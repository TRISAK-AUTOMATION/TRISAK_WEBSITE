import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Attachments sent with the public Contact Us / "Request a quote" form
// (part-number lists, BOMs, specs). Like résumés they may hold customer data,
// so they live OUTSIDE server/uploads (served publicly at /uploads) and are
// only reachable through the admin-authenticated download endpoint.
export const contactAttachmentsDir = path.join(__dirname, "../../private/contact-attachments");
fs.mkdirSync(contactAttachmentsDir, { recursive: true });

export const MAX_CONTACT_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB

const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // .docx / .xlsx
const OLE2 = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]); // .doc / .xls

// extension → accepted MIME types + the file signature it must start with
// (magic: null = no reliable signature, e.g. plain-text CSV)
const TYPES = {
  ".pdf": { mimes: ["application/pdf"], magic: Buffer.from("%PDF-", "latin1") },
  ".xlsx": {
    mimes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/zip",
      "application/octet-stream",
    ],
    magic: ZIP,
  },
  ".xls": {
    mimes: ["application/vnd.ms-excel", "application/msexcel", "application/x-msexcel", "application/octet-stream"],
    magic: OLE2,
  },
  ".csv": {
    mimes: ["text/csv", "application/vnd.ms-excel", "text/plain", "application/csv", "text/x-csv"],
    magic: null,
  },
  ".docx": {
    mimes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "application/octet-stream",
    ],
    magic: ZIP,
  },
  ".doc": { mimes: ["application/msword", "application/octet-stream"], magic: OLE2 },
  ".png": { mimes: ["image/png"], magic: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  ".jpg": { mimes: ["image/jpeg", "image/pjpeg"], magic: Buffer.from([0xff, 0xd8, 0xff]) },
  ".jpeg": { mimes: ["image/jpeg", "image/pjpeg"], magic: Buffer.from([0xff, 0xd8, 0xff]) },
};

const TYPE_ERROR =
  "Attachment must be a PDF, Excel, CSV, Word or image file (.pdf, .xlsx, .xls, .csv, .docx, .doc, .png, .jpg, .jpeg).";

// Display name only — never used to build a path.
export function sanitizeAttachmentName(originalName) {
  // multer decodes the name as latin1; recover UTF-8 (Thai file names)
  let name = String(originalName || "");
  try {
    name = Buffer.from(name, "latin1").toString("utf8");
  } catch {
    /* keep as-is */
  }
  const base = path.basename(name).normalize("NFKC");
  const cleaned = base.replace(/[\u0000-\u001F\u007F/\\:*?"<>|]+/g, "_").trim();
  return cleaned.slice(0, 200) || "attachment";
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, contactAttachmentsDir),
  // entirely server-generated: random id + the (allow-listed) extension
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const type = TYPES[ext];
  if (!type || !type.mimes.includes(file.mimetype)) {
    const err = new Error(TYPE_ERROR);
    err.status = 400;
    return cb(err);
  }
  cb(null, true);
}

const multerSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_CONTACT_ATTACHMENT_SIZE, files: 1, fields: 20, fieldSize: 100 * 1024 },
}).single("attachment");

// Run multer only for multipart requests — the form still posts plain JSON
// when there is no attachment (express.json() has already parsed that body).
export function uploadContactAttachment(req, res, next) {
  if (!req.is("multipart/form-data")) return next();
  multerSingle(req, res, (err) => {
    if (!err) return next();
    if (req.file) fs.unlink(req.file.path, () => {});
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Attachment must be 10 MB or smaller." });
    }
    if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ error: "Only one attachment (field \"attachment\") is allowed." });
    }
    if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
    return res.status(err.status || 400).json({ error: err.message || TYPE_ERROR });
  });
}

// Defense in depth: the stored bytes must really start with the signature
// of the declared type. Deletes the file and fails the request otherwise.
export function verifyContactAttachmentSignature(req, res, next) {
  if (!req.file) return next();
  const type = TYPES[path.extname(req.file.filename).toLowerCase()];
  if (!type) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: TYPE_ERROR });
  }
  if (!type.magic) return next();
  const header = Buffer.alloc(type.magic.length);
  let bytes = 0;
  try {
    const fd = fs.openSync(req.file.path, "r");
    bytes = fs.readSync(fd, header, 0, header.length, 0);
    fs.closeSync(fd);
  } catch {
    bytes = 0;
  }
  if (bytes < header.length || !header.equals(type.magic)) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: "The attachment's contents do not match its file type." });
  }
  next();
}
