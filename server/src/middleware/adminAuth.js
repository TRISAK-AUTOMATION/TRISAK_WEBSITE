import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Sessions are kept in memory AND mirrored to a small file on disk, so
// `npm run dev` (which restarts the process on every file save via
// `node --watch`) doesn't log everyone out on every edit. This is still
// not a real session store — no multi-instance support, no rotation. If
// this needs to be hardened later, swap it for Redis or a JWT approach.
const SESSION_FILE = path.join(__dirname, "../../.sessions.json");
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

let sessions = new Map(); // token -> expiresAt (ms)

function loadSessions() {
  try {
    const raw = fs.readFileSync(SESSION_FILE, "utf-8");
    const entries = JSON.parse(raw);
    const now = Date.now();
    sessions = new Map(entries.filter(([, expiresAt]) => expiresAt > now));
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

export function createSession() {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  persistSessions();
  return token;
}

function isValid(token) {
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    sessions.delete(token);
    persistSessions();
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
  persistSessions();
}
