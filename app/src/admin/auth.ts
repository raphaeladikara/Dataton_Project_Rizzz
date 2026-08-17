import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "neurogaze_admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function passwordHash(): string {
  return process.env.NEUROGAZE_ADMIN_PASSWORD_SHA256 ?? "";
}

function sessionSecret(): string {
  return process.env.NEUROGAZE_ADMIN_SESSION_SECRET ?? "";
}

export function adminConfigured(): boolean {
  return /^[a-f0-9]{64}$/i.test(passwordHash()) && sessionSecret().length >= 32;
}

export function verifyAdminPassword(password: string): boolean {
  if (!adminConfigured() || password.length === 0 || password.length > 256) return false;
  const actual = Buffer.from(createHash("sha256").update(password, "utf8").digest("hex"));
  const expected = Buffer.from(passwordHash().toLowerCase());
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function signature(expiresAt: string): string {
  return createHmac("sha256", sessionSecret()).update(`neurogaze-admin:${expiresAt}`).digest("hex");
}

export function createAdminSession(): { token: string; maxAge: number } {
  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  return { token: `${expiresAt}.${signature(expiresAt)}`, maxAge: SESSION_TTL_SECONDS };
}

export function verifyAdminSession(token: string | undefined): boolean {
  if (!adminConfigured() || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expiresAt, providedSignature] = parts;
  const now = Math.floor(Date.now() / 1000);
  const expiry = Number(expiresAt);
  if (!/^\d{10}$/.test(expiresAt) || !/^[a-f0-9]{64}$/i.test(providedSignature)) return false;
  if (!Number.isSafeInteger(expiry) || expiry <= now || expiry > now + SESSION_TTL_SECONDS) return false;
  const actual = Buffer.from(providedSignature);
  const expected = Buffer.from(signature(expiresAt));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
