import pool from "../config/db.js";
import { logActivity } from "../utils/activityLog.js";
import { hashPassword, verifyPassword, passwordProblem } from "../utils/password.js";
import { createSession, destroySession, destroyUserSessions, bearerToken } from "../middleware/adminAuth.js";

/**
 * Admin accounts: sign-in / sign-out, the signed-in user (/admin/me, own
 * password), and user management for superadmins.
 *
 * Sign-in protection: after MAX_ATTEMPTS wrong passwords for one username,
 * that username is locked for LOCK_MINUTES. Counters live in memory and are
 * kept for unknown usernames too, so responses never reveal whether an
 * account exists.
 */

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const attempts = new Map(); // username (lower) -> { count, lockedUntil }

const USER_COLUMNS = "id, username, display_name, email, role, is_active, last_login_at, created_at";
const ROLES = ["superadmin", "admin"];

const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  display_name: u.display_name,
  email: u.email,
  role: u.role,
});

function lockState(key) {
  const a = attempts.get(key);
  if (a?.lockedUntil && a.lockedUntil > Date.now()) return a;
  if (a?.lockedUntil) attempts.delete(key); // lock expired: start over
  return null;
}

function recordFailure(key) {
  const a = attempts.get(key) || { count: 0, lockedUntil: 0 };
  a.count += 1;
  if (a.count >= MAX_ATTEMPTS) a.lockedUntil = Date.now() + LOCK_MINUTES * 60 * 1000;
  attempts.set(key, a);
  return a;
}

const minutesLeft = (until) => Math.max(1, Math.ceil((until - Date.now()) / 60000));

function lockedResponse(res, until) {
  return res.status(429).json({
    code: "locked",
    retryAfterMinutes: minutesLeft(until),
    error: `กรอกรหัสผ่านผิดหลายครั้ง บัญชีนี้ถูกล็อกชั่วคราว ลองใหม่ในอีก ${minutesLeft(until)} นาที`,
  });
}

// ---------------- sign in / out ----------------

export async function login(req, res) {
  const { password, remember } = req.body || {};
  // older clients sent only a password: treat it as the "admin" username
  const username = String(req.body?.username ?? "admin").trim().toLowerCase();
  if (!username || typeof password !== "string" || !password) {
    return res.status(400).json({ code: "missing", error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
  }

  const locked = lockState(username);
  if (locked) return lockedResponse(res, locked.lockedUntil);

  try {
    const { rows: countRows } = await pool.query("SELECT COUNT(*)::int AS n FROM admin_users");

    // First sign-in after the upgrade: no accounts yet. The old shared
    // ADMIN_PASSWORD creates the first superadmin with the chosen username.
    if (countRows[0].n === 0) {
      if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
        return failed(res, username);
      }
      if (!/^[a-z0-9._-]{3,60}$/.test(username)) {
        return res.status(400).json({
          code: "invalid_username",
          error: "ชื่อผู้ใช้ต้องเป็น a-z, 0-9, จุด, ขีด หรือขีดล่าง 3–60 ตัวอักษร",
        });
      }
      const { rows } = await pool.query(
        `INSERT INTO admin_users (username, display_name, password_hash, role, last_login_at)
         VALUES ($1, $2, $3, 'superadmin', now()) RETURNING ${USER_COLUMNS}`,
        [username, username, await hashPassword(password)]
      );
      attempts.delete(username);
      const token = createSession(rows[0].id, Boolean(remember));
      logActivity("admin_user_created", `สร้างบัญชีผู้ดูแลระบบแรก "${username}"`, username);
      return res.json({ token, user: publicUser(rows[0]), firstAccount: true });
    }

    const { rows } = await pool.query(
      `SELECT ${USER_COLUMNS}, password_hash FROM admin_users
       WHERE username = $1 OR lower(email) = $1 LIMIT 1`,
      [username]
    );
    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return failed(res, username);
    }
    if (!user.is_active) {
      return res.status(403).json({ code: "disabled", error: "บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ" });
    }

    attempts.delete(username);
    await pool.query("UPDATE admin_users SET last_login_at = now() WHERE id = $1", [user.id]);
    const token = createSession(user.id, Boolean(remember));
    logActivity("admin_login", "เข้าสู่ระบบหลังบ้าน", user.display_name || user.username);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่" });
  }
}

function failed(res, username) {
  const a = recordFailure(username);
  if (a.lockedUntil) return lockedResponse(res, a.lockedUntil);
  return res.status(401).json({
    code: "invalid",
    remaining: MAX_ATTEMPTS - a.count,
    error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
  });
}

export async function logout(req, res) {
  const token = bearerToken(req);
  if (token) destroySession(token);
  res.json({ success: true });
}

// ---------------- the signed-in user ----------------

export async function getMe(req, res) {
  res.json(publicUser(req.adminUser));
}

export async function changeOwnPassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  const problem = passwordProblem(newPassword);
  if (problem) return res.status(400).json({ error: problem });
  try {
    const { rows } = await pool.query("SELECT password_hash FROM admin_users WHERE id = $1", [req.adminUser.id]);
    if (!rows.length || !(await verifyPassword(currentPassword || "", rows[0].password_hash))) {
      return res.status(400).json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
    }
    await pool.query("UPDATE admin_users SET password_hash = $1, updated_at = now() WHERE id = $2", [
      await hashPassword(newPassword),
      req.adminUser.id,
    ]);
    // sign out every other device, keep this one
    destroyUserSessions(req.adminUser.id, bearerToken(req));
    logActivity("admin_password_changed", "เปลี่ยนรหัสผ่านของตัวเอง");
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เปลี่ยนรหัสผ่านไม่สำเร็จ" });
  }
}

// ---------------- user management (superadmin) ----------------

function readUserFields(body, { creating }) {
  const out = {};
  if (creating) {
    const username = String(body.username || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,60}$/.test(username)) {
      return { error: "ชื่อผู้ใช้ต้องเป็น a-z, 0-9, จุด, ขีด หรือขีดล่าง 3–60 ตัวอักษร" };
    }
    out.username = username;
  }
  if (body.displayName !== undefined) {
    const v = String(body.displayName || "").trim();
    if (v.length > 120) return { error: "ชื่อที่แสดงยาวเกิน 120 ตัวอักษร" };
    out.display_name = v || null;
  }
  if (body.email !== undefined) {
    const v = String(body.email || "").trim().toLowerCase();
    if (v && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.length > 150)) return { error: "รูปแบบอีเมลไม่ถูกต้อง" };
    out.email = v || null;
  }
  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) return { error: "สิทธิ์ไม่ถูกต้อง" };
    out.role = body.role;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") return { error: "สถานะไม่ถูกต้อง" };
    out.is_active = body.isActive;
  }
  return { values: out };
}

const duplicateError = (err) =>
  err.code === "23505"
    ? err.constraint === "idx_admin_users_email"
      ? "อีเมลนี้ถูกใช้กับบัญชีอื่นแล้ว"
      : "ชื่อผู้ใช้นี้มีอยู่แล้ว"
    : null;

async function activeSuperadminCount(excludeId) {
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS n FROM admin_users WHERE role = 'superadmin' AND is_active AND id <> $1",
    [excludeId]
  );
  return rows[0].n;
}

export async function listUsers(req, res) {
  try {
    const { rows } = await pool.query(`SELECT ${USER_COLUMNS} FROM admin_users ORDER BY created_at, id`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "โหลดรายชื่อผู้ใช้ไม่สำเร็จ" });
  }
}

export async function createUser(req, res) {
  const { values, error } = readUserFields(req.body || {}, { creating: true });
  if (error) return res.status(400).json({ error });
  const problem = passwordProblem(req.body?.password);
  if (problem) return res.status(400).json({ error: problem });
  try {
    const { rows } = await pool.query(
      `INSERT INTO admin_users (username, display_name, email, role, is_active, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${USER_COLUMNS}`,
      [
        values.username,
        values.display_name ?? null,
        values.email ?? null,
        values.role ?? "admin",
        values.is_active ?? true,
        await hashPassword(req.body.password),
      ]
    );
    logActivity("admin_user_created", `เพิ่มผู้ใช้หลังบ้าน "${rows[0].username}"`);
    res.status(201).json(rows[0]);
  } catch (err) {
    const dup = duplicateError(err);
    if (dup) return res.status(409).json({ error: dup });
    console.error(err);
    res.status(500).json({ error: "เพิ่มผู้ใช้ไม่สำเร็จ" });
  }
}

export async function updateUser(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: "ไม่พบผู้ใช้" });
  const { values, error } = readUserFields(req.body || {}, { creating: false });
  if (error) return res.status(400).json({ error });
  const self = id === req.adminUser.id;
  if (self && (values.is_active === false || values.role === "admin")) {
    return res.status(400).json({ error: "ไม่สามารถปิดใช้งานหรือลดสิทธิ์บัญชีของตัวเองได้" });
  }
  const newPassword = req.body?.password;
  if (newPassword) {
    const problem = passwordProblem(newPassword);
    if (problem) return res.status(400).json({ error: problem });
    values.password_hash = await hashPassword(newPassword);
  }
  try {
    const { rows: current } = await pool.query("SELECT role, is_active FROM admin_users WHERE id = $1", [id]);
    if (!current.length) return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    const losesSuper =
      current[0].role === "superadmin" && current[0].is_active && (values.role === "admin" || values.is_active === false);
    if (losesSuper && (await activeSuperadminCount(id)) === 0) {
      return res.status(400).json({ error: "ต้องมี Superadmin ที่ใช้งานอยู่อย่างน้อย 1 คน" });
    }
    const cols = Object.keys(values);
    if (!cols.length) return res.status(400).json({ error: "ไม่มีข้อมูลที่จะบันทึก" });
    const { rows } = await pool.query(
      `UPDATE admin_users SET ${cols.map((c, i) => `${c} = $${i + 1}`).join(", ")}, updated_at = now()
       WHERE id = $${cols.length + 1} RETURNING ${USER_COLUMNS}`,
      [...cols.map((c) => values[c]), id]
    );
    // a deactivated user or a reset password signs that person out everywhere
    if (values.is_active === false || values.password_hash) destroyUserSessions(id, self ? bearerToken(req) : null);
    logActivity(
      "admin_user_updated",
      values.password_hash ? `ตั้งรหัสผ่านใหม่ให้ "${rows[0].username}"` : `แก้ไขผู้ใช้หลังบ้าน "${rows[0].username}"`
    );
    res.json(rows[0]);
  } catch (err) {
    const dup = duplicateError(err);
    if (dup) return res.status(409).json({ error: dup });
    console.error(err);
    res.status(500).json({ error: "บันทึกผู้ใช้ไม่สำเร็จ" });
  }
}

export async function deleteUser(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: "ไม่พบผู้ใช้" });
  if (id === req.adminUser.id) return res.status(400).json({ error: "ไม่สามารถลบบัญชีของตัวเองได้" });
  try {
    const { rows: current } = await pool.query("SELECT username, role, is_active FROM admin_users WHERE id = $1", [id]);
    if (!current.length) return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    if (current[0].role === "superadmin" && current[0].is_active && (await activeSuperadminCount(id)) === 0) {
      return res.status(400).json({ error: "ต้องมี Superadmin ที่ใช้งานอยู่อย่างน้อย 1 คน" });
    }
    await pool.query("DELETE FROM admin_users WHERE id = $1", [id]);
    destroyUserSessions(id);
    logActivity("admin_user_deleted", `ลบผู้ใช้หลังบ้าน "${current[0].username}"`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ลบผู้ใช้ไม่สำเร็จ" });
  }
}
