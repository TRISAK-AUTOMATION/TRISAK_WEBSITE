import pool from "../config/db.js";
import { VALID_INTERESTS } from "../utils/contactRequests.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 5000;

// Trim a value to a string, or null when empty / not a string.
const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

// Public endpoint — POST /api/contact. Stores the submission in
// contact_requests with status 'new' (the column default).
export async function submitContact(req, res) {
  const { interestedIn } = req.body || {};
  const name = clean(req.body?.name);
  const company = clean(req.body?.company);
  const email = clean(req.body?.email);
  const phone = clean(req.body?.phone);
  const message = clean(req.body?.message);

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (interestedIn && !VALID_INTERESTS.includes(interestedIn)) {
    return res.status(400).json({ error: "Invalid interestedIn value." });
  }
  if (name.length > 150 || (company && company.length > 150) || email.length > 150) {
    return res.status(400).json({ error: "Name, company and email must be 150 characters or fewer." });
  }
  if (phone && phone.length > 50) {
    return res.status(400).json({ error: "Phone must be 50 characters or fewer." });
  }
  if (message && message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.` });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO contact_requests (name, company, email, phone, interested_in, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [name, company, email, phone, interestedIn || null, message]
    );
    res.status(201).json({ success: true, id: rows[0].id, createdAt: rows[0].created_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit inquiry" });
  }
}
