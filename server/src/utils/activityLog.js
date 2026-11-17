import pool from "../config/db.js";
import { currentAdmin } from "./requestContext.js";

/**
 * Records one row in activity_log for the Admin Dashboard's
 * "Recent Activity" feed, with the signed-in admin as the actor.
 *
 * Fire-and-forget: a logging failure should never break the admin
 * action that triggered it, so errors are swallowed (and logged to
 * the server console for debugging).
 *
 * @param {string} actionType - short machine key, e.g. "product_added"
 * @param {string} description - human-readable line shown in the UI
 * @param {string} [actor] - who did it; defaults to the signed-in admin
 */
export async function logActivity(actionType, description, actor) {
  const user = currentAdmin();
  const who = actor ?? (user ? user.display_name || user.username : null);
  try {
    await pool.query(
      "INSERT INTO activity_log (action_type, description, actor) VALUES ($1, $2, $3)",
      [actionType, String(description).slice(0, 255), who]
    );
  } catch (err) {
    console.error("Failed to write activity log:", err.message);
  }
}
