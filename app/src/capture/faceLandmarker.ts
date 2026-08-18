import {
  FaceLandmarker,
  FilesetResolver,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export type EyeSignal = { u: number; v: number };
export type CalibrationSample = {
  signal: EyeSignal;
  target: { x: number; y: number };
  targetIndex?: number;
  phase?: "train" | "validation";
  timestampMs?: number;
};
export type CalibrationTargetDiagnostic = {
  targetIndex: number;
  phase: "train" | "validation";
  attempted: number;
  accepted: number;
  rejectedNoFace: number;
  rejectedEye: number;
  rejectedPose: number;
  dispersionU: number;
  dispersionV: number;
  representativeU?: number;
  representativeV?: number;
};
export type CalibrationDiagnostics = {
  trainingTargets: number;
  trainingSamples: number;
  validationSamples: number;
  signalRangeU: number;
  signalRangeV: number;
  trainingRmseDeg: number;
  gridMedianErrorDeg: number;
  centerDriftDeg: number;
  validationErrorDeg: number;
  targetDiagnostics: CalibrationTargetDiagnostic[];
  warnings: string[];
};
export type Calibration = {
  x: [number, number, number];
  y: [number, number, number];
  curveX?: Array<[number, number]>;
  curveY?: Array<[number, number]>;
  errorDeg: number;
  diagnostics?: CalibrationDiagnostics;
};

/** Physical geometry needed to turn a screen distance into a visual angle. */
export type ViewingGeometry = {
  screenWidthMm: number;
  screenHeightMm: number;
  viewingDistanceMm: number;
};

/**
 * Degrees per normalised screen unit assumed when no viewing geometry is given.
 *
 * This is the constant every Gate A figure was computed under, including the
 * published 2.36 deg median and 3.58 deg p90. It asserts that the screen
 * subtends 45 deg, which no device in Gate A actually does: a 226 mm tablet at
 * 500 mm subtends 2*atan(113/500) = 25.5 deg. The constant therefore overstates
 * the error by roughly 1.8x — conservative in direction, but it is an assumed
 * number sitting under a headline comparison against WebGazer's published
 * 4.17 deg, which was measured under different geometry again.
 *
 * It stays as the fallback so archived evidence keeps reproducing under the
 * convention it was recorded with. Pass a ViewingGeometry to get the real angle.
 */
export const LEGACY_DEGREES_PER_UNIT = 45;

/**
 * Visual angle subtended by a displacement given in normalised screen units.
 *
 * x is normalised to screen width and y to screen height, so the two axes carry
 * different millimetres per unit and cannot be combined before conversion.
 */
export function visualAngleDeg(
  dxNormalized: number,
  dyNormalized: number,
  geometry?: ViewingGeometry,
): number {
  if (!geometry || !(geometry.viewingDistanceMm > 0)) {
    return Math.hypot(dxNormalized, dyNormalized) * LEGACY_DEGREES_PER_UNIT;
  }
  const millimetres = Math.hypot(
    dxNormalized * geometry.screenWidthMm,
    dyNormalized * geometry.screenHeightMm,
  );
  return (2 * Math.atan(millimetres / 2 / geometry.viewingDistanceMm) * 180) / Math.PI;
}

export type EyeMeasurement = {
  signal: EyeSignal | null;
  accepted: boolean;
  reason: "ok" | "landmarks" | "iris" | "blink" | "pose" | "nonfinite";
  eyeOpen: number;
  yaw: number;
  pitch: number;
  rollDeg: number;
};

export type FrameDiagnostics = {
  brightness: number;
  faceCoverage: number;
};

export async function createFaceLandmarker() {
  const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "/mediapipe/face_landmarker.task",
      delegate: "CPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
    minFaceDetectionConfidence: 0.6,
    minFacePresenceConfidence: 0.6,
    minTrackingConfidence: 0.6,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });
}

export function irisCenters(landmarks: NormalizedLandmark[]) {
  if (landmarks.length < 478) return null;
  return { left: landmarks[468], right: landmarks[473] };
}

function eyeLocalPosition(center: NormalizedLandmark, a: NormalizedLandmark, b: NormalizedLandmark) {
  const left = a.x <= b.x ? a : b;
  const right = a.x <= b.x ? b : a;
  const hx = right.x - left.x;
  const hy = right.y - left.y;
  const widthSquared = Math.max(hx * hx + hy * hy, 1e-8);
  const px = center.x - left.x;
  const py = center.y - left.y;
  return {
    u: (px * hx + py * hy) / widthSquared,
    v: (-px * hy + py * hx) / widthSquared,
  };
}

export function eyeSignal(landmarks: NormalizedLandmark[]): EyeSignal | null {
  const centers = irisCenters(landmarks);
  if (!centers) return null;
  // Project each iris into an eye-local coordinate frame. The corner axis is
  // stable under head roll and does not turn eyelid opening into false gaze.
  const left = eyeLocalPosition(centers.left, landmarks[33], landmarks[133]);
  const right = eyeLocalPosition(centers.right, landmarks[362], landmarks[263]);
  return {
    u: (left.u + right.u) / 2,
    v: (left.v + right.v) / 2,
  };
}

export function eyeMeasurement(landmarks: NormalizedLandmark[]): EyeMeasurement {
  const signal = eyeSignal(landmarks);
  if (!signal || landmarks.length < 478) {
    return { signal: null, accepted: false, reason: "landmarks", eyeOpen: 0, yaw: 0, pitch: 0, rollDeg: 0 };
  }
  const leftOuter = landmarks[33];
  const rightOuter = landmarks[263];
  const eyeDistance = Math.max(Math.hypot(rightOuter.x - leftOuter.x, rightOuter.y - leftOuter.y), 1e-6);
  const leftOpen = Math.hypot(landmarks[159].x - landmarks[145].x, landmarks[159].y - landmarks[145].y);
  const rightOpen = Math.hypot(landmarks[386].x - landmarks[374].x, landmarks[386].y - landmarks[374].y);
  const eyeOpen = (leftOpen + rightOpen) / (2 * eyeDistance);
  const faceLeft = Math.min(landmarks[234].x, landmarks[454].x);
  const faceRight = Math.max(landmarks[234].x, landmarks[454].x);
  const faceTop = landmarks[10].y;
  const faceBottom = landmarks[152].y;
  const nose = landmarks[1];
  const yaw = (nose.x - (faceLeft + faceRight) / 2) / Math.max(faceRight - faceLeft, 1e-6);
  const pitch = (nose.y - (faceTop + faceBottom) / 2) / Math.max(faceBottom - faceTop, 1e-6);
  const rollDeg = Math.atan2(rightOuter.y - leftOuter.y, rightOuter.x - leftOuter.x) * 180 / Math.PI;
  if (![signal.u, signal.v, eyeOpen, yaw, pitch, rollDeg].every(Number.isFinite)) {
    return { signal: null, accepted: false, reason: "nonfinite", eyeOpen, yaw, pitch, rollDeg };
  }
  const centers = irisCenters(landmarks)!;
  const leftIris = eyeLocalPosition(centers.left, landmarks[33], landmarks[133]);
  const rightIris = eyeLocalPosition(centers.right, landmarks[362], landmarks[263]);
  const irisInsideEyes = [leftIris, rightIris].every(({ u, v }) => u >= -0.12 && u <= 1.12 && Math.abs(v) <= 0.38);
  const binocularAgreement = Math.abs(leftIris.u - rightIris.u) <= 0.34 && Math.abs(leftIris.v - rightIris.v) <= 0.24;
  if (!irisInsideEyes || !binocularAgreement) {
    return { signal, accepted: false, reason: "iris", eyeOpen, yaw, pitch, rollDeg };
  }
  if (eyeOpen < 0.045) return { signal, accepted: false, reason: "blink", eyeOpen, yaw, pitch, rollDeg };
  if (Math.abs(yaw) > 0.32 || Math.abs(pitch) > 0.38 || Math.abs(rollDeg) > 20) {
    return { signal, accepted: false, reason: "pose", eyeOpen, yaw, pitch, rollDeg };
  }
  return { signal, accepted: true, reason: "ok", eyeOpen, yaw, pitch, rollDeg };
}

export function faceCoverage(landmarks: NormalizedLandmark[]): number {
  if (!landmarks.length) return 0;
  const xs = landmarks.map((point) => point.x);
  const ys = landmarks.map((point) => point.y);
  return Math.max(0, Math.max(...xs) - Math.min(...xs)) *
    Math.max(0, Math.max(...ys) - Math.min(...ys));
}

export function frameBrightness(video: HTMLVideoElement): number {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return 0;
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 54;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return 0;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let luminance = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    luminance +=
      0.2126 * pixels[index] +
      0.7152 * pixels[index + 1] +
      0.0722 * pixels[index + 2];
  }
  return luminance / (255 * (pixels.length / 4));
}

function fitAxis(samples: CalibrationSample[], axis: "x" | "y"): [number, number, number] {
  const predictor = axis === "x" ? "u" : "v";
  const xs = samples.map((sample) => sample.signal[predictor]);
  const ys = samples.map((sample) => sample.target[axis]);
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
  const covariance = xs.reduce((sum, value, index) => sum + (value - meanX) * (ys[index] - meanY), 0);
  const variance = xs.reduce((sum, value) => sum + (value - meanX) ** 2, 0);
  if (!Number.isFinite(variance) || variance < 1e-8)
    throw new Error("Sampel kalibrasi tidak cukup bervariasi.");
  const slope = covariance / variance;
  const intercept = meanY - slope * meanX;
  // Iris ratios are head-relative. Independent axes avoid amplifying a weak
  // vertical channel into horizontal error (and vice versa).
  return axis === "x" ? [intercept, slope, 0] : [intercept, 0, slope];
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function representativeSamples(samples: CalibrationSample[]): CalibrationSample[] {
  const groups = new Map<string, CalibrationSample[]>();
  samples.forEach((sample) => {
    const key = String(sample.targetIndex ?? `${sample.target.x.toFixed(3)}:${sample.target.y.toFixed(3)}`);
    groups.set(key, [...(groups.get(key) ?? []), sample]);
  });
  return [...groups.values()].map((group) => ({
    signal: {
      u: median(group.map((sample) => sample.signal.u)),
      v: median(group.map((sample) => sample.signal.v)),
    },
    target: group[0].target,
    targetIndex: group[0].targetIndex,
    phase: "train",
  }));
}

function axisCurve(representatives: CalibrationSample[], axis: "x" | "y"): Array<[number, number]> | undefined {
  const signalKey = axis === "x" ? "u" : "v";
  const targetValues = [...new Set(representatives.map((sample) => sample.target[axis]))].sort((a, b) => a - b);
  if (targetValues.length !== 3) return undefined;
  const pairs = targetValues.map((target) => {
    const values = representatives.filter((sample) => sample.target[axis] === target).map((sample) => sample.signal[signalKey]);
    return [median(values), target] as [number, number];
  }).sort((a, b) => a[0] - b[0]);
  const signalSpan = Math.abs(pairs[2][0] - pairs[0][0]);
  const minimumKnotGap = Math.max(0.002, signalSpan * 0.12);
  if (pairs.some((pair, index) => index > 0 && Math.abs(pair[0] - pairs[index - 1][0]) < minimumKnotGap)) return undefined;
  const targetsBySignal = pairs.map((pair) => pair[1]);
  const monotonic = targetsBySignal.every((value, index) => index === 0 || value > targetsBySignal[index - 1]) ||
    targetsBySignal.every((value, index) => index === 0 || value < targetsBySignal[index - 1]);
  return monotonic ? pairs : undefined;
}

function projectCurve(curve: Array<[number, number]>, signal: number): number {
  const segment = signal <= curve[1][0] ? [curve[0], curve[1]] : [curve[1], curve[2]];
  const span = Math.max(Math.abs(segment[1][0] - segment[0][0]), 1e-8);
  const ratio = (signal - segment[0][0]) / (segment[1][0] - segment[0][0] || span);
  return segment[0][1] + ratio * (segment[1][1] - segment[0][1]);
}

export function fitCalibration(
  samples: CalibrationSample[],
  targetDiagnostics: CalibrationTargetDiagnostic[] = [],
  options: {
    minimumTrainingTargets?: number;
    minimumTrainingSamples?: number;
    /** Omit to fall back to LEGACY_DEGREES_PER_UNIT, the Gate A convention. */
    geometry?: ViewingGeometry;
  } = {},
): Calibration {
  const minimumTrainingTargets = options.minimumTrainingTargets ?? 7;
  const minimumTrainingSamples = options.minimumTrainingSamples ?? 35;
  const geometry = options.geometry;
  const explicitPhases = samples.some((sample) => sample.phase !== undefined);
  const validation = explicitPhases
    ? samples.filter((sample) => sample.phase === "validation")
    : samples.filter((sample) => sample.target.x === 0.5 && sample.target.y === 0.5);
  const training = explicitPhases
    ? samples.filter((sample) => sample.phase === "train")
    : samples.filter((sample) => !validation.includes(sample));
  const representatives = representativeSamples(training);
  const unstableTargets = targetDiagnostics.filter((target) =>
    target.phase === "train" && (target.dispersionU > 0.012 || target.dispersionV > 0.012),
  );
  if (unstableTargets.length) {
    const labels = unstableTargets.map((target) => target.targetIndex + 1).join(", ");
    throw new Error(`CALIBRATION_STABILITY: sinyal iris tidak stabil pada titik ${labels}. Kurangi pantulan kacamata, jaga kepala tetap, lalu ulangi.`);
  }
  if (representatives.length < minimumTrainingTargets || training.length < minimumTrainingSamples)
    throw new Error(`CALIBRATION_COVERAGE: hanya ${representatives.length}/${minimumTrainingTargets} posisi dan ${training.length} sampel valid. Pastikan kedua mata terlihat, lalu ulangi.`);
  if (validation.length < 8)
    throw new Error(`CALIBRATION_VALIDATION: hanya ${validation.length} sampel validasi. Tatap titik tengah sampai selesai.`);
  const rangeU = Math.max(...representatives.map((sample) => sample.signal.u)) - Math.min(...representatives.map((sample) => sample.signal.u));
  const rangeV = Math.max(...representatives.map((sample) => sample.signal.v)) - Math.min(...representatives.map((sample) => sample.signal.v));
  if (rangeU < 0.008)
    throw new Error("CALIBRATION_RANGE_X: gerakan sinyal horizontal terlalu kecil. Dekatkan tablet atau pastikan mata mengikuti titik, bukan hanya kepala.");
  if (rangeV < 0.004)
    throw new Error("CALIBRATION_RANGE_Y: gerakan sinyal vertikal terlalu kecil. Naikkan tablet sejajar mata dan ulangi.");
  const x = fitAxis(representatives, "x");
  const y = fitAxis(representatives, "y");
  const curveX = axisCurve(representatives, "x");
  const curveY = axisCurve(representatives, "y");
  const draft: Calibration = { x, y, curveX, curveY, errorDeg: 0 };
  const trainingErrors = representatives.map(({ signal, target }) => {
    const point = applyCalibration(draft, signal);
    return visualAngleDeg(point.x - target.x, point.y - target.y, geometry);
  });
  const validationCenter = {
    u: median(validation.map((sample) => sample.signal.u)),
    v: median(validation.map((sample) => sample.signal.v)),
  };
  const beforeCorrection = applyCalibration(draft, validationCenter);
  const centerDriftDeg = visualAngleDeg(beforeCorrection.x - 0.5, beforeCorrection.y - 0.5, geometry);
  // The final center target corrects session drift. Grid slopes remain untouched.
  x[0] += 0.5 - beforeCorrection.x;
  y[0] += 0.5 - beforeCorrection.y;
  curveX?.forEach((point) => { point[1] += 0.5 - beforeCorrection.x; });
  curveY?.forEach((point) => { point[1] += 0.5 - beforeCorrection.y; });
  const validationErrors = validation.map(({ signal, target }) => {
    const point = applyCalibration({ x, y, curveX, curveY, errorDeg: 0 }, signal);
    return visualAngleDeg(point.x - target.x, point.y - target.y, geometry);
  });
  const gridMedianErrorDeg = median(trainingErrors);
  const validationErrorDeg = median(validationErrors);
  const errorDeg = Math.max(gridMedianErrorDeg, validationErrorDeg);
  const trainingRmseDeg = Math.sqrt(trainingErrors.reduce((sum, value) => sum + value ** 2, 0) / trainingErrors.length);
  const warnings: string[] = [];
  if (representatives.length < minimumTrainingTargets) warnings.push(`Hanya ${representatives.length}/${minimumTrainingTargets} posisi training memenuhi syarat.`);
  if (trainingRmseDeg > 5) warnings.push("Residual training tinggi; posisi kepala atau jarak mungkin berubah selama kalibrasi.");
  if (centerDriftDeg > 5) warnings.push(`Drift pusat ${centerDriftDeg.toFixed(1)}° dikoreksi pada langkah terakhir.`);
  if (errorDeg > 5) warnings.push("Galat robust grid/stabilitas pusat melebihi batas 5°. Ulangi setelah memperbaiki posisi dan pencahayaan.");
  return {
    x,
    y,
    curveX,
    curveY,
    errorDeg,
    diagnostics: {
      trainingTargets: representatives.length,
      trainingSamples: training.length,
      validationSamples: validation.length,
      signalRangeU: rangeU,
      signalRangeV: rangeV,
      trainingRmseDeg,
      gridMedianErrorDeg,
      centerDriftDeg,
      validationErrorDeg,
      targetDiagnostics,
      warnings,
    },
  };
}

export function applyCalibration(calibration: Calibration, signal: EyeSignal) {
  const row = [1, signal.u, signal.v];
  const project = (coefficients: [number, number, number]) =>
    coefficients.reduce((sum, value, index) => sum + value * row[index], 0);
  return {
    x: Math.max(0, Math.min(1, calibration.curveX ? projectCurve(calibration.curveX, signal.u) : project(calibration.x))),
    y: Math.max(0, Math.min(1, calibration.curveY ? projectCurve(calibration.curveY, signal.v) : project(calibration.y))),
  };
}
