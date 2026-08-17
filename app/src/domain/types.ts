export type Point = {
  t: number;
  x: number;
  y: number;
  segment?: number;
  phase?: string;
  epoch?: "pre_cue" | "post_cue";
};

export type Quality = {
  faceRate: number;
  gazeDropout: number;
  calibrationErrorDeg: number;
  calibrationLimitDeg?: number;
  brightness: number;
  sampleCount: number;
  coverage?: number;
  phaseCoverage?: number;
  oodMaxRobustZ?: number;
  oodFlaggedFeatures?: string[];
  reasons: string[];
  passed: boolean;
};

export type DeviceDiagnostics = {
  detections: number;
  attempts: number;
  width: number;
  height: number;
  frameRate: number;
  brightness: number;
  faceCoverage: number;
  landscape: boolean;
  hardwareConcurrency?: number;
  deviceMemoryGB?: number | null;
  batteryLevel?: number | null;
  batteryCharging?: boolean | null;
  telemetrySupport?: { battery: boolean; thermal: false };
};

export type ModelExport = {
  schema_version: number;
  model_version: string;
  feature_set: string;
  feature_order: string[];
  scaler: { mean: number[]; scale: number[] };
  classifier: { coef: number[]; intercept: number };
  calibrator: { coef: number; intercept: number; epsilon: number };
  decision: {
    refer_if_probability_gte: number;
    threshold_status: string;
    quality_gate_required: boolean;
  };
};

export type ReplayScenario = {
  id: "refer" | "monitor" | "withheld";
  title: string;
  description: string;
  calibrationErrorDeg: number;
  faceRate: number;
  gazeDropout: number;
  brightness: number;
  seed: number;
  pattern: "wide" | "focused";
};
