import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.js";
import { requestContext } from "../utils/requestContext.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Sessions are kept in memory AND mirrored to a small file on disk, so
// `npm run dev` (which restarts the process on every file save via
// `node --watch`) doesn't log everyone out on every edit. This is still
// not a real session store — no multi-instance support, no rotation. If
// this needs to be hardened later, swap it for Redis or a JWT approach.
const SESSION_FILE = path.join(__dirname, "../../.sessions.json");
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // "remember me": 30 days

let sessions = new Map(); // token -> { userId, expiresAt }

function loadSessions() {
  try {
    const entries = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
    const now = Date.now();
    // Sessions from before per-user accounts (value = a bare timestamp) have
    // no user and are dropped: everyone signs in once with their account.
    sessions = new Map(
      entries.filter(([, s]) => s && typeof s === "object" && s.userId && s.expiresAt > now)
    );
  } catch {
    sessions = new Map(); // no file yet, or unreadable — start fresh
  }
}

function persistSessions() {
  try {
    fs.writeFileSync(SESSION_FILE, JSON.stringify([...sessions.entries()]));
  } catch (err) {
    console.error("Failed to persist admin sessions:", err.message);
  }
}

loadSessions();

export function createSession(userId, remember = false) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { userId, expiresAt: Date.now() + (remember ? REMEMBER_TTL_MS : SESSION_TTL_MS) });
  persistSessions();
  return token;
}

export function destroySession(token) {
  sessions.delete(token);
  persistSessions();
}

/** Signs a user out everywhere (deactivated, deleted, password reset), optionally keeping one token. */
export function destroyUserSessions(userId, keepToken = null) {
  let changed = false;
  for (const [token, s] of sessions) {
    if (s.userId === userId && token !== keepToken) {
      sessions.delete(token);
      changed = true;
    }
  }
  if (changed) persistSessions();
}

export const bearerToken = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

/**
 * Valid session + an active account → req.adminUser is set and the rest of
 * the request runs with that user in requestContext (for the activity log).
 */
export async function requireAdmin(req, res, next) {
  const token = bearerToken(req);
  const session = token && sessions.get(token);
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  if (Date.now() > session.expiresAt) {
    destroySession(token);
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const { rows } = await pool.query(
      "SELECT id, username, display_name, email, role, is_active FROM admin_users WHERE id = $1",
      [session.userId]
    );
    const user = rows[0];
    if (!user || !user.is_active) {
      destroySession(token);
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.adminUser = user;
    requestContext.run({ user }, next);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check the session" });
  }
}

/** For user management: only a superadmin. Use after requireAdmin. */
export function requireSuperadmin(req, res, next) {
  if (req.adminUser?.role !== "superadmin") {
    return res.status(403).json({ error: "เฉพาะผู้ดูแลระบบสูงสุด (Superadmin) เท่านั้น" });
  }
  next();
}
