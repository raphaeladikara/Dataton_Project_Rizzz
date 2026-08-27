import { DEFAULT_LOCALE, type Locale } from "../i18n/locale";

export type ValidityOutcome = "VALID" | "RETRY_STAGE" | "RESTART_SESSION" | "HELD";
export type HeldKind = "HELD_MEASUREMENT" | "HELD_SYSTEM" | null;
export type PhaseValidity = "valid" | "degraded" | "invalid";

export type ValidityReasonCode =
  | "GAZE_FROZEN"
  | "GAZE_RANDOM_JUMPS"
  | "DIRECTION_REVERSED"
  | "CENTER_LOCK"
  | "OFF_SCREEN_DOMINANT"
  | "PHASE_DESYNC"
  | "INSUFFICIENT_VALID_PHASES"
  | "FACE_POSE_UNSTABLE"
  | "CAMERA_STREAM_INTERRUPTED"
  | "FEATURE_CONTRACT_MISMATCH"
  | "CALIBRATION_INVALID"
  | "GAZE_UNAVAILABLE"
  | "SESSION_INCOMPLETE";

export type PhaseAssessment = {
  id: string;
  status: PhaseValidity;
  faceAvailable: boolean;
  gazeAvailable: boolean;
  onScreen: boolean;
  stable: boolean;
  timestampsComplete: boolean;
  stimulusComplete: boolean;
  synchronized: boolean;
  retryCount?: number;
};

export type SessionValidityInput = {
  sessionComplete: boolean;
  cameraInterrupted: boolean;
  orientationChanged: boolean;
  calibrationPassed: boolean;
  /**
   * Whether a scoring model was loaded at all. Defaults to true so existing
   * callers keep their behaviour. When false there is no contract to check:
   * the features were never going to be handed to anything, and the two fields
   * below say nothing about the recording.
   */
  scoringModelAvailable?: boolean;
  featureContractMatches: boolean;
  timestampsSynchronized: boolean;
  faceRate: number;
  gazeDropout: number;
  poseRejectedRate: number;
  offScreenRate: number;
  gazeMovement: number;
  rawIrisMovement: number;
  stationaryJumpRate: number;
  sanity?: {
    completed: boolean;
    leftMedianX: number;
    centerMedianX: number;
    rightMedianX: number;
    stable: boolean;
  };
  phases: PhaseAssessment[];
  missingFeatures?: string[];
};

export type SessionValidityResult = {
  canScore: boolean;
  outcome: ValidityOutcome;
  heldKind: HeldKind;
  primaryReasonCode: ValidityReasonCode | null;
  userMessage: string;
  operatorAction: string;
  invalidStages: string[];
  debugEvidence: Record<string, unknown>;
};

type ReasonCopy = {
  message: string;
  action: string;
  stage: string;
  kind: Exclude<HeldKind, null>;
};

const REASON_COPY_ID: Record<ValidityReasonCode, ReasonCopy> = {
  GAZE_FROZEN: { message: "Hasil pandangan tidak berubah saat gambar berpindah.", action: "Ulangi kalibrasi.", stage: "pengukuran pandangan", kind: "HELD_MEASUREMENT" },
  GAZE_RANDOM_JUMPS: { message: "Pembacaan pandangan masih terlalu berubah-ubah.", action: "Perbaiki posisi dan ulangi kalibrasi.", stage: "pengukuran pandangan", kind: "HELD_MEASUREMENT" },
  DIRECTION_REVERSED: { message: "Pengaturan kamera perlu diperiksa.", action: "Kembali ke pemeriksaan posisi lalu ulangi kalibrasi.", stage: "pengecekan arah pandangan", kind: "HELD_SYSTEM" },
  CENTER_LOCK: { message: "Arah pandangan belum dapat dibedakan.", action: "Ulangi kalibrasi dengan wajah tetap menghadap layar.", stage: "pengecekan arah pandangan", kind: "HELD_MEASUREMENT" },
  OFF_SCREEN_DOMINANT: { message: "Posisi pandangan belum sesuai dengan layar.", action: "Kembali ke pemeriksaan posisi dan ulangi kalibrasi.", stage: "stimulus", kind: "HELD_MEASUREMENT" },
  PHASE_DESYNC: { message: "Sesi sempat terhenti sehingga hasil belum dapat dihitung.", action: "Ulangi stimulus.", stage: "stimulus", kind: "HELD_SYSTEM" },
  INSUFFICIENT_VALID_PHASES: { message: "Belum cukup bagian tes yang berhasil direkam.", action: "Ulangi tes saat anak sudah siap.", stage: "stimulus", kind: "HELD_MEASUREMENT" },
  FACE_POSE_UNSTABLE: { message: "Posisi anak berubah terlalu banyak selama tes.", action: "Bantu anak duduk lebih nyaman dan ulangi bagian ini.", stage: "perekaman", kind: "HELD_MEASUREMENT" },
  CAMERA_STREAM_INTERRUPTED: { message: "Kamera sempat berhenti.", action: "Izinkan kamera kembali lalu mulai sesi baru dari pemeriksaan posisi.", stage: "kamera", kind: "HELD_SYSTEM" },
  FEATURE_CONTRACT_MISMATCH: { message: "Terjadi masalah pada aplikasi. Hasil tidak dibuat agar tidak menyesatkan.", action: "Mulai ulang aplikasi.", stage: "pemeriksaan sistem", kind: "HELD_SYSTEM" },
  CALIBRATION_INVALID: { message: "Kamera dapat melihat mata, tetapi arah pandangan belum terbaca.", action: "Ulangi kalibrasi.", stage: "kalibrasi", kind: "HELD_MEASUREMENT" },
  GAZE_UNAVAILABLE: { message: "Mata belum terbaca dengan baik.", action: "Periksa posisi, cahaya, dan pantulan pada kacamata.", stage: "perekaman", kind: "HELD_MEASUREMENT" },
  SESSION_INCOMPLETE: { message: "Tes sempat terhenti dan perlu diulang.", action: "Mulai sesi baru saat anak siap.", stage: "sesi", kind: "HELD_SYSTEM" },
};

const REASON_COPY_EN: Record<ValidityReasonCode, ReasonCopy> = {
  GAZE_FROZEN: { message: "The gaze reading did not change as the picture moved.", action: "Repeat calibration.", stage: "gaze measurement", kind: "HELD_MEASUREMENT" },
  GAZE_RANDOM_JUMPS: { message: "The gaze reading is still too erratic.", action: "Correct the framing and repeat calibration.", stage: "gaze measurement", kind: "HELD_MEASUREMENT" },
  DIRECTION_REVERSED: { message: "The camera setup needs checking.", action: "Go back to the framing check, then repeat calibration.", stage: "gaze direction check", kind: "HELD_SYSTEM" },
  CENTER_LOCK: { message: "Gaze direction cannot yet be distinguished.", action: "Repeat calibration with the face kept towards the screen.", stage: "gaze direction check", kind: "HELD_MEASUREMENT" },
  OFF_SCREEN_DOMINANT: { message: "Gaze position does not line up with the screen.", action: "Go back to the framing check and repeat calibration.", stage: "stimulus", kind: "HELD_MEASUREMENT" },
  PHASE_DESYNC: { message: "The session was interrupted, so the result cannot be computed.", action: "Repeat the stimulus.", stage: "stimulus", kind: "HELD_SYSTEM" },
  INSUFFICIENT_VALID_PHASES: { message: "Not enough of the test sections were recorded successfully.", action: "Repeat the test once the child is ready.", stage: "stimulus", kind: "HELD_MEASUREMENT" },
  FACE_POSE_UNSTABLE: { message: "The child's position changed too much during the test.", action: "Help the child sit more comfortably and repeat this section.", stage: "recording", kind: "HELD_MEASUREMENT" },
  CAMERA_STREAM_INTERRUPTED: { message: "The camera stopped.", action: "Allow the camera again, then start a new session from the framing check.", stage: "camera", kind: "HELD_SYSTEM" },
  FEATURE_CONTRACT_MISMATCH: { message: "Something went wrong in the application. No result is produced, so that nothing misleading is reported.", action: "Restart the application.", stage: "system check", kind: "HELD_SYSTEM" },
  CALIBRATION_INVALID: { message: "The camera can see the eyes, but gaze direction is not readable.", action: "Repeat calibration.", stage: "calibration", kind: "HELD_MEASUREMENT" },
  GAZE_UNAVAILABLE: { message: "The eyes are not reading clearly.", action: "Check framing, lighting, and reflections on any glasses.", stage: "recording", kind: "HELD_MEASUREMENT" },
  SESSION_INCOMPLETE: { message: "The test was interrupted and needs repeating.", action: "Start a new session when the child is ready.", stage: "session", kind: "HELD_SYSTEM" },
};

/**
 * Kept exported under its original name so existing callers and the contract
 * tests keep reading the Indonesian table without a change.
 */
export const REASON_COPY = REASON_COPY_ID;

const REASON_COPY_BY_LOCALE: Record<Locale, Record<ValidityReasonCode, ReasonCopy>> = {
  id: REASON_COPY_ID,
  en: REASON_COPY_EN,
};

const OUTCOME_COPY: Record<Locale, {
  notRisk: string;
  retryMessage: string;
  retryAction: (phaseId: string) => string;
  validMessage: string;
  validAction: string;
}> = {
  id: {
    notRisk: "Ini bukan hasil risiko anak.",
    retryMessage: "Satu bagian tes perlu direkam ulang. Ini bukan hasil risiko anak.",
    retryAction: (phaseId) => `Ulangi bagian ${phaseId}.`,
    validMessage: "Rekaman cukup baik untuk dianalisis.",
    validAction: "Lanjutkan ke laporan.",
  },
  en: {
    notRisk: "This is not a risk finding about the child.",
    retryMessage: "One section of the test needs recording again. This is not a risk finding about the child.",
    retryAction: (phaseId) => `Repeat section ${phaseId}.`,
    validMessage: "The recording is good enough to analyse.",
    validAction: "Continue to the report.",
  },
};

function held(
  code: ValidityReasonCode,
  evidence: Record<string, unknown>,
  invalidStages: string[] | undefined,
  locale: Locale,
): SessionValidityResult {
  const copy = REASON_COPY_BY_LOCALE[locale][code];
  return {
    canScore: false,
    outcome: "HELD",
    heldKind: copy.kind,
    primaryReasonCode: code,
    userMessage: `${copy.message} ${OUTCOME_COPY[locale].notRisk}`,
    operatorAction: copy.action,
    invalidStages: invalidStages?.length ? invalidStages : [copy.stage],
    debugEvidence: evidence,
  };
}

export function evaluateSessionValidity(
  input: SessionValidityInput,
  locale: Locale = DEFAULT_LOCALE,
): SessionValidityResult {
  const evidence = {
    sessionComplete: input.sessionComplete,
    faceRate: input.faceRate,
    gazeDropout: input.gazeDropout,
    poseRejectedRate: input.poseRejectedRate,
    offScreenRate: input.offScreenRate,
    gazeMovement: input.gazeMovement,
    rawIrisMovement: input.rawIrisMovement,
    stationaryJumpRate: input.stationaryJumpRate,
    sanity: input.sanity,
    phaseStatus: Object.fromEntries(input.phases.map((phase) => [phase.id, phase.status])),
    missingFeatures: input.missingFeatures ?? [],
  };

  // Only meaningful once a model exists to have a contract with. A session
  // recorded without one is still a valid recording; it simply produces no
  // score, which the engineering lanes never wanted and the child report
  // already has its own "estimate unavailable" state for.
  if (input.scoringModelAvailable !== false && (!input.featureContractMatches || (input.missingFeatures?.length ?? 0) > 0))
    return held("FEATURE_CONTRACT_MISMATCH", evidence, ["pemeriksaan sistem"], locale);
  if (input.cameraInterrupted) return held("CAMERA_STREAM_INTERRUPTED", evidence, undefined, locale);
  if (!input.sessionComplete) return held("SESSION_INCOMPLETE", evidence, undefined, locale);
  if (input.orientationChanged) return held("OFF_SCREEN_DOMINANT", evidence, ["pemeriksaan posisi", "kalibrasi"], locale);
  if (!input.calibrationPassed) return held("CALIBRATION_INVALID", evidence, undefined, locale);
  // Ahead of the phase-level checks, because a mapping that put most of the
  // session past the edge of the screen is what starves those phases of
  // samples in the first place. Ranked below them it lost every time: the
  // operator was told the session had been interrupted and to repeat the
  // stimulus, so the calibration at fault was carried into the retry
  // unchanged and the next recording failed the same way.
  if (input.offScreenRate > 0.5) return held("OFF_SCREEN_DOMINANT", evidence, ["kalibrasi"], locale);
  if (!input.timestampsSynchronized || input.phases.some((phase) => !phase.timestampsComplete || !phase.synchronized))
    return held("PHASE_DESYNC", evidence, undefined, locale);

  if (input.sanity) {
    const { leftMedianX: left, centerMedianX: center, rightMedianX: right, stable } = input.sanity;
    if (!input.sanity.completed || !stable) return held("CALIBRATION_INVALID", evidence, ["pengecekan arah pandangan"], locale);
    if (left > right + 0.08) return held("DIRECTION_REVERSED", evidence, ["pengecekan arah pandangan"], locale);
    if (Math.max(Math.abs(left - center), Math.abs(right - center), Math.abs(right - left)) < 0.08)
      return held("CENTER_LOCK", evidence, ["pengecekan arah pandangan"], locale);
  }

  if (input.rawIrisMovement >= 0.02 && input.gazeMovement < 0.015) return held("GAZE_FROZEN", evidence, undefined, locale);
  if (input.stationaryJumpRate > 0.18) return held("GAZE_RANDOM_JUMPS", evidence, undefined, locale);
  if (input.poseRejectedRate > 0.25) return held("FACE_POSE_UNSTABLE", evidence, undefined, locale);
  if (input.faceRate < 0.85 || input.gazeDropout > 0.2) return held("GAZE_UNAVAILABLE", evidence, undefined, locale);

  const invalid = input.phases.filter((phase) => phase.status === "invalid");
  const valid = input.phases.filter((phase) => phase.status === "valid");
  if (invalid.length === 1 && valid.length >= Math.max(1, input.phases.length - 1)) {
    return {
      canScore: false,
      outcome: "RETRY_STAGE",
      heldKind: null,
      primaryReasonCode: "INSUFFICIENT_VALID_PHASES",
      userMessage: OUTCOME_COPY[locale].retryMessage,
      operatorAction: OUTCOME_COPY[locale].retryAction(invalid[0].id),
      invalidStages: invalid.map((phase) => phase.id),
      debugEvidence: evidence,
    };
  }
  if (valid.length < Math.ceil(input.phases.length * 0.75))
    return held("INSUFFICIENT_VALID_PHASES", evidence, invalid.map((phase) => phase.id), locale);

  return {
    canScore: true,
    outcome: "VALID",
    heldKind: null,
    primaryReasonCode: null,
    userMessage: OUTCOME_COPY[locale].validMessage,
    operatorAction: OUTCOME_COPY[locale].validAction,
    invalidStages: [],
    debugEvidence: evidence,
  };
}

/**
 * `timestampsMonotonic` is the only thing here that can speak to the clock, and
 * a caller that does not measure it says nothing rather than guessing.
 *
 * These two fields used to be filled in from the sample count, which reads as
 * "the session was interrupted" whenever a phase was merely thin. A phase can
 * be starved of samples with a perfectly monotone clock — that is exactly what
 * an off-screen calibration produces — and the fabricated answer outranked the
 * real one in evaluateSessionValidity, so the operator was sent to repeat the
 * stimulus while the calibration that caused it went untouched.
 */
export function phaseAssessment(
  id: string,
  sampleCount: number,
  expectedMinimum = 8,
  timestampsMonotonic = true,
): PhaseAssessment {
  const valid = sampleCount >= expectedMinimum;
  return {
    id,
    status: valid ? "valid" : sampleCount > 0 ? "degraded" : "invalid",
    faceAvailable: sampleCount > 0,
    gazeAvailable: sampleCount > 0,
    onScreen: sampleCount > 0,
    stable: valid,
    timestampsComplete: timestampsMonotonic,
    stimulusComplete: true,
    synchronized: timestampsMonotonic,
  };
}
