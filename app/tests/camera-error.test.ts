import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CameraRequestTimeoutError,
  cameraErrorInfo,
} from "../src/capture/cameraError";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

function namedError(name: string, message = "RAW_BROWSER_ERROR_DO_NOT_SHOW") {
  return Object.assign(new Error(message), { name });
}

test("permission errors explain how to restore site camera access", () => {
  for (const name of ["NotAllowedError", "PermissionDeniedError"]) {
    const result = cameraErrorInfo(namedError(name));
    assert.equal(result.kind, "permission_denied");
    assert.match(result.message, /izin kamera.*pengaturan browser.*coba lagi/i);
  }
});

test("missing-device errors explain that no camera was found", () => {
  for (const name of ["NotFoundError", "DevicesNotFoundError"]) {
    const result = cameraErrorInfo(namedError(name));
    assert.equal(result.kind, "camera_not_found");
    assert.match(result.message, /kamera tidak ditemukan.*aktifkan.*coba lagi/i);
  }
});

test("busy-device errors explain that another application may own the camera", () => {
  for (const name of ["NotReadableError", "TrackStartError"]) {
    const result = cameraErrorInfo(namedError(name));
    assert.equal(result.kind, "camera_busy");
    assert.match(result.message, /dipakai aplikasi lain.*tutup.*coba lagi/i);
  }
});

test("security errors and insecure contexts direct the operator to HTTPS", () => {
  for (const result of [
    cameraErrorInfo(namedError("SecurityError")),
    cameraErrorInfo(null, { isSecureContext: false }),
  ]) {
    assert.equal(result.kind, "insecure_context");
    assert.match(result.message, /HTTPS.*localhost.*coba lagi/i);
  }
});

test("aborted and timed-out requests describe the 12-second retry path", () => {
  for (const error of [namedError("AbortError"), new CameraRequestTimeoutError()]) {
    const result = cameraErrorInfo(error);
    assert.equal(result.kind, "request_timeout");
    assert.match(result.message, /12 detik.*coba lagi/i);
  }
});

test("unknown values return safe recovery copy without raw browser details", () => {
  for (const error of [
    namedError("OverconstrainedError"),
    "RAW_BROWSER_ERROR_DO_NOT_SHOW",
    null,
  ]) {
    const result = cameraErrorInfo(error);
    assert.equal(result.kind, "unknown");
    assert.match(result.message, /periksa izin kamera.*coba lagi/i);
    assert.doesNotMatch(result.message, /RAW_BROWSER_ERROR_DO_NOT_SHOW/);
  }
});

test("live capture uses localized errors while preserving bounded video-only cleanup", () => {
  assert.match(page, /cameraErrorInfo\(error/);
  assert.doesNotMatch(page, /setDeviceMessage\(\s*error instanceof Error\s*\? error\.message/);
  assert.match(page, /window\.setTimeout\([\s\S]*?12_000/);
  assert.match(page, /audio: false/);
  assert.match(page, /if \(cameraRequestExpired\) \{\s*openedStream\.getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\)/);
  assert.match(page, /if \(requestId !== cameraRequestIdRef\.current\) \{\s*stream\.getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\)/);
  assert.match(page, /return \(\) => \{[\s\S]*?streamRef\.current\?\.getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\)/);
  assert.match(page, /function goHome\(\) \{[\s\S]*?stopCamera\(\)/);
  assert.match(page, /if \(mode === "live" && nextValidity\.outcome !== "RETRY_STAGE"\) stopCamera\(\)/);
});
