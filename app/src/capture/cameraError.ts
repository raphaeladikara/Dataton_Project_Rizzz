export type CameraErrorKind =
  | "permission_denied"
  | "camera_not_found"
  | "camera_busy"
  | "insecure_context"
  | "request_timeout"
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
  request_timeout: {
    kind: "request_timeout",
    message: "Kamera tidak merespons dalam 12 detik. Periksa izin dan koneksi kamera, lalu coba lagi.",
  },
  unknown: {
    kind: "unknown",
    message: "Kamera belum dapat dibuka. Periksa izin kamera, tutup aplikasi lain yang memakai kamera, lalu coba lagi.",
  },
};

export function cameraErrorInfo(
  error: unknown,
  environment: { isSecureContext?: boolean } = {},
): CameraErrorInfo {
  if (environment.isSecureContext === false) return CAMERA_ERRORS.insecure_context;

  const name = errorName(error);
  if (name === "NotAllowedError" || name === "PermissionDeniedError")
    return CAMERA_ERRORS.permission_denied;
  if (name === "NotFoundError" || name === "DevicesNotFoundError")
    return CAMERA_ERRORS.camera_not_found;
  if (name === "NotReadableError" || name === "TrackStartError")
    return CAMERA_ERRORS.camera_busy;
  if (name === "SecurityError") return CAMERA_ERRORS.insecure_context;
  if (name === "AbortError" || name === "CameraRequestTimeoutError")
    return CAMERA_ERRORS.request_timeout;
  return CAMERA_ERRORS.unknown;
}
