import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Résumés hold personal data, so they live OUTSIDE server/uploads (which is
// served publicly at /uploads). They are only reachable through the
// admin-authenticated download endpoint.
export const resumesDir = path.join(__dirname, "../../private/resumes");
fs.mkdirSync(resumesDir, { recursive: true });

export const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5 MB

// extension → accepted MIME types + the file signature it must start with
const TYPES = {
  ".pdf": { mimes: ["application/pdf"], magic: Buffer.from("%PDF-", "latin1") },
  ".docx": {
    mimes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "application/octet-stream",
    ],
    magic: Buffer.from([0x50, 0x4b, 0x03, 0x04]), // ZIP
  },
  ".doc": {
    mimes: ["application/msword", "application/octet-stream"],
    magic: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), // OLE2
  },
};

// Display name only — never used to build a path.
export function sanitizeResumeName(originalName) {
  // multer decodes the name as latin1; recover UTF-8 (Thai file names)
  let name = String(originalName || "");
  try {
    name = Buffer.from(name, "latin1").toString("utf8");
  } catch {
    /* keep as-is */
  }
  const base = path.basename(name).normalize("NFKC");
  const cleaned = base.replace(/[\u0000-\u001F\u007F/\\:*?"<>|]+/g, "_").trim();
  return cleaned.slice(0, 200) || "resume";
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, resumesDir),
  // entirely server-generated: random id + the (allow-listed) extension
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const type = TYPES[ext];
  if (!type || !type.mimes.includes(file.mimetype)) {
    return cb(new Error("Resume must be a PDF or Word file (.pdf, .doc, .docx)."));
  }
  cb(null, true);
}

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_RESUME_SIZE, files: 1, fields: 20 },
}).single("resume");

// Defense in depth: the stored bytes must really start with the signature
// of the declared type. Deletes the file and fails the request otherwise.
export function verifyResumeSignature(req, res, next) {
  if (!req.file) return next();
  const type = TYPES[path.extname(req.file.filename).toLowerCase()];
  const header = Buffer.alloc(type.magic.length);
  const fd = fs.openSync(req.file.path, "r");
  fs.readSync(fd, header, 0, header.length, 0);
  fs.closeSync(fd);
  if (!header.equals(type.magic)) {
    fs.unlink(req.file.path, () => {});
    return next(new Error("The uploaded resume is not a valid PDF or Word file."));
  }
  next();
}

// multer reports "too large" as a generic error — give the applicant a clear one.
export function resumeUploadErrors(err, req, res, next) {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Resume must be 5 MB or smaller." });
  }
  next(err);
}
