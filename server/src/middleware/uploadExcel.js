import multer from "multer";

const ALLOWED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // some browsers/OSes report .xlsx under the legacy type
  "application/octet-stream", // fallback some browsers use for unrecognized types
];

function fileFilter(req, file, cb) {
  const isXlsxExt = file.originalname.toLowerCase().endsWith(".xlsx");
  if (isXlsxExt && ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else if (isXlsxExt) {
    // Trust the .xlsx extension even if the browser sent an unexpected
    // mimetype — ExcelJS will reject the buffer later if it isn't
    // actually a valid workbook.
    cb(null, true);
  } else {
    cb(new Error("Only .xlsx files are allowed"));
  }
}

// Kept in memory only — parsed straight from the buffer and never
// written to disk, since this is a one-shot import file, not an asset.
export const uploadExcel = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
