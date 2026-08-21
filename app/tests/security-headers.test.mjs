import assert from "node:assert/strict";
import test from "node:test";

import nextConfig from "../next.config.ts";

async function globalHeaders() {
  const entries = await nextConfig.headers();
  const global = entries.find((entry) => entry.source === "/:path*");
  assert.ok(global, "global response headers are missing");
  return new Map(global.headers.map(({ key, value }) => [key.toLowerCase(), value]));
}

test("Next suppresses its framework banner and production browser source maps", () => {
  assert.equal(nextConfig.poweredByHeader, false);
  assert.equal(nextConfig.productionBrowserSourceMaps, false);
});

test("global responses retain the existing browser security boundaries", async () => {
  const headers = await globalHeaders();
  assert.equal(headers.get("permissions-policy"), "camera=(self), microphone=()");
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("x-frame-options"), "DENY");
  assert.equal(headers.get("cross-origin-opener-policy"), "same-origin");
  assert.equal(headers.get("referrer-policy"), "strict-origin-when-cross-origin");
});

test("global responses require long-lived HTTPS without preloading undeclared subdomains", async () => {
  const value = (await globalHeaders()).get("strict-transport-security") ?? "";
  const maxAge = Number(/(?:^|;)\s*max-age=(\d+)/i.exec(value)?.[1] ?? 0);
  assert.ok(maxAge >= 31_536_000, `HSTS max-age is too short: ${maxAge}`);
  assert.match(value, /(?:^|;)\s*includeSubDomains(?:;|$)/i);
  assert.doesNotMatch(value, /(?:^|;)\s*preload(?:;|$)/i);
});

test("CSP is explicit, same-origin, and compatible with local Next and MediaPipe assets", async () => {
  const csp = (await globalHeaders()).get("content-security-policy") ?? "";
  const directives = new Map(
    csp.split(";")
      .map((part) => part.trim().split(/\s+/))
      .filter(([name]) => name)
      .map(([name, ...sources]) => [name, sources]),
  );

  const expected = [
    "default-src",
    "base-uri",
    "form-action",
    "frame-ancestors",
    "object-src",
    "script-src",
    "style-src",
    "img-src",
    "font-src",
    "connect-src",
    "media-src",
    "worker-src",
    "manifest-src",
  ];
  for (const name of expected) assert.ok(directives.has(name), `missing CSP directive: ${name}`);

  assert.deepEqual(directives.get("default-src"), ["'self'"]);
  assert.deepEqual(directives.get("base-uri"), ["'self'"]);
  assert.deepEqual(directives.get("form-action"), ["'self'"]);
  assert.deepEqual(directives.get("frame-ancestors"), ["'none'"]);
  assert.deepEqual(directives.get("object-src"), ["'none'"]);
  assert.deepEqual(directives.get("connect-src"), ["'self'"]);
  assert.ok(directives.get("script-src")?.includes("'wasm-unsafe-eval'"));
  assert.ok(directives.get("script-src")?.includes("'unsafe-inline'"));
  assert.ok(directives.get("style-src")?.includes("'unsafe-inline'"));
  assert.ok(directives.get("img-src")?.includes("data:"));
  assert.ok(directives.get("img-src")?.includes("blob:"));
  assert.ok(directives.get("media-src")?.includes("blob:"));
  assert.ok(directives.get("worker-src")?.includes("blob:"));

  assert.doesNotMatch(csp, /(?:^|\s)\*(?:\s|;|$)/);
  assert.doesNotMatch(csp, /https?:|wss?:/);
  assert.doesNotMatch(csp, /'unsafe-eval'/);
});
