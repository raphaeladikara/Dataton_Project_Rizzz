import type { Locale } from "../i18n/locale";
export type CameraErrorKind =
  | "permission_denied"
  | "camera_not_found"
  | "camera_busy"
  | "insecure_context"
  | "unsupported_browser"
  | "unsupported_constraints"
  | "request_timeout"
  | "request_interrupted"
  | "unknown";

export type CameraErrorInfo = {
  kind: CameraErrorKind;
  message: string;
};

export class CameraRequestTimeoutError extends Error {
  override name = "CameraRequestTimeoutError";

  constructor() {
    super("Camera request exceeded its 12-second limit.");
  }
}

function errorName(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  try {
    const name = Reflect.get(error, "name");
    return typeof name === "string" ? name : null;
  } catch {
    return null;
  }
}

const CAMERA_ERRORS_EN: Record<CameraErrorKind, string> = {
  permission_denied:
    "Camera permission was denied. Allow camera access for this site in your browser settings, then try again.",
  camera_not_found:
    "No camera found. Connect or enable a front-facing camera, then try again.",
  camera_busy:
    "The camera is in use by another application. Close any app or tab using it, then try again.",
  insecure_context:
    "The camera requires HTTPS or http://localhost. Open this page over an HTTPS connection, then try again.",
  unsupported_browser:
    "This browser or WebView does not support camera access. Open the page in a recent version of Chrome, Edge, or Safari, then try again.",
  unsupported_constraints:
    "The camera cannot meet this session's resolution requirement. Choose a different camera or check the device's resolution settings, then try again.",
  request_timeout:
    "The camera did not respond within 12 seconds. Check camera permissions and connection, then try again.",
  request_interrupted:
    "The camera request stopped before it finished. Try again; if it keeps happening, reload the page.",
  unknown:
    "The camera could not be opened. Check camera permissions, close other apps using the camera, then try again.",
};

/** The message for a kind, in the reader's language. */
export function cameraErrorMessage(kind: CameraErrorKind, locale: Locale): string {
  return locale === "en" ? CAMERA_ERRORS_EN[kind] : CAMERA_ERRORS[kind].message;
}

const CAMERA_ERRORS: Record<CameraErrorKind, CameraErrorInfo> = {
  permission_denied: {
    kind: "permission_denied",
    message: "Izin kamera ditolak. Buka izin kamera untuk situs ini di pengaturan browser, lalu coba lagi.",
  },
  camera_not_found: {
    kind: "camera_not_found",
    message: "Kamera tidak ditemukan. Sambungkan atau aktifkan kamera depan, lalu coba lagi.",
  },
  camera_busy: {
    kind: "camera_busy",
    message: "Kamera sedang dipakai aplikasi lain. Tutup aplikasi atau tab yang memakai kamera, lalu coba lagi.",
  },
  insecure_context: {
    kind: "insecure_context",
    message: "Kamera memerlukan HTTPS atau http://localhost. Buka halaman ini melalui koneksi HTTPS, lalu coba lagi.",
  },
  unsupported_browser: {
    kind: "unsupported_browser",
    message: "Browser atau WebView ini tidak mendukung akses kamera. Buka halaman di Chrome, Edge, atau Safari versi terbaru, lalu coba lagi.",
  },
  unsupported_constraints: {
    kind: "unsupported_constraints",
    message: "Kemampuan kamera tidak memenuhi kebutuhan resolusi sesi ini. Pilih kamera lain atau periksa pengaturan resolusi perangkat, lalu coba lagi.",
  },
  request_timeout: {
    kind: "request_timeout",
    message: "Kamera tidak merespons dalam 12 detik. Periksa izin dan koneksi kamera, lalu coba lagi.",
  },
  request_interrupted: {
    kind: "request_interrupted",
    message: "Permintaan kamera terhenti sebelum selesai. Coba lagi; jika berulang, muat ulang halaman.",
  },
  unknown: {
    kind: "unknown",
    message: "Kamera belum dapat dibuka. Periksa izin kamera, tutup aplikasi lain yang memakai kamera, lalu coba lagi.",
  },
};

export function cameraErrorInfo(
  error: unknown,
  environment: {
    isSecureContext?: boolean;
    getUserMediaSupported?: boolean;
  } = {},
): CameraErrorInfo {
  if (environment.isSecureContext === false) return CAMERA_ERRORS.insecure_context;
  if (environment.getUserMediaSupported === false) return CAMERA_ERRORS.unsupported_browser;

  const name = errorName(error);
  if (name === "NotAllowedError" || name === "PermissionDeniedError")
    return CAMERA_ERRORS.permission_denied;
  if (name === "NotFoundError" || name === "DevicesNotFoundError")
    return CAMERA_ERRORS.camera_not_found;
  if (name === "NotReadableError" || name === "TrackStartError")
    return CAMERA_ERRORS.camera_busy;
  if (name === "SecurityError") return CAMERA_ERRORS.insecure_context;
  if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError")
    return CAMERA_ERRORS.unsupported_constraints;
  if (error instanceof CameraRequestTimeoutError) return CAMERA_ERRORS.request_timeout;
  if (name === "AbortError") return CAMERA_ERRORS.request_interrupted;
  return CAMERA_ERRORS.unknown;
}

type CameraStreamResource = {
  getTracks(): ArrayLike<{ stop(): void }>;
};

type CameraDetectionResource = {
  close(): void;
};

export function cleanupFailedCameraAcquisition<
  TStream extends CameraStreamResource,
  TDetector extends CameraDetectionResource,
>({
  acquiredStream,
  activeStream,
  videoElements,
  acquiredDetector,
  activeDetector,
  clearActiveStream,
  clearActiveDetector,
}: {
  acquiredStream: TStream;
  activeStream: TStream | null;
  // `HTMLVideoElement.srcObject` is the wider `MediaProvider | null`; keeping
  // this structural lets the helper remain testable without DOM instances.
  videoElements: Array<{ srcObject: unknown }>;
  acquiredDetector: TDetector | null;
  activeDetector: TDetector | null;
  clearActiveStream(): void;
  clearActiveDetector(): void;
}): boolean {
  let tracks: ArrayLike<{ stop(): void }> = [];
  try {
    tracks = acquiredStream.getTracks();
  } catch {
    // Continue clearing bindings even if a browser stream object is damaged.
  }
  for (const track of Array.from(tracks)) {
    try {
      track.stop();
    } catch {
      // One broken track must not leave the remaining camera resources live.
    }
  }

  for (const video of videoElements) {
    if (video.srcObject === acquiredStream) video.srcObject = null;
  }

  if (activeStream !== acquiredStream) return false;
  clearActiveStream();

  if (acquiredDetector && activeDetector === acquiredDetector) {
    try {
      acquiredDetector.close();
    } catch {
      // The failed session still relinquishes the detector reference.
    } finally {
      clearActiveDetector();
    }
  }
  return true;
}
