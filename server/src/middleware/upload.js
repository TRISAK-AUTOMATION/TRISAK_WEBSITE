import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// server/uploads — created on first run if it doesn't exist yet
export const uploadsDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpg, png, webp, gif, svg)"));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Re-encodes the just-uploaded file in place: caps its longest edge and
// re-compresses it, trading invisible quality loss for a meaningfully
// smaller file — without changing its filename/URL, so nothing else
// downstream needs to know this happened. Vector/animated formats
// (SVG, GIF) pass through untouched since resizing would break them.
const OPTIMIZE_MAX_DIMENSION = 2000;
const OPTIMIZABLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function optimizeUploadedImage(req, res, next) {
  if (!req.file || !OPTIMIZABLE_TYPES.has(req.file.mimetype)) return next();
  const filePath = req.file.path;
  try {
    const original = fs.readFileSync(filePath);
    let pipeline = sharp(original).rotate(); // rotate() auto-applies EXIF orientation
    const meta = await pipeline.metadata();
    if ((meta.width || 0) > OPTIMIZE_MAX_DIMENSION || (meta.height || 0) > OPTIMIZE_MAX_DIMENSION) {
      pipeline = pipeline.resize({
        width: OPTIMIZE_MAX_DIMENSION,
        height: OPTIMIZE_MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      });
    }
    if (req.file.mimetype === "image/jpeg") pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
    else if (req.file.mimetype === "image/png") pipeline = pipeline.png({ compressionLevel: 9 });
    else if (req.file.mimetype === "image/webp") pipeline = pipeline.webp({ quality: 82 });

    const optimized = await pipeline.toBuffer();
    // Only keep the optimized version if it's actually smaller — a
    // already-tiny/already-compressed source can grow slightly on
    // re-encode, and there's no benefit to swapping it in that case.
    if (optimized.length < original.length) {
      fs.writeFileSync(filePath, optimized);
      req.file.size = optimized.length;
    }
  } catch (err) {
    // Optimization is a nice-to-have — never block the upload over it.
    console.error("Image optimization skipped:", err.message);
  }
  next();
}
