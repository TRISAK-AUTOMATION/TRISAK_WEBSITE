import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { uploadsDir } from "./upload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20 MB

// Where a given product's uploads live on disk, and the public URL that
// maps to it (uploadsDir is already served at /uploads by express.static).
export function productDir(productId) {
  return path.join(uploadsDir, "products", String(productId));
}

export function productDocumentsDir(productId) {
  return path.join(productDir(productId), "documents");
}

export function productDocumentsPublicPath(productId, fileName) {
  return `/uploads/products/${productId}/documents/${fileName}`;
}

// Strip any path component and any character outside a safe allow-list —
// this is display metadata only (file_name), never used to build a path.
export function sanitizeFileName(originalName) {
  const base = path.basename(String(originalName || "")).normalize("NFKC");
  const cleaned = base.replace(/[^a-zA-Z0-9._ -]+/g, "_").trim();
  return cleaned.slice(0, 150) || "document.pdf";
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // :productId comes from the route pattern, so it's always a plain
    // decimal segment here — but validate anyway before it touches a path.
    const productId = req.params.productId;
    if (!/^\d+$/.test(String(productId))) {
      return cb(new Error("Invalid product id"));
    }
    const dir = productDocumentsDir(productId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // The stored file name is entirely server-generated — ignores the
    // original name and its extension is always literally ".pdf", so
    // nothing about the upload's own name ever reaches the filesystem.
    cb(null, `${crypto.randomUUID()}.pdf`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (file.mimetype !== "application/pdf" || ext !== ".pdf") {
    return cb(new Error("Only PDF files are allowed."));
  }
  cb(null, true);
}

export const uploadProductDocument = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_DOCUMENT_SIZE },
});

// Defense in depth against a spoofed extension/MIME type: read the file's
// first bytes back off disk and confirm the actual PDF signature is there.
// Deletes the upload and calls next(err) if it isn't a real PDF.
export function verifyPdfSignature(req, res, next) {
  if (!req.file) return next();
  const fd = fs.openSync(req.file.path, "r");
  const header = Buffer.alloc(5);
  fs.readSync(fd, header, 0, 5, 0);
  fs.closeSync(fd);
  if (header.toString("latin1") !== "%PDF-") {
    fs.unlink(req.file.path, () => {});
    return next(new Error("The uploaded file is not a valid PDF."));
  }
  next();
}
