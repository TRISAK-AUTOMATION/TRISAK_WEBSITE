import crypto from "crypto";
import { promisify } from "util";

const scrypt = promisify(crypto.scrypt);
const KEY_LEN = 64;

/**
 * Password hashing with Node's built-in scrypt (no extra dependency).
 * Stored format: "scrypt$<salt hex>$<hash hex>".
 */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(String(password), salt, KEY_LEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored || "").split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(String(password), Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export const MIN_PASSWORD_LENGTH = 8;

/** Returns an error message, or null when the password is acceptable. */
export function passwordProblem(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`;
  }
  if (password.length > 200) return "รหัสผ่านยาวเกินไป";
  return null;
}
