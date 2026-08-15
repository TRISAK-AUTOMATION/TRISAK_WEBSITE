import pool from "../config/db.js";

const VALID_INTERESTS = ["products", "automation_solution", "technical_support"];

export async function submitContact(req, res) {
  const { name, company, email, phone, interestedIn, message } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }
  if (interestedIn && !VALID_INTERESTS.includes(interestedIn)) {
    return res.status(400).json({ error: "Invalid interestedIn value." });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO contact_submissions (name, company, email, phone, interested_in, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [name, company || null, email, phone || null, interestedIn || null, message || null]
    );
    res.status(201).json({ success: true, id: rows[0].id, createdAt: rows[0].created_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit inquiry" });
  }
}
