import assert from "node:assert/strict";
import test from "node:test";

import nextConfig from "../next.config";
import { securityHeaders, type HeaderRule } from "../src/security/responseHeaders";

function headerMap(entries: HeaderRule[]) {
  const global = entries.find((entry) => entry.source === "/:path*");
  assert.ok(global, "global response headers are missing");
  return new Map(global.headers.map(({ key, value }) => [key.toLowerCase(), value]));
}

async function globalHeaders() {
  assert.ok(nextConfig.headers, "next.config.ts declares no response headers");
  return headerMap((await nextConfig.headers()) as HeaderRule[]);
}

function productionHeaders() {
  return headerMap(securityHeaders("production"));
}

function developmentHeaders() {
  return headerMap(securityHeaders("development"));
}

function parseDirectives(csp: string) {
  return new Map(
    csp.split(";")
      .map((part) => part.trim().split(/\s+/))
      .filter(([name]) => name)
      .map(([name, ...sources]) => [name, sources]),
  );
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

test("both modes keep the same browser security boundaries", () => {
  for (const headers of [productionHeaders(), developmentHeaders()]) {
    assert.equal(headers.get("permissions-policy"), "camera=(self), microphone=()");
    assert.equal(headers.get("x-content-type-options"), "nosniff");
    assert.equal(headers.get("x-frame-options"), "DENY");
    assert.equal(headers.get("cross-origin-opener-policy"), "same-origin");
    assert.equal(headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  }
});

test("production responses require long-lived HTTPS without preloading undeclared subdomains", () => {
  const value = productionHeaders().get("strict-transport-security") ?? "";
  const maxAge = Number(/(?:^|;)\s*max-age=(\d+)/i.exec(value)?.[1] ?? 0);
  assert.ok(maxAge >= 31_536_000, `HSTS max-age is too short: ${maxAge}`);
  assert.match(value, /(?:^|;)\s*includeSubDomains(?:;|$)/i);
  assert.doesNotMatch(value, /(?:^|;)\s*preload(?:;|$)/i);
});

test("development responses do not pin HSTS onto a local http origin", () => {
  // An HSTS header served from localhost would upgrade every later
  // http://localhost port on the operator's machine, including unrelated ones.
  assert.equal(developmentHeaders().get("strict-transport-security"), undefined);
});

test("CSP is explicit, same-origin, and compatible with local Next and MediaPipe assets", () => {
  const csp = productionHeaders().get("content-security-policy") ?? "";
  const directives = parseDirectives(csp);

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

test("the shipped config never grants eval to a deployed build", async () => {
  const csp = (await globalHeaders()).get("content-security-policy") ?? "";
  if (process.env.NODE_ENV === "development") return;
  assert.doesNotMatch(csp, /'unsafe-eval'/);
});

test("development CSP admits the eval React needs for its dev client", () => {
  // React's development build reconstructs cross-environment stacks with
  // eval(); without this the dev server logs a CSP error on every page load.
  const csp = developmentHeaders().get("content-security-policy") ?? "";
  const scriptSrc = parseDirectives(csp).get("script-src") ?? [];
  assert.ok(scriptSrc.includes("'unsafe-eval'"));
  assert.ok(scriptSrc.includes("'wasm-unsafe-eval'"));
});

test("the development relaxation is confined to script execution", () => {
  const production = parseDirectives(productionHeaders().get("content-security-policy") ?? "");
  const development = parseDirectives(developmentHeaders().get("content-security-policy") ?? "");
  assert.deepEqual([...development.keys()], [...production.keys()]);
  for (const [name, sources] of production) {
    if (name === "script-src") continue;
    assert.deepEqual(development.get(name), sources, `${name} differs between modes`);
  }
});
