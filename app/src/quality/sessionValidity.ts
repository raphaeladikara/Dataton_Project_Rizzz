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

export const REASON_COPY: Record<ValidityReasonCode, ReasonCopy> = {
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

function held(code: ValidityReasonCode, evidence: Record<string, unknown>, invalidStages?: string[]): SessionValidityResult {
  const copy = REASON_COPY[code];
  return {
    canScore: false,
    outcome: "HELD",
    heldKind: copy.kind,
    primaryReasonCode: code,
    userMessage: `${copy.message} Ini bukan hasil risiko anak.`,
    operatorAction: copy.action,
    invalidStages: invalidStages?.length ? invalidStages : [copy.stage],
    debugEvidence: evidence,
  };
}

export function evaluateSessionValidity(input: SessionValidityInput): SessionValidityResult {
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
    return held("FEATURE_CONTRACT_MISMATCH", evidence, ["pemeriksaan sistem"]);
  if (input.cameraInterrupted) return held("CAMERA_STREAM_INTERRUPTED", evidence);
  if (!input.sessionComplete) return held("SESSION_INCOMPLETE", evidence);
  if (input.orientationChanged) return held("OFF_SCREEN_DOMINANT", evidence, ["pemeriksaan posisi", "kalibrasi"]);
  if (!input.calibrationPassed) return held("CALIBRATION_INVALID", evidence);
  if (!input.timestampsSynchronized || input.phases.some((phase) => !phase.timestampsComplete || !phase.synchronized))
    return held("PHASE_DESYNC", evidence);

  if (input.sanity) {
    const { leftMedianX: left, centerMedianX: center, rightMedianX: right, stable } = input.sanity;
    if (!input.sanity.completed || !stable) return held("CALIBRATION_INVALID", evidence, ["pengecekan arah pandangan"]);
    if (left > right + 0.08) return held("DIRECTION_REVERSED", evidence, ["pengecekan arah pandangan"]);
    if (Math.max(Math.abs(left - center), Math.abs(right - center), Math.abs(right - left)) < 0.08)
      return held("CENTER_LOCK", evidence, ["pengecekan arah pandangan"]);
  }

  if (input.rawIrisMovement >= 0.02 && input.gazeMovement < 0.015) return held("GAZE_FROZEN", evidence);
  if (input.stationaryJumpRate > 0.18) return held("GAZE_RANDOM_JUMPS", evidence);
  if (input.offScreenRate > 0.5) return held("OFF_SCREEN_DOMINANT", evidence);
  if (input.poseRejectedRate > 0.25) return held("FACE_POSE_UNSTABLE", evidence);
  if (input.faceRate < 0.85 || input.gazeDropout > 0.2) return held("GAZE_UNAVAILABLE", evidence);

  const invalid = input.phases.filter((phase) => phase.status === "invalid");
  const valid = input.phases.filter((phase) => phase.status === "valid");
  if (invalid.length === 1 && valid.length >= Math.max(1, input.phases.length - 1)) {
    return {
      canScore: false,
      outcome: "RETRY_STAGE",
      heldKind: null,
      primaryReasonCode: "INSUFFICIENT_VALID_PHASES",
      userMessage: "Satu bagian tes perlu direkam ulang. Ini bukan hasil risiko anak.",
      operatorAction: `Ulangi bagian ${invalid[0].id}.`,
      invalidStages: invalid.map((phase) => phase.id),
      debugEvidence: evidence,
    };
  }
  if (valid.length < Math.ceil(input.phases.length * 0.75))
    return held("INSUFFICIENT_VALID_PHASES", evidence, invalid.map((phase) => phase.id));

  return {
    canScore: true,
    outcome: "VALID",
    heldKind: null,
    primaryReasonCode: null,
    userMessage: "Rekaman cukup baik untuk dianalisis.",
    operatorAction: "Lanjutkan ke laporan.",
    invalidStages: [],
    debugEvidence: evidence,
  };
}

export function phaseAssessment(id: string, sampleCount: number, expectedMinimum = 8): PhaseAssessment {
  const valid = sampleCount >= expectedMinimum;
  return {
    id,
    status: valid ? "valid" : sampleCount > 0 ? "degraded" : "invalid",
    faceAvailable: sampleCount > 0,
    gazeAvailable: sampleCount > 0,
    onScreen: sampleCount > 0,
    stable: valid,
    timestampsComplete: valid,
    stimulusComplete: true,
    synchronized: valid,
  };
}
