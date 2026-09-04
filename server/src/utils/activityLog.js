import pool from "../config/db.js";

/**
 * Records one row in activity_log for the Admin Dashboard's
 * "Recent Activity" feed.
 *
 * Fire-and-forget: a logging failure should never break the admin
 * action that triggered it, so errors are swallowed (and logged to
 * the server console for debugging).
 *
 * @param {string} actionType - short machine key, e.g. "product_added"
 * @param {string} description - human-readable line shown in the UI
 */
export async function logActivity(actionType, description) {
  try {
    await pool.query(
      "INSERT INTO activity_log (action_type, description) VALUES ($1, $2)",
      [actionType, description]
    );
  } catch (err) {
    console.error("Failed to write activity log:", err.message);
  }
}
