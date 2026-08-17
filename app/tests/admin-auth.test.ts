import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  adminConfigured,
  createAdminSession,
  verifyAdminPassword,
  verifyAdminSession,
} from "../src/admin/auth";

const originalPasswordHash = process.env.NEUROGAZE_ADMIN_PASSWORD_SHA256;
const originalSessionSecret = process.env.NEUROGAZE_ADMIN_SESSION_SECRET;

test.before(() => {
  process.env.NEUROGAZE_ADMIN_PASSWORD_SHA256 = createHash("sha256").update("correct horse battery staple").digest("hex");
  process.env.NEUROGAZE_ADMIN_SESSION_SECRET = "test-only-session-secret-with-at-least-32-characters";
});

test.after(() => {
  if (originalPasswordHash === undefined) delete process.env.NEUROGAZE_ADMIN_PASSWORD_SHA256;
  else process.env.NEUROGAZE_ADMIN_PASSWORD_SHA256 = originalPasswordHash;
  if (originalSessionSecret === undefined) delete process.env.NEUROGAZE_ADMIN_SESSION_SECRET;
  else process.env.NEUROGAZE_ADMIN_SESSION_SECRET = originalSessionSecret;
});

test("admin authentication is configured only with strong server values", () => {
  assert.equal(adminConfigured(), true);
  assert.equal(verifyAdminPassword("correct horse battery staple"), true);
  assert.equal(verifyAdminPassword("wrong"), false);
  assert.equal(verifyAdminPassword("x".repeat(257)), false);
});

test("admin sessions reject malformed, expired, tampered, and overlong tokens", () => {
  const session = createAdminSession();
  const tampered = `${session.token.slice(0, -1)}${session.token.endsWith("0") ? "1" : "0"}`;
  assert.equal(verifyAdminSession(session.token), true);
  assert.equal(verifyAdminSession(`${session.token}.extra`), false);
  assert.equal(verifyAdminSession(tampered), false);
  assert.equal(verifyAdminSession("9999999999." + "a".repeat(64)), false);
  assert.equal(verifyAdminSession("1000000000." + "a".repeat(64)), false);
});
