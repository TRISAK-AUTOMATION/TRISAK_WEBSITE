import crypto from "crypto";

// In-memory session store. Good enough for a small internal admin tool —
// sessions reset when the server restarts, and there's no multi-instance
// scale-out support. If this needs to be hardened later, swap this module
// for a real session store (e.g. Redis) or a JWT-based approach.
const sessions = new Map(); // token -> expiresAt (ms)
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export function createSession() {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function isValid(token) {
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token || !isValid(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export function destroySession(token) {
  sessions.delete(token);
}
