import fs from "fs";
import path from "path";
import pool from "../config/db.js";
import { contactAttachmentsDir, sanitizeAttachmentName } from "../middleware/uploadContactAttachment.js";
import { VALID_INTERESTS } from "../utils/contactRequests.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 5000;

// Trim a value to a string, or null when empty / not a string.
const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

const removeFile = (file) => {
  if (file) fs.unlink(path.join(contactAttachmentsDir, path.basename(file)), () => {});
};

// ---- simple per-IP rate limit for the public form (in memory) ----
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const hits = new Map(); // ip -> [timestamps]
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return recent.length > MAX_PER_WINDOW;
}

// Public endpoint — POST /api/contact. Stores the submission in
// contact_requests with status 'new' (the column default).
// Accepts either a JSON body or multipart/form-data with one optional
// "attachment" file (see middleware/uploadContactAttachment.js).
export async function submitContact(req, res) {
  const fail = (status, error) => {
    removeFile(req.file?.filename);
    return res.status(status).json({ error });
  };

  if (rateLimited(req.ip)) return fail(429, "Too many requests. Please try again later.");

  const { interestedIn } = req.body || {};
  const name = clean(req.body?.name);
  const company = clean(req.body?.company);
  const email = clean(req.body?.email);
  const phone = clean(req.body?.phone);
  const message = clean(req.body?.message);

  if (!name || !email) {
    return fail(400, "Name and email are required.");
  }
  if (!EMAIL_RE.test(email)) {
    return fail(400, "Please enter a valid email address.");
  }
  if (interestedIn && !VALID_INTERESTS.includes(interestedIn)) {
    return fail(400, "Invalid interestedIn value.");
  }
  if (name.length > 150 || (company && company.length > 150) || email.length > 150) {
    return fail(400, "Name, company and email must be 150 characters or fewer.");
  }
  if (phone && phone.length > 50) {
    return fail(400, "Phone must be 50 characters or fewer.");
  }
  if (message && message.length > MAX_MESSAGE_LENGTH) {
    return fail(400, `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO contact_requests
         (name, company, email, phone, interested_in, message, attachment_file, attachment_name, attachment_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, created_at`,
      [
        name, company, email, phone, interestedIn || null, message,
        req.file?.filename || null,
        req.file ? sanitizeAttachmentName(req.file.originalname) : null,
        req.file?.size ?? null,
      ]
    );
    res.status(201).json({ success: true, id: rows[0].id, createdAt: rows[0].created_at });
  } catch (err) {
    console.error(err);
    return fail(500, "Failed to submit inquiry");
  }
}
