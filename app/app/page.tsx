"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";
import {
  applyCalibration,
  createFaceLandmarker,
  eyeMeasurement,
  irisCenters,
  faceCoverage,
  fitCalibration,
  frameBrightness,
  type Calibration,
  type CalibrationSample,
  type CalibrationTargetDiagnostic,
} from "../src/capture/faceLandmarker";
import { projectCoverPoint, projectCoverRect } from "../src/capture/videoProjection";
import type {
  DeviceDiagnostics,
  ModelExport,
  Point,
  Quality,
  ReplayScenario,
} from "../src/domain/types";
import { infer, validateModel } from "../src/inference/model";
import {
  validateParticipantReference,
} from "../src/inference/explain";
import { summarizeSessionObservations } from "../src/inference/sessionObservations";
import { summarizeJointAttention } from "../src/inference/jointAttention";
import { createFrameTrace } from "../src/capture/frameTrace";
import { buildPhenotypeProfile, type PhenotypeProfile } from "../src/phenotype/profile";
import { activeGeoprefAsset } from "../src/geopref/stimulusMeta";
import { geoprefLayout, GEOPREF_VIDEO_ASPECT } from "../src/geopref/protocol";
import { scoreGeopref } from "../src/geopref/score";
import { resolveSessionOutcome } from "../src/outcome/sessionOutcome";
import {
  appendAuditEvent,
  createSessionAudit,
  downloadAuditLog,
  type SessionAuditLog,
} from "../src/audit/sessionLog";
import { processGazeSamples, type GazePipelineDiagnostics } from "../src/gaze/pipeline";
import { AOI_VERSION, cueFeatures, type CueFeatureSummary } from "../src/gaze/aoi";
import { evaluateQuality } from "../src/quality/gate";
import {
  evaluateSessionValidity,
  phaseAssessment,
  type SessionValidityResult,
} from "../src/quality/sessionValidity";
import { assessFeatureOod, type OodAssessment, type OodReference } from "../src/quality/ood";
import type { GateBStudyMeta } from "../src/gateb/studyMeta";
import { replayPoints, SCENARIOS } from "../src/replay/scenarios";
import { geometryFeatures } from "../src/scanpath/features";
import {
  GEOPREF_PHASE_ID,
  NAME_CALL_OFFSETS_MS,
  NAME_CALL_PHASE_ID,
  phaseAtElapsed,
  scoredPhaseTargets,
  STIMULUS_PHASES,
  STIMULUS_VERSION,
} from "../src/stimulus/protocol";
import {
  IconAlert,
  IconArrowLeft,
  IconArrowRight,
  IconBook,
  IconBrightness,
  IconCalibrationGrid,
  IconCamera,
  IconCheck,
  IconChild,
  IconCoverage,
  IconCpu,
  IconDownload,
  IconEye,
  IconGauge,
  IconInfo,
  IconJointAttention,
  IconLocation,
  IconOffline,
  IconOrientation,
  IconPlay,
  IconPrivacyShield,
  IconRefresh,
  IconReport,
  IconResearch,
  IconRoute,
  IconSamples,
  IconScanpathFocus,
  IconScanpathSpread,
  IconShieldCheck,
  IconSignalHeld,
  IconTimer,
  IconTrash,
  LogoMark,
} from "../src/ui/icons";
import { HeroDevice } from "../src/ui/hero-device";
import { StimulusScene } from "../src/ui/stimulus-scene";
import { CameraFramingArt, GuideScene, NaturalWatchingArt } from "../src/ui/scene-art";

type Stage =
  | "home"
  | "consent"
  | "preparation"
  | "tutorial"
  | "device"
  | "calibration"
  | "sanity"
  | "stimulus"
  | "quality"
  | "report"
  | "guide";
type Mode = "replay" | "live";
type SessionPurpose = SessionAuditLog["purpose"];

type TrackingSnapshot = {
  source: { width: number; height: number };
  face: { x: number; y: number; width: number; height: number };
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  accepted: boolean;
  reason: "ok" | "landmarks" | "iris" | "blink" | "pose" | "nonfinite";
  eyeOpen: number;
};

type CalibrationProgress = {
  target: number;
  attempted: number;
  accepted: number;
  stable: boolean;
  rejectedNoFace: number;
  rejectedEye: number;
  rejectedPose: number;
};

/** Phases that show the social actor; the preferential-looking block is the nonsocial contrast. */
const SOCIAL_PHASE_IDS = STIMULUS_PHASES.filter((phase) => phase.target !== "none").map((phase) => phase.id);
const NAME_CALLS = NAME_CALL_OFFSETS_MS.map((offsetMs, index) => ({ index, offsetMs }));
const EMPTY_PHENOTYPE = buildPhenotypeProfile({
  frames: [], nameCalls: [], socialPhases: SOCIAL_PHASE_IDS, nonsocialPhases: [GEOPREF_PHASE_ID],
});

const TARGETS = [
  [0.12, 0.14],
  [0.5, 0.14],
  [0.88, 0.14],
  [0.12, 0.5],
  [0.5, 0.5],
  [0.88, 0.5],
  [0.12, 0.86],
  [0.5, 0.86],
  [0.88, 0.86],
] as const;
const CHILD_TARGETS = [
  [0.5, 0.5],
  [0.18, 0.18],
  [0.82, 0.18],
  [0.18, 0.82],
  [0.82, 0.82],
] as const;
const APP_VERSION = "3.0.0-child-flow";
const pause = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function trackingSnapshot(landmarks: Array<{ x: number; y: number }>, source: { width: number; height: number }): TrackingSnapshot | null {
  if (landmarks.length < 478) return null;
  const measurement = eyeMeasurement(landmarks as Parameters<typeof eyeMeasurement>[0]);
  const xs = landmarks.map((point) => point.x);
  const ys = landmarks.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const centers = irisCenters(landmarks as Parameters<typeof irisCenters>[0])!;
  return {
    source,
    face: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    leftEye: { x: centers.left.x, y: centers.left.y },
    rightEye: { x: centers.right.x, y: centers.right.y },
    accepted: measurement.accepted,
    reason: measurement.reason,
    eyeOpen: measurement.eyeOpen,
  };
}

function trackingCopy(snapshot: TrackingSnapshot | null) {
  if (!snapshot) return { title: "Wajah belum terbaca", detail: "Hadapkan wajah ke kamera dan pastikan tidak terhalang." };
  if (snapshot.reason === "blink") return { title: "Mata sedang tertutup", detail: "Tunggu mata terbuka; tidak perlu menatap kamera." };
  if (snapshot.reason === "pose") return { title: "Kepala terlalu miring", detail: "Tegakkan kepala dan hadapkan wajah ke layar." };
  if (snapshot.reason === "iris") return { title: "Posisi iris tidak konsisten", detail: "Buka kedua mata, kurangi pantulan kacamata, dan hadapkan wajah lurus." };
  if (!snapshot.accepted) return { title: "Mata belum terbaca jelas", detail: "Kurangi pantulan pada kacamata atau tambah cahaya dari depan." };
  return { title: "Landmark iris terbaca", detail: "Penanda hijau menunjukkan deteksi iris; akurasinya diuji pada kalibrasi." };
}

const CALIBRATION_STABLE_FRAMES = 16;
const CALIBRATION_MAX_ATTEMPTS = 34;
const CALIBRATION_MAX_DISPERSION = 0.012;

function signalDispersion(samples: CalibrationSample[]) {
  const deviation = (values: number[]) => {
    if (!values.length) return Number.POSITIVE_INFINITY;
    const center = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.sqrt(values.reduce((sum, value) => sum + (value - center) ** 2, 0) / values.length);
  };
  return {
    u: deviation(samples.map((sample) => sample.signal.u)),
    v: deviation(samples.map((sample) => sample.signal.v)),
  };
}

function mostStableWindow(samples: CalibrationSample[], size = CALIBRATION_STABLE_FRAMES) {
  if (samples.length <= size) return [...samples];
  let best = samples.slice(0, size);
  let bestScore = Number.POSITIVE_INFINITY;
  for (let start = 0; start <= samples.length - size; start += 1) {
    const candidate = samples.slice(start, start + size);
    const dispersion = signalDispersion(candidate);
    const score = dispersion.u + dispersion.v;
    if (score < bestScore) { best = candidate; bestScore = score; }
  }
  return best;
}

function calibrationRecovery(calibration: Calibration | null, message: string | null) {
  const diagnostics = calibration?.diagnostics;
  if (message?.includes("CALIBRATION_STABILITY")) {
    return { title: "Landmark iris bergerak saat tatapan diam", action: "Miringkan sumber cahaya atau kacamata sedikit agar pantulan berkurang, lalu jaga kepala tetap saat tiap titik dikumpulkan." };
  }
  if (message?.includes("CALIBRATION_RANGE_Y") || (diagnostics && diagnostics.signalRangeV < 0.004)) {
    return { title: "Gerakan mata atas–bawah belum terbaca", action: "Naikkan kamera sejajar mata. Saat titik bergerak, ikuti dengan mata—bukan dengan kepala." };
  }
  if (message?.includes("CALIBRATION_RANGE_X") || (diagnostics && diagnostics.signalRangeU < 0.008)) {
    return { title: "Gerakan mata kiri–kanan belum terbaca", action: "Dekatkan perangkat sedikit dan pastikan mata mengikuti titik sampai ke sisi layar." };
  }
  if (message?.includes("CALIBRATION_COVERAGE") || (diagnostics && diagnostics.trainingTargets < 9)) {
    return { title: "Beberapa titik kehilangan mata", action: "Pastikan wajah tidak keluar dari bingkai. Lepaskan benda yang menutupi mata lalu ulangi." };
  }
  if (diagnostics && diagnostics.targetDiagnostics.some((target) => target.rejectedPose > target.accepted)) {
    return { title: "Kepala terlalu banyak bergerak", action: "Gunakan dudukan perangkat dan minta peserta menggerakkan mata saja." };
  }
  if (diagnostics && diagnostics.trainingRmseDeg > 5) {
    return { title: "Pemetaan gaze belum cocok untuk sesi ini", action: "Ini bukan kesalahan peserta. Ulangi paling banyak satu kali; bila tetap gagal, lanjutkan hanya sebagai uji sinyal tanpa skor atau hentikan sesi." };
  }
  return { title: "Kalibrasi belum cukup akurat", action: "Jaga jarak 40–50 cm, sejajarkan kamera dengan mata, lalu ulangi satu kali." };
}

function TrackingOverlay({ snapshot, compact = false }: { snapshot: TrackingSnapshot | null; compact?: boolean }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const update = () => setViewport({ width: overlay.clientWidth, height: overlay.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(overlay);
    return () => observer.disconnect();
  }, []);
  const copy = trackingCopy(snapshot);
  const source = snapshot?.source ?? { width: 0, height: 0 };
  const face = snapshot ? projectCoverRect(snapshot.face, source, viewport) : null;
  const leftEye = snapshot ? projectCoverPoint(snapshot.leftEye, source, viewport) : null;
  const rightEye = snapshot ? projectCoverPoint(snapshot.rightEye, source, viewport) : null;
  return (
    <div ref={overlayRef} className={`trackingOverlay ${snapshot?.accepted ? "tracked" : "lost"} ${compact ? "compact" : ""}`} aria-live="polite">
      {snapshot && face && leftEye && rightEye && source.width > 0 && viewport.width > 0 && (
        <>
          <i className="faceTrackBox" style={{ left: face.left, top: face.top, width: face.width, height: face.height }} />
          <i className="eyeTrack left" style={{ left: leftEye.x, top: leftEye.y }} />
          <i className="eyeTrack right" style={{ left: rightEye.x, top: rightEye.y }} />
        </>
      )}
      <span className="trackingReadout"><b aria-hidden="true" /> <span><strong>{copy.title}</strong>{!compact && <small>{copy.detail}</small>}</span></span>
    </div>
  );
}

type NavigatorWithTelemetry = Navigator & {
  deviceMemory?: number;
  getBattery?: () => Promise<{ level: number; charging: boolean }>;
};

async function platformTelemetry() {
  const extended = navigator as NavigatorWithTelemetry;
  const battery = extended.getBattery ? await extended.getBattery().catch(() => null) : null;
  return {
    hardwareConcurrency: navigator.hardwareConcurrency || undefined,
    deviceMemoryGB: extended.deviceMemory ?? null,
    batteryLevel: battery?.level ?? null,
    batteryCharging: battery?.charging ?? null,
    telemetrySupport: { battery: Boolean(extended.getBattery), thermal: false as const },
  };
}

function Logo() {
  return (
    <span className="logo" aria-label="Neurogaze">
      <span className="logoMark" aria-hidden="true">
        <LogoMark size={30} />
      </span>
      <span>Neurogaze</span>
    </span>
  );
}

/** The five capture stages, shown as one strip so the flow is visible at a glance. */
const SESSION_FLOW = [
  { icon: IconPlay, label: "Tutorial", hint: "Panduan singkat untuk pendamping", tone: "teal" },
  { icon: IconCamera, label: "Posisi", hint: "Wajah, cahaya, dan jarak diperiksa", tone: "teal" },
  { icon: IconCalibrationGrid, label: "Kalibrasi", hint: "Lima gambar berpindah otomatis", tone: "amber" },
  { icon: IconJointAttention, label: "Stimulus", hint: "Anak cukup menonton dengan nyaman", tone: "teal" },
  { icon: IconReport, label: "Laporan", hint: "Kesimpulan dan tindakan berikutnya", tone: "slate" },
] as const;

const SCENARIO_ICON = {
  refer: IconScanpathSpread,
  monitor: IconScanpathFocus,
  withheld: IconSignalHeld,
} as const;

/**
 * Counts a value up on mount. Reserved for the rare, high-value numbers
 * (risk score, quality readings) — never for anything a user sees repeatedly.
 */
function Ticker({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 620;
    let frame = 0;
    const startedAt = performance.now();
    const step = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - startedAt) / duration);
      // Matches --ease-out: fast first, settles gently.
      setShown(value * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{format(shown)}</>;
}

const SESSION_STEPS: { key: Stage; label: string; hint: string; icon: (p: { size?: number }) => ReactElement }[] = [
  { key: "consent", label: "Persetujuan", hint: "Izin orang tua", icon: IconShieldCheck },
  { key: "preparation", label: "Persiapan", hint: "Anak nyaman", icon: IconChild },
  { key: "tutorial", label: "Tutorial", hint: "Panduan singkat", icon: IconPlay },
  { key: "device", label: "Posisi", hint: "Kamera dan cahaya", icon: IconCamera },
  { key: "calibration", label: "Kalibrasi", hint: "5 gambar menarik", icon: IconCalibrationGrid },
  { key: "sanity", label: "Cek arah", hint: "Kiri, tengah, kanan", icon: IconEye },
  { key: "stimulus", label: "Stimulus", hint: "Adegan perhatian", icon: IconJointAttention },
  { key: "quality", label: "Pemeriksaan", hint: "Kualitas rekaman", icon: IconGauge },
  { key: "report", label: "Laporan", hint: "Kesimpulan & tindakan", icon: IconReport },
];

/**
 * Session progress rail.
 *
 * Lives in the left column rather than as a sticky bar: a sticky header
 * overlapped the workspace content on scroll, and a vertical rail gives each
 * step room for an icon and a one-line hint.
 */
function Stepper({ stage }: { stage: Stage }) {
  const active = Math.max(
    0,
    SESSION_STEPS.findIndex((step) => step.key === stage),
  );
  const current = SESSION_STEPS[active];
  const next = SESSION_STEPS[active + 1];

  return (
    <nav className="sessionRail" aria-label="Kemajuan sesi">
      <div className="railHead" aria-live="polite" aria-atomic="true">
        <span className="railCounter">
          <strong key={`c${active}`}>{String(active + 1).padStart(2, "0")}</strong>
          <small>/ {String(SESSION_STEPS.length).padStart(2, "0")}</small>
        </span>
        <span className="railNow">
          <small>Langkah saat ini</small>
          <strong key={`l${active}`}>{current.label}</strong>
        </span>
      </div>

      <ol className="railList">
        {SESSION_STEPS.map((step, index) => {
          const state = index === active ? "active" : index < active ? "done" : "upcoming";
          return (
            <li key={step.key} data-state={state} aria-current={index === active ? "step" : undefined}>
              <span className="railMark" aria-hidden="true">
                {index < active ? <IconCheck size={12} /> : <step.icon size={15} />}
              </span>
              <span className="railCopy">
                <strong>{step.label}</strong>
                <small>{step.hint}</small>
              </span>
            </li>
          );
        })}
      </ol>

      <p className="railNext">{next ? `Berikutnya: ${next.label}` : "Tahap terakhir"}</p>
    </nav>
  );
}

function Metric({
  label,
  value,
  status = "neutral",
  icon: Icon,
  index,
}: {
  label: string;
  value: string;
  status?: "good" | "bad" | "neutral";
  icon?: (props: { size?: number }) => ReactElement;
  index?: number;
}) {
  return (
    <div
      className={`metric ${status}`}
      style={index === undefined ? undefined : ({ "--i": index } as CSSProperties)}
    >
      <span>
        {Icon ? <Icon size={15} /> : null}
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

const GUIDE_FRAMES = [
  { title: "Duduk nyaman, layar sejajar wajah.", body: "Letakkan tablet pada dudukan, sekitar satu lengan dari anak.", icon: IconChild, tag: "01 · POSISI", visual: "seated" },
  { title: "Pastikan wajah masuk bingkai.", body: "Tidak perlu mendekat. Wajah cukup terlihat penuh dan tidak tertutup.", icon: IconCamera, tag: "02 · KAMERA", visual: "framed" },
  { title: "Biarkan tatapan anak alami.", body: "Jangan menunjuk layar atau menyebut arah dan warna.", icon: IconAlert, tag: "03 · TANPA ARAHAN", visual: "no-pointing" },
  { title: "Anak cukup menonton.", body: "Gambar akan bergerak sendiri. Tidak ada jawaban benar atau salah.", icon: IconJointAttention, tag: "04 · MENONTON", visual: "character" },
  { title: "Jeda bila anak tidak nyaman.", body: "Sesi boleh dihentikan. Kenyamanan anak selalu lebih penting.", icon: IconTimer, tag: "05 · ISTIRAHAT", visual: "pause" },
  { title: "Sudah siap? Mulai saat anak tenang.", body: "Video diproses di perangkat dan tidak disimpan.", icon: IconCheck, tag: "06 · SIAP", visual: "ready" },
] as const;

function GuideFilm({ onComplete }: { onComplete?: () => void } = {}) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    if (!playing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setFrame((current) => (current + 1) % GUIDE_FRAMES.length), 4200);
    return () => window.clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    if (muted || !playing) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frame === GUIDE_FRAMES.length - 1 ? 660 : 440;
    gain.gain.setValueAtTime(0.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.09);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
    return () => { void context.close(); };
  }, [frame, muted, playing]);
  const current = GUIDE_FRAMES[frame];
  const FrameIcon = current.icon;
  return (
    <section className="guideFilm" aria-label="Video panduan animasi Neurogaze">
      <div className="guideFilmScreen">
        <div className="guideFilmTop"><Logo /><span>TUTORIAL · 00:{String((frame + 1) * 4).padStart(2, "0")}</span></div>
        <div key={current.tag} className={`guideFilmScene scene-${current.visual}`}>
          <GuideScene visual={current.visual} />
          <div className="guideFilmCopy">
            <span className="guideFilmIcon"><FrameIcon size={22} /></span>
            <small>{current.tag}</small>
            <h2>{current.title}</h2>
            <p aria-label="Subtitle tutorial">{current.body}</p>
          </div>
        </div>
        <div className="guideFilmTimeline">{GUIDE_FRAMES.map((item, index) => <button key={item.tag} className={index === frame ? "active" : ""} aria-label={`Buka panduan ${index + 1}`} onClick={() => { setFrame(index); setPlaying(false); }}><i /></button>)}</div>
      </div>
      <div className="guideFilmControls">
        <div><strong>Panduan pendamping</strong><span>24 detik · dapat diputar tanpa internet</span></div>
        <div className="tutorialButtons">
          <button className="secondary" aria-pressed={!muted} onClick={() => setMuted((value) => !value)}>{muted ? "Nyalakan suara" : "Matikan suara"}</button>
          <button className="secondary" onClick={() => setPlaying((value) => !value)}>{playing ? "Jeda" : <><IconPlay size={13} /> Putar</>}</button>
          <button className="secondary" onClick={() => { setFrame(0); setPlaying(true); }}>Putar ulang</button>
        </div>
      </div>
      {onComplete && <div className="tutorialActions"><button className="textButton" onClick={onComplete}>Lewati, saya sudah paham</button><button className="primary" onClick={onComplete}>Anak sudah nyaman · lanjutkan <IconArrowRight size={16} /></button></div>}
    </section>
  );
}

export default function Home({ initialPurpose }: { initialPurpose?: SessionPurpose } = {}) {
  const isAdminCapture = initialPurpose === "gate_b_bridge";
  const [stage, setStage] = useState<Stage>(isAdminCapture ? "consent" : "home");
  const [mode, setMode] = useState<Mode>(isAdminCapture ? "live" : "replay");
  const [sessionPurpose, setSessionPurpose] = useState<SessionPurpose>(initialPurpose ?? "demo_replay");
  const [scenario, setScenario] = useState<ReplayScenario>(SCENARIOS[0]);
  const [model, setModel] = useState<ModelExport | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  const [profile, setProfile] = useState(isAdminCapture
    ? { childId: `GB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-P01`, age: "", site: "Lab validasi", operator: "Peneliti-01" }
    : { childId: "NG-0042", age: "24", site: "Posyandu Melati 3", operator: "Kader-07" });
  const [bridgeMeta, setBridgeMeta] = useState<GateBStudyMeta>({
    gate: "B",
    pairId: `GBC-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-01`,
    visitId: "V1",
    deviceId: "tablet-01",
    referenceDevice: "WebGazer.js",
    acquisitionMode: "simultaneous_browser_streams",
    deviceOrder: "simultaneous",
    screenWidthMm: 260,
    screenHeightMm: 165,
    viewingDistanceMm: 500,
  });
  const [deviceStatus, setDeviceStatus] = useState<"idle" | "checking" | "passed" | "failed">("idle");
  const [deviceMessage, setDeviceMessage] = useState("Belum diperiksa");
  const [deviceDiagnostics, setDeviceDiagnostics] = useState<DeviceDiagnostics | null>(null);
  const [calibration, setCalibration] = useState<Calibration | null>(null);
  const [calibrationTarget, setCalibrationTarget] = useState<number | null>(null);
  const [calibrationMessage, setCalibrationMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [points, setPoints] = useState<Point[]>([]);
  const [phenotype, setPhenotype] = useState<PhenotypeProfile>(() => EMPTY_PHENOTYPE);
  const [riskInterpretable, setRiskInterpretable] = useState(false);
  // Captured when the stimulus starts, not at render time: a later resize must
  // not move the AOIs away from where the child was actually looking.
  const [stageAspect, setStageAspect] = useState(GEOPREF_VIDEO_ASPECT);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [validity, setValidity] = useState<SessionValidityResult | null>(null);
  const [risk, setRisk] = useState<number | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [gazeDiagnostics, setGazeDiagnostics] = useState<GazePipelineDiagnostics | null>(null);
  const [cueSummary, setCueSummary] = useState<CueFeatureSummary | null>(null);
  const [oodReference, setOodReference] = useState<OodReference | null>(null);
  const [oodAssessment, setOodAssessment] = useState<OodAssessment | null>(null);
  const [stimulusPhase, setStimulusPhase] = useState<(typeof STIMULUS_PHASES)[number] | null>(null);
  const [stimulusCueActive, setStimulusCueActive] = useState(false);
  const [stimulusOstensiveActive, setStimulusOstensiveActive] = useState(false);
  const [auditLog, setAuditLog] = useState<SessionAuditLog | null>(null);
  const [online, setOnline] = useState(true);
  const [busy, setBusy] = useState(false);
  const [stimulusPaused, setStimulusPaused] = useState(false);
  const [tracking, setTracking] = useState<TrackingSnapshot | null>(null);
  const [calibrationProgress, setCalibrationProgress] = useState<CalibrationProgress | null>(null);
  const [calibrationAttempts, setCalibrationAttempts] = useState(0);
  const technicalCalibration = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("technicalCalibration") === "1";
  const [sanityTarget, setSanityTarget] = useState<"left" | "center" | "right" | null>(null);
  const [sanityPassed, setSanityPassed] = useState<boolean | null>(null);
  const [sanityAttempts, setSanityAttempts] = useState(0);
  const captureVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const calibrationVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestIdRef = useRef(0);
  const landmarkerRef = useRef<Awaited<ReturnType<typeof createFaceLandmarker>> | null>(null);
  const auditRef = useRef<SessionAuditLog | null>(null);
  const frameTraceRef = useRef(createFrameTrace());
  // The child's real given name is needed to call them, but it is identifying.
  // It lives in a ref for the duration of the session, is never copied into
  // `profile`, never reaches the audit log, and never leaves the device.
  const callNameRef = useRef("");
  const stimulusPausedRef = useRef(false);

  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const message = args.map(String).join(" ");
      if (message.includes("Created TensorFlow Lite XNNPACK delegate for CPU")) return;
      originalConsoleError(...args);
    };
    fetch("/models/model.json")
      .then((response) => {
        if (!response.ok) throw new Error("Model tidak tersedia");
        return response.json();
      })
      .then((candidate: unknown) => {
        validateModel(candidate);
        setModel(candidate);
        setModelError(null);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Model lokal gagal dimuat.";
        setModelError(message);
        setDeviceMessage(message);
      });
    fetch("/models/ood_reference.json")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("OOD reference tidak tersedia")))
      .then((candidate: OodReference) => setOodReference(candidate))
      .catch(() => setOodReference(null));
    // The participant reference is no longer shown anywhere, but validating it
    // on load still catches a corrupted or mismatched artifact at startup.
    fetch("/models/participant_reference.json")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Referensi partisipan tidak tersedia")))
      .then((candidate: unknown) => validateParticipantReference(candidate))
      .catch(() => undefined);
    const updateOnline = () => setOnline(navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      } else {
        navigator.serviceWorker.getRegistrations().then((registrations) =>
          registrations.forEach((registration) => registration.unregister()),
        );
        caches.keys().then((keys) =>
          Promise.all(keys.filter((key) => key.startsWith("neurogaze-")).map((key) => caches.delete(key))),
        );
      }
    }
    return () => {
      console.error = originalConsoleError;
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      landmarkerRef.current?.close();
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [stage]);

  useEffect(() => {
    if (stage !== "calibration" || !calibrationVideoRef.current || !streamRef.current) return;
    calibrationVideoRef.current.srcObject = streamRef.current;
    calibrationVideoRef.current.play().catch(() => undefined);
  }, [stage]);

  useEffect(() => {
    if (mode !== "live" || (stage !== "device" && stage !== "calibration") || busy || !streamRef.current) return;
    let frame = 0;
    let stopped = false;
    let lastCheckedAt = 0;
    const watch = (now: number) => {
      if (stopped) return;
      const video = captureVideoRef.current;
      const landmarker = landmarkerRef.current;
      if (video && landmarker && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && now - lastCheckedAt > 120) {
        lastCheckedAt = now;
        const landmarks = landmarker.detectForVideo(video, now).faceLandmarks[0];
        setTracking(landmarks ? trackingSnapshot(landmarks, { width: video.videoWidth, height: video.videoHeight }) : null);
      }
      frame = requestAnimationFrame(watch);
    };
    frame = requestAnimationFrame(watch);
    return () => { stopped = true; cancelAnimationFrame(frame); };
  }, [busy, mode, stage, deviceStatus]);

  function commitAudit(next: SessionAuditLog | null) {
    auditRef.current = next;
    setAuditLog(next);
    if (next?.purpose === "gate_b_bridge" && typeof window !== "undefined") {
      window.sessionStorage.setItem("neurogaze_gate_b_last_audit", JSON.stringify(next));
    }
  }

  function recordAudit(
    type: string,
    data?: Record<string, unknown>,
    level: "info" | "warning" | "error" = "info",
  ) {
    if (!auditRef.current) return;
    commitAudit(appendAuditEvent(auditRef.current, type, data, level));
  }

  function beginAuditedSession() {
    const next = createSessionAudit({
      appVersion: APP_VERSION,
      stimulusVersion: STIMULUS_VERSION,
      mode,
      purpose: sessionPurpose,
      profile,
      researchConsent,
      modelVersion: model?.model_version,
      study: isGateB ? bridgeMeta : undefined,
    });
    commitAudit(next);
    setStage(isEngineeringStudy ? "device" : "preparation");
  }

  function downloadCurrentAudit() {
    if (!auditRef.current) return;
    recordAudit("audit.downloaded");
    downloadAuditLog(auditRef.current);
  }

  function deleteCurrentAudit() {
    if (auditRef.current?.purpose === "gate_b_bridge" && typeof window !== "undefined") {
      window.sessionStorage.removeItem("neurogaze_gate_b_last_audit");
    }
    commitAudit(null);
  }

  function stopCamera() {
    cameraRequestIdRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (captureVideoRef.current) captureVideoRef.current.srcObject = null;
    if (previewVideoRef.current) previewVideoRef.current.srcObject = null;
  }

  async function enterMeasurementFullscreen() {
    if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // CSS focus mode remains fully usable when browser fullscreen is denied.
    }
  }

  async function leaveMeasurementFullscreen() {
    if (!document.fullscreenElement || !document.exitFullscreen) return;
    try {
      await document.exitFullscreen();
    } catch {
      // The browser may already have left fullscreen through Escape/system UI.
    }
  }

  function goHome() {
    void leaveMeasurementFullscreen();
    stopCamera();
    setBusy(false);
    setStage("home");
  }

  // Feature attributions are no longer surfaced: the Carette model does not
  // drive any decision, so explaining its contributions would imply it does.
  // explainInference stays in the research code and the paper.
  /**
   * Speaks the child's name from the tablet speaker. Perochon et al. 2023 used
   * an examiner calling from behind the child; the tablet speaker keeps the
   * timing exact and removes the need for a second person. Falls back to a
   * haptic prompt so the operator can call the name themselves.
   */
  function speakChildName() {
    const name = callNameRef.current.trim();
    const synth = typeof window === "undefined" ? undefined : window.speechSynthesis;
    if (!name || !synth) {
      navigator.vibrate?.([100, 80, 100]);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(name);
    utterance.lang = "id-ID";
    utterance.rate = 0.9;
    synth.speak(utterance);
  }

  const geoprefAsset = useMemo(() => activeGeoprefAsset(), []);
  const geoprefResult = useMemo(() => {
    const geoprefPoints = points.filter((point) => point.phase === GEOPREF_PHASE_ID);
    if (!geoprefPoints.length) return null;
    return scoreGeopref(geoprefPoints, {
      ...geoprefLayout(profile.childId || "NG-0000"),
      validatedProtocol: geoprefAsset.validatedProtocol,
      viewportAspect: stageAspect,
    });
  }, [points, profile.childId, geoprefAsset, stageAspect]);
  const jointAttention = useMemo(() => summarizeJointAttention(cueSummary), [cueSummary]);
  const sessionOutcome = useMemo(() => resolveSessionOutcome({
    mode,
    qualityPassed: Boolean(quality?.passed),
    validityCanScore: Boolean(validity?.canScore),
    geopref: geoprefResult,
    jointAttention,
  }), [mode, quality, validity, geoprefResult, jointAttention]);
  const isGateA = sessionPurpose === "gate_a_adult";
  const isGateB = sessionPurpose === "gate_b_bridge";
  const isEngineeringStudy = isGateA || isGateB;
  const useTechnicalCalibration = isEngineeringStudy || technicalCalibration;
  const activeTargets = useTechnicalCalibration ? TARGETS : CHILD_TARGETS;
  const calibrationLimitDeg = isEngineeringStudy ? 3 : 5;
  const calibrationFailed = Boolean(calibrationMessage && (!calibration || calibration.errorDeg > calibrationLimitDeg));
  const recovery = calibrationRecovery(calibration, calibrationMessage);
  // Stimulus is deliberately outside the rail: it is the child-facing screen
  // and must fill the tablet without operator chrome.
  const isSessionStage =
    stage !== "home" && stage !== "guide" && stage !== "stimulus";

  function start(
    modeChoice: Mode,
    replay = scenario,
    purpose: SessionPurpose = modeChoice === "replay" ? "demo_replay" : "gate_a_adult",
  ) {
    setBusy(false);
    setMode(modeChoice);
    setSessionPurpose(purpose);
    setScenario(replay);
    setConsented(modeChoice === "replay");
    setResearchConsent(false);
    setProfile(purpose === "gate_a_adult"
      ? { childId: `GA-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-01`, age: "", site: "Pilot perangkat", operator: "Operator-01" }
      : purpose === "gate_b_bridge"
        ? { childId: `GB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-P01`, age: "", site: "Lab validasi", operator: "Peneliti-01" }
      : { childId: "NG-0042", age: "24", site: "Posyandu Melati 3", operator: "Kader-07" });
    setDeviceStatus("idle");
    setDeviceDiagnostics(null);
    setCalibration(null);
    setCalibrationMessage(null);
    setCalibrationAttempts(0);
    setSanityPassed(null);
    setSanityAttempts(0);
    setTracking(null);
    setCalibrationProgress(null);
    setQuality(null);
    setValidity(null);
    setRisk(null);
    setLatencyMs(null);
    setGazeDiagnostics(null);
    setCueSummary(null);
    setOodAssessment(null);
    setStimulusPhase(null);
    commitAudit(null);
    setPoints([]);
    setPhenotype(EMPTY_PHENOTYPE);
    callNameRef.current = "";
    frameTraceRef.current.reset();
    setProgress(0);
    setStage("consent");
  }

  async function inspectLiveDevice() {
    setBusy(true);
    setDeviceStatus("checking");
    setDeviceMessage("Memuat pemeriksaan wajah lokal…");
    let requestId = cameraRequestIdRef.current;
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
        throw new Error("Kamera memerlukan HTTPS atau http://localhost.");
      stopCamera();
      requestId = cameraRequestIdRef.current;
      let cameraRequestExpired = false;
      const cameraRequest = navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
        },
        audio: false,
      });
      const stream = await new Promise<MediaStream>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          cameraRequestExpired = true;
          reject(
            new Error(
              "Kamera tidak merespons dalam 12 detik. Periksa izin kamera browser lalu coba lagi.",
            ),
          );
        }, 12_000);
        cameraRequest.then(
          (openedStream) => {
            window.clearTimeout(timer);
            if (cameraRequestExpired) {
              openedStream.getTracks().forEach((track) => track.stop());
              return;
            }
            resolve(openedStream);
          },
          (reason) => {
            window.clearTimeout(timer);
            reject(reason);
          },
        );
      });
      if (requestId !== cameraRequestIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (!captureVideoRef.current || !previewVideoRef.current)
        throw new Error("Panel kamera belum siap.");
      captureVideoRef.current.srcObject = stream;
      previewVideoRef.current.srcObject = stream;
      await Promise.all([captureVideoRef.current.play(), previewVideoRef.current.play()]);
      landmarkerRef.current ||= await createFaceLandmarker();
      let detections = 0;
      const attempts = 12;
      const coverages: number[] = [];
      const brightnessValues: number[] = [];
      for (let index = 0; index < attempts; index += 1) {
        const result = landmarkerRef.current.detectForVideo(
          captureVideoRef.current,
          performance.now(),
        );
        if (result.faceLandmarks[0]) {
          const landmarks = result.faceLandmarks[0];
          const measurement = eyeMeasurement(landmarks);
          setTracking(trackingSnapshot(landmarks, { width: captureVideoRef.current.videoWidth, height: captureVideoRef.current.videoHeight }));
          if (measurement.accepted) {
            detections += 1;
            coverages.push(faceCoverage(landmarks));
          }
        } else {
          setTracking(null);
        }
        brightnessValues.push(frameBrightness(captureVideoRef.current));
        await pause(80);
      }
      const settings = stream.getVideoTracks()[0].getSettings();
      const brightness = brightnessValues.reduce((a, b) => a + b, 0) / brightnessValues.length;
      const coverage = coverages.length
        ? coverages.reduce((a, b) => a + b, 0) / coverages.length
        : 0;
      const landscape = window.matchMedia("(orientation: landscape)").matches;
      const diagnostics: DeviceDiagnostics = {
        detections,
        attempts,
        width: settings.width || 0,
        height: settings.height || 0,
        frameRate: settings.frameRate || 0,
        brightness,
        faceCoverage: coverage,
        landscape,
        ...(await platformTelemetry()),
      };
      setDeviceDiagnostics(diagnostics);
      const passed =
        detections >= 9 &&
        (settings.width || 0) >= 640 &&
        brightness >= 0.22 &&
        brightness <= 0.92 &&
        coverage >= 0.08 &&
        coverage <= 0.6;
      setDeviceStatus(passed ? "passed" : "failed");
      const failures = [
        detections < 9 ? "Wajah sering hilang dari kamera." : null,
        brightness < 0.22 ? "Wajah terlalu gelap; tambah cahaya dari depan." : null,
        brightness > 0.92 ? "Cahaya terlalu terang; hindari lampu atau jendela tepat di belakang kamera." : null,
        coverage < 0.08 ? "Wajah terlalu jauh; dekatkan hingga berada di dalam bingkai." : null,
        coverage > 0.6 ? "Wajah terlalu dekat; mundur sedikit dari kamera." : null,
        (settings.width || 0) < 640 ? "Resolusi kamera terlalu rendah." : null,
      ].filter(Boolean);
      setDeviceMessage(
        passed
          ? "Kamera siap. Wajah dan kedua mata terbaca dengan pencahayaan yang cukup."
          : failures[0] || "Posisi belum stabil. Ikuti petunjuk yang ditandai merah lalu periksa lagi.",
      );
      if (auditRef.current) {
        const next = appendAuditEvent(
          { ...auditRef.current, device: diagnostics },
          passed ? "device.passed" : "device.failed",
          diagnostics,
          passed ? "info" : "warning",
        );
        commitAudit(next);
      }
    } catch (error) {
      if (requestId !== cameraRequestIdRef.current) return;
      setDeviceStatus("failed");
      setDeviceMessage(
        error instanceof Error
          ? error.message
          : "Izin kamera ditolak atau perangkat tidak tersedia.",
      );
      recordAudit(
        "device.error",
        { message: error instanceof Error ? error.message : String(error) },
        "error",
      );
    } finally {
      if (requestId === cameraRequestIdRef.current) setBusy(false);
    }
  }

  async function inspectDevice() {
    if (mode === "live") return inspectLiveDevice();
    setBusy(true);
    setDeviceStatus("checking");
    await pause(700);
    setDeviceStatus("passed");
    const diagnostics: DeviceDiagnostics = {
      detections: 12,
      attempts: 12,
      width: 1280,
      height: 720,
      frameRate: 30,
      brightness: scenario.brightness,
      faceCoverage: 0.22,
      landscape: true,
      hardwareConcurrency: navigator.hardwareConcurrency || undefined,
      deviceMemoryGB: null,
      batteryLevel: null,
      batteryCharging: null,
      telemetrySupport: { battery: false, thermal: false },
    };
    setDeviceDiagnostics(diagnostics);
    if (auditRef.current) commitAudit(appendAuditEvent({ ...auditRef.current, device: diagnostics }, "device.replay_ready", diagnostics));
    setDeviceMessage("Replay lokal siap · aset model tersedia · tanpa unggah media");
    setBusy(false);
  }

  async function runCalibration() {
    setCalibrationAttempts((value) => value + 1);
    setBusy(true);
    setCalibration(null);
    setCalibrationMessage(null);
    setCalibrationProgress(null);
    recordAudit("calibration.started", {
      protocol: useTechnicalCalibration ? "technical_9_grid_plus_center_drift_v6" : "child_passive_5_position_v1",
      targetCount: activeTargets.length,
      fullscreen: Boolean(document.fullscreenElement),
      viewport: { width: window.innerWidth, height: window.innerHeight },
    });
    if (mode === "replay") {
      for (let index = 0; index < activeTargets.length; index += 1) {
        setCalibrationTarget(index);
        await pause(160);
      }
      setCalibration({
        x: [0, 1, 0],
        y: [0, 0, 1],
        errorDeg: scenario.calibrationErrorDeg,
      });
      setCalibrationMessage("Replay memakai kalibrasi deterministik bawaan.");
      recordAudit("calibration.replay_completed", { errorDeg: scenario.calibrationErrorDeg });
      setCalibrationTarget(null);
      setBusy(false);
      return;
    }
    const video = captureVideoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker) {
      setCalibrationMessage("Kamera atau model wajah belum siap. Ulangi pemeriksaan perangkat.");
      setBusy(false);
      return;
    }
    const samples: CalibrationSample[] = [];
    const targetDiagnostics: CalibrationTargetDiagnostic[] = [];
    const calibrationSequence = [
      ...activeTargets.map(([x, y], targetIndex) => ({ targetIndex, target: { x, y }, phase: "train" as const })),
      { targetIndex: activeTargets.length, target: { x: 0.5, y: 0.5 }, phase: "validation" as const },
    ];
    for (const item of calibrationSequence) {
      setCalibrationTarget(item.targetIndex);
      await pause(900);
      let rejectedNoFace = 0;
      let rejectedEye = 0;
      let rejectedPose = 0;
      const acceptedCandidates: CalibrationSample[] = [];
      let attemptedFrames = 0;
      for (let sample = 0; sample < CALIBRATION_MAX_ATTEMPTS; sample += 1) {
        attemptedFrames += 1;
        const result = landmarker.detectForVideo(video, performance.now());
        const landmarks = result.faceLandmarks[0];
        if (!landmarks) {
          rejectedNoFace += 1;
          setTracking(null);
        } else {
          setTracking(trackingSnapshot(landmarks, { width: video.videoWidth, height: video.videoHeight }));
          const measurement = eyeMeasurement(landmarks);
          if (!measurement.accepted || !measurement.signal) {
            if (measurement.reason === "pose") rejectedPose += 1;
            else rejectedEye += 1;
          } else {
            acceptedCandidates.push({
              signal: measurement.signal,
              target: item.target,
              targetIndex: item.targetIndex,
              phase: item.phase,
              timestampMs: performance.now(),
            });
          }
        }
        const stableCandidate = mostStableWindow(acceptedCandidates);
        const liveDispersion = signalDispersion(stableCandidate);
        const stable = stableCandidate.length >= CALIBRATION_STABLE_FRAMES && liveDispersion.u <= CALIBRATION_MAX_DISPERSION && liveDispersion.v <= CALIBRATION_MAX_DISPERSION;
        setCalibrationProgress({
          target: item.targetIndex,
          attempted: attemptedFrames,
          accepted: Math.min(acceptedCandidates.length, CALIBRATION_STABLE_FRAMES),
          stable,
          rejectedNoFace,
          rejectedEye,
          rejectedPose,
        });
        if (stable) break;
        await pause(55);
      }
      // Choose the quietest consecutive window. Glass reflections can make
      // otherwise valid iris landmarks jump for a few frames.
      const accepted = mostStableWindow(acceptedCandidates);
      const acceptedDispersion = signalDispersion(accepted);
      const diagnostic: CalibrationTargetDiagnostic = {
        targetIndex: item.targetIndex,
        phase: item.phase,
        attempted: attemptedFrames,
        accepted: accepted.length,
        rejectedNoFace,
        rejectedEye,
        rejectedPose,
        dispersionU: acceptedDispersion.u,
        dispersionV: acceptedDispersion.v,
        representativeU: accepted.length ? [...accepted].sort((a, b) => a.signal.u - b.signal.u)[Math.floor(accepted.length / 2)].signal.u : undefined,
        representativeV: accepted.length ? [...accepted].sort((a, b) => a.signal.v - b.signal.v)[Math.floor(accepted.length / 2)].signal.v : undefined,
      };
      targetDiagnostics.push(diagnostic);
      samples.push(...accepted);
      recordAudit(
        "calibration.target_completed",
        { ...diagnostic, target: item.target },
        accepted.length >= 8 ? "info" : "warning",
      );
    }
    setCalibrationTarget(null);
    setCalibrationProgress(null);
    try {
      const fitted = fitCalibration(samples, targetDiagnostics, useTechnicalCalibration
        ? undefined
        : { minimumTrainingTargets: 5, minimumTrainingSamples: 25 });
      setCalibration(fitted);
      setSanityPassed(null);
      setCalibrationMessage(
        fitted.errorDeg > calibrationLimitDeg ? "Belum terbaca, mari coba lagi." : "Siap digunakan.",
      );
      if (auditRef.current && fitted.diagnostics) {
        const next = appendAuditEvent(
          { ...auditRef.current, calibration: fitted.diagnostics },
          fitted.errorDeg <= calibrationLimitDeg ? "calibration.passed" : "calibration.failed_validation",
          { errorDeg: fitted.errorDeg, limitDeg: calibrationLimitDeg, purpose: sessionPurpose, warnings: fitted.diagnostics.warnings },
          fitted.errorDeg <= calibrationLimitDeg ? "info" : "warning",
        );
        commitAudit(next);
      }
    } catch (error) {
      setCalibration(null);
      const message = error instanceof Error ? error.message : "Kalibrasi gagal.";
      setCalibrationMessage(message);
      recordAudit("calibration.fit_failed", { message, targetDiagnostics }, "error");
    }
    setBusy(false);
  }

  async function beginCalibration() {
    await enterMeasurementFullscreen();
    await runCalibration();
  }

  async function runSanityCheck() {
    if (!calibration) return;
    setBusy(true);
    setSanityPassed(null);
    setSanityAttempts((value) => value + 1);
    const positions = [
      { id: "left" as const, x: 0.2 },
      { id: "center" as const, x: 0.5 },
      { id: "right" as const, x: 0.8 },
    ];
    const observed: Record<"left" | "center" | "right", number[]> = { left: [], center: [], right: [] };
    if (mode === "replay") {
      for (const position of positions) {
        setSanityTarget(position.id);
        await pause(420);
        observed[position.id] = [position.x - 0.01, position.x, position.x + 0.01];
      }
    } else {
      const video = captureVideoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker) {
        setSanityTarget(null);
        setSanityPassed(false);
        setBusy(false);
        return;
      }
      for (const position of positions) {
        setSanityTarget(position.id);
        await pause(650);
        for (let frame = 0; frame < 18; frame += 1) {
          const landmarks = landmarker.detectForVideo(video, performance.now()).faceLandmarks[0];
          if (landmarks) {
            const measurement = eyeMeasurement(landmarks);
            if (measurement.accepted && measurement.signal) observed[position.id].push(applyCalibration(calibration, measurement.signal).x);
          }
          await pause(55);
        }
      }
    }
    const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0.5;
    const left = median(observed.left);
    const center = median(observed.center);
    const right = median(observed.right);
    const enough = positions.every((position) => observed[position.id].length >= 3);
    const passed = enough && left < center - 0.06 && right > center + 0.06 && left < right;
    setSanityTarget(null);
    setSanityPassed(passed);
    recordAudit(passed ? "sanity.passed" : "sanity.failed", {
      targetOrder: positions.map((position) => position.id),
      sampleCount: Object.fromEntries(positions.map((position) => [position.id, observed[position.id].length])),
      medians: { left, center, right },
      reasonCode: passed ? null : left > right ? "DIRECTION_REVERSED" : "CENTER_LOCK",
    }, passed ? "info" : "warning");
    setBusy(false);
  }

  function holdAfterSanityFailure() {
    const nextValidity = evaluateSessionValidity({
      sessionComplete: true,
      cameraInterrupted: false,
      orientationChanged: false,
      calibrationPassed: Boolean(calibration && calibration.errorDeg <= calibrationLimitDeg),
      featureContractMatches: true,
      timestampsSynchronized: true,
      faceRate: deviceDiagnostics ? deviceDiagnostics.detections / Math.max(deviceDiagnostics.attempts, 1) : 0,
      gazeDropout: 1,
      poseRejectedRate: 0,
      offScreenRate: 0,
      gazeMovement: 0,
      rawIrisMovement: 0,
      stationaryJumpRate: 0,
      sanity: { completed: true, leftMedianX: 0.49, centerMedianX: 0.5, rightMedianX: 0.51, stable: true },
      phases: [],
    });
    const heldQuality: Quality = {
      faceRate: deviceDiagnostics ? deviceDiagnostics.detections / Math.max(deviceDiagnostics.attempts, 1) : 0,
      gazeDropout: 1,
      calibrationErrorDeg: calibration?.errorDeg ?? 99,
      calibrationLimitDeg,
      brightness: deviceDiagnostics?.brightness ?? 0,
      sampleCount: 0,
      reasons: [nextValidity.userMessage],
      passed: false,
    };
    setValidity(nextValidity);
    setQuality(heldQuality);
    setRisk(null);
    recordAudit("session.held", { validity: nextValidity }, "warning");
    setStage("quality");
  }

  async function runStimulus() {
    if (!calibration || (mode === "replay" && !model)) return;
    const retryPhaseIds = validity?.outcome === "RETRY_STAGE" ? validity.invalidStages : [];
    const runPhases = retryPhaseIds.length
      ? STIMULUS_PHASES.filter((phase) => retryPhaseIds.includes(phase.id))
      : STIMULUS_PHASES;
    const preservedPoints = retryPhaseIds.length ? points.filter((point) => !retryPhaseIds.includes(point.phase ?? "")) : [];
    setBusy(true);
    setStimulusPaused(false);
    stimulusPausedRef.current = false;
    setProgress(0);
    setStimulusPhase(runPhases[0]);
    setStimulusCueActive(runPhases[0].cueOnsetMs === 0);
    setStimulusOstensiveActive(runPhases[0].ostensiveOnsetMs === 0);
    const capturedStageAspect = window.innerWidth / Math.max(window.innerHeight, 1);
    setStageAspect(capturedStageAspect);
    recordAudit(retryPhaseIds.length ? "stimulus.partial_retry_started" : "stimulus.started", { version: STIMULUS_VERSION, phases: runPhases.map((phase) => phase.id), retry: retryPhaseIds.length > 0, stageAspect: Number(capturedStageAspect.toFixed(4)) });
    let captured: Point[] = [];
    const rawCaptured: Point[] = [];
    const rawSignals: Array<{ u: number; v: number }> = [];
    let processedDiagnostics: GazePipelineDiagnostics | null = null;
    let faceFrames = 0;
    let attemptedFrames = 0;
    let poseRejectedFrames = 0;
    let eyeRejectedFrames = 0;
    const totalFrames = 180;
    const durationMs = Array.from(runPhases).reduce((sum: number, phase) => sum + phase.durationMs, 0);
    if (mode === "replay") {
      captured = replayPoints(scenario, totalFrames).map((point, index) => {
        const virtualElapsed = (index / Math.max(totalFrames - 1, 1)) * Math.max(durationMs - 1, 0);
        const state = phaseAtElapsed(virtualElapsed, runPhases)!;
        return { ...point, phase: state.phase.id, epoch: state.cueActive ? "post_cue" as const : "pre_cue" as const };
      });
      for (let index = 0; index < totalFrames; index += 6) {
        setProgress(Math.round((index / totalFrames) * 100));
        while (stimulusPausedRef.current) await pause(100);
        const state = phaseAtElapsed((index / totalFrames) * durationMs, runPhases)!;
        setStimulusPhase(state.phase);
        setStimulusCueActive(state.cueActive);
        setStimulusOstensiveActive(state.ostensiveActive);
        await pause(140);
      }
      faceFrames = Math.round(scenario.faceRate * totalFrames);
      attemptedFrames = totalFrames;
    } else {
      const video = captureVideoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || !streamRef.current) {
        setBusy(false);
        setDeviceStatus("failed");
        setDeviceMessage("Kamera terputus. Ulangi pemeriksaan perangkat.");
        setStage("device");
        return;
      }
      const startedAt = performance.now();
      let pausedTotalMs = 0;
      let pausedAt: number | null = null;
      let phaseIndex = -1;
      const cueStartedPhaseIds = new Set<string>();
      const ostensiveStartedPhaseIds = new Set<string>();
      const nameCallsDelivered = new Set<number>();
      while (performance.now() - startedAt - pausedTotalMs < durationMs) {
        if (stimulusPausedRef.current) {
          pausedAt ??= performance.now();
          await pause(100);
          continue;
        }
        if (pausedAt !== null) {
          pausedTotalMs += performance.now() - pausedAt;
          pausedAt = null;
        }
        const frameStartedAt = performance.now();
        const elapsed = frameStartedAt - startedAt - pausedTotalMs;
        const phaseState = phaseAtElapsed(elapsed, runPhases)!;
        const nextPhaseIndex = phaseState.index;
        if (nextPhaseIndex !== phaseIndex) {
          phaseIndex = nextPhaseIndex;
          const phase = runPhases[phaseIndex];
          setStimulusPhase(phase);
          setStimulusCueActive(phaseState.cueActive);
          setStimulusOstensiveActive(phaseState.ostensiveActive);
          recordAudit("stimulus.phase_started", { id: phase.id, cue: phase.cue, target: phase.target, ostensiveOnsetMs: phase.ostensiveOnsetMs, cueOnsetMs: phase.cueOnsetMs, elapsedMs: Math.round(elapsed) });
        }
        if (phaseState.ostensiveActive && !ostensiveStartedPhaseIds.has(phaseState.phase.id)) {
          ostensiveStartedPhaseIds.add(phaseState.phase.id);
          setStimulusOstensiveActive(true);
          recordAudit("stimulus.ostensive_started", { id: phaseState.phase.id, elapsedMs: Math.round(elapsed), plannedOnsetMs: phaseState.phase.ostensiveOnsetMs });
        }
        if (phaseState.cueActive && !cueStartedPhaseIds.has(phaseState.phase.id)) {
          cueStartedPhaseIds.add(phaseState.phase.id);
          setStimulusCueActive(true);
          recordAudit("stimulus.cue_started", { id: phaseState.phase.id, elapsedMs: Math.round(elapsed), plannedOnsetMs: phaseState.phase.cueOnsetMs });
        }
        if (phaseState.phase.id === NAME_CALL_PHASE_ID) {
          NAME_CALL_OFFSETS_MS.forEach((offsetMs, index) => {
            if (nameCallsDelivered.has(index) || phaseState.phaseElapsedMs < offsetMs) return;
            nameCallsDelivered.add(index);
            speakChildName();
            // The spoken name is never written here: only the fact that a call
            // was delivered and when, so the audit log stays pseudonymous.
            recordAudit("stimulus.name_called", { callIndex: index, phaseElapsedMs: Math.round(phaseState.phaseElapsedMs), spoken: callNameRef.current.length > 0 });
          });
        }
        const result = landmarker.detectForVideo(video, frameStartedAt);
        attemptedFrames += 1;
        if (result.faceLandmarks[0]) {
          faceFrames += 1;
          setTracking(trackingSnapshot(result.faceLandmarks[0], { width: video.videoWidth, height: video.videoHeight }));
          const measurement = eyeMeasurement(result.faceLandmarks[0]);
          // Pose and eye opening are behavioural signal, not just gate inputs.
          // Keep every frame, including ones the gaze pipeline rejects.
          frameTraceRef.current.record({
            t: elapsed,
            phase: phaseState.phase.id,
            faceDetected: true,
            accepted: measurement.accepted,
            reason: measurement.reason,
            eyeOpen: measurement.eyeOpen,
            yaw: measurement.yaw,
            pitch: measurement.pitch,
            rollDeg: measurement.rollDeg,
          });
          if (measurement.accepted && measurement.signal) {
            rawSignals.push(measurement.signal);
            const gaze = applyCalibration(calibration, measurement.signal);
            rawCaptured.push({ t: elapsed, ...gaze, phase: phaseState.phase.id, epoch: phaseState.cueActive ? "post_cue" : "pre_cue" });
          } else if (measurement.reason === "pose") {
            poseRejectedFrames += 1;
          } else {
            eyeRejectedFrames += 1;
          }
        } else {
          frameTraceRef.current.record({
            t: elapsed,
            phase: phaseState.phase.id,
            faceDetected: false,
            accepted: false,
            reason: "landmarks",
            eyeOpen: 0,
            yaw: 0,
            pitch: 0,
            rollDeg: 0,
          });
          setTracking(null);
        }
        setProgress(Math.min(99, Math.round((elapsed / durationMs) * 100)));
        await pause(Math.max(0, 50 - (performance.now() - frameStartedAt)));
      }
      const processed = processGazeSamples(rawCaptured);
      captured = processed.points;
      processedDiagnostics = processed.diagnostics;
      setGazeDiagnostics(processed.diagnostics);
    }
    captured = [...preservedPoints, ...captured].sort((a, b) => {
      const phaseDelta = STIMULUS_PHASES.findIndex((phase) => phase.id === a.phase) - STIMULUS_PHASES.findIndex((phase) => phase.id === b.phase);
      return phaseDelta || a.t - b.t;
    });
    setProgress(100);
    setStimulusPhase(null);
    setStimulusCueActive(false);
    setPoints(captured);
    setPhenotype(buildPhenotypeProfile({
      frames: frameTraceRef.current.samples(),
      nameCalls: NAME_CALLS,
      socialPhases: SOCIAL_PHASE_IDS,
      nonsocialPhases: [GEOPREF_PHASE_ID],
    }));
    const frameRate = faceFrames / Math.max(attemptedFrames, 1);
    const dropout =
      mode === "replay"
        ? scenario.gazeDropout
        : 1 - rawCaptured.length / Math.max(attemptedFrames, 1);
    const features = geometryFeatures(captured);
    const nextOod = oodReference ? assessFeatureOod(features, oodReference) : null;
    const phaseTargets = scoredPhaseTargets();
    const nextCueSummary = cueFeatures(captured, phaseTargets);
    const baseQuality = evaluateQuality({
      faceRate: frameRate,
      gazeDropout: dropout,
      calibrationErrorDeg: calibration.errorDeg,
      calibrationLimitDeg,
      brightness: mode === "replay"
        ? scenario.brightness
        : deviceDiagnostics?.brightness ?? frameBrightness(captureVideoRef.current!),
      sampleCount: captured.length,
      coverage: nextOod?.coverage,
      phaseCoverage: nextCueSummary.phaseCoverage,
      oodMaxRobustZ: nextOod?.maxRobustZ,
      // Carette is a legacy reference from a different device, population,
      // sampling rate, and stimulus. It may block replay inference, but it
      // must not turn a technically valid live capture into a camera failure.
      oodFlaggedFeatures: mode === "replay" ? nextOod?.flaggedFeatures : undefined,
    });
    const scoredPhases = STIMULUS_PHASES.filter((phase) => phase.scored);
    const phaseAssessments = scoredPhases.map((phase) => phaseAssessment(
      phase.id,
      captured.filter((point) => point.phase === phase.id).length,
    ));
    const gazeSteps = captured.slice(1).map((point, index) => ({
      distance: Math.hypot(point.x - captured[index].x, point.y - captured[index].y),
      samePhase: point.phase === captured[index].phase,
    }));
    const gazeMovement = captured.length ? Math.hypot(
      Math.max(...captured.map((point) => point.x)) - Math.min(...captured.map((point) => point.x)),
      Math.max(...captured.map((point) => point.y)) - Math.min(...captured.map((point) => point.y)),
    ) : 0;
    const rawIrisMovement = rawSignals.length ? Math.hypot(
      Math.max(...rawSignals.map((signal) => signal.u)) - Math.min(...rawSignals.map((signal) => signal.u)),
      Math.max(...rawSignals.map((signal) => signal.v)) - Math.min(...rawSignals.map((signal) => signal.v)),
    ) : gazeMovement;
    const samePhaseSteps = gazeSteps.filter((step) => step.samePhase);
    const nextValidity = evaluateSessionValidity({
      sessionComplete: progress < 100 || captured.length > 0,
      cameraInterrupted: mode === "live" && !streamRef.current,
      orientationChanged: Boolean(deviceDiagnostics && deviceDiagnostics.landscape !== window.matchMedia("(orientation: landscape)").matches),
      calibrationPassed: calibration.errorDeg <= calibrationLimitDeg,
      featureContractMatches: Boolean(model && model.feature_order.every((feature) => Number.isFinite(features[feature]))),
      timestampsSynchronized: STIMULUS_PHASES.every((phase) => {
        const phasePoints = captured.filter((point) => point.phase === phase.id);
        return phasePoints.every((point, index) => index === 0 || point.t >= phasePoints[index - 1].t);
      }),
      faceRate: frameRate,
      gazeDropout: dropout,
      poseRejectedRate: poseRejectedFrames / Math.max(attemptedFrames, 1),
      offScreenRate: rawCaptured.length ? rawCaptured.filter((point) => point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1).length / rawCaptured.length : 0,
      gazeMovement,
      rawIrisMovement,
      stationaryJumpRate: samePhaseSteps.length ? samePhaseSteps.filter((step) => step.distance > 0.45).length / samePhaseSteps.length : 0,
      sanity: { completed: sanityPassed === true, leftMedianX: 0.2, centerMedianX: 0.5, rightMedianX: 0.8, stable: sanityPassed === true },
      phases: phaseAssessments,
      missingFeatures: model ? model.feature_order.filter((feature) => !Number.isFinite(features[feature])) : ["model"],
    });
    const nextQuality: Quality = nextValidity.canScore && baseQuality.passed
      ? baseQuality
      : { ...baseQuality, passed: false, reasons: [...baseQuality.reasons, ...(nextValidity.canScore ? [] : [nextValidity.userMessage])] };
    const inferenceStarted = performance.now();
    // The bundled LR is trained on Carette scanpath rasters, whose geometric
    // features encode where that study's stimulus content sat on screen. The
    // decision boundary therefore does not transfer to this stimulus, on top of
    // the age and sampling-rate gaps. It runs so the research panel can show
    // the OOD guard rejecting it, and never drives a referral.
    const nextRisk = nextValidity.canScore && nextQuality.passed && model
      ? infer(model, features)
      : null;
    const riskIsInterpretable = mode === "replay" && Boolean(nextOod?.passed);
    setRiskInterpretable(riskIsInterpretable);
    setLatencyMs(performance.now() - inferenceStarted);
    setCueSummary(nextCueSummary);
    setOodAssessment(nextOod);
    setQuality(nextQuality);
    setValidity(nextValidity);
    setRisk(nextRisk);
    if (auditRef.current) {
      const observations = summarizeSessionObservations(nextCueSummary);
      const assessment = mode === "replay"
        ? {
            status: nextRisk === null ? "withheld" : "demo_only",
            modelVersion: model?.model_version ?? null,
            score: nextRisk,
            threshold: model?.decision.refer_if_probability_gte ?? null,
            outcome: nextRisk === null || !model ? "withheld" : nextRisk >= model.decision.refer_if_probability_gte ? "refer" : "monitor",
            observations,
          }
        : {
            status: "withheld",
            reasonCode: isEngineeringStudy ? "ENGINEERING_SESSION_NO_SCORE" : "LIVE_MODEL_CONTRACT_MISMATCH",
            modelVersion: model?.model_version ?? null,
            score: null,
            outcome: "no_referral_direction",
            observations,
          };
      const gaze = {
        rawSamples: rawCaptured.length,
        processedSamples: captured.length,
        attemptedFrames,
        faceFrames,
        poseRejectedFrames,
        eyeRejectedFrames,
        pipeline: processedDiagnostics,
        ood: nextOod,
        cueFeatures: nextCueSummary,
        aoiVersion: AOI_VERSION,
        // Exported so a recorded session can be replayed with the same
        // phenotype indices it produced live. Pose and eye opening are derived
        // scalars, not landmarks: no face geometry is reconstructable.
        ...(mode === "live" ? { processedPoints: captured, frames: frameTraceRef.current.samples() } : {}),
        ...(isGateB ? { cleanSamples: captured } : {}),
      };
      const next = appendAuditEvent(
        { ...auditRef.current, quality: nextQuality, gaze, assessment },
        nextQuality.passed ? "quality.passed" : "quality.withheld",
        { reasons: nextQuality.reasons, validity: nextValidity, assessment, ...gaze },
        nextQuality.passed ? "info" : "warning",
      );
      commitAudit(next);
    }
    if (mode === "live" && nextValidity.outcome !== "RETRY_STAGE") stopCamera();
    void leaveMeasurementFullscreen();
    setBusy(false);
    setStage("quality");
  }

  function restart() {
    void leaveMeasurementFullscreen();
    if (mode === "live") stopCamera();
    setQuality(null);
    setValidity(null);
    setRisk(null);
    setLatencyMs(null);
    setGazeDiagnostics(null);
    setCueSummary(null);
    setOodAssessment(null);
    setStimulusPhase(null);
    setProgress(0);
    setStimulusPaused(false);
    setStimulusCueActive(false);
    setStimulusOstensiveActive(false);
    stimulusPausedRef.current = false;
    setPoints([]);
    setPhenotype(EMPTY_PHENOTYPE);
    callNameRef.current = "";
    frameTraceRef.current.reset();
    setCalibration(null);
    setCalibrationMessage(null);
    setCalibrationAttempts(0);
    setSanityPassed(null);
    setSanityAttempts(0);
    if (mode === "live") setDeviceDiagnostics(null);
    setDeviceStatus(mode === "replay" ? "passed" : "idle");
    setStage(mode === "replay" ? "calibration" : "device");
  }

  return (
    <main>
      {stage !== "calibration" && stage !== "stimulus" && <header className="topbar">
        <div className="topbarInner">
        <button className="brandButton" onClick={goHome}>
          <Logo />
        </button>
        <nav className="topnav" aria-label="Navigasi utama">
          <button className={stage === "home" ? "active" : ""} onClick={goHome}>Beranda</button>
          <button onClick={() => setStage("guide")}>Panduan & demo</button>
          <button onClick={() => {
            goHome();
            const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
            requestAnimationFrame(() => document.getElementById("evidence")?.scrollIntoView({ behavior }));
          }}>Bukti & privasi</button>
        </nav>
        <div className="statusCluster">
          <span className={`offlineBadge ${online ? "" : "offline"}`}>
            {online ? <b aria-hidden="true" /> : <IconOffline size={13} />}
            {online ? "Siap luring" : "Luring aktif"}
          </span>
          <span className="version">app {APP_VERSION}</span>
        </div>
        </div>
      </header>}

      <video
        ref={captureVideoRef}
        className="captureVideoSource"
        muted
        playsInline
        aria-hidden="true"
      />

      {stage === "home" && (
        <>
          <div className="heroShell">
          <div className="heroBackdrop" aria-hidden="true"><i /><i /><i /><u /><b /></div>
          <section className="hero">
            <div className="heroCopy">
              <span className="heroBadge" style={{ "--i": 0 } as CSSProperties}>
                <i aria-hidden="true"><IconEye size={13} /></i>
                Pendamping skrining untuk Posyandu
              </span>
              <h1 style={{ "--i": 1 } as CSSProperties}>Amati pola perhatian anak <em>dalam beberapa menit</em>.</h1>
              <p className="lead" style={{ "--i": 2 } as CSSProperties}>
                Neurogaze membantu kader dan orang tua mendokumentasikan pola perhatian anak saat menonton stimulus singkat untuk dibaca bersama skrining perkembangan yang tervalidasi.
              </p>
              <div className="heroActions" style={{ "--i": 3 } as CSSProperties}>
                <button className="primary primaryArrow" onClick={() => start("live", scenario, "target_population_research")}>
                  Mulai observasi kamera <span aria-hidden="true"><IconArrowRight size={16} /></span>
                </button>
                <button className="secondary" onClick={() => start("replay", SCENARIOS[0])}>
                  <IconPlay size={14} /> Lihat demo replay
                </button>
              </div>
              <div className="trustList" aria-label="Perlindungan data utama" style={{ "--i": 4 } as CSSProperties}>
                <span><i aria-hidden="true"><IconCpu size={14} /></i> Analisis lokal</span>
                <span><i aria-hidden="true"><IconPrivacyShield size={14} /></i> Video tidak disimpan</span>
                <span><i aria-hidden="true"><IconOffline size={14} /></i> Dapat berjalan luring</span>
              </div>
              <div className="warning heroWarning" style={{ "--i": 5 } as CSSProperties}>
                <span aria-hidden="true"><IconAlert size={18} /></span>
                <p><strong>Neurogaze adalah alat skrining awal dan bukan alat diagnosis.</strong> Neurogaze tidak menggantikan tenaga kesehatan.</p>
              </div>
            </div>
          </section>

          <div className="heroStage">
            <HeroDevice />
          </div>
          </div>

          <section className="featureSection" aria-labelledby="feature-heading">
            <div className="sectionHead">
              <span className="sectionPill"><IconEye size={13} /> Cara kerja</span>
              <h2 id="feature-heading">Tiga hal penting. Selebihnya kami pandu.</h2>
            </div>
            <div className="featureShowcase">
              <article className="featureCard featureCamera">
                <div className="featureVisual" aria-hidden="true">
                  <CameraFramingArt />
                  <em className="featureBadge"><IconCheck size={13} /> Posisi pas</em>
                </div>
                <div className="featureCopy"><span>01 · SIAPKAN</span><h3>Sejajarkan kamera dengan wajah.</h3><p>Panduan posisi dan cahaya muncul langsung di layar.</p></div>
              </article>
              <article className="featureCard featureWatch">
                <div className="featureVisual" aria-hidden="true">
                  <NaturalWatchingArt />
                </div>
                <div className="featureCopy"><span>02 · TONTON</span><h3>Biarkan anak melihat secara alami.</h3><p>Tanpa menunjuk, mengarahkan, atau mencari jawaban benar.</p></div>
              </article>
              <article className="featureCard featureResult">
                <div className="featureVisual" aria-hidden="true">
                  <div className="featureResultCard"><small>Status sesi</small><strong><IconSignalHeld size={16} /> Belum dapat ditafsirkan</strong><i><b style={{ width: "78%" }} /></i><span>Data terukur · interpretasi dikunci</span></div>
                </div>
                <div className="featureCopy"><span>03 · PAHAMI</span><h3>Lihat kesimpulan sebelum angka.</h3><p>Laporan membedakan data kurang, hasil terukur, dan arahan lanjut.</p></div>
              </article>
            </div>
          </section>

          <section className="flowSection" aria-labelledby="flow-heading">
            <div className="sectionHead">
              <span className="sectionPill"><IconRoute size={13} /> Alur sesi</span>
              <h2 id="flow-heading">Satu alur, tanpa menebak langkah berikutnya.</h2>
            </div>
            <ol className="flowStrip">
              {SESSION_FLOW.map((step, index) => (
                <li className="flowStep" key={step.label} data-tone={step.tone} style={{ "--i": index } as CSSProperties}>
                  <span className="flowMark" aria-hidden="true"><step.icon size={21} /></span>
                  <span className="flowIndex">0{index + 1}</span>
                  <strong>{step.label}</strong>
                  <small>{step.hint}</small>
                </li>
              ))}
            </ol>
          </section>

          <section className="homeSection replaySection" aria-labelledby="replay-heading">
            <div className="sectionHead">
              <span className="sectionPill" data-tone="amber"><IconPlay size={11} /> Demo tanpa kamera</span>
              <h2 id="replay-heading">Pratinjau tiga keadaan laporan.</h2>
              <p>Simulasi dengan hasil tetap untuk menguji alur, bahasa rekomendasi, dan keputusan yang ditahan.</p>
            </div>
            <div className="scenarioGrid">
              {SCENARIOS.map((item, index) => {
                const ScenarioIcon = SCENARIO_ICON[item.id as keyof typeof SCENARIO_ICON] ?? IconScanpathFocus;
                return (
                  <button
                    className={`scenarioCard ${item.id}`}
                    key={item.id}
                    style={{ "--i": index } as CSSProperties}
                    onClick={() => start("replay", item)}
                  >
                    <span className="scenarioIndex">0{index + 1}</span>
                    <span className={`scenarioVisual ${item.id}`} aria-hidden="true"><ScenarioIcon size={38} /></span>
                    <strong>{item.title.replace("Contoh: ", "")}</strong>
                    <small>{item.id === "refer" ? "Pemeriksaan kualitas lulus · arahan rujuk" : item.id === "withheld" ? "Mutu tidak cukup · skor ditahan" : "Pemeriksaan kualitas lulus · pantau rutin"}</small>
                    <span className="scenarioLink">Buka demo <IconArrowRight size={14} /></span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="homeSection evidenceSection" id="evidence" aria-labelledby="evidence-heading">
            <div className="sectionHead">
              <span className="sectionPill" data-tone="slate"><IconShieldCheck size={12} /> Bukti, batas, privasi</span>
              <h2 id="evidence-heading">Dibangun agar dapat diaudit.</h2>
              <p>Jejak teknis tersedia untuk evaluasi, sementara media mentah tetap berada di luar laporan.</p>
            </div>
            <div className="evidenceRow">
              <article className="evidenceCard privacy" style={{ "--i": 0 } as CSSProperties}>
                <span className="evidenceIcon" aria-hidden="true"><IconPrivacyShield size={26} /></span>
                <strong>Privasi sejak awal</strong>
                <p>Video dan landmark mentah tidak disimpan. Log teknis hanya berada di memori sampai diekspor.</p>
              </article>
              <article className="evidenceCard" style={{ "--i": 1 } as CSSProperties}>
                <span className="evidenceNumber">13</span>
                <strong>Fitur geometri</strong>
                <p>Baseline replay yang dapat dijelaskan dan diuji parity Python ↔ browser.</p>
              </article>
              <article className="evidenceCard" style={{ "--i": 2 } as CSSProperties}>
                <span className="evidenceNumber">54</span>
                <strong>Partisipan anchor POC</strong>
                <p>Anak usia sekolah dengan evaluasi group-aware; bukan validasi klinis balita.</p>
              </article>
            </div>
            <div className="evidenceActions">
              <button className="secondary" onClick={() => setStage("guide")}>
                <IconBook size={15} /> Baca panduan validasi
              </button>
            </div>
          </section>

          <section className="ctaSection" aria-labelledby="cta-heading">
            <div className="ctaBand">
              <div>
                <span className="sectionPill"><IconCamera size={12} /> Mulai sekarang</span>
                <h2 id="cta-heading">Jalankan satu sesi di perangkat ini.</h2>
                <p>Sistem memandu persiapan, memeriksa kualitas rekaman, dan menahan hasil yang belum dapat dipercaya.</p>
                <div className="ctaActions">
                  <button className="primary primaryArrow" onClick={() => start("live", scenario, "target_population_research")}>
                    Mulai observasi kamera <span aria-hidden="true"><IconArrowRight size={16} /></span>
                  </button>
                  <button className="secondary" onClick={() => start("replay", SCENARIOS[1])}>
                    <IconPlay size={14} /> Coba replay pantau
                  </button>
                </div>
              </div>
              <div className="ctaPreview" aria-hidden="true">
                <div className="ctaPreviewHead"><span>Laporan sesi</span><span>NG-0042</span></div>
                <div className="ctaPreviewRow"><span><IconGauge size={15} /> Pemeriksaan kualitas</span><strong>lulus</strong></div>
                <div className="ctaPreviewRow"><span><IconScanpathFocus size={15} /> Pola tatapan</span><strong>terpusat</strong></div>
                <div className="ctaPreviewRow"><span><IconTimer size={15} /> Ekstraksi + inferensi</span><strong>4,8 ms</strong></div>
                <div className="ctaPreviewRow"><span><IconPrivacyShield size={15} /> Raw media</span><strong>tidak disimpan</strong></div>
              </div>
            </div>
          </section>

          <footer className="siteFooter">
            <div className="footerGrid">
              <div className="footerBrand">
                <Logo />
                <p>PWA luring untuk mendokumentasikan pola perhatian di layanan Posyandu. Bukan alat diagnosis atau penentu rujukan otomatis.</p>
              </div>
              <div className="footerCol">
                <h3>Alur</h3>
                <ul>
                  {SESSION_FLOW.map((step) => (
                    <li key={step.label}><step.icon size={14} />{step.label}</li>
                  ))}
                </ul>
              </div>
              <div className="footerCol">
                <h3>Jaminan</h3>
                <ul>
                  <li><IconCpu size={14} />Inferensi di perangkat</li>
                  <li><IconPrivacyShield size={14} />Tanpa unggah video</li>
                  <li><IconOffline size={14} />Berjalan luring</li>
                  <li><IconBook size={14} />Log audit dapat diekspor</li>
                </ul>
              </div>
            </div>
            <div className="footerBase">
              <div>
                <span>Datathon RISTEK Fasilkom UI 2026 · University Track</span>
                <div className="footerMeta">
                  <a className="adminAccess" href="/admin"><IconShieldCheck size={14} /> Konsol admin</a>
                  <code>app {APP_VERSION}</code>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}

      {stage === "guide" && (
        <section className="workspace guide">
          <button className="back" onClick={goHome}><IconArrowLeft size={16} /> Beranda</button>
          <span className="eyebrow">Panduan operator · mulai dari sini</span>
          <h1>Ikuti satu langkah pada satu waktu.</h1>
          <p className="guideLead">Tonton panduan singkat ini sebelum mendampingi anak. Anak tidak perlu melihat atau mengikuti instruksinya.</p>
          <GuideFilm />
          <div className="guideEssentials" aria-label="Tiga aturan pendamping">
            <article><span><IconChild size={22} /></span><div><small>POSISI</small><strong>Nyaman dan sejajar</strong><p>Tablet stabil, cahaya dari depan, jarak 40–50 cm.</p></div></article>
            <article><span><IconEye size={22} /></span><div><small>SELAMA TES</small><strong>Biarkan melihat sendiri</strong><p>Jangan menunjuk layar atau menyebut arah.</p></div></article>
            <article><span><IconTimer size={22} /></span><div><small>KENYAMANAN</small><strong>Boleh berhenti kapan saja</strong><p>Jeda bila anak lelah, gelisah, atau ingin berpaling.</p></div></article>
          </div>
          <details className="operatorGuideDetails">
            <summary><IconBook size={16} /> Petunjuk teknis untuk operator</summary>
            <div className="operatorGuideGrid">
              <p><strong>Pilih mode yang tepat.</strong> Replay untuk demo, Observasi kamera untuk sesi anak tanpa skor, dan Gate A untuk uji perangkat pada orang dewasa.</p>
              <p><strong>Jangan berikan kalibrasi 9 titik kepada anak.</strong> Alur anak memakai lima pemancing perhatian pasif. Hasil ditahan jika kualitas sinyal tidak cukup.</p>
              <p><strong>Batasi percobaan.</strong> Untuk Gate A, berhenti setelah dua kalibrasi gagal dan unduh log audit.</p>
              <p><strong>Baca status sebelum angka.</strong> “Ditahan” berarti data belum cukup; status ini tidak menilai perkembangan anak.</p>
            </div>
          </details>
          <div className="cardActions guideActions">
            <button className="primary" onClick={() => start("live", scenario, "gate_a_adult")}><IconCamera size={16} /> Mulai Gate A sekarang</button>
            <button className="secondary" onClick={() => start("replay", SCENARIOS[0])}><IconPlay size={14} /> Uji replay dulu</button>
          </div>
          <p className="guideFootnote"><IconInfo size={15} /> Gate A hanya menguji kinerja perangkat. Tahap ini tidak menilai ASD.</p>
        </section>
      )}

      {isSessionStage && (
        <div className={`sessionShell ${stage === "calibration" ? "measurementShell" : ""}`}>
          {stage !== "calibration" && <Stepper stage={stage} />}
          <div className="sessionMain">
      {stage === "consent" && (
        <section className="workspace">
          <div className="sectionHeading">
            <span className="eyebrow">Langkah 1 · {isGateB ? "Gate B WebGazer" : isGateA ? "Gate A engineering" : "profil pseudonim"}</span>
            <h1>{isGateB ? "Siapkan satu sesi pembanding WebGazer." : isGateA ? "Siapkan satu sesi uji perangkat." : "Persetujuan sebelum pengukuran."}</h1>
            <p>{isGateB ? "Gunakan ID pseudonim dan ID pasangan yang sama pada dua aliran browser. Sesi ini mengukur agreement, bukan ASD." : isGateA ? "Gunakan peserta dewasa dan ID pseudonim. Sesi ini hanya mengukur kinerja kamera, bukan ASD." : "Jangan masukkan nama lengkap, NIK, alamat, atau foto identitas."}</p>
          </div>
          <div className="formCard">
            <div className="formGrid">
              <label><span><IconChild size={14} />{isEngineeringStudy ? "ID peserta pseudonim" : "ID anak pseudonim"}</span><input value={profile.childId} onChange={(event) => setProfile({ ...profile, childId: event.target.value })} /></label>
              {isEngineeringStudy ? <label><span><IconResearch size={14} />Jenis sesi</span><input value={isGateB ? "Gate B · WebGazer agreement" : "Dewasa · validasi engineering"} disabled /></label> : <label><span><IconTimer size={14} />Usia (bulan)</span><input type="number" min="16" max="30" value={profile.age} onChange={(event) => setProfile({ ...profile, age: event.target.value })} /></label>}
              <label><span><IconLocation size={14} />Lokasi layanan</span><input value={profile.site} onChange={(event) => setProfile({ ...profile, site: event.target.value })} /></label>
              <label><span><IconShieldCheck size={14} />ID operator</span><input value={profile.operator} onChange={(event) => setProfile({ ...profile, operator: event.target.value })} /></label>
              {!isEngineeringStudy && <label className="transientField"><span><IconTimer size={14} />Nama panggilan anak</span><input defaultValue="" placeholder="Untuk dipanggil saat tes" onChange={(event) => { callNameRef.current = event.target.value; }} /><small>Tidak disimpan, tidak masuk log, hilang saat sesi selesai. Kosongkan bila Anda ingin memanggil sendiri.</small></label>}
            </div>
            {isGateB && <div className="bridgeSetup" aria-label="Metadata pasangan Gate B">
              <div className="bridgeSetupHead"><div><strong>Kontrak pasangan</strong><small>Nilai ini harus identik pada aliran Neurogaze dan WebGazer.</small></div><span>Gate B · riset</span></div>
              <div className="formGrid">
                <label><span>Pair ID</span><input value={bridgeMeta.pairId} onChange={(event) => setBridgeMeta({ ...bridgeMeta, pairId: event.target.value })} /></label>
                <label><span>Visit ID</span><input value={bridgeMeta.visitId} onChange={(event) => setBridgeMeta({ ...bridgeMeta, visitId: event.target.value })} /></label>
                <label><span>Tablet ID</span><input value={bridgeMeta.deviceId} onChange={(event) => setBridgeMeta({ ...bridgeMeta, deviceId: event.target.value })} /></label>
                <label><span>Referensi</span><input value={bridgeMeta.referenceDevice} disabled /></label>
                <label><span>Metode akuisisi</span><input value="Aliran browser simultan" disabled /></label>
                <label><span>Urutan</span><input value="Simultan" disabled /></label>
                <label><span>Lebar layar (mm)</span><input type="number" min="50" value={bridgeMeta.screenWidthMm} onChange={(event) => setBridgeMeta({ ...bridgeMeta, screenWidthMm: Number(event.target.value) })} /></label>
                <label><span>Tinggi layar (mm)</span><input type="number" min="50" value={bridgeMeta.screenHeightMm} onChange={(event) => setBridgeMeta({ ...bridgeMeta, screenHeightMm: Number(event.target.value) })} /></label>
                <label><span>Jarak mata–layar (mm)</span><input type="number" min="200" value={bridgeMeta.viewingDistanceMm} onChange={(event) => setBridgeMeta({ ...bridgeMeta, viewingDistanceMm: Number(event.target.value) })} /></label>
              </div>
            </div>}
            <label className="checkRow">
              <input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} />
              <span><strong>{isEngineeringStudy ? "Persetujuan peserta diberikan." : "Persetujuan layanan diberikan."}</strong> {isGateB ? "Peserta menyetujui perekaman dua aliran gaze browser dan dapat menghentikan studi kapan saja." : isGateA ? "Peserta memahami bahwa sesi hanya mengaudit perangkat dan dapat dihentikan kapan saja." : "Pengasuh memahami bahwa Neurogaze bukan diagnosis dan persetujuan dapat ditarik."}</span>
            </label>
            <label className="checkRow optional">
              <input type="checkbox" checked={researchConsent} onChange={(event) => setResearchConsent(event.target.checked)} />
              <span><strong>{isGateB ? "Wajib untuk Gate B:" : "Opsional:"}</strong> {isGateB ? "izinkan ekspor koordinat gaze bersih bertimestamp. Video dan landmark wajah tetap tidak disimpan." : "tandai log teknis pseudonim sebagai layak dipakai untuk riset. Log hanya berada di memori sampai operator mengunduhnya."}</span>
            </label>
            <div className="cardActions">
              <button className="secondary" onClick={() => { if (isAdminCapture) window.location.href = "/admin"; else goHome(); }}>Batal</button>
              <button className="primary" disabled={!consented || (isGateB && !researchConsent) || !profile.childId.trim() || (isGateB && (!bridgeMeta.pairId.trim() || !bridgeMeta.visitId.trim() || !bridgeMeta.deviceId.trim() || !bridgeMeta.referenceDevice.trim() || bridgeMeta.screenWidthMm < 50 || bridgeMeta.screenHeightMm < 50 || bridgeMeta.viewingDistanceMm < 200)) || (!isEngineeringStudy && (Number(profile.age) < 16 || Number(profile.age) > 30))} onClick={beginAuditedSession}>{isEngineeringStudy ? "Lanjut periksa perangkat" : "Lanjut persiapan anak"} <IconArrowRight size={16} /></button>
            </div>
          </div>
        </section>
      )}

      {stage === "preparation" && (
        <section className="workspace childPrepPage">
          <div className="sectionHeading">
            <span className="eyebrow">Persiapan anak</span>
            <h1>Buat anak nyaman sebelum mulai.</h1>
            <p>Tidak perlu meminta anak menatap titik atau memberi jawaban tertentu.</p>
          </div>
          <div className="prepCard">
            <div className="prepIllustration" aria-hidden="true"><span><IconChild size={42} /></span><i><IconCamera size={24} /></i></div>
            <ol>
              <li><IconCheck size={16} /><span><strong>Dudukkan anak dengan nyaman</strong><small>Boleh di pangkuan orang tua selama wajah tetap terlihat.</small></span></li>
              <li><IconCheck size={16} /><span><strong>Letakkan tablet sejajar wajah</strong><small>Gunakan penyangga agar layar tidak banyak bergerak.</small></span></li>
              <li><IconCheck size={16} /><span><strong>Biarkan respons berlangsung alami</strong><small>Jangan menunjuk, menyebut warna, atau mengarahkan pandangan.</small></span></li>
              <li><IconCheck size={16} /><span><strong>Berhenti bila anak tidak nyaman</strong><small>Tes dapat diulang di lain waktu.</small></span></li>
            </ol>
          </div>
          <div className="cardActions"><button className="primary" onClick={() => setStage("tutorial")}>Lihat tutorial singkat <IconArrowRight size={16} /></button></div>
        </section>
      )}

      {stage === "tutorial" && (
        <section className="workspace tutorialPage">
          <div className="sectionHeading"><span className="eyebrow">Panduan · 24 detik</span><h1>Siapkan anak dengan tenang.</h1><p>Panduan ini untuk pendamping. Anak cukup duduk nyaman.</p></div>
          <GuideFilm onComplete={() => setStage("device")} />
        </section>
      )}

      {stage === "device" && (
        <section className="workspace">
          <div className="sectionHeading">
            <span className="eyebrow">Pemeriksaan kamera dan posisi</span>
            <h1>{mode === "replay" ? "Siapkan demo tanpa kamera." : "Posisikan wajah di dalam kotak."}</h1>
            <p>{mode === "replay" ? "Replay memakai data contoh untuk memperlihatkan alur lengkap." : "Sejajarkan tablet dengan wajah anak. Sistem akan memberi petunjuk sederhana bila posisi belum pas."}</p>
          </div>
          <div className="deviceGrid">
            <div className="cameraPanel">
              {mode === "live" ? (
                <><video ref={previewVideoRef} muted playsInline aria-label="Pratinjau kamera depan" /><TrackingOverlay snapshot={tracking} /></>
              ) : (
                <div className="replayVisual"><span><IconPlay size={11} /> REPLAY</span><i /><i /><i /></div>
              )}
              <span className={`cameraStatus ${deviceStatus}`}><i aria-hidden="true" />{deviceStatus === "passed" ? "Siap" : deviceStatus === "failed" ? "Perlu diperbaiki" : deviceStatus === "checking" ? "Memeriksa" : "Menunggu"}</span>
            </div>
            <div className="checkPanel">
              <div className="checkIntro"><span><IconGauge size={18} /></span><div><strong>Selesaikan yang ditandai merah</strong><small>Sistem akan mengecek ulang setelah posisi diperbaiki.</small></div></div>
              <div className="readinessList">
                <div data-state={deviceDiagnostics ? (deviceDiagnostics.detections >= 9 ? "good" : "bad") : "idle"}><IconEye size={17} /><span><strong>Wajah terlihat</strong><small>{deviceDiagnostics ? "Wajah terdeteksi tanpa menampilkan koordinat mata" : "Belum diperiksa"}</small></span><b>{deviceDiagnostics ? (deviceDiagnostics.detections >= 9 ? "Terlihat" : "Atur posisi") : "—"}</b></div>
                <div data-state={deviceDiagnostics ? (deviceDiagnostics.brightness >= 0.22 && deviceDiagnostics.brightness <= 0.92 ? "good" : "bad") : "idle"}><IconBrightness size={17} /><span><strong>Pencahayaan cukup</strong><small>Hindari cahaya kuat dari belakang</small></span><b>{deviceDiagnostics ? (deviceDiagnostics.brightness >= 0.22 && deviceDiagnostics.brightness <= 0.92 ? "Cukup" : "Perbaiki cahaya") : "—"}</b></div>
                <div data-state={deviceDiagnostics ? (deviceDiagnostics.faceCoverage >= 0.08 && deviceDiagnostics.faceCoverage <= 0.6 ? "good" : "bad") : "idle"}><IconOrientation size={17} /><span><strong>Posisi sudah pas</strong><small>Geser tablet lebih dekat atau jauh bila diminta</small></span><b>{deviceDiagnostics ? (deviceDiagnostics.faceCoverage < 0.08 ? "Lebih dekat" : deviceDiagnostics.faceCoverage > 0.6 ? "Lebih jauh" : "Sudah pas") : "—"}</b></div>
                <div data-state={deviceDiagnostics ? (deviceDiagnostics.detections >= 9 ? "good" : "bad") : "idle"}><IconChild size={17} /><span><strong>Anak menghadap layar</strong><small>Pastikan wajah tidak tertutup</small></span><b>{deviceDiagnostics ? (deviceDiagnostics.detections >= 9 ? "Siap" : "Arahkan ke layar") : "—"}</b></div>
              </div>
              <div className={`deviceMessage ${deviceStatus}`} role="status" aria-live="polite">
                {deviceStatus === "passed" ? <IconCheck size={16} /> : deviceStatus === "failed" ? <IconAlert size={16} /> : <IconInfo size={16} />}
                <span>{deviceMessage}</span>
              </div>
              <button className="primary wide" disabled={busy || (mode === "replay" && !model)} onClick={inspectDevice}>{busy ? <><span className="spinner" aria-hidden="true" /> Memeriksa…</> : <><IconGauge size={16} /> Jalankan pemeriksaan</>}</button>
              <button className="secondary wide" disabled={deviceStatus !== "passed"} onClick={() => setStage("calibration")}>Mulai kalibrasi <IconArrowRight size={16} /></button>
              <details className="technicalDetails">
                <summary>Detail teknis untuk operator</summary>
                <dl>
                  <div><dt>Mode</dt><dd>{mode === "live" ? (isGateB ? "Gate B berpasangan · tanpa skor" : isGateA ? "Gate A dewasa · tanpa skor" : "Riset kamera · tanpa skor") : "Simulasi tetap"}</dd></div>
                  <div><dt>Lokalisasi wajah/iris</dt><dd>MediaPipe Face Landmarker · 478 landmark · CPU lokal</dd></div>
                  <div><dt>Validasi iris</dt><dd>indeks pusat 468/473 · di dalam mata · konsisten binokular</dd></div>
                  <div><dt>Overlay kamera</dt><dd>crop `cover` + mirror dikoreksi terhadap resolusi asli</dd></div>
                  <div><dt>Model replay</dt><dd>{model ? model.model_version : modelError || "Memuat…"}</dd></div>
                  <div><dt>Klasifikasi langsung</dt><dd>dinonaktifkan; model lama hanya digunakan untuk replay</dd></div>
                  {deviceDiagnostics && <><div><dt>Kamera</dt><dd>{deviceDiagnostics.width}×{deviceDiagnostics.height} · {Math.round(deviceDiagnostics.frameRate)} fps</dd></div><div><dt>Cakupan wajah</dt><dd>{Math.round(deviceDiagnostics.faceCoverage * 100)}%</dd></div></>}
                </dl>
              </details>
            </div>
          </div>
        </section>
      )}

      {stage === "calibration" && (
        <section className="workspace calibrationPage" data-busy={busy ? "true" : "false"}>
          <div className="calibrationHud">
            <div className="calibrationHudBrand"><LogoMark size={25} /><span><small>Langkah 3 dari 6</small><strong>Kalibrasi layar penuh</strong></span></div>
            {busy && calibrationProgress ? <div className={`sampleProgress ${calibrationProgress.stable ? "stable" : ""}`} style={{ "--sample-progress": Math.min(1, calibrationProgress.accepted / CALIBRATION_STABLE_FRAMES) } as CSSProperties}><span><i /></span><div><strong>{calibrationProgress.target === activeTargets.length ? "Pengecekan terakhir" : `Posisi ${calibrationProgress.target + 1} dari ${activeTargets.length}`}</strong><small>{calibrationProgress.stable ? "Sudah terbaca" : "Tunggu sebentar"}</small></div></div> : <span className="calibrationHudHint"><IconEye size={14} /> Anak cukup melihat gambar</span>}
            <button className="calibrationExit" disabled={busy} onClick={() => { void leaveMeasurementFullscreen(); setStage("device"); }}><IconArrowLeft size={15} /> Keluar</button>
          </div>
          <div className="calibrationBoard">
            {activeTargets.map(([x, y], index) => (
              <span key={`${x}-${y}`} className={`calibrationDot ${useTechnicalCalibration ? "technicalTarget" : "childTarget"} ${calibrationTarget === index ? "active" : calibrationTarget !== null && index < calibrationTarget ? "done" : ""}`} style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>{calibrationTarget === index ? <i /> : useTechnicalCalibration ? index + 1 : <IconChild size={20} />}</span>
            ))}
            {calibrationTarget === activeTargets.length && <span className={`calibrationDot calibrationValidationDot active ${useTechnicalCalibration ? "technicalTarget" : "childTarget"}`} style={{ left: "50%", top: "50%" }}><i /></span>}
            {calibrationTarget === null && !calibration && !busy && <div className="calibrationSetup">
              {mode === "live" && <div className="calibrationSetupPreview"><video ref={calibrationVideoRef} muted playsInline aria-label="Pratinjau mata sebelum kalibrasi" /><TrackingOverlay snapshot={tracking} compact /></div>}
              <div className="calibrationSetupCopy">
                <span className="eyebrow">Kalibrasi ramah anak</span>
                <h1>{useTechnicalCalibration ? "Kalibrasi teknis untuk pengujian." : "Ayo lihat gambar-gambar lucu!"}</h1>
                <p>{useTechnicalCalibration ? "Mode sembilan titik ini hanya tersedia untuk developer dan studi engineering." : "Tidak perlu menyentuh layar. Cukup biarkan anak menonton."}</p>
                <div className="calibrationBriefGrid">
                  <article><span><IconCalibrationGrid size={17} /></span><div><strong>Apa yang terjadi?</strong><small>{useTechnicalCalibration ? "Sembilan titik muncul untuk pengujian teknis." : "Satu karakter muncul otomatis di lima posisi."}</small></div></article>
                  <article><span><IconEye size={17} /></span><div><strong>Apa tugas anak?</strong><small>Cukup menonton. Jangan menunjuk atau meminta anak melihat ke arah tertentu.</small></div></article>
                  <article><span><IconGauge size={17} /></span><div><strong>Kapan selesai?</strong><small>Sistem berpindah otomatis setelah pandangan cukup terbaca.</small></div></article>
                </div>
                <div className="calibrationTruth"><IconInfo size={16} /><span>{isEngineeringStudy ? <><strong>{isGateB ? "Ini perekaman agreement Gate B terhadap WebGazer." : "Ini hanya untuk peserta dewasa Gate A."}</strong> Kalibrasi 9 titik belum tervalidasi untuk anak 16–30 bulan dan tidak boleh dipakai pada anak sebelum protokol pasif serta persetujuan etik tersedia.</> : <><strong>Ini simulasi dengan hasil yang selalu sama.</strong> Hasilnya tidak mengukur kemampuan perangkat atau peserta nyata.</>}</span></div>
                {mode === "live" && <div className={`calibrationLiveState ${tracking?.accepted ? "good" : "bad"}`}><i /><span><strong>{trackingCopy(tracking).title}</strong><small>{tracking?.accepted ? "Bila berkacamata, hindari pantulan jendela atau lampu tepat di depan lensa." : trackingCopy(tracking).detail}</small></span></div>}
                <button className="primary amber" onClick={beginCalibration}><IconCalibrationGrid size={16} /> Mulai {useTechnicalCalibration ? "9 titik teknis" : "5 gambar"}</button>
              </div>
            </div>}
            {calibrationTarget === TARGETS.length && <div className="validationLabel"><IconEye size={13} /> KOREKSI DRIFT · TATAP TENGAH</div>}
            {calibration && <div className={`calibrationResult ${calibration.errorDeg <= calibrationLimitDeg ? "passed" : "failed"}`}><strong>{calibration.errorDeg <= calibrationLimitDeg ? "Siap digunakan" : "Belum terbaca"}</strong><span>{calibration.errorDeg <= calibrationLimitDeg ? "Kalibrasi cukup untuk dilanjutkan" : "Mari coba lagi"}</span></div>}
          </div>
          <div className={`calibrationOutcome ${calibrationMessage ? "visible" : ""}`}>
          {calibrationMessage && !calibrationFailed && <p className="calibrationMessage passed" role="status" aria-live="polite"><IconCheck size={17} /> {calibrationMessage}</p>}
          {calibrationFailed && <div className="recoveryCard" role="alert"><span><IconAlert size={20} /></span><div><small>{calibrationAttempts >= 2 ? "Batas percobaan tercapai" : "Kenapa belum berhasil"}</small><strong>{recovery.title}</strong><p>{calibrationAttempts >= 2 ? "Hentikan pengulangan. Unduh log lalu lanjutkan hanya sebagai uji sinyal yang hasilnya otomatis ditahan." : recovery.action}</p></div>{calibrationAttempts < 2 && <button className="secondary" disabled={busy} onClick={beginCalibration}><IconRefresh size={15} /> Ulangi sekali</button>}</div>}
          {calibration?.diagnostics && (
            <details className="calibrationTechnical">
              <summary>Detail teknis kalibrasi</summary>
              <div className="calibrationDiagnostics" aria-label="Diagnostik kalibrasi">
              <Metric index={0} icon={IconCalibrationGrid} label="Cakupan titik" value={`${calibration.diagnostics.trainingTargets}/9`} status={calibration.diagnostics.trainingTargets === 9 ? "good" : "bad"} />
              <Metric index={1} icon={IconSamples} label="Sampel grid/pusat" value={`${calibration.diagnostics.trainingSamples}/${calibration.diagnostics.validationSamples}`} />
              <Metric index={2} icon={IconCoverage} label="Rentang sinyal X/Y" value={`${calibration.diagnostics.signalRangeU.toFixed(3)} / ${calibration.diagnostics.signalRangeV.toFixed(3)}`} />
              <Metric index={3} icon={IconGauge} label="RMSE training" value={`${calibration.diagnostics.trainingRmseDeg.toFixed(1)}°`} status={calibration.diagnostics.trainingRmseDeg <= 5 ? "good" : "bad"} />
              <Metric index={4} icon={IconGauge} label={`Median galat grid · batas ${calibrationLimitDeg}°`} value={`${calibration.diagnostics.gridMedianErrorDeg.toFixed(1)}°`} status={calibration.diagnostics.gridMedianErrorDeg <= calibrationLimitDeg ? "good" : "bad"} />
              <Metric index={5} icon={IconEye} label="Drift pusat dikoreksi" value={`${calibration.diagnostics.centerDriftDeg.toFixed(1)}°`} status={calibration.diagnostics.centerDriftDeg <= 5 ? "good" : undefined} />
              </div>
            </details>
          )}
          <div className="calibrationActions">
            <button className="secondary" onClick={() => { void leaveMeasurementFullscreen(); setStage("device"); }}><IconArrowLeft size={15} /> Kembali</button>
            {auditLog && <button className="secondary" onClick={downloadCurrentAudit}><IconDownload size={15} /> Unduh log analisis</button>}
            {calibration && calibrationAttempts < 2 && <button className="primary amber" disabled={busy} onClick={beginCalibration}><IconRefresh size={16} /> Ulangi sekali</button>}
            {calibrationAttempts >= 2 && calibrationFailed && <button className="secondary" onClick={goHome}>Akhiri tes</button>}
            <button className="primary dark" disabled={!calibration || calibration.errorDeg > calibrationLimitDeg} onClick={() => setStage("sanity")}>Periksa arah pandangan <IconArrowRight size={16} /></button>
          </div>
          </div>
        </section>
      )}

      {stage === "sanity" && (
        <section className="workspace sanityPage">
          <div className="sectionHeading">
            <span className="eyebrow">Pengecekan singkat setelah kalibrasi</span>
            <h1>{sanityPassed === false ? (sanityAttempts >= 2 ? "Tes belum dapat dilanjutkan" : "Arah pandangan belum terbaca") : "Mari lihat satu gambar lagi."}</h1>
            <p>{sanityPassed === false ? (sanityAttempts >= 2 ? "Sistem belum dapat membaca arah pandangan dengan cukup baik. Hasil tidak akan dibuat agar tidak menyesatkan." : "Kamera dapat melihat mata, tetapi belum dapat menentukan bagian layar yang sedang dilihat.") : "Karakter akan muncul di kiri, tengah, lalu kanan. Anak cukup menonton seperti biasa."}</p>
          </div>
          <div className={`sanityStage ${sanityPassed === true ? "passed" : sanityPassed === false ? "failed" : ""}`}>
            {sanityTarget ? <span className={`sanityCharacter ${sanityTarget}`} aria-label={`Karakter di ${sanityTarget === "left" ? "kiri" : sanityTarget === "right" ? "kanan" : "tengah"}`}><IconChild size={34} /></span> : <span className="sanityPlaceholder"><IconEye size={34} /><strong>{sanityPassed === true ? "Arah pandangan terbaca" : "Siap memeriksa tiga posisi"}</strong></span>}
          </div>
          {sanityPassed === false && <div className="falloutNotice" role="alert"><IconAlert size={20} /><div><strong>{sanityAttempts >= 2 ? "Hasil tidak akan dibuat" : "Mari perbaiki lalu coba lagi"}</strong><p>Pastikan wajah lurus, kamera sejajar mata, dan tidak ada pantulan kuat pada kacamata. Ini bukan hasil risiko anak.</p></div></div>}
          <div className="cardActions">
            {sanityPassed !== true && sanityAttempts < 2 && <button className="primary" disabled={busy} onClick={sanityPassed === false ? () => setStage("calibration") : runSanityCheck}>{busy ? "Memeriksa…" : sanityPassed === false ? "Ulangi kalibrasi" : "Mulai pengecekan"}</button>}
            {sanityPassed === false && sanityAttempts >= 2 && <><button className="secondary" onClick={() => setStage("device")}>Kembali ke pemeriksaan posisi</button><button className="primary" onClick={holdAfterSanityFailure}>Akhiri tes</button></>}
            {sanityPassed === true && <button className="primary" onClick={() => setStage("stimulus")}>Lanjut ke stimulus <IconArrowRight size={16} /></button>}
          </div>
        </section>
      )}

      {stage === "quality" && quality && (
        <section className="workspace">
          <div className="sectionHeading">
            <span className="eyebrow">Pemeriksaan kualitas</span>
            <h1>{quality.passed ? "Rekaman selesai diperiksa." : validity?.outcome === "RETRY_STAGE" ? "Satu bagian perlu diulang." : "Tes belum dapat dinilai."}</h1>
            <p>{quality.passed ? "Rekaman cukup baik untuk melanjutkan ke laporan." : validity?.userMessage ?? "Kami belum mendapatkan rekaman yang cukup baik untuk memberikan hasil."}</p>
          </div>
          <div className="qualitySimpleGrid" aria-label="Ringkasan kualitas sesi">
            <article><IconEye size={20} /><span><strong>Wajah</strong><small>{quality.faceRate >= 0.85 ? "Terbaca dengan baik" : "Perlu diulang"}</small></span></article>
            <article><IconCalibrationGrid size={20} /><span><strong>Arah pandangan</strong><small>{validity?.primaryReasonCode === "CENTER_LOCK" || validity?.primaryReasonCode === "DIRECTION_REVERSED" ? "Belum terbaca" : "Sudah diperiksa"}</small></span></article>
            <article><IconJointAttention size={20} /><span><strong>Bagian tes</strong><small>{validity?.outcome === "RETRY_STAGE" ? "Satu bagian perlu diulang" : quality.passed ? "Cukup lengkap" : "Belum cukup"}</small></span></article>
          </div>
          <details className="technicalDetails qualityTechnical">
            <summary>Detail teknis untuk petugas</summary>
            <div className="qualityGrid">
            <Metric index={0} icon={IconEye} label="Wajah/mata terdeteksi" value={`${(quality.faceRate * 100).toFixed(0)}%`} status={quality.faceRate >= 0.85 ? "good" : "bad"} />
            <Metric index={1} icon={IconSignalHeld} label="Sampel tatapan hilang" value={`${(quality.gazeDropout * 100).toFixed(0)}%`} status={quality.gazeDropout <= 0.2 ? "good" : "bad"} />
            <Metric index={2} icon={IconCalibrationGrid} label={`Galat kalibrasi · batas ${quality.calibrationLimitDeg ?? 5}°`} value={`${quality.calibrationErrorDeg.toFixed(1)}°`} status={quality.calibrationErrorDeg <= (quality.calibrationLimitDeg ?? 5) ? "good" : "bad"} />
            <Metric index={3} icon={IconBrightness} label="Pencahayaan" value={`${Math.round(quality.brightness * 100)}%`} status={quality.brightness >= 0.22 && quality.brightness <= 0.92 ? "good" : "bad"} />
            <Metric index={4} icon={IconSamples} label="Sampel scanpath" value={String(points.length)} status={points.length >= 100 ? "good" : "bad"} />
            {gazeDiagnostics && <Metric index={5} icon={IconRoute} label="Segmen/gap terpanjang" value={`${gazeDiagnostics.segments} / ${Math.round(gazeDiagnostics.longestGapMs)} ms`} status={gazeDiagnostics.longestGapMs <= 180 ? "good" : "neutral"} />}
            <Metric index={6} icon={IconCoverage} label="Cakupan fitur" value={oodAssessment ? `${Math.round(oodAssessment.coverage * 100)}%` : "referensi belum ada"} status={oodAssessment ? (oodAssessment.coverage === 1 ? "good" : "bad") : "neutral"} />
            <Metric index={7} icon={IconShieldCheck} label={mode === "live" ? "Kecocokan referensi lama" : "Kesesuaian fitur"} value={oodAssessment ? (oodAssessment.passed ? "dalam referensi" : `${oodAssessment.flaggedFeatures.length} fitur berbeda`) : "tidak dinilai"} status={mode === "live" ? "neutral" : oodAssessment ? (oodAssessment.passed ? "good" : "bad") : "neutral"} />
            <Metric index={8} icon={IconJointAttention} label="Cakupan fase stimulus" value={`${Math.round((cueSummary?.phaseCoverage ?? 0) * 100)}%`} status={cueSummary?.phaseCoverage === 1 ? "good" : "bad"} />
            <Metric index={9} icon={IconTimer} label="Ekstraksi + inferensi" value={latencyMs === null ? "—" : `${latencyMs.toFixed(1)} ms`} status={latencyMs !== null && latencyMs < 100 ? "good" : "neutral"} />
            </div>
          </details>
          <div className={`gateDecision ${quality.passed ? "passed" : "failed"}`}>
            <span aria-hidden="true">{quality.passed ? <IconCheck size={20} /> : <IconAlert size={20} />}</span>
            <div><strong>{quality.passed ? "Rekaman dapat digunakan" : validity?.outcome === "RETRY_STAGE" ? "Ulangi bagian yang terganggu" : "Hasil ditahan"}</strong><p>{quality.passed ? (mode === "live" && !isEngineeringStudy ? "Rekaman siap ditinjau sebagai observasi deskriptif tanpa arahan rujukan otomatis." : mode === "live" ? "Catatan teknis siap diaudit." : "Lanjutkan untuk melihat laporan demo.") : validity?.operatorAction ?? "Perbaiki posisi dan coba lagi."}</p></div>
          </div>
          <div className="cardActions">
            <button className="secondary" onClick={validity?.outcome === "RETRY_STAGE" ? () => { setProgress(0); setStage("stimulus"); } : restart}><IconRefresh size={15} /> {validity?.outcome === "RETRY_STAGE" ? "Ulangi bagian" : "Ulangi sesi"}</button>
            <button className="primary" onClick={() => setStage("report")}><IconReport size={16} /> {quality.passed ? "Buka laporan" : "Lihat laporan ditahan"}</button>
          </div>
        </section>
      )}

      {stage === "report" && quality && (
        <section className="workspace reportPage">
          <div className="reportHeader">
            <div>
              <span className="eyebrow">Laporan sesi · {profile.childId}</span>
              <h1>{isGateB ? (quality.passed ? "Rekaman tablet Gate B siap dibandingkan" : "Rekaman tablet Gate B ditahan") : isGateA ? (quality.passed ? "Sesi uji Gate A lulus" : "Sesi uji Gate A perlu diulang") : sessionOutcome.headline}</h1>
              <p>{isGateB ? `${bridgeMeta.pairId} · ${bridgeMeta.visitId}` : isGateA ? "Peserta dewasa · Gate A engineering" : `${profile.age} bulan`} · {profile.site} · {new Date().toLocaleString("id-ID")}</p>
            </div>
            <span className={`decisionBadge ${isEngineeringStudy ? "research" : sessionOutcome.emitsReferral ? "refer" : sessionOutcome.kind === "WITHHELD" ? "withheld" : "monitor"}`}>
              {isEngineeringStudy ? <IconResearch size={15} /> : sessionOutcome.emitsReferral ? <IconScanpathSpread size={15} /> : sessionOutcome.kind === "WITHHELD" ? <IconSignalHeld size={15} /> : <IconScanpathFocus size={15} />}
              {isEngineeringStudy ? (quality.passed ? "LULUS TEKNIS · TANPA SKOR" : "BELUM LULUS · TANPA SKOR") : sessionOutcome.emitsReferral ? "PERIKSA LANJUT" : sessionOutcome.kind === "WITHHELD" ? "REKAMAN DITAHAN" : "TERUKUR"}
            </span>
          </div>
          <div className="warning">
            <span aria-hidden="true"><IconAlert size={18} /></span>
            <p><strong>Bukan diagnosis ASD.</strong> {isEngineeringStudy ? "Sesi ini menguji perangkat, bukan perkembangan peserta." : "Gunakan bersama SDIDTK/M-CHAT dan penilaian tenaga kesehatan. Ambang rujukan mengikuti GeoPref (Wen dkk., 2022); indeks lain bersifat deskriptif dan belum punya ambang tervalidasi."}</p>
          </div>
          {!isEngineeringStudy && quality.passed ? (
            <div className="observationReport">
              {sessionOutcome.recordedSession && <p className="recordedBanner" role="status"><IconInfo size={15} /> Simulasi dengan hasil tetap untuk menguji alur. Indeks perilaku hanya terisi pada sesi kamera.</p>}
              <article className="observationLead">
                <span className="resultIcon" aria-hidden="true"><IconShieldCheck size={28} /></span>
                <div><small>Hasil pengukuran sesi ini</small><h2>{sessionOutcome.headline}</h2><p>{sessionOutcome.summaryLine}</p><span className="observationStatus"><IconCheck size={14} /> {geoprefResult ? `${geoprefResult.validSamples} sampel dalam area` : "Belum terukur"} <i /> <IconSignalHeld size={14} /> Bukan diagnosis</span></div>
              </article>
              <section className="observationMetrics" aria-label="Indeks perilaku sesi">
                <article><span><IconScanpathSpread size={19} /> Pola geometrik</span><strong>{geoprefResult?.percentGeometric == null ? "—" : <Ticker value={geoprefResult.percentGeometric * 100} format={(n) => `${Math.round(n)}%`} />}</strong><p>Ambang rujukan 69% (Wen dkk., 2022; n=1.863, spesifisitas 98%).</p></article>
                <article><span><IconJointAttention size={19} /> Isyarat diikuti</span><strong>{jointAttention ? `${jointAttention.trialsFollowed}/${jointAttention.trialsScored}` : "—"}</strong><p>{jointAttention?.pValue == null ? "Belum cukup percobaan." : `Uji tanda p = ${jointAttention.pValue.toFixed(3).replace(".", ",")}.`}</p></article>
                <article><span><IconEye size={19} /> Menghadap layar</span><strong>{phenotype.facingForward.proportion == null ? "—" : `${Math.round(phenotype.facingForward.proportion * 100)}%`}</strong><p>Padanan indeks ber-AUC 0,838 pada preseden tablet.</p></article>
                <article><span><IconRoute size={19} /> Gerak kepala</span><strong>{phenotype.headMovement.rangePerSecond == null ? "—" : phenotype.headMovement.rangePerSecond.toFixed(3).replace(".", ",")}</strong><p>Padanan indeks ber-AUC 0,864, tertinggi pada preseden.</p></article>
                <article><span><IconTimer size={19} /> Respons nama</span><strong>{phenotype.responseToName.proportion == null ? "—" : `${phenotype.responseToName.responses}/${phenotype.responseToName.callsDelivered}`}</strong><p>{phenotype.responseToName.medianLatencyMs == null ? "Belum terukur." : `Median ${Math.round(phenotype.responseToName.medianLatencyMs)} ms.`}</p></article>
                <article><span><IconGauge size={19} /> Laju kedip</span><strong>{phenotype.blinkSocial.blinksPerMinute == null ? "—" : `${phenotype.blinkSocial.blinksPerMinute.toFixed(1).replace(".", ",")}/mnt`}</strong><p>Saat adegan sosial.</p></article>
              </section>
              <section className="observationAnswer">
                <span className="observationQuestion"><IconInfo size={20} /></span>
                <div><small>Cara membaca hasil ini</small><h2>{sessionOutcome.emitsReferral ? "Kenapa hasil ini perlu ditindaklanjuti?" : "Kenapa hasil ini belum berarti aman?"}</h2><p>{sessionOutcome.emitsReferral ? "Preferensi kuat pada pola geometrik jarang muncul pada anak tanpa ASD: spesifisitasnya 98 persen pada 1.863 balita usia 12 sampai 49 bulan. Bawa hasil ini ke kader atau Puskesmas bersama SDIDTK." : "Ambang rujukan otomatis dirancang untuk memastikan hasil positif, bukan menyingkirkan ASD. Sensitivitasnya hanya 17 persen, jadi sebagian besar anak ASD tidak terdeteksi di sini. Indeks lain di atas adalah pengukuran deskriptif yang belum punya ambang tervalidasi; skrining perkembangan rutin tetap diperlukan."}</p></div>
              </section>
              <section className="decisionRules" aria-labelledby="decision-rules-heading">
                <div className="decisionRulesHead"><small>Cara membaca status</small><h2 id="decision-rules-heading">Kapan sistem memberi arahan?</h2></div>
                <div className="decisionRuleGrid">
                  <article className={sessionOutcome.kind === "WITHHELD" ? "current" : ""}><span className="ruleIcon withheld"><IconSignalHeld size={18} /></span><div><small>DATA KURANG</small><strong>Sesi ditahan</strong><p>Wajah sering hilang, kalibrasi gagal, atau bagian tes tidak lengkap. Tidak ada hasil yang dikeluarkan.</p></div></article>
                  <article className={sessionOutcome.kind === "MEASURED_NO_RULE_IN" || sessionOutcome.kind === "MEASURED_PROTOCOL_ABBREVIATED" ? "current" : ""}><span className="ruleIcon measured"><IconResearch size={18} /></span><div><small>DI BAWAH AMBANG</small><strong>Terukur, tanpa arahan rujukan</strong><p>Pola geometrik di bawah 69 persen. Bukan tanda aman: tes ini melewatkan sebagian besar anak ASD.</p></div></article>
                  <article className={sessionOutcome.emitsReferral ? "current" : ""}><span className="ruleIcon alert"><IconAlert size={18} /></span><div><small>DI ATAS AMBANG</small><strong>Disarankan pemeriksaan lanjutan</strong><p>Pola geometrik 69 persen ke atas. Spesifisitas 98 persen pada 1.863 balita usia 12 sampai 49 bulan.</p></div></article>
                </div>
              </section>
              {cueSummary && <details className="reportTechnical observationDetails"><summary>Lihat angka tiap adegan</summary><div className="cueRows">{STIMULUS_PHASES.filter((phase) => phase.target === "left" || phase.target === "right").map((phase) => { const response = cueSummary.targetResponse[phase.id]; const face = cueSummary.dwellShare[phase.id]?.face; return <div key={phase.id}><span>{phase.label}</span><strong>{response ? `${Math.round(response.probability * 100)}% pada target` : "tidak terbaca"}</strong><small>{face == null ? "wajah n/a" : `${Math.round(face * 100)}% pada wajah`}{response?.latencyMs == null ? "" : ` · respons awal ${Math.round(response.latencyMs)} ms`}</small></div>; })}</div><p>Persentase ini adalah porsi waktu tatapan, bukan probabilitas ASD dan bukan nilai benar/salah.</p></details>}
              <section className="resultNext"><span><IconRoute size={20} /></span><div><small>Langkah berikutnya</small><h2>Gunakan instrumen skrining perkembangan yang tervalidasi.</h2><p>Bila ada kekhawatiran, bawa ringkasan observasi ini bersama hasil SDIDTK atau M-CHAT-R/F kepada kader, Puskesmas, atau dokter anak. Keputusan pemeriksaan lanjutan berasal dari penilaian tersebut, bukan dari skor kamera ini.</p></div></section>
            </div>
          ) : mode === "live" && isEngineeringStudy ? (
            <div className="researchPanel">
              <span className={`stateArt ${quality.passed ? "passed" : "withheld"}`} aria-hidden="true">{quality.passed ? <IconCheck size={26} /> : <IconSignalHeld size={26} />}</span>
              <div>
                <span className="reportKicker">Kesimpulan sesi</span>
                <h2>{quality.passed ? "Kamera, kalibrasi, dan rekaman stimulus berhasil." : "Satu atau lebih pemeriksaan teknis belum berhasil."}</h2>
                <p>{quality.passed ? "Aplikasi berhasil merekam tatapan pada perangkat ini dan seluruh fase memiliki data yang cukup. Sesi ini lulus uji teknis, tetapi tidak menilai ASD atau perkembangan peserta." : quality.reasons.join(" ")}</p>
                <div className="reportOutcomeGrid">
                  <article><span><IconCamera size={16} /> Kamera</span><strong>{Math.round(quality.faceRate * 100)}% bingkai terbaca</strong><small>{deviceDiagnostics?.frameRate ? `${Math.round(deviceDiagnostics.frameRate)} fps · ` : ""}{quality.gazeDropout === 0 ? "tanpa sampel hilang" : `${Math.round(quality.gazeDropout * 100)}% sampel hilang`}</small></article>
                  <article><span><IconCalibrationGrid size={16} /> Kalibrasi</span><strong>{quality.calibrationErrorDeg.toFixed(1)}° · {quality.calibrationErrorDeg <= (quality.calibrationLimitDeg ?? 5) ? "lulus" : "belum lulus"}</strong><small>Batas sesi ≤{quality.calibrationLimitDeg ?? 5}°{calibration?.diagnostics?.validationErrorDeg != null ? ` · validasi ${calibration.diagnostics.validationErrorDeg.toFixed(1)}°` : ""}</small></article>
                  <article><span><IconJointAttention size={16} /> Stimulus</span><strong>{Math.round((cueSummary?.phaseCoverage ?? 0) * 100)}% fase tercakup</strong><small>{points.length} sampel · {cueSummary?.adequatePhaseCount ?? 0}/{cueSummary?.expectedPhaseCount ?? 0} fase terukur</small></article>
                </div>
                <div className="validationLadder" aria-label="Status gerbang validasi">
                  {isGateB ? <>
                    <article data-state={quality.passed ? "passed" : "failed"}><span>{quality.passed ? <IconCheck size={15} /> : <IconAlert size={15} />}</span><div><strong>Rekaman tablet · {quality.passed ? "siap" : "ditahan"}</strong><small>Ini hanya menilai kelayakan sinyal pasangan saat ini.</small></div></article>
                    <article data-state="pending"><span><IconTimer size={15} /></span><div><strong>Perbandingan pasangan · menunggu</strong><small>Gabungkan aliran Neurogaze dan WebGazer dalam analisis Gate B.</small></div></article>
                  </> : <>
                    <article data-state={quality.passed ? "passed" : "failed"}><span>{quality.passed ? <IconCheck size={15} /> : <IconAlert size={15} />}</span><div><strong>Gate A · {quality.passed ? "sesi memenuhi batas" : "belum memenuhi batas"}</strong><small>Engineering perangkat pada peserta dewasa.</small></div></article>
                    <article data-state="passed"><span><IconCheck size={15} /></span><div><strong>Gate B · lulus</strong><small>Agreement terhadap WebGazer.js memenuhi seluruh kriteria yang tercatat.</small></div></article>
                  </>}
                  <article data-state="locked"><span><IconShieldCheck size={15} /></span><div><strong>Gate C · terkunci</strong><small>Validasi prospektif balita baru dimulai setelah Gate B lulus dan etik tersedia.</small></div></article>
                </div>
                <div className="reportNextStep">
                  <span><IconRoute size={18} /></span>
                  <div><strong>Langkah berikutnya</strong><p>{isGateB ? "Simpan kedua aliran browser dengan pair ID, stimulus, AOI, dan origin waktu yang sama. Status studi ditentukan dari seluruh kohort, bukan satu pasangan." : "Unduh log JSON, ulangi Gate A pada perangkat fisik yang dituju, lalu bandingkan presisi, dropout, FPS, latensi, baterai, dan panas perangkat. Jangan aktifkan skor kamera dari hasil ini."}</p></div>
                </div>
                {cueSummary && <div className="cueReadout">
                  <div className="cueReadoutHead"><div><strong>Respons selama stimulus</strong><small>Deskriptif, bukan lulus/gagal</small></div><span>Tidak masuk skor</span></div>
                  <div className="cueRows">
                    {STIMULUS_PHASES.filter((phase) => phase.target === "left" || phase.target === "right").map((phase) => {
                      const response = cueSummary.targetResponse[phase.id];
                      return <div key={phase.id}><span>{phase.label}</span><strong>{response ? `${Math.round(response.probability * 100)}% target pasca-cue` : "tidak terbaca"}</strong><small>{response?.latencyMs == null ? "latensi n/a" : `${Math.round(response.latencyMs)} ms`}{response?.targetLift == null ? "" : ` · perubahan ${response.targetLift >= 0 ? "+" : ""}${Math.round(response.targetLift * 100)} poin`}</small></div>;
                    })}
                  </div>
                  <p>Persentase dan latensi dihitung setelah onset cue, terpisah dari lead-in netral. Ini bukan probabilitas ASD dan bukan nilai “benar”. Respons alami anak boleh berbeda; pada Gate A dewasa, bagian ini hanya mengecek apakah stimulus dan AOI dapat dipahami.</p>
                </div>}
                <details className="reportTechnical">
                  <summary>Detail teknis dan privasi</summary>
                  <dl>
                    <div><dt>Model Carette</dt><dd>{riskInterpretable ? (risk ?? 0).toFixed(2).replace(".", ",") : "ditolak OOD — tidak dipakai"}</dd></div>
                    <div><dt>Fitur di luar rentang</dt><dd>{oodAssessment?.flaggedFeatures.length ? oodAssessment.flaggedFeatures.slice(0, 3).join(", ") : "tidak ada"}</dd></div>
                    <div><dt>Coverage/OOD</dt><dd>{oodAssessment ? `${Math.round(oodAssessment.coverage * 100)}% / ${oodAssessment.passed ? "lulus" : "flag"}` : "tidak dinilai"}</dd></div>
                    <div><dt>Stimulus</dt><dd>{STIMULUS_VERSION}</dd></div>
                    <div><dt>Waktu proses</dt><dd>{latencyMs === null ? "n/a" : `${latencyMs.toFixed(1)} ms`}</dd></div>
                    <div><dt>AOI/fase</dt><dd>{AOI_VERSION} / {Object.keys(cueSummary?.occupancy ?? {}).length}</dd></div>
                    <div><dt>Baterai awal</dt><dd>{deviceDiagnostics?.batteryLevel == null ? "API tidak tersedia" : `${Math.round(deviceDiagnostics.batteryLevel * 100)}%`}</dd></div>
                    <div><dt>Thermal</dt><dd>API browser tidak tersedia</dd></div>
                    <div><dt>ID sesi</dt><dd>{auditLog?.sessionId.slice(0, 12) ?? "n/a"}</dd></div>
                    <div><dt>Video mentah/titik wajah</dt><dd>tidak disimpan</dd></div>
                  </dl>
                </details>
              </div>
            </div>
          ) : (
            <div className={`withheldPanel ${mode === "live" && !isEngineeringStudy && quality.passed ? "validCapture" : ""}`}>
              <span className={`stateArt ${mode === "live" && !isEngineeringStudy && quality.passed ? "passed" : "withheld"}`} aria-hidden="true">{mode === "live" && !isEngineeringStudy && quality.passed ? <IconCheck size={26} /> : <IconSignalHeld size={26} />}</span>
              {mode === "live" && !isEngineeringStudy && quality.passed ? <div><small>Model tidak tersedia</small><h2>Rekaman valid, tetapi estimasi tidak dapat dihitung</h2><p>Kamera, kalibrasi, dan seluruh fase stimulus berhasil direkam. Pemeriksaan kualitas lulus, tetapi model lokal atau format fitur tidak tersedia sehingga sistem menahan hasil.</p><div className="captureStatusGrid"><article><span>Pemeriksaan kualitas</span><strong>Lulus</strong><small>{Math.round(quality.faceRate * 100)}% wajah · {Math.round(quality.gazeDropout * 100)}% sampel hilang</small></article><article><span>Stimulus</span><strong>{cueSummary?.adequatePhaseCount ?? 0}/{cueSummary?.expectedPhaseCount ?? 0} fase</strong><small>{points.length} sampel valid</small></article><article><span>Estimasi</span><strong>Ditahan</strong><small>Periksa model lokal</small></article></div><div className="reportNextStep"><span><IconDownload size={18} /></span><div><strong>Langkah berikutnya</strong><p>Unduh catatan audit, lalu periksa aset model dan kecocokan format fitur sebelum mengulang sesi.</p></div></div><details className="reportTechnical"><summary>Ringkasan teknis sesi</summary><p><strong>Status:</strong> VALID · pemeriksaan kualitas lulus.</p><p><strong>Kalibrasi:</strong> {quality.calibrationErrorDeg.toFixed(2)}°.</p><p><strong>Model:</strong> {modelError ?? "inferensi tidak menghasilkan nilai"}.</p></details></div> : <div><small>Hasil ditahan</small><h2>Tes belum dapat dinilai</h2><p>{validity?.userMessage ?? "Kami belum mendapatkan rekaman tatapan yang cukup baik untuk memberikan hasil. Ini bukan hasil risiko anak."}</p><h3>Apa yang bisa dilakukan?</h3><ol><li>Pastikan wajah terlihat penuh dan tablet sejajar wajah.</li><li>Hindari pantulan cahaya pada kacamata.</li><li>Biarkan anak melihat layar tanpa diarahkan.</li><li>Ulangi tes saat anak lebih tenang.</li></ol>{validity?.primaryReasonCode && <details className="reportTechnical"><summary>Lihat detail untuk petugas</summary><p><strong>Masalah utama:</strong> {validity.userMessage}</p>{validity.invalidStages.length > 0 && <p><strong>Tahap:</strong> {validity.invalidStages.join(", ")}</p>}<p><strong>Saran:</strong> {validity.operatorAction}</p><code>reasonCode={validity.primaryReasonCode}</code></details>}</div>}
            </div>
          )}
          <div className="cardActions">
            <button className="secondary" onClick={() => { if (isAdminCapture) window.location.href = "/admin"; else goHome(); }}><IconCheck size={15} /> {isAdminCapture ? "Kembali ke konsol admin" : "Selesai"}</button>
            {auditLog && <button className="secondary" onClick={downloadCurrentAudit}><IconDownload size={15} /> Unduh log audit JSON</button>}
            {auditLog && <button className="textButton danger" onClick={deleteCurrentAudit}><IconTrash size={15} /> Hapus log dari memori</button>}
            <button className="primary" onClick={restart}><IconRefresh size={15} /> Ulangi sesi</button>
          </div>
        </section>
      )}
          </div>
        </div>
      )}

      {stage === "stimulus" && (
        <section className="stimulusPage">
          {!busy && <div className="stimulusHeader"><Logo /><span>{isEngineeringStudy ? "Uji peserta dewasa" : "Anak cukup menonton"} · siap</span>{mode === "live" && <span className={`stimulusTracking ${tracking?.accepted ? "good" : "bad"}`}><i />{trackingCopy(tracking).title}</span>}<button onClick={restart}><IconArrowLeft size={15} /> Kembali</button></div>}
          {busy && <div className="stimulusOperatorControls"><button onClick={() => { const next = !stimulusPausedRef.current; stimulusPausedRef.current = next; setStimulusPaused(next); recordAudit(next ? "stimulus.paused" : "stimulus.resumed"); }} aria-pressed={stimulusPaused}>{stimulusPaused ? <><IconPlay size={14} /> Lanjutkan</> : "Jeda"}</button><button onClick={restart} aria-label="Hentikan stimulus"><IconArrowLeft size={14} /> Hentikan</button></div>}
          <div className={`stimulusCanvas phase-${stimulusPhase?.id ?? "ready"}`} aria-label="Adegan perhatian bersama dengan wajah dan dua mainan">
            <StimulusScene visualCue={stimulusPhase?.visualCue ?? "attention"} cueActive={stimulusCueActive} ostensiveActive={stimulusOstensiveActive} paused={stimulusPaused} geoprefSource={geoprefAsset.path} geometricSide={geoprefLayout(profile.childId || "NG-0000").geometricSide} />
            {!busy && progress === 0 && <div className={`stimulusIntro ${isEngineeringStudy ? "gateA" : "child"}`}>
              <span className="stimulusAudience">{isEngineeringStudy ? `Peserta dewasa · ${isGateB ? "Gate B" : "Gate A"}` : "Instruksi untuk pengasuh"}</span>
              <strong>{isEngineeringStudy ? "Ikuti petunjuk sosial di layar." : "Tugas anak hanya menonton."}</strong>
              <p>{isEngineeringStudy ? "Amati wajah, lalu ikuti arah mata, kepala, atau tangan ke benda yang dituju. Tidak perlu mengklik." : "Posisikan anak dengan nyaman dan biarkan responsnya alami. Jangan menyebut sisi layar, warna, atau meminta anak melihat ke arah tertentu."}</p>
              <div className="stimulusSteps" aria-label="Ringkasan tugas">
                <span><b>1</b>{isEngineeringStudy ? "Lihat wajah" : "Duduk nyaman"}</span>
                <span><b>2</b>{isEngineeringStudy ? "Ikuti arah cue" : "Biarkan menonton"}</span>
                <span><b>3</b>{isEngineeringStudy ? "Tanpa klik" : "Tanpa mengarahkan"}</span>
              </div>
              <small>{isEngineeringStudy ? "Stimulus berlangsung sekitar satu menit (66 detik). Selama pengukuran, layar hanya menampilkan adegan; jaga kepala relatif diam dan tidak perlu mengklik." : "Stimulus berlangsung sekitar satu menit (66 detik) dengan satu gaya visual yang konsisten. Hentikan bila anak tidak nyaman."}</small>
              <button className="startStimulus" disabled={!calibration || sanityPassed !== true || (mode === "replay" && !model)} onClick={() => void runStimulus()}><IconPlay size={15} />{mode === "replay" ? "Saya paham · mulai demo" : isEngineeringStudy ? "Saya paham · mulai pengukuran" : "Mulai tes"}</button>
            </div>}
            </div>
          {!busy && <p className="stimulusNote">Setelah tombol mulai ditekan, semua petunjuk menghilang agar tidak ikut menarik tatapan.</p>}
        </section>
      )}
    </main>
  );
}
