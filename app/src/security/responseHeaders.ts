export type ResponseHeader = { key: string; value: string };
export type HeaderRule = { source: string; headers: ResponseHeader[] };
export type BuildMode = "development" | "production";

/**
 * Next App Router emits inline hydration data and injects framework/component
 * styles without a nonce architecture. Those two exceptions stay confined to
 * script/style; every external origin remains blocked in both modes.
 *
 * `'unsafe-eval'` is the one directive that differs by mode. React's
 * development build calls eval() to rebuild callstacks across environments, so
 * a dev server without it logs a CSP violation on every page load. A deployed
 * build never needs it, and `securityHeaders("production")` never grants it.
 */
function contentSecurityPolicy(mode: BuildMode): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'"];
  if (mode === "development") scriptSrc.push("'unsafe-eval'");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self' data: blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join("; ");
}

export function securityHeaders(mode: BuildMode): HeaderRule[] {
  const headers: ResponseHeader[] = [
    { key: "Permissions-Policy", value: "camera=(self), microphone=()" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ];

  // HSTS is keyed to a host, not a port. Sending it from http://localhost
  // would force every other local port on the operator's machine to HTTPS.
  if (mode === "production") {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }

  headers.push({ key: "Content-Security-Policy", value: contentSecurityPolicy(mode) });

  return [
    { source: "/:path*", headers },
    {
      source: "/admin/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
    },
  ];
}

export function currentBuildMode(nodeEnv: string | undefined): BuildMode {
  return nodeEnv === "development" ? "development" : "production";
}
