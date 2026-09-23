import fs from "fs";
import path from "path";
import pool from "../config/db.js";
import { logActivity } from "../utils/activityLog.js";
import {
  uploadsDir,
} from "../middleware/upload.js";
import {
  productDir,
  productDocumentsPublicPath,
  sanitizeFileName,
} from "../middleware/uploadProductDocument.js";

export const DOCUMENT_TYPES = [
  "Datasheet",
  "User Manual",
  "Installation Manual",
  "Catalog",
  "Technical Document",
  "Other",
];

const COLUMNS = `
  id, product_id AS "productId", title, document_type AS "documentType",
  file_name AS "fileName", file_url AS "fileUrl", file_size AS "fileSize",
  mime_type AS "mimeType", created_at AS "createdAt", updated_at AS "updatedAt"
`;

// True only for a file this app itself stored (under /uploads/products/…) —
// legacy rows may point at an arbitrary external URL, which is never
// deleted from disk because we don't own it. Handles both the relative
// paths older rows may hold and the absolute URLs we generate now.
function localFilePath(fileUrl) {
  if (!fileUrl) return null;
  let pathname;
  try {
    pathname = new URL(fileUrl, "http://placeholder").pathname;
  } catch {
    return null;
  }
  const prefix = "/uploads/";
  if (!pathname.startsWith(prefix)) return null;
  const abs = path.join(uploadsDir, pathname.slice(prefix.length));
  // guard against a stored value ever escaping uploadsDir
  if (!abs.startsWith(uploadsDir + path.sep)) return null;
  return abs;
}

function unlinkQuietly(absPath) {
  if (!absPath) return;
  fs.unlink(absPath, () => {}); // best-effort — a missing file is not an error here
}

async function productExists(productId) {
  const { rows } = await pool.query("SELECT id, name FROM products WHERE id = $1", [productId]);
  return rows[0] || null;
}

// GET /api/products/:productId/documents — public, used by the product page.
export async function listProductDocuments(req, res) {
  const { productId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT ${COLUMNS} FROM product_documents WHERE product_id = $1 ORDER BY created_at`,
      [productId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load documents" });
  }
}

// POST /api/admin/products/:productId/documents  (multipart: file, title, documentType)
export async function createProductDocument(req, res) {
  const { productId } = req.params;
  if (!req.file) return res.status(400).json({ error: "Please choose a PDF file to upload." });

  const cleanup = () => unlinkQuietly(req.file.path);

  const product = await productExists(productId).catch(() => null);
  if (!product) {
    cleanup();
    return res.status(404).json({ error: "Product not found" });
  }

  const documentType = DOCUMENT_TYPES.includes(req.body?.documentType) ? req.body.documentType : "Other";
  const title = (req.body?.title || "").trim() || path.parse(req.file.originalname || "").name || "Document";
  if (title.length > 150) {
    cleanup();
    return res.status(400).json({ error: "Title must be 150 characters or fewer." });
  }

  try {
    const fileUrl = `${req.protocol}://${req.get("host")}${productDocumentsPublicPath(productId, req.file.filename)}`;
    const { rows } = await pool.query(
      `INSERT INTO product_documents (product_id, title, document_type, file_name, file_url, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${COLUMNS}`,
      [productId, title, documentType, sanitizeFileName(req.file.originalname), fileUrl, req.file.size, req.file.mimetype]
    );
    logActivity("product_document_uploaded", `อัปโหลดเอกสาร "${title}" สำหรับ "${product.name}"`);
    res.status(201).json(rows[0]);
  } catch (err) {
    cleanup();
    console.error(err);
    res.status(500).json({ error: "Failed to save the document. Please try again." });
  }
}

// PUT /api/admin/products/:productId/documents/:documentId
// Multipart. A new `file` field replaces the PDF; title/documentType update
// the metadata either way (send the current values to leave them as-is).
export async function updateProductDocument(req, res) {
  const { productId, documentId } = req.params;
  const cleanup = () => req.file && unlinkQuietly(req.file.path);

  const { rows: existingRows } = await pool.query(
    `SELECT ${COLUMNS}, file_url AS "rawFileUrl" FROM product_documents WHERE id = $1 AND product_id = $2`,
    [documentId, productId]
  );
  const existing = existingRows[0];
  if (!existing) {
    cleanup();
    return res.status(404).json({ error: "Document not found" });
  }

  const documentType = DOCUMENT_TYPES.includes(req.body?.documentType)
    ? req.body.documentType
    : existing.documentType;
  const titleRaw = req.body?.title !== undefined ? req.body.title.trim() : existing.title;
  const title = titleRaw || existing.title;
  if (title.length > 150) {
    cleanup();
    return res.status(400).json({ error: "Title must be 150 characters or fewer." });
  }

  const replacing = Boolean(req.file);
  const fileName = replacing ? sanitizeFileName(req.file.originalname) : existing.fileName;
  const fileUrl = replacing
    ? `${req.protocol}://${req.get("host")}${productDocumentsPublicPath(productId, req.file.filename)}`
    : existing.fileUrl;
  const fileSize = replacing ? req.file.size : existing.fileSize;
  const mimeType = replacing ? req.file.mimetype : existing.mimeType;

  try {
    const { rows } = await pool.query(
      `UPDATE product_documents
       SET title = $1, document_type = $2, file_name = $3, file_url = $4,
           file_size = $5, mime_type = $6, updated_at = now()
       WHERE id = $7
       RETURNING ${COLUMNS}`,
      [title, documentType, fileName, fileUrl, fileSize, mimeType, documentId]
    );
    // Only remove the old file from disk once the new one is safely stored
    // and the row is updated — never delete before the replacement lands.
    if (replacing) unlinkQuietly(localFilePath(existing.rawFileUrl));
    logActivity("product_document_updated", `อัปเดตเอกสาร "${title}"`);
    res.json(rows[0]);
  } catch (err) {
    cleanup();
    console.error(err);
    res.status(500).json({ error: "Failed to save the document. Please try again." });
  }
}

// DELETE /api/admin/products/:productId/documents/:documentId
export async function deleteProductDocument(req, res) {
  const { productId, documentId } = req.params;
  try {
    const { rows } = await pool.query(
      "DELETE FROM product_documents WHERE id = $1 AND product_id = $2 RETURNING title, file_url",
      [documentId, productId]
    );
    if (!rows.length) return res.status(404).json({ error: "Document not found" });
    unlinkQuietly(localFilePath(rows[0].file_url));
    logActivity("product_document_deleted", `ลบเอกสาร "${rows[0].title}"`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete the document. Please try again." });
  }
}

// Called from adminController.deleteProduct, so the product's whole upload
// directory (documents and anything else stored under it) is cleaned up —
// the DB rows themselves go automatically via ON DELETE CASCADE.
export async function deleteAllProductDocumentFiles(productId) {
  fs.rm(productDir(productId), { recursive: true, force: true }, () => {});
}
