import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CameraRequestTimeoutError,
  cameraErrorInfo,
  cleanupFailedCameraAcquisition,
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

test("a secure browser without getUserMedia gets browser guidance, not HTTPS guidance", () => {
  const result = cameraErrorInfo(null, {
    isSecureContext: true,
    getUserMediaSupported: false,
  });
  assert.equal(result.kind, "unsupported_browser");
  assert.match(result.message, /browser|WebView/i);
  assert.doesNotMatch(result.message, /HTTPS/);
});

test("only the app timeout sentinel describes the 12-second timeout", () => {
  const result = cameraErrorInfo(new CameraRequestTimeoutError());
  assert.equal(result.kind, "request_timeout");
  assert.match(result.message, /12 detik.*coba lagi/i);
});

test("native aborts describe an interrupted request without claiming a timeout", () => {
  const result = cameraErrorInfo(namedError("AbortError"));
  assert.equal(result.kind, "request_interrupted");
  assert.match(result.message, /terhenti.*coba lagi/i);
  assert.doesNotMatch(result.message, /12 detik/i);
});

test("constraint errors point to camera capability and resolution", () => {
  for (const name of ["OverconstrainedError", "ConstraintNotSatisfiedError"]) {
    const result = cameraErrorInfo(namedError(name));
    assert.equal(result.kind, "unsupported_constraints");
    assert.match(result.message, /kemampuan kamera.*resolusi.*coba lagi/i);
  }
});

test("unknown values return safe recovery copy without raw browser details", () => {
  for (const error of [
    namedError("UnknownCameraError"),
    "RAW_BROWSER_ERROR_DO_NOT_SHOW",
    null,
  ]) {
    const result = cameraErrorInfo(error);
    assert.equal(result.kind, "unknown");
    assert.match(result.message, /periksa izin kamera.*coba lagi/i);
    assert.doesNotMatch(result.message, /RAW_BROWSER_ERROR_DO_NOT_SHOW/);
  }
});

function fakeStream(trackCount: number) {
  const stops = Array.from({ length: trackCount }, () => 0);
  return {
    stops,
    getTracks: () => stops.map((_, index) => ({ stop: () => { stops[index] += 1; } })),
  };
}

test("failed acquisition cleanup releases owned tracks, videos, stream state, and detector", () => {
  const stream = fakeStream(2);
  const unrelatedStream = fakeStream(1);
  const preview = { srcObject: stream };
  const capture = { srcObject: stream };
  const calibration = { srcObject: stream };
  const unrelatedVideo = { srcObject: unrelatedStream };
  let activeStream: typeof stream | null = stream;
  let detectorCloseCount = 0;
  const detector = { close: () => { detectorCloseCount += 1; } };
  let activeDetector: typeof detector | null = detector;

  const cleared = cleanupFailedCameraAcquisition({
    acquiredStream: stream,
    activeStream,
    videoElements: [preview, capture, calibration, unrelatedVideo],
    acquiredDetector: detector,
    activeDetector,
    clearActiveStream: () => { activeStream = null; },
    clearActiveDetector: () => { activeDetector = null; },
  });

  assert.equal(cleared, true);
  assert.deepEqual(stream.stops, [1, 1]);
  assert.equal(preview.srcObject, null);
  assert.equal(capture.srcObject, null);
  assert.equal(calibration.srcObject, null);
  assert.equal(unrelatedVideo.srcObject, unrelatedStream);
  assert.equal(activeStream, null);
  assert.equal(detectorCloseCount, 1);
  assert.equal(activeDetector, null);
});

test("failed acquisition cleanup never releases a newer request's stream or shared detector", () => {
  const failedStream = fakeStream(1);
  const newerStream = fakeStream(1);
  const failedVideo = { srcObject: failedStream };
  const newerVideo = { srcObject: newerStream };
  let activeStream: typeof failedStream | null = newerStream;
  let detectorCloseCount = 0;
  const sharedDetector = { close: () => { detectorCloseCount += 1; } };
  let activeDetector: typeof sharedDetector | null = sharedDetector;

  const cleared = cleanupFailedCameraAcquisition({
    acquiredStream: failedStream,
    activeStream,
    videoElements: [failedVideo, newerVideo],
    acquiredDetector: sharedDetector,
    activeDetector,
    clearActiveStream: () => { activeStream = null; },
    clearActiveDetector: () => { activeDetector = null; },
  });

  assert.equal(cleared, false);
  assert.deepEqual(failedStream.stops, [1]);
  assert.deepEqual(newerStream.stops, [0]);
  assert.equal(failedVideo.srcObject, null);
  assert.equal(newerVideo.srcObject, newerStream);
  assert.equal(activeStream, newerStream);
  assert.equal(detectorCloseCount, 0);
  assert.equal(activeDetector, sharedDetector);
});

test("live capture uses localized errors while preserving bounded video-only cleanup", () => {
  assert.match(page, /cameraErrorInfo\(error/);
  assert.match(page, /cleanupFailedCameraAcquisition\(\{/);
  assert.doesNotMatch(page, /setDeviceMessage\(\s*error instanceof Error\s*\? error\.message/);
  assert.match(page, /window\.setTimeout\([\s\S]*?12_000/);
  assert.match(page, /audio: false/);
  assert.match(page, /if \(cameraRequestExpired\) \{\s*openedStream\.getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\)/);
  assert.match(page, /if \(requestId !== cameraRequestIdRef\.current\) \{\s*stream\.getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\)/);
  assert.match(page, /return \(\) => \{[\s\S]*?streamRef\.current\?\.getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\)/);
  assert.match(page, /function goHome\(\) \{[\s\S]*?stopCamera\(\)/);
  assert.match(page, /if \(mode === "live" && nextValidity\.outcome !== "RETRY_STAGE"\) stopCamera\(\)/);
});
