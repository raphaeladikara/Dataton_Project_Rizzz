"use client";

/* eslint-disable react-hooks/purity -- Every site this rule flags here is a
   `performance.now()` or a setState inside an async event handler:
   runCalibration, runSanityCheck, runStimulus. None of them runs during render.
   The rule stayed quiet until this component shrank enough for the React
   Compiler to stop bailing out on it, so the warnings are newly visible rather
   than newly true. Re-enable and fix for real if these functions ever move out
   of the component body. */

import Link from "next/link";
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
import { CHILD_TARGETS, TECHNICAL_TARGETS as TARGETS } from "../src/capture/calibrationTargets";
import {
  CameraRequestTimeoutError,
  cameraErrorInfo,
  cleanupFailedCameraAcquisition,
} from "../src/capture/cameraError";
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
import { consentBlockers } from "../src/domain/consent";
import { createFrameTrace } from "../src/capture/frameTrace";
import { buildPhenotypeProfile, type PhenotypeProfile } from "../src/phenotype/profile";
import { activeGeoprefAsset } from "../src/geopref/stimulusMeta";
import { geoprefLayout, GEOPREF_AOI_VERSION, GEOPREF_VIDEO_ASPECT } from "../src/geopref/protocol";
import { scoreGeopref } from "../src/geopref/score";
import { resolveSessionOutcome } from "../src/outcome/sessionOutcome";
import { buildReferralRecommendation, REFERRAL_RULE_VERSION } from "../src/outcome/referralRecommendation";
import { reportBadge } from "../src/outcome/reportBadge";
import { buildPosteriorOdds } from "../src/outcome/posteriorOdds";
import { buildSessionVerdict } from "../src/outcome/sessionVerdict";
import { buildReportNotice, buildReportPresentation, type ReportSourceKind } from "../src/outcome/reportPresentation";
import { buildStageMirror } from "../src/ui/stageMirror";
import { CaregiverReport, PrintableReport } from "../src/outcome/reportComponents";
import { compositeLaneHeadline } from "../src/outcome/referralPresentation";
import {
  appendAuditEvent,
  createSessionAudit,
  downloadAuditLog,
  renewSessionIdentity,
  type AuditExportPurpose,
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
import {
  deriveOfflineReadiness,
  monitorOfflineReadiness,
  offlineReadinessCopy,
} from "../src/offline/readiness";
import type { GateBStudyMeta } from "../src/gateb/studyMeta";
import {
  MAX_POSITIVE_CONTROL_ATTEMPTS,
  positiveControlBlockers,
  stimulusIntroCopy,
  positiveControlFromSession,
  sessionNameCalls,
  type PositiveControlMeta,
} from "../src/positive/control";
import {
  loadRecordingManifest,
  orchestrateRegisteredReplay,
  type RecordedSession,
  type RecordingEntry,
} from "../src/replay/recording";
import { SCENARIOS, syntheticSessionPoints } from "../src/replay/scenarios";
import { geometryFeatures } from "../src/scanpath/features";
import {
  GEOPREF_PHASE_ID,
  NAME_CALL_OFFSETS_MS,
  NAME_CALL_PHASE_ID,
  phaseAtElapsed,
  scoredPhaseTargets,
  sessionStimulusPhases,
  STIMULUS_PHASES,
  stimulusSeconds,
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
import { CalibrationCharacter } from "../src/ui/calibration-character";
import { HeroDevice } from "../src/ui/hero-device";
import {
  COMPACT_NAV_MEDIA,
  compactNavigationTransition,
  focusNavigationDestination,
  type NavigationDestinationId,
} from "../src/ui/navigationFocus";
import { StimulusScene } from "../src/ui/stimulus-scene";
import {
  createMediaReadinessController,
  initialMediaReadiness,
  isMediaFailure,
  mediaFailure,
  type MediaReadiness,
  type MediaReadinessController,
  type MediaVisibilitySource,
  type MediaReadinessEvent,
  type MediaReadinessStatus,
} from "../src/ui/mediaReadiness";
import { CameraFramingArt, GuideScene, NaturalWatchingArt } from "../src/ui/scene-art";
import { LanguageToggle } from "../src/i18n/LanguageToggle";
import { decimal } from "../src/i18n/format";
import { phaseLabel } from "../src/i18n/phaseLabel";
import { useT, type Translate } from "../src/i18n/useT";
import type { MessageKey } from "../src/i18n/dictionary";
import type { Locale } from "../src/i18n/locale";

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
const EMPTY_PHENOTYPE = buildPhenotypeProfile({
  frames: [], nameCalls: [], socialPhases: SOCIAL_PHASE_IDS, nonsocialPhases: [GEOPREF_PHASE_ID],
});

const APP_VERSION = "3.0.0-child-flow";

/**
 * Where a session's identity fields start, per purpose.
 *
 * Field sessions start blank so an example can never be mistaken for the child
 * in front of the operator. Adult/demo purposes keep explicit fixture-like
 * defaults because they are controlled technical lanes, not service records.
 */
function defaultProfile(purpose: SessionPurpose) {
  const today = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  if (purpose === "gate_a_adult") return { childId: `GA-${today}-01`, age: "", site: "Pilot perangkat", operator: "Operator-01" };
  if (purpose === "gate_b_bridge") return { childId: `GB-${today}-P01`, age: "", site: "Lab validasi", operator: "Peneliti-01" };
  if (purpose === "stage_demo") return { childId: `PERAGA-${today}-01`, age: "", site: "Peragaan panggung", operator: "Penyaji-01" };
  if (purpose === "target_population_research") return { childId: "", age: "", site: "", operator: "" };
  return { childId: "NG-0042", age: "24", site: "Posyandu Melati 3", operator: "Kader-07" };
}
const pause = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Small counts spelled out, so report copy can be derived rather than retyped.
 * The referral explainer counts its own signals — the copy once said "empat
 * sinyal" for a while after the rule dropped to three — so the word has to
 * come from the number in whichever language is on screen.
 */
const NUMBER_WORDS: Record<Locale, readonly string[]> = {
  id: ["nol", "satu", "dua", "tiga", "empat", "lima", "enam"],
  en: ["zero", "one", "two", "three", "four", "five", "six"],
};
function numberWord(count: number, locale: Locale): string {
  return NUMBER_WORDS[locale][count] ?? String(count);
}
function numberWordCapitalized(count: number, locale: Locale): string {
  const word = numberWord(count, locale);
  return word.charAt(0).toUpperCase() + word.slice(1);
}

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

function trackingCopy(snapshot: TrackingSnapshot | null, t: Translate) {
  if (!snapshot) return { title: t("tracking.noFace"), detail: t("tracking.noFaceHint") };
  if (snapshot.reason === "blink") return { title: t("tracking.blink"), detail: t("tracking.blinkHint") };
  if (snapshot.reason === "pose") return { title: t("tracking.pose"), detail: t("tracking.poseHint") };
  if (snapshot.reason === "iris") return { title: t("tracking.iris"), detail: t("tracking.irisHint") };
  if (!snapshot.accepted) return { title: t("tracking.unclear"), detail: t("tracking.unclearHint") };
  return { title: t("tracking.ok"), detail: t("tracking.okHint") };
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

function calibrationRecovery(calibration: Calibration | null, message: string | null, t: Translate) {
  const diagnostics = calibration?.diagnostics;
  if (message?.includes("CALIBRATION_STABILITY")) {
    return { title: t("calibFix.stability"), action: t("calibFix.stabilityAction") };
  }
  if (message?.includes("CALIBRATION_RANGE_Y") || (diagnostics && diagnostics.signalRangeV < 0.004)) {
    return { title: t("calibFix.rangeY"), action: t("calibFix.rangeYAction") };
  }
  if (message?.includes("CALIBRATION_RANGE_X") || (diagnostics && diagnostics.signalRangeU < 0.008)) {
    return { title: t("calibFix.rangeX"), action: t("calibFix.rangeXAction") };
  }
  if (message?.includes("CALIBRATION_COVERAGE") || (diagnostics && diagnostics.trainingTargets < 9)) {
    return { title: t("calibFix.coverage"), action: t("calibFix.coverageAction") };
  }
  if (diagnostics && diagnostics.targetDiagnostics.some((target) => target.rejectedPose > target.accepted)) {
    return { title: t("calibFix.pose"), action: t("calibFix.poseAction") };
  }
  if (diagnostics && diagnostics.trainingRmseDeg > 5) {
    return { title: t("calibFix.rmse"), action: t("calibFix.rmseAction") };
  }
  return { title: t("calibFix.generic"), action: t("calibFix.genericAction") };
}

/**
 * The three states a composite signal can be in. Written out at three call
 * sites before — the verdict list, the referral list, and the printed table —
 * which is three chances for the wording to drift apart between languages.
 */
function signalStatusLabel(status: string, t: Translate): string {
  if (status === "menyimpang") return t("report.signalDeviant");
  if (status === "normal") return t("report.signalNormal");
  return t("report.signalUnassessable");
}

function TrackingOverlay({ snapshot, compact = false }: { snapshot: TrackingSnapshot | null; compact?: boolean }) {
  const { t } = useT();
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
  const copy = trackingCopy(snapshot, t);
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
/**
 * Holds message keys rather than copy. The steps and their order are structure
 * — the words for them are not — so the table stays a module constant and only
 * resolves against a language at render.
 */
const SESSION_FLOW = [
  { icon: IconPlay, label: "home.flow.tutorial", hint: "home.flow.tutorialHint", tone: "teal" },
  { icon: IconCamera, label: "home.flow.framing", hint: "home.flow.framingHint", tone: "teal" },
  { icon: IconCalibrationGrid, label: "home.flow.calibration", hint: "home.flow.calibrationHint", tone: "amber" },
  { icon: IconJointAttention, label: "home.flow.stimulus", hint: "home.flow.stimulusHint", tone: "teal" },
  { icon: IconReport, label: "home.flow.report", hint: "home.flow.reportHint", tone: "slate" },
] as const;

const SCENARIO_ICON = {
  refer: IconScanpathSpread,
  monitor: IconScanpathFocus,
  withheld: IconSignalHeld,
} as const;

/**
 * The scenario's own `title` is Indonesian and lives in the replay module,
 * where the tests read it. Keying the card off the stable `id` instead leaves
 * that module untouched and drops the `"Contoh: "` prefix strip, which was
 * only ever there to undo a label the demo did not want.
 */
const SCENARIO_COPY = {
  refer: { title: "guide.scenario.refer", hint: "guide.scenario.referHint" },
  monitor: { title: "guide.scenario.monitor", hint: "guide.scenario.monitorHint" },
  withheld: { title: "guide.scenario.withheld", hint: "guide.scenario.withheldHint" },
} as const;

/**
 * Counts a value up on mount. Reserved for the rare, high-value numbers
 * (risk score, quality readings) — never for anything a user sees repeatedly.
 */
/**
 * Counts up to a measurement, and lands on it even when nothing animates.
 *
 * It used to start at zero and rely on requestAnimationFrame to carry it to the
 * real number. Browsers do not run rAF in a hidden tab, so a report opened and
 * left in the background rendered every index as 0 and stayed there — and for
 * a figure like "0% waktu pada pola geometrik" that is not an obviously missing
 * value, it is a plausible one. The headline said 19% in the same view.
 *
 * The value is therefore correct from the first paint, and the animation is
 * something that happens to it rather than the only thing that produces it.
 */
function Ticker({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    // State already holds the value, so the two cases that cannot animate need
    // no write at all: they are already showing the right number.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || document.hidden) return;
    let frame = 0;
    const startedAt = performance.now();
    const settle = () => setShown(value);
    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt) / 620);
      // Matches --ease-out: fast first, settles gently. The first frame lands at
      // t ~ 0, which is where the count-up starts from.
      setShown(value * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    // Hiding the tab suspends the loop wherever it happens to be, so the number
    // is committed on the way out rather than frozen part-grown.
    document.addEventListener("visibilitychange", settle);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", settle);
    };
  }, [value]);

  return <>{format(shown)}</>;
}

const SESSION_STEPS = [
  { key: "consent", label: "rail.consent", hint: "rail.consentHint", icon: IconShieldCheck },
  { key: "preparation", label: "rail.preparation", hint: "rail.preparationHint", icon: IconChild },
  { key: "tutorial", label: "rail.tutorial", hint: "rail.tutorialHint", icon: IconPlay },
  { key: "device", label: "rail.device", hint: "rail.deviceHint", icon: IconCamera },
  { key: "calibration", label: "rail.calibration", hint: "rail.calibrationHint", icon: IconCalibrationGrid },
  { key: "sanity", label: "rail.sanity", hint: "rail.sanityHint", icon: IconEye },
  { key: "stimulus", label: "rail.stimulus", hint: "rail.stimulusHint", icon: IconJointAttention },
  { key: "quality", label: "rail.quality", hint: "rail.qualityHint", icon: IconGauge },
  { key: "report", label: "rail.report", hint: "rail.reportHint", icon: IconReport },
] as const satisfies readonly { key: Stage; label: MessageKey; hint: MessageKey; icon: (p: { size?: number }) => ReactElement }[];

/**
 * Step position, derived once.
 *
 * The rail said 09 / 09 while the fullscreen calibration screen said "Langkah 3
 * dari 6". Both now count the same nine steps.
 */
function sessionStepPosition(stage: Stage) {
  const index = Math.max(0, SESSION_STEPS.findIndex((step) => step.key === stage));
  return { index, number: index + 1, total: SESSION_STEPS.length, label: SESSION_STEPS[index].label };
}

/**
 * Session progress rail.
 *
 * Lives in the left column rather than as a sticky bar: a sticky header
 * overlapped the workspace content on scroll, and a vertical rail gives each
 * step room for an icon and a one-line hint.
 */
function Stepper({ stage }: { stage: Stage }) {
  const { t } = useT();
  const active = sessionStepPosition(stage).index;
  const current = SESSION_STEPS[active];
  const next = SESSION_STEPS[active + 1];

  return (
    <nav className="sessionRail" aria-label={t("chrome.sessionProgress")}>
      <div className="railHead" aria-live="polite" aria-atomic="true">
        <span className="railCounter">
          <strong key={`c${active}`}>{String(active + 1).padStart(2, "0")}</strong>
          <small>/ {String(SESSION_STEPS.length).padStart(2, "0")}</small>
        </span>
        <span className="railNow">
          <small>{t("rail.current")}</small>
          <strong key={`l${active}`}>{t(current.label)}</strong>
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
                <strong>{t(step.label)}</strong>
                <small>{t(step.hint)}</small>
              </span>
            </li>
          );
        })}
      </ol>

      <p className="railNext">{next ? t("rail.next", { label: t(next.label) }) : t("rail.last")}</p>
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
  { title: "film.frame1Title", body: "film.frame1Body", icon: IconChild, tag: "film.frame1Tag", visual: "seated" },
  { title: "film.frame2Title", body: "film.frame2Body", icon: IconCamera, tag: "film.frame2Tag", visual: "framed" },
  { title: "film.frame3Title", body: "film.frame3Body", icon: IconAlert, tag: "film.frame3Tag", visual: "no-pointing" },
  { title: "film.frame4Title", body: "film.frame4Body", icon: IconJointAttention, tag: "film.frame4Tag", visual: "character" },
  { title: "film.frame5Title", body: "film.frame5Body", icon: IconTimer, tag: "film.frame5Tag", visual: "pause" },
  { title: "film.frame6Title", body: "film.frame6Body", icon: IconCheck, tag: "film.frame6Tag", visual: "ready" },
] as const;

function GuideFilm({ onComplete }: { onComplete?: () => void } = {}) {
  const { t } = useT();
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
    <section className="guideFilm" aria-label={t("film.aria")}>
      <div className="guideFilmScreen">
        <div className="guideFilmTop"><Logo /><span>TUTORIAL · 00:{String((frame + 1) * 4).padStart(2, "0")}</span></div>
        <div key={current.tag} className={`guideFilmScene scene-${current.visual}`}>
          <GuideScene visual={current.visual} />
          <div className="guideFilmCopy">
            <span className="guideFilmIcon"><FrameIcon size={22} /></span>
            <small>{t(current.tag)}</small>
            <h2>{t(current.title)}</h2>
            <p aria-label={t("film.subtitleAria")}>{t(current.body)}</p>
          </div>
        </div>
        <div className="guideFilmTimeline">{GUIDE_FRAMES.map((item, index) => <button key={item.tag} className={index === frame ? "active" : ""} aria-label={t("film.chapterAria", { number: index + 1 })} onClick={() => { setFrame(index); setPlaying(false); }}><i /></button>)}</div>
      </div>
      <div className="guideFilmControls">
        <div><strong>{t("film.title")}</strong><span>{t("film.meta")}</span></div>
        <div className="tutorialButtons">
          <button className="secondary" aria-pressed={!muted} onClick={() => setMuted((value) => !value)}>{t(muted ? "film.soundOn" : "film.soundOff")}</button>
          <button className="secondary" onClick={() => setPlaying((value) => !value)}>{playing ? t("film.pause") : <><IconPlay size={13} /> {t("film.play")}</>}</button>
          <button className="secondary" onClick={() => { setFrame(0); setPlaying(true); }}>{t("film.replay")}</button>
        </div>
      </div>
      {onComplete && <div className="tutorialActions"><button className="textButton" onClick={onComplete}>{t("film.skip")}</button><button className="primary" onClick={onComplete}>{t("film.continue")} <IconArrowRight size={16} /></button></div>}
    </section>
  );
}

export default function Home({ initialPurpose }: { initialPurpose?: SessionPurpose } = {}) {
  const { t, locale, bcp47 } = useT();
  const isAdminCapture = initialPurpose === "gate_b_bridge";
  const [stage, setStage] = useState<Stage>(isAdminCapture ? "consent" : "home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const primaryNavigationRef = useRef<HTMLDivElement>(null);
  const mobileNavButtonRef = useRef<HTMLButtonElement>(null);
  const [mode, setMode] = useState<Mode>(isAdminCapture ? "live" : "replay");
  const [sessionPurpose, setSessionPurpose] = useState<SessionPurpose>(initialPurpose ?? "demo_replay");
  const [scenario, setScenario] = useState<ReplayScenario>(SCENARIOS[0]);
  // Registered demonstrations require a real recording. Null remains reserved
  // for the three explicitly synthetic preview scenarios and is never a demo
  // fallback.
  const [recording, setRecording] = useState<RecordedSession | null>(null);
  const recordingRef = useRef<RecordedSession | null>(null);
  /**
   * What the replay manifest lists, so the demo can name the condition it is
   * about to play instead of silently taking whichever file happens to be
   * first. Two recordings that differ only by filename read as interchangeable,
   * and one of them is a person producing the pattern on instruction.
   */
  const [recordingEntries, setRecordingEntries] = useState<RecordingEntry[]>([]);
  const [demoReplayError, setDemoReplayError] = useState<string | null>(null);
  const [demoRun, setDemoRun] = useState<"idle" | "calibrating" | "measuring" | "done">("idle");
  /**
   * Stage demonstration of the full rule-in report. Reachable only from replay
   * or the `stage_demo` purpose, so a session with a child in front of the
   * tablet cannot enter it, and the outcome it produces has emitsReferral
   * hard-coded to false.
   */
  const [demonstrationMode, setDemonstrationMode] = useState(false);
  /**
   * Positive control (docs/kontrol_positif.md). Adult participants produce the
   * three decision patterns on purpose. Null on every other session, including
   * plain Gate A device testing.
   */
  const [positiveControl, setPositiveControl] = useState<PositiveControlMeta | null>(null);
  /** Measured once per rig with a tape measure, then typed in. */
  const [viewingDistanceMm, setViewingDistanceMm] = useState(500);
  /** Mirrors callNameRef so the consent gate can see it; the name itself stays in the ref. */
  const [callNamePresent, setCallNamePresent] = useState(false);
  /**
   * Whether the tablet calls the child by name at all.
   *
   * It used to be inferred from whether the field had text in it, which gave
   * the operator no way to say "I will call the child myself" other than
   * leaving a box mysteriously blank. Declared instead: unchecking clears the
   * name, and the report records that the calls were not delivered rather than
   * that the child did not respond.
   */
  const [callNameEnabled, setCallNameEnabled] = useState(false);
  const [model, setModel] = useState<ModelExport | null>(null);
  const [modelError, setModelError] = useState<MessageKey | null>(null);
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
  const [deviceMessage, setDeviceMessage] = useState<MessageKey>("device.msgUnchecked");
  const [deviceDiagnostics, setDeviceDiagnostics] = useState<DeviceDiagnostics | null>(null);
  const [calibration, setCalibration] = useState<Calibration | null>(null);
  const [calibrationTarget, setCalibrationTarget] = useState<number | null>(null);
  /**
   * The calibration strip carries two different things under one name.
   *
   * On success it is a status sentence a reader reads, which has to follow the
   * language toggle. On failure it is the raw thrown message, which nobody
   * reads — `calibrationRecovery` parses its CALIBRATION_* code and prints
   * translated advice instead. Keeping them apart is what lets the first be a
   * key and the second stay verbatim.
   */
  const [calibrationNote, setCalibrationNote] = useState<
    { kind: "status"; key: MessageKey; label?: string } | { kind: "error"; message: string } | null
  >(null);
  const [progress, setProgress] = useState(0);
  const [points, setPoints] = useState<Point[]>([]);
  const [phenotype, setPhenotype] = useState<PhenotypeProfile>(() => EMPTY_PHENOTYPE);
  const [riskInterpretable, setRiskInterpretable] = useState(false);
  // Captured when the stimulus starts, not at render time: a later resize must
  // not move the AOIs away from where the child was actually looking.
  const [stageAspect, setStageAspect] = useState(GEOPREF_VIDEO_ASPECT);
  /**
   * The id every counterbalanced choice in this recording derives from.
   *
   * Held in state as well as on the audit log because the geopref stage reads
   * it during render to decide which way to mirror the clip, and the scorer
   * reads it afterwards to decide which panel was the geometric one. Those two
   * must be the same string or the score is computed against the panel the
   * participant was not shown.
   */
  const [counterbalanceKey, setCounterbalanceKey] = useState<string | null>(null);
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
  const [offlineReadiness, setOfflineReadiness] = useState(() =>
    deriveOfflineReadiness({
      online: true,
      serviceWorkerSupported: false,
      registration: "idle",
      controlled: false,
      verification: "idle",
    }),
  );
  const [busy, setBusy] = useState(false);
  const [stimulusPaused, setStimulusPaused] = useState(false);
  const [mediaReadiness, setMediaReadiness] = useState<MediaReadiness>(() => initialMediaReadiness());
  const [mediaGeneration, setMediaGeneration] = useState(0);
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
  const geoprefVideoRef = useRef<HTMLVideoElement>(null);
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
  const mediaReadinessRef = useRef<MediaReadiness>(initialMediaReadiness());
  const mediaControllerRef = useRef<MediaReadinessController | null>(null);
  const stimulusRunIdRef = useRef(0);

  function mediaController(): MediaReadinessController {
    if (!mediaControllerRef.current) {
      mediaControllerRef.current = createMediaReadinessController({
        onChange: (next) => {
          mediaReadinessRef.current = next;
          setMediaReadiness(next);
        },
        onWithhold: () => geoprefVideoRef.current?.pause(),
      });
    }
    return mediaControllerRef.current;
  }

  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const message = args.map(String).join(" ");
      if (message.includes("Created TensorFlow Lite XNNPACK delegate for CPU")) return;
      originalConsoleError(...args);
    };
    fetch("/models/model.json")
      .then((response) => {
        if (!response.ok) throw new Error("model.unavailable");
        return response.json();
      })
      .then((candidate: unknown) => {
        validateModel(candidate);
        setModel(candidate);
        setModelError(null);
      })
      .catch((error) => {
        // Only the fetch above throws a key; a validateModel failure throws a
        // developer-facing message that has no translation and does not want
        // one.
        const key: MessageKey = error instanceof Error && error.message === "model.unavailable"
          ? "model.unavailable"
          : "model.loadFailed";
        setModelError(key);
        setDeviceMessage(key);
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
    let stopOfflineMonitor: () => void = () => undefined;
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        stopOfflineMonitor = monitorOfflineReadiness({
          serviceWorker: navigator.serviceWorker,
          network: {
            get online() { return navigator.onLine; },
            addEventListener: (name, listener) => window.addEventListener(name, listener),
            removeEventListener: (name, listener) => window.removeEventListener(name, listener),
          },
          onChange: setOfflineReadiness,
        });
      } else {
        navigator.serviceWorker.getRegistrations().then((registrations) =>
          registrations.forEach((registration) => registration.unregister()),
        );
        caches.keys().then((keys) =>
          Promise.all(keys.filter((key) => key.startsWith("neurogaze-")).map((key) => caches.delete(key))),
        );
      }
    } else if (process.env.NODE_ENV === "production") {
      stopOfflineMonitor = monitorOfflineReadiness({
        serviceWorker: null,
        network: {
          get online() { return navigator.onLine; },
          addEventListener: (name, listener) => window.addEventListener(name, listener),
          removeEventListener: (name, listener) => window.removeEventListener(name, listener),
        },
        onChange: setOfflineReadiness,
      });
    }
    return () => {
      console.error = originalConsoleError;
      stopOfflineMonitor();
      stimulusRunIdRef.current += 1;
      // The current node is intentionally read at unmount rather than captured
      // on the home-screen mount, when the stimulus video does not exist yet.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      geoprefVideoRef.current?.pause();
      mediaControllerRef.current?.dispose();
      // Invalidate an in-flight getUserMedia request. If it resolves after
      // unmount, the request-id guard below stops every track immediately.
      cameraRequestIdRef.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      landmarkerRef.current?.close();
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [stage]);

  // Read once. An empty list is not a failure: it means no recording is
  // registered and the quick demo falls back to the synthetic path, which the
  // report already labels as a simulation.
  useEffect(() => {
    let cancelled = false;
    void loadRecordingManifest().then((entries) => {
      if (!cancelled) setRecordingEntries(entries);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  // The stimulus-stage effect below subscribes to later visibility changes.
  // A run prepared before that effect commits reads the document through this
  // helper instead, so a session started on a hidden tab is withheld as an
  // interruption rather than waiting out the clip's load deadline.
  function visibilitySource(): MediaVisibilitySource | null {
    return typeof document === "undefined" ? null : document;
  }

  useEffect(() => {
    if (stage !== "stimulus" || !busy) return;
    return mediaController().connectVisibility(document);
  }, [busy, stage]);

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

  function transitionMedia(event: MediaReadinessEvent): MediaReadiness {
    return mediaController().event(event);
  }

  function transitionMediaGeneration(event: MediaReadinessEvent, generation: number): MediaReadiness {
    return mediaController().event(event, generation);
  }

  function resetMediaPlayback() {
    stimulusRunIdRef.current += 1;
    geoprefVideoRef.current?.pause();
    setMediaGeneration(mediaController().reset());
  }

  async function holdForMedia(status: MediaReadinessStatus, runId: number) {
    if (runId !== stimulusRunIdRef.current || !isMediaFailure(status)) return;
    stimulusRunIdRef.current += 1;
    mediaController().deactivate();
    geoprefVideoRef.current?.pause();
    const failure = mediaFailure(status);
    const heldValidity: SessionValidityResult = {
      canScore: false,
      outcome: "HELD",
      heldKind: "HELD_SYSTEM",
      primaryReasonCode: "SESSION_INCOMPLETE",
      userMessage: `${failure.userMessage} Ini bukan hasil risiko anak.`,
      operatorAction: failure.operatorAction,
      invalidStages: [GEOPREF_PHASE_ID],
      debugEvidence: { mediaStatus: status, mediaReason: failure.reason },
    };
    const heldQuality: Quality = {
      faceRate: 0,
      gazeDropout: 1,
      calibrationErrorDeg: calibration?.errorDeg ?? 99,
      calibrationLimitDeg,
      brightness: deviceDiagnostics?.brightness ?? 0,
      sampleCount: 0,
      reasons: [failure.userMessage],
      passed: false,
    };
    setPoints([]);
    frameTraceRef.current.reset();
    setGazeDiagnostics(null);
    setCueSummary(null);
    setOodAssessment(null);
    setLatencyMs(null);
    setPhenotype(EMPTY_PHENOTYPE);
    setRisk(null);
    setRiskInterpretable(false);
    setQuality(heldQuality);
    setValidity(heldValidity);
    setStimulusPhase(null);
    setStimulusCueActive(false);
    setStimulusOstensiveActive(false);
    setProgress(0);
    if (auditRef.current) {
      commitAudit(appendAuditEvent(
        { ...auditRef.current, quality: heldQuality, gaze: undefined, assessment: undefined, decision: undefined },
        "stimulus.media_withheld",
        { reason: failure.reason, status, scoredSamples: 0 },
        "error",
      ));
    }
    if (mode === "live") stopCamera();
    void leaveMeasurementFullscreen();
    setBusy(false);
    setStage("quality");
  }

  async function stopIfMediaTerminated(runId: number): Promise<boolean> {
    if (runId !== stimulusRunIdRef.current) return true;
    const status = mediaController().blockingFailure();
    if (!status) return false;
    await holdForMedia(status, runId);
    return true;
  }

  function toggleStimulusPause() {
    const next = !stimulusPausedRef.current;
    stimulusPausedRef.current = next;
    setStimulusPaused(next);
    if (next) {
      geoprefVideoRef.current?.pause();
      if (stimulusPhase?.id === GEOPREF_PHASE_ID) transitionMedia("waiting");
    }
    else if (stimulusPhase?.id === GEOPREF_PHASE_ID) {
      const media = geoprefVideoRef.current;
      const generation = mediaController().generation();
      void media?.play().catch(() => transitionMediaGeneration("error", generation));
    }
    recordAudit(next ? "stimulus.paused" : "stimulus.resumed");
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
      modelError: model ? undefined : t(modelError ?? "model.notLoadedAtStart"),
      study: isGateB ? bridgeMeta : undefined,
      positiveControl: positiveControl ?? undefined,
      // Shaped for research/recompute_gate_b.py: degrees cannot be recomputed
      // from a pair file that does not carry the display geometry. A positive
      // control carries the distance alone — the protocol fixes it at 500 mm
      // and the analysis needs to see whether the rig actually held there.
      viewingGeometry: isGateB ? {
        screenWidthMm: bridgeMeta.screenWidthMm,
        screenHeightMm: bridgeMeta.screenHeightMm,
        viewingDistanceMm: bridgeMeta.viewingDistanceMm,
        deviceId: bridgeMeta.deviceId,
        referenceDevice: bridgeMeta.referenceDevice,
      } : positiveControl ? {
        screenWidthMm: 0,
        screenHeightMm: 0,
        viewingDistanceMm,
        deviceId: profile.site,
        referenceDevice: "-",
      } : undefined,
    });
    // Logged here rather than where the box was ticked, because an event needs
    // a log to land in and start() has just cleared the previous one.
    commitAudit(demonstrationMode
      ? appendAuditEvent(next, "session.demonstration_mode", {
        enabled: true,
        live: mode === "live",
        declaredAt: "layar_persetujuan",
        reason: "ambang_69_diterapkan_pada_protokol_dipersingkat",
      }, "warning")
      : next);
    setStage(isEngineeringStudy ? "device" : "preparation");
  }

  function downloadCurrentAudit(purpose: AuditExportPurpose) {
    if (!auditRef.current) return;
    const downloaded = downloadAuditLog(auditRef.current, purpose);
    if (downloaded) commitAudit(downloaded);
  }

  function setResearchLogPermission(on: boolean) {
    setResearchConsent(on);
    const current = auditRef.current;
    if (!current || current.purpose !== "target_population_research") return;
    const updated = {
      ...current,
      privacy: { ...current.privacy, researchConsent: on },
    };
    commitAudit(appendAuditEvent(updated, "privacy.research_consent", {
      enabled: on,
      declaredAt: "laporan_sebelum_ekspor",
    }));
  }

  function deleteCurrentAudit() {
    if (auditRef.current?.purpose === "gate_b_bridge" && typeof window !== "undefined") {
      window.sessionStorage.removeItem("neurogaze_gate_b_last_audit");
    }
    commitAudit(null);
  }

  function confirmDeleteCurrentAudit() {
    if (!window.confirm(t("confirm.deleteLog"))) return;
    deleteCurrentAudit();
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
    resetMediaPlayback();
    stopCamera();
    setBusy(false);
    setStage("home");
  }

  function moveNavigationFocus(destinationId: NavigationDestinationId) {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    requestAnimationFrame(() => {
      document.getElementById(destinationId)?.scrollIntoView({ behavior });
      focusNavigationDestination(document, destinationId);
    });
  }

  function selectPrimaryNavigation(destinationId: NavigationDestinationId, navigate: () => void) {
    const transition = compactNavigationTransition(mobileNavOpen, { type: "select", destinationId });
    setMobileNavOpen(transition.open);
    navigate();
    if (transition.focusTarget !== "trigger" && transition.focusTarget) {
      moveNavigationFocus(transition.focusTarget);
    }
  }

  function openHomeSection(sectionId: "evidence" | "privacy") {
    selectPrimaryNavigation(sectionId, goHome);
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

  const consentBaseIssues = useMemo(() => consentBlockers({
    purpose: sessionPurpose,
    childId: profile.childId,
    ageMonths: profile.age,
    site: profile.site,
    operator: profile.operator,
    consented,
    researchConsent,
    bridge: sessionPurpose === "gate_b_bridge" ? bridgeMeta : null,
  }, locale), [sessionPurpose, profile.childId, profile.age, profile.site, profile.operator, consented, researchConsent, bridgeMeta, locale]);
  const consentIssues = useMemo(
    () => [
      ...consentBaseIssues,
      ...(positiveControl ? positiveControlBlockers(positiveControl, { callName: callNamePresent ? "ada" : "" }, locale) : []),
    ],
    [consentBaseIssues, positiveControl, callNamePresent, locale],
  );

  const geoprefAsset = useMemo(() => activeGeoprefAsset(), []);
  const geoprefResult = useMemo(() => {
    const geoprefPoints = points.filter((point) => point.phase === GEOPREF_PHASE_ID);
    if (!geoprefPoints.length) return null;
    return scoreGeopref(geoprefPoints, {
      ...geoprefLayout(counterbalanceKey ?? "NG-0000"),
      validatedProtocol: geoprefAsset.validatedProtocol,
      demonstrationMode,
      viewportAspect: stageAspect,
    });
  }, [points, counterbalanceKey, geoprefAsset, stageAspect, demonstrationMode]);
  const jointAttention = useMemo(() => summarizeJointAttention(cueSummary), [cueSummary]);
  const sessionOutcome = useMemo(() => resolveSessionOutcome({
    mode,
    qualityPassed: Boolean(quality?.passed),
    validityCanScore: Boolean(validity?.canScore),
    geopref: geoprefResult,
    jointAttention,
  }, locale), [mode, quality, validity, geoprefResult, jointAttention, locale]);
  // Lane 2. Reported beside the GeoPref lane, never merged into it: the 69%
  // cutoff is the one number in this system we did not choose, and folding it
  // into a composite would throw that away.
  const referral = useMemo(() => buildReferralRecommendation({
    geopref: geoprefResult,
    jointAttention,
  }, locale), [geoprefResult, jointAttention, locale]);
  const compositeHeadline = compositeLaneHeadline({
    headline: referral.headline,
    recommendsFollowUp: referral.recommendsFollowUp,
    assessableCount: referral.assessableCount,
    deviantCount: referral.deviantCount,
    demonstrationMode,
  }, locale);
  const isGateA = sessionPurpose === "gate_a_adult";
  const isGateB = sessionPurpose === "gate_b_bridge";
  /** Consenting adult running the shipped child flow so the threshold can be shown. */
  const isStageDemo = sessionPurpose === "stage_demo";
  /** Wording only: an adult is in the chair, so "anak" would be wrong on screen. */
  const isAdultParticipant = isGateA || isGateB || isStageDemo;
  /**
   * Who the session is about, as a noun the surrounding sentence can take.
   * English needs the article baked in ("the child", not "child"), which is
   * why this is a dictionary lookup rather than a bare word.
   */
  const subjectWord = t(isAdultParticipant ? "consent.name.participant" : "consent.name.child");
  const introCopy = stimulusIntroCopy({ engineering: isGateA || isGateB, positiveControl, gateB: isGateB }, locale);
  const isEngineeringStudy = isGateA || isGateB;
  // Read from both lanes, because a demonstration whose composite fires is not
  // a referral and is not nothing either, and the badge is what most of a room
  // actually reads.
  const badge = reportBadge({
    engineeringStudy: isEngineeringStudy,
    qualityPassed: Boolean(quality?.passed),
    outcome: sessionOutcome,
    demonstrationMode,
    recommendsFollowUp: referral.recommendsFollowUp,
  }, locale);
  /**
   * Layer 1 of the referral model, and the number the report is asked to defend.
   *
   * It exists only where the 69% cutoff was actually applied. On the shipped
   * field path every likelihood ratio would be 1 and the posterior would equal
   * the prevalence it started from — a result-shaped restatement of the input,
   * which is worse than no number at all.
   */
  const posterior = useMemo(() => buildPosteriorOdds({
    signals: referral.signals,
    thresholdApplied: demonstrationMode,
  }, locale), [referral, demonstrationMode, locale]);
  const verdict = useMemo(() => buildSessionVerdict({
    referral,
    outcome: sessionOutcome,
    posterior,
    demonstrationMode,
  }, locale), [referral, sessionOutcome, posterior, demonstrationMode, locale]);
  const offlineCopy = offlineReadinessCopy(offlineReadiness.reason, locale);
  const useTechnicalCalibration = isEngineeringStudy || technicalCalibration;
  const activeTargets = useTechnicalCalibration ? TARGETS : CHILD_TARGETS;
  // Null outside the positive-control lane, so an ordinary child session never
  // sounds a name call and never needs the phase that would carry one.
  const speakerDeclared = Boolean(positiveControl?.speakerBehind);
  // What this configuration will actually run, which is 13 s shorter whenever
  // the name call is silent. Operators decide whether a child will sit still
  // from this number, so it cannot keep quoting the longest possible battery.
  const sessionSeconds = useMemo(
    () => stimulusSeconds(sessionStimulusPhases("duration-probe", { nameCallsDelivered: speakerDeclared })),
    [speakerDeclared],
  );
  /**
   * Presenter-facing telemetry, and only on a stage.
   *
   * 67 silent seconds is a ninth of a ten minute pitch. The child-facing screen
   * still shows nothing but the stimulus — this strip is the operator side of a
   * `stage_demo`, where the participant is a consenting adult under a banner.
   * `isStageDemo` is the gate; tests/stage-mirror.test.ts holds it shut.
   */
  const stageMirror = useMemo(() => buildStageMirror({
    isStageDemo,
    running: busy,
    paused: stimulusPaused,
    phaseLabel: stimulusPhase ? phaseLabel(stimulusPhase.id, stimulusPhase.label, locale) : null,
    phaseId: stimulusPhase?.id ?? null,
    progress,
    totalSeconds: sessionSeconds,
    tracking: tracking ? { accepted: tracking.accepted, eyeOpen: tracking.eyeOpen } : null,
    cueActive: stimulusCueActive,
    ostensiveActive: stimulusOstensiveActive,
  }, locale), [isStageDemo, busy, stimulusPaused, stimulusPhase, progress, sessionSeconds, tracking, stimulusCueActive, stimulusOstensiveActive, locale]);

  const reportSourceKind: ReportSourceKind = mode === "live"
    ? "live"
    : recording
      ? "recorded_replay"
      : "synthetic_preview";
  // Not memoized: it concatenates a handful of literals, so a dependency array
  // would cost more to keep correct than the call costs to run.
  const reportNotice = buildReportNotice({
    demonstrationMode,
    isEngineeringStudy,
    sourceKind: reportSourceKind,
    recordingLabel: recording?.label ?? null,
    recordingCapturedAt: recording?.capturedAt ?? null,
  }, locale);
  const reportPresentation = useMemo(() => buildReportPresentation({
    qualityPassed: Boolean(quality?.passed && validity?.canScore),
    sourceKind: reportSourceKind,
    demonstrationMode,
    recommendsFollowUp: referral.recommendsFollowUp,
    emitsReferral: sessionOutcome.emitsReferral,
    fieldTitle: verdict?.headline ?? sessionOutcome.headline,
    sessionHeadline: verdict?.subline ?? sessionOutcome.headline,
    sessionSummary: sessionOutcome.summaryLine,
    validityMessage: validity?.userMessage,
  }, locale), [quality, reportSourceKind, demonstrationMode, referral, sessionOutcome, verdict, validity, locale]);

  useEffect(() => {
    const compactNavigation = window.matchMedia(COMPACT_NAV_MEDIA);
    const closeWhenWide = (event: MediaQueryListEvent) => {
      setMobileNavOpen((open) => compactNavigationTransition(open, {
        type: "breakpoint",
        compact: event.matches,
      }).open);
    };
    compactNavigation.addEventListener("change", closeWhenWide);
    return () => compactNavigation.removeEventListener("change", closeWhenWide);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const transition = compactNavigationTransition(mobileNavOpen, {
          type: "escape",
          compact: window.matchMedia(COMPACT_NAV_MEDIA).matches,
        });
        setMobileNavOpen(transition.open);
        if (transition.focusTarget === "trigger") mobileNavButtonRef.current?.focus();
      }
    };
    const closeOutside = (event: PointerEvent) => {
      if (!primaryNavigationRef.current?.contains(event.target as Node)) {
        setMobileNavOpen(compactNavigationTransition(mobileNavOpen, { type: "outside" }).open);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [mobileNavOpen]);
  const calibrationLimitDeg = isEngineeringStudy ? 3 : 5;
  const calibrationFailed = Boolean(calibrationNote && (!calibration || calibration.errorDeg > calibrationLimitDeg));
  const recovery = calibrationRecovery(
    calibration,
    calibrationNote?.kind === "error" ? calibrationNote.message : null,
    t,
  );
  // Stimulus is deliberately outside the rail: it is the child-facing screen
  // and must fill the tablet without operator chrome.
  const isSessionStage =
    stage !== "home" && stage !== "guide" && stage !== "stimulus";

  function start(
    modeChoice: Mode,
    replay = scenario,
    purpose: SessionPurpose = modeChoice === "replay" ? "demo_replay" : "gate_a_adult",
    options: { demonstration?: boolean } = {},
  ) {
    setBusy(false);
    resetMediaPlayback();
    recordingRef.current = null;
    setRecording(null);
    setDemoRun("idle");
    // Replay, or a live adult session started from the stage control.
    //
    // A live camera run could not enter demonstration mode at all, which meant
    // the threshold was unreachable on stage no matter what the participant did
    // — there was no way to show, live, that the instrument responds. It is
    // still barred from `target_population_research`: the one purpose that
    // means a child is in front of the tablet is the one that must never apply
    // a threshold its protocol does not license. Every path here keeps the
    // banner on screen and `emitsReferral` false.
    //
    // `stage_demo` runs the same child flow, same calibration, same gates — the
    // participant is a consenting adult and the threshold is applied so the
    // report's shape is visible. It exists because the shipped session cannot
    // reach the threshold at all while the licensed clip is short, which left
    // no way to show on stage that the instrument responds.
    setDemonstrationMode(
      Boolean(options.demonstration)
      && (modeChoice === "replay" || purpose === "stage_demo"),
    );
    // Opted into per session on the Gate A consent screen, never carried over.
    setPositiveControl(null);
    setCallNamePresent(false);
    setMode(modeChoice);
    setSessionPurpose(purpose);
    setScenario(replay);
    setConsented(modeChoice === "replay");
    setResearchConsent(false);
    setProfile(defaultProfile(purpose));
    setDeviceStatus("idle");
    setDeviceDiagnostics(null);
    setCalibration(null);
    setCalibrationNote(null);
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
    setCallNamePresent(false);
    setCallNameEnabled(false);
    frameTraceRef.current.reset();
    setProgress(0);
    setStage("consent");
  }

  async function inspectLiveDevice() {
    setBusy(true);
    setDeviceStatus("checking");
    setDeviceMessage("device.msgLoading");
    let requestId = cameraRequestIdRef.current;
    let acquiredStream: MediaStream | null = null;
    let acquiredLandmarker: Awaited<ReturnType<typeof createFaceLandmarker>> | null = null;
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API unavailable");
      }
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
          reject(new CameraRequestTimeoutError());
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
      acquiredStream = stream;
      if (requestId !== cameraRequestIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (!captureVideoRef.current || !previewVideoRef.current)
        throw new Error("device.panelNotReady");
      captureVideoRef.current.srcObject = stream;
      previewVideoRef.current.srcObject = stream;
      await Promise.all([captureVideoRef.current.play(), previewVideoRef.current.play()]);
      landmarkerRef.current ||= await createFaceLandmarker();
      acquiredLandmarker = landmarkerRef.current;
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
      const failures: MessageKey[] = [
        detections < 9 ? "device.failFaceLost" : null,
        brightness < 0.22 ? "device.failTooDark" : null,
        brightness > 0.92 ? "device.failTooBright" : null,
        coverage < 0.08 ? "device.failTooFar" : null,
        coverage > 0.6 ? "device.failTooClose" : null,
        (settings.width || 0) < 640 ? "device.failLowRes" : null,
      ].filter((key): key is MessageKey => key !== null);
      setDeviceMessage(
        passed
          ? "device.msgReady"
          : failures[0] ?? "device.msgUnstable",
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
      if (acquiredStream) {
        cleanupFailedCameraAcquisition({
          acquiredStream,
          activeStream: streamRef.current,
          videoElements: [
            captureVideoRef.current,
            previewVideoRef.current,
            calibrationVideoRef.current,
          ].filter((video): video is HTMLVideoElement => video !== null),
          acquiredDetector: acquiredLandmarker,
          activeDetector: landmarkerRef.current,
          clearActiveStream: () => { streamRef.current = null; },
          clearActiveDetector: () => { landmarkerRef.current = null; },
        });
        setTracking(null);
      }
      const localizedError = cameraErrorInfo(error, {
        isSecureContext: window.isSecureContext,
        getUserMediaSupported: Boolean(navigator.mediaDevices?.getUserMedia),
      });
      setDeviceStatus("failed");
      // The kind is the stable part; the sentence is derived from it at render
      // so that switching language repaints the error rather than stranding it.
      setDeviceMessage(`camera.${localizedError.kind}`);
      recordAudit(
        "device.error",
        { kind: localizedError.kind, message: localizedError.message },
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
    setDeviceMessage("device.msgReplayReady");
    setBusy(false);
  }

  /**
   * One-click path to a finished report.
   *
   * It runs the real pipeline rather than staging a fake result: calibration,
   * the stimulus block, the quality gate, and the same outcome resolver a live
   * session uses. The only difference is where the gaze comes from.
   */
  async function startQuickDemo(options: { demonstration: true; entry: RecordingEntry }) {
    setDemoReplayError(null);
    const result = await orchestrateRegisteredReplay(options.entry, (found) => {
      start("replay", SCENARIOS[0], "demo_replay", options);
      recordingRef.current = found;
      setRecording(found);
      setProfile({ childId: "NG-PERAGA-01", age: "24", site: "Posyandu Melati 3", operator: "Kader-07" });
      recordAudit("session.demonstration_mode", { enabled: true, reason: "ambang_69_diterapkan_pada_protokol_dipersingkat" }, "warning");
      // Naming the recording in the log matters more than it looks: the report
      // says which condition it replayed, so a screenshot cannot be captioned as
      // the other one after the fact.
      recordAudit("replay.recording_selected", { file: options.entry.file, label: options.entry.label, condition: options.entry.condition ?? null });
      setDemoRun("calibrating");
    }, fetch, locale);
    if (!result.ok) setDemoReplayError(result.message);
  }

  async function runCalibration() {
    setCalibrationAttempts((value) => value + 1);
    setBusy(true);
    setCalibration(null);
    setCalibrationNote(null);
    setCalibrationProgress(null);
    recordAudit("calibration.started", {
      protocol: useTechnicalCalibration ? "technical_9_grid_plus_center_drift_v6" : "child_passive_5_cross_v2",
      targetCount: activeTargets.length,
      fullscreen: Boolean(document.fullscreenElement),
      viewport: { width: window.innerWidth, height: window.innerHeight },
    });
    if (mode === "replay") {
      for (let index = 0; index < activeTargets.length; index += 1) {
        setCalibrationTarget(index);
        await pause(160);
      }
      const replayedError = recordingRef.current?.calibrationErrorDeg ?? scenario.calibrationErrorDeg;
      setCalibration({
        x: [0, 1, 0],
        y: [0, 0, 1],
        errorDeg: replayedError,
      });
      setCalibrationNote(recordingRef.current
        ? { kind: "status", key: "calib.fromRecording", label: recordingRef.current.label }
        : { kind: "status", key: "calib.replayDefault" });
      recordAudit("calibration.replay_completed", { errorDeg: replayedError, recording: recordingRef.current?.id ?? null });
      setCalibrationTarget(null);
      setBusy(false);
      return;
    }
    const video = captureVideoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker) {
      setCalibrationNote({ kind: "status", key: "calib.notReady" });
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
      // Screen size and viewing distance are already collected, so calibration
      // error can be a real visual angle instead of the assumed 45 deg/unit the
      // Gate A figures were computed under. See LEGACY_DEGREES_PER_UNIT.
      const geometry = {
        screenWidthMm: bridgeMeta.screenWidthMm,
        screenHeightMm: bridgeMeta.screenHeightMm,
        viewingDistanceMm: bridgeMeta.viewingDistanceMm,
      };
      const fitted = fitCalibration(samples, targetDiagnostics, useTechnicalCalibration
        ? { geometry }
        : { minimumTrainingTargets: 5, minimumTrainingSamples: 25, geometry });
      setCalibration(fitted);
      setSanityPassed(null);
      setCalibrationNote({
        kind: "status",
        key: fitted.errorDeg > calibrationLimitDeg ? "calib.retryStatus" : "calib.readyStatus",
      });
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
      // Verbatim on purpose: this is the string calibrationRecovery reads the
      // CALIBRATION_* code out of, and it never reaches the screen.
      const message = error instanceof Error ? error.message : "Kalibrasi gagal.";
      setCalibrationNote({ kind: "error", message });
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
    }, locale);
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

  async function runStimulus(options: { fast?: boolean } = {}) {
    if (!calibration || (mode === "replay" && !model)) return;
    const runId = stimulusRunIdRef.current + 1;
    stimulusRunIdRef.current = runId;
    // Cue order is counterbalanced per session, so the run order comes from the
    // session id rather than the declaration order. Everything downstream that
    // cares about ordering has to read this, not STIMULUS_PHASES.
    const retryPhaseIds = validity?.outcome === "RETRY_STAGE" ? validity.invalidStages : [];
    // A partial retry continues the recording it is repairing, so it keeps that
    // recording's key; anything else is a new recording and gets a new one.
    // Keying off `profile.childId` — which is what this did — meant an operator
    // who left the identity field alone between participants handed every one
    // of them the same panel side and the same cue sequence. All 24
    // positive-control sessions ran the identical order because of it.
    let runKey = counterbalanceKey;
    // Replay reproduces a recording, so it inherits that recording's key rather
    // than drawing one: the panel scored has to be the panel that was shown.
    const replayKey = mode === "replay" ? recordingRef.current?.counterbalanceKey : null;
    if (replayKey) {
      runKey = replayKey;
      setCounterbalanceKey(replayKey);
    } else if (!retryPhaseIds.length || !runKey) {
      const renewed = auditRef.current ? renewSessionIdentity(auditRef.current) : null;
      runKey = renewed?.sessionId ?? globalThis.crypto?.randomUUID?.() ?? `ng-${Date.now()}`;
      if (renewed) commitAudit(renewed);
      setCounterbalanceKey(runKey);
    }
    // Decided before the phase list is built, not after: without a speaker
    // behind the participant nothing is ever sounded, and the phase would run
    // thirteen seconds of bare centre dot for a measurement that cannot happen.
    const orderedPhases = sessionStimulusPhases(runKey, { nameCallsDelivered: speakerDeclared });
    const nameCallsPlanned = sessionNameCalls(positiveControl, orderedPhases);
    const runPhases = retryPhaseIds.length
      ? orderedPhases.filter((phase) => retryPhaseIds.includes(phase.id))
      : orderedPhases;
    const includesGeopref = runPhases.some((phase) => phase.id === GEOPREF_PHASE_ID);
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
    const preloaded = await mediaController().prepareRun(includesGeopref, ["ready", "playing"], visibilitySource());
    if (preloaded && isMediaFailure(preloaded.status)) {
      await holdForMedia(preloaded.status, runId);
      return;
    }
    if (runId !== stimulusRunIdRef.current) return;

    const ensureGeoprefPlaying = async () => {
      const current = mediaReadinessRef.current;
      if (isMediaFailure(current.status)) {
        await holdForMedia(current.status, runId);
        return false;
      }
      const media = geoprefVideoRef.current;
      if (!media) {
        const failed = transitionMedia("error");
        await holdForMedia(failed.status, runId);
        return false;
      }
      const generation = mediaController().generation();
      if (mediaController().canAdvance(mode, media)) return true;
      // `playing` is an event history, not proof that the element is still
      // advancing. A spontaneous pause or early end is a media failure.
      if (current.status === "playing") transitionMedia("error");
      if (isMediaFailure(mediaReadinessRef.current.status)) {
        await holdForMedia(mediaReadinessRef.current.status, runId);
        return false;
      }
      if (runId !== stimulusRunIdRef.current
        || generation !== mediaController().generation()
        || media !== geoprefVideoRef.current) return false;
      if (media.currentTime !== 0 && media.paused) media.currentTime = 0;
      const playback = await mediaController().requestPlaying(() => media.play(), generation);
      if (runId !== stimulusRunIdRef.current
        || generation !== mediaController().generation()
        || media !== geoprefVideoRef.current) return false;
      if (isMediaFailure(playback.status)) {
        await holdForMedia(playback.status, runId);
        return false;
      }
      return runId === stimulusRunIdRef.current && mediaController().canAdvance(mode, media);
    };
    const geoprefCaptureReady = () => {
      const media = geoprefVideoRef.current;
      return Boolean(media && mediaController().canAdvance(mode, media));
    };
    if (includesGeopref && !await ensureGeoprefPlaying()) return;
    if (includesGeopref && runPhases[0]?.id !== GEOPREF_PHASE_ID) {
      const media = geoprefVideoRef.current;
      media?.pause();
      if (media) media.currentTime = 0;
      transitionMedia("waiting");
    }
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
    const replayed = recordingRef.current;
    if (mode === "replay") {
      if (replayed) {
        // A real session: its points already carry phase and epoch, and its
        // frame trace is what fills the layer-B indices.
        captured = replayed.points;
        frameTraceRef.current.reset();
        replayed.frames.forEach((frame) => frameTraceRef.current.record(frame));
      } else {
        // Density follows the protocol clock, not the progress-animation step
        // count, so a timing change cannot silently starve the phase contract.
        captured = syntheticSessionPoints(scenario, runPhases);
      }
      const stepPause = options.fast ? 8 : 140;
      for (let index = 0; index < totalFrames; index += 6) {
        if (await stopIfMediaTerminated(runId)) return;
        while (stimulusPausedRef.current) {
          await pause(100);
          if (await stopIfMediaTerminated(runId)) return;
        }
        const state = phaseAtElapsed((index / totalFrames) * durationMs, runPhases)!;
        setStimulusPhase(state.phase);
        setStimulusCueActive(state.cueActive);
        setStimulusOstensiveActive(state.ostensiveActive);
        if (state.phase.id === GEOPREF_PHASE_ID && !geoprefCaptureReady()) {
          if (!await ensureGeoprefPlaying()) return;
        } else if (state.phase.id !== GEOPREF_PHASE_ID && geoprefVideoRef.current && !geoprefVideoRef.current.paused) {
          geoprefVideoRef.current.pause();
          transitionMedia("waiting");
        }
        setProgress(Math.round((index / totalFrames) * 100));
        await pause(stepPause);
        if (state.phase.id === GEOPREF_PHASE_ID && !geoprefCaptureReady()) {
          if (!await ensureGeoprefPlaying()) return;
        }
      }
      faceFrames = Math.round((replayed?.faceRate ?? scenario.faceRate) * totalFrames);
      attemptedFrames = totalFrames;
    } else {
      const video = captureVideoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || !streamRef.current) {
        setBusy(false);
        setDeviceStatus("failed");
        setDeviceMessage("device.msgCameraLost");
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
        if (await stopIfMediaTerminated(runId)) return;
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
        if (phaseState.phase.id === GEOPREF_PHASE_ID && !geoprefCaptureReady()) {
          const mediaWaitStarted = performance.now();
          setStimulusPhase(phaseState.phase);
          setStimulusCueActive(phaseState.cueActive);
          setStimulusOstensiveActive(phaseState.ostensiveActive);
          // Let React reveal the already-mounted stage before playback starts.
          await pause(0);
          if (!await ensureGeoprefPlaying()) return;
          pausedTotalMs += performance.now() - mediaWaitStarted;
          continue;
        }
        if (phaseState.phase.id !== GEOPREF_PHASE_ID && geoprefVideoRef.current && !geoprefVideoRef.current.paused) {
          geoprefVideoRef.current.pause();
          transitionMedia("waiting");
        }
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
        // The phase always runs — removing it would change the battery and make
        // these recordings incomparable to earlier ones — but the calls only go
        // out when a speaker behind the participant was declared. Played through
        // the tablet they measure nothing, and a call that measures nothing is
        // better not delivered than delivered and misread.
        if (phaseState.phase.id === NAME_CALL_PHASE_ID && nameCallsPlanned.length > 0) {
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
    if (await stopIfMediaTerminated(runId)) return;
    captured = [...preservedPoints, ...captured].sort((a, b) => {
      const phaseDelta = orderedPhases.findIndex((phase) => phase.id === a.phase) - orderedPhases.findIndex((phase) => phase.id === b.phase);
      return phaseDelta || a.t - b.t;
    });
    setProgress(100);
    geoprefVideoRef.current?.pause();
    if (mediaReadinessRef.current.status === "playing") transitionMedia("waiting");
    mediaController().deactivate();
    setStimulusPhase(null);
    setStimulusCueActive(false);
    setPoints(captured);
    // Kept as a local as well as state: the audit is committed further down in
    // this same call, before any memo reading `points` or `phenotype` has
    // recomputed. Anything the log needs has to come from these locals.
    const nextPhenotype = buildPhenotypeProfile({
      frames: frameTraceRef.current.samples(),
      // Empty when no speaker was declared, so the index reads "not measured"
      // instead of a confident zero out of three.
      nameCalls: nameCallsPlanned,
      socialPhases: SOCIAL_PHASE_IDS,
      nonsocialPhases: [GEOPREF_PHASE_ID],
    });
    setPhenotype(nextPhenotype);
    const frameRate = faceFrames / Math.max(attemptedFrames, 1);
    const dropout =
      mode === "replay"
        ? replayed?.gazeDropout ?? scenario.gazeDropout
        : 1 - rawCaptured.length / Math.max(attemptedFrames, 1);
    const features = geometryFeatures(captured);
    const nextOod = oodReference ? assessFeatureOod(features, oodReference) : null;
    const phaseTargets = scoredPhaseTargets();
    const nextCueSummary = cueFeatures(captured, phaseTargets);
    const capturedGeoprefPoints = captured.filter((point) => point.phase === GEOPREF_PHASE_ID);
    // Both of these are set by this same function a few hundred lines up, so
    // reading them back off state here would read the previous render's values:
    // the panel side of the recording before this one, and — on a first run —
    // the aspect placeholder the state was initialised with rather than the
    // stage the clip was actually letterboxed into. The locals are the values
    // this recording ran on.
    const nextGeopref = capturedGeoprefPoints.length
      ? scoreGeopref(capturedGeoprefPoints, {
          ...geoprefLayout(runKey),
          validatedProtocol: geoprefAsset.validatedProtocol,
          demonstrationMode,
          viewportAspect: capturedStageAspect,
        })
      : null;
    const baseQuality = evaluateQuality({
      faceRate: frameRate,
      gazeDropout: dropout,
      calibrationErrorDeg: calibration.errorDeg,
      calibrationLimitDeg,
      brightness: mode === "replay"
        ? replayed?.brightness ?? scenario.brightness
        : deviceDiagnostics?.brightness ?? frameBrightness(captureVideoRef.current!),
      sampleCount: captured.length,
      coverage: nextOod?.coverage,
      phaseCoverage: nextCueSummary.phaseCoverage,
      gazeSaturationRate: processedDiagnostics
        ? processedDiagnostics.saturatedSamples / Math.max(processedDiagnostics.inputSamples, 1)
        : undefined,
      oodMaxRobustZ: nextOod?.maxRobustZ,
      // Reported, never gating.
      //
      // Carette is a legacy reference from a different device, population,
      // sampling rate, and stimulus, and the guard built on it exists to decide
      // whether that model's output may be read. Feeding its flags to the
      // quality gate made it decide something else entirely: whether the
      // session was recorded well enough to report at all. In replay that
      // withheld the whole report — including preferential looking and cue
      // following, which are read off AOIs and owe the Carette feature space
      // nothing — so the first real recording registered for the demo came back
      // as a camera failure. Its own copy said "rekaman cukup baik untuk
      // dianalisis" in the same panel.
      //
      // The guard now gates the model it was built for, at the inference call
      // below, and nothing else.
    }, locale);
    const scoredPhases = STIMULUS_PHASES.filter((phase) => phase.scored);
    const phaseAssessments = scoredPhases.map((phase) => {
      const phasePoints = captured.filter((point) => point.phase === phase.id);
      return phaseAssessment(
        phase.id,
        phasePoints.length,
        undefined,
        // Measured, not inferred from how many samples survived. A thin phase
        // and a desynchronised one need opposite remedies from the operator.
        phasePoints.every((point, index) => index === 0 || point.t >= phasePoints[index - 1].t),
      );
    });
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
      scoringModelAvailable: Boolean(model),
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
    }, locale);
    const nextQuality: Quality = nextValidity.canScore && baseQuality.passed
      ? baseQuality
      : { ...baseQuality, passed: false, reasons: [...baseQuality.reasons, ...(nextValidity.canScore ? [] : [nextValidity.userMessage])] };
    const inferenceStarted = performance.now();
    // The bundled LR is trained on Carette scanpath rasters, whose geometric
    // features encode where that study's stimulus content sat on screen. The
    // decision boundary therefore does not transfer to this stimulus, on top of
    // the age and sampling-rate gaps. It runs so the research panel can show
    // the OOD guard rejecting it, and never drives a referral.
    // The OOD guard is what stands between this model and a number anybody
    // reads, so it gates the inference rather than the report. Withheld here
    // means withheld in the audit log too: `assessment.score` cannot carry a
    // value the guard rejected, and `outcome` cannot become refer or monitor
    // off the back of one.
    const riskIsInterpretable = mode === "replay" && Boolean(nextOod?.passed);
    const nextRisk = nextValidity.canScore && nextQuality.passed && model
      && (mode !== "replay" || riskIsInterpretable)
      ? infer(model, features)
      : null;
    setRiskInterpretable(riskIsInterpretable);
    setLatencyMs(performance.now() - inferenceStarted);
    setCueSummary(nextCueSummary);
    setOodAssessment(nextOod);
    setQuality(nextQuality);
    setValidity(nextValidity);
    setRisk(nextRisk);
    if (auditRef.current) {
      const observations = summarizeSessionObservations(nextCueSummary);
      const nextJointAttention = summarizeJointAttention(nextCueSummary);
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
            // Every column lembar_sesi.csv asks for, written by the app rather
            // than transcribed off the screen by an operator at a lab table.
            ...(positiveControl ? {
              positiveControl: positiveControlFromSession({
                meta: positiveControl,
                geopref: nextGeopref,
                jointAttention: nextJointAttention,
              }),
            } : {}),
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
        // What this recording was actually counterbalanced to.
        //
        // It used to be derivable only by re-running geoprefLayout on the same
        // input the app used, which meant a reader had to know which field that
        // was — and when the field turned out to be the operator-typed identity
        // rather than the session id, every recording that shared an identity
        // silently shared a panel side and a cue order. Written down, the
        // assignment is checkable from the file instead of reconstructable from
        // the source at the version that produced it.
        counterbalance: {
          derivedFrom: "recordingSessionId",
          key: runKey,
          geometricSide: geoprefLayout(runKey).geometricSide,
          geoprefAoiVersion: GEOPREF_AOI_VERSION,
          cueOrder: orderedPhases.map((phase) => phase.id),
        },
        // The descriptive index the speaker mode decides whether to collect.
        // Quarantined from the rule, so the log is the only place it is auditable.
        responseToName: nextPhenotype.responseToName,
        nameCallsPlanned: nameCallsPlanned.length,
        aoiVersion: AOI_VERSION,
        // Exported so a recorded session can be replayed with the same
        // phenotype indices it produced live. Pose and eye opening are derived
        // scalars, not landmarks: no face geometry is reconstructable.
        ...(mode === "live" ? { processedPoints: captured, frames: frameTraceRef.current.samples() } : {}),
        ...(isGateB ? { cleanSamples: captured } : {}),
      };
      // What the report said, and everything that produced it.
      //
      // `assessment` is the Carette research panel and nothing else, so a
      // downloaded log carried the gaze samples and the quality gate but not one
      // field of the decision the operator actually read on screen: not the
      // percentage, not its interval, not the composite rule, not whether the
      // threshold had been applied at all. A session could be argued about only
      // by re-running the app on the same recording at the same version. The
      // sheet a kader hands over and the file a reviewer opens now say the same
      // thing.
      //
      // Recomputed from the locals rather than read off `geoprefResult`,
      // `sessionOutcome` and `referral`: those are memos of state this function
      // is still in the middle of setting, so reading them here would write the
      // previous recording's decision into this recording's log.
      const decision = {
        ruleVersion: REFERRAL_RULE_VERSION,
        // False on every field session while the licensed clip is short. It is
        // the single field that says whether the 69% comparison was made at all.
        demonstrationMode,
        stimulus: {
          assetId: geoprefAsset.id,
          durationSeconds: geoprefAsset.durationSeconds,
          validatedProtocol: geoprefAsset.validatedProtocol,
        },
        geopref: nextGeopref,
        jointAttention: nextJointAttention,
        sessionOutcome: resolveSessionOutcome({
          mode,
          qualityPassed: nextQuality.passed,
          validityCanScore: nextValidity.canScore,
          geopref: nextGeopref,
          jointAttention: nextJointAttention,
        }),
        // Deliberately the default, not the reader's locale: this branch writes
        // the audit log, and an exported record whose language depends on which
        // toggle the operator happened to have on is not a record.
        referral: buildReferralRecommendation({ geopref: nextGeopref, jointAttention: nextJointAttention }),
      };
      const next = appendAuditEvent(
        { ...auditRef.current, quality: nextQuality, gaze, assessment, decision },
        nextQuality.passed ? "quality.passed" : "quality.withheld",
        { reasons: nextQuality.reasons, validity: nextValidity, assessment, decision, ...gaze },
        nextQuality.passed ? "info" : "warning",
      );
      commitAudit(next);
    }
    if (mode === "live" && nextValidity.outcome !== "RETRY_STAGE") stopCamera();
    void leaveMeasurementFullscreen();
    setBusy(false);
    setStage("quality");
  }

  // Drives the quick demo from calibration through to the report. It sits below
  // runCalibration and runStimulus because it calls both, and reading it before
  // they exist is what the compiler objects to.
  useEffect(() => {
    if (demoRun === "idle" || demoRun === "done") return;
    let cancelled = false;
    void (async () => {
      if (demoRun === "calibrating") {
        if (!calibration) {
          if (!busy) await runCalibration();
          return;
        }
        if (cancelled) return;
        setSanityPassed(true);
        // The stimulus stage has to be on screen before the battery is
        // prepared. Its scene owns the GeoPref <video>, and the media gate
        // waits for that element to report canplay; asking for the clip while
        // the calibration screen is still mounted spends the whole deadline on
        // an element that does not exist yet and withholds every demo run.
        setStage("stimulus");
        setDemoRun("measuring");
        return;
      }
      if (!model) return;
      if (!quality) {
        if (!busy) await runStimulus({ fast: true });
        return;
      }
      if (cancelled) return;
      setDemoRun("done");
      setStage("report");
    })();
    return () => { cancelled = true; };
    // runCalibration and runStimulus close over the state this effect waits on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoRun, calibration, quality, model, busy]);

  function restart() {
    void leaveMeasurementFullscreen();
    resetMediaPlayback();
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
    setCallNamePresent(false);
    setCallNameEnabled(false);
    frameTraceRef.current.reset();
    setCalibration(null);
    setCalibrationNote(null);
    setCalibrationAttempts(0);
    setSanityPassed(null);
    setSanityAttempts(0);
    if (mode === "live") setDeviceDiagnostics(null);
    setDeviceStatus(mode === "replay" ? "passed" : "idle");
    setStage(mode === "replay" ? "calibration" : "device");
  }

  return (
    <main>
      <a className="skipLink" href="#konten">{t("chrome.skipToContent")}</a>
      {/* Second live region: the rail announces the step, this announces the
          screen change itself, including on the fullscreen stages where the
          rail is not rendered. */}
      <p className="srOnly" role="status" aria-live="polite">
        {stage === "home" || stage === "guide"
          ? t("nav.home")
          : `${t("calib.step", { number: sessionStepPosition(stage).number, total: sessionStepPosition(stage).total })}: ${t(sessionStepPosition(stage).label)}`}
      </p>
      <div id="konten" tabIndex={-1} />
      {/* A checkbox on one screen is easy to forget three screens later. This
          stays across every screen except the two the participant looks at, so
          nobody narrates a demonstration as an ordinary session by accident. */}
      {demonstrationMode && stage !== "calibration" && stage !== "stimulus" && (
        <div className="presentationStrip" role="status">
          <span><IconResearch size={14} /> {t("chrome.demoStrip")}</span>
          <small>{reportPresentation.demoBanner}</small>
        </div>
      )}
      {stage !== "calibration" && stage !== "stimulus" && <header className={`topbar ${isSessionStage ? "operationalTopbar" : ""}`}>
        <div className="topbarInner">
        <button className="brandButton" onClick={() => { setMobileNavOpen(false); goHome(); }}>
          <Logo />
        </button>
        <div className="primaryNavigation" ref={primaryNavigationRef}>
          <button
            ref={mobileNavButtonRef}
            className="navMenuButton"
            type="button"
            aria-expanded={mobileNavOpen}
            aria-controls="primary-navigation"
            onClick={() => setMobileNavOpen(compactNavigationTransition(mobileNavOpen, { type: "toggle" }).open)}
          >
            {t("nav.menu")}
          </button>
          <nav className="topnav" id="primary-navigation" aria-label={t("nav.aria")} data-open={String(mobileNavOpen)}>
            <button className={stage === "home" ? "active" : ""} onClick={() => selectPrimaryNavigation("home-heading", goHome)}>{t("nav.home")}</button>
            <button onClick={() => selectPrimaryNavigation("guide-heading", () => setStage("guide"))}>{t("nav.guide")}</button>
            {/* The technical panel is the full evidence surface; the home page
                keeps a three-card summary of the same numbers. Primary nav
                points at the panel, so an auditor never has to hunt the footer
                for it. */}
            <Link className="navLink" href="/admin" onClick={() => setMobileNavOpen(false)}>{t("nav.evidence")}</Link>
            <button onClick={() => openHomeSection("privacy")}>{t("nav.privacy")}</button>
          </nav>
        </div>
        <div className="statusCluster">
          <LanguageToggle />
          {/* Rendered from the reason code rather than the sentence the monitor
              produced: the monitor is created once in an effect, so its own
              text would stay in whichever language was active at mount. */}
          <span
            className={`offlineBadge ${offlineReadiness.status === "incomplete" ? "offline" : offlineReadiness.status}`}
            title={offlineCopy.detail}
            aria-label={`${offlineCopy.label}. ${offlineCopy.detail}`}
          >
            {offlineReadiness.status === "incomplete"
              ? <IconOffline size={13} />
              : <b aria-hidden="true" />}
            {offlineCopy.label}
          </span>
          <span className="version">{t("chrome.version", { version: APP_VERSION })}</span>
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
                {t("home.hero.badge")}
              </span>
              <h1 id="home-heading" tabIndex={-1} style={{ "--i": 1 } as CSSProperties}>{t("home.hero.title")} <em>{t("home.hero.titleEm", { seconds: sessionSeconds })}</em>.</h1>
              <p className="lead" style={{ "--i": 2 } as CSSProperties}>
                {t("home.hero.lead")}
              </p>
              {/* One action, and it is the real session.
                  Every demo path now lives behind "Panduan & demo". A second
                  button here made the operator choose between two things that
                  produce reports that look alike, with a child waiting — and the
                  choice never belonged to them. */}
              <div className="heroActions" style={{ "--i": 3 } as CSSProperties}>
                <button className="primary primaryArrow" onClick={() => start("live", scenario, "target_population_research")}>
                  {t("home.hero.start")} <span aria-hidden="true"><IconArrowRight size={16} /></span>
                </button>
              </div>
              <div className="trustList" aria-label={t("home.hero.trustAria")} style={{ "--i": 4 } as CSSProperties}>
                <span><i aria-hidden="true"><IconCpu size={14} /></i> {t("home.hero.trustLocal")}</span>
                <span><i aria-hidden="true"><IconPrivacyShield size={14} /></i> {t("home.hero.trustNoVideo")}</span>
                <span><i aria-hidden="true"><IconOffline size={14} /></i> {t("home.hero.trustOffline")}</span>
              </div>
              <div className="warning heroWarning" style={{ "--i": 5 } as CSSProperties}>
                <span aria-hidden="true"><IconAlert size={18} /></span>
                <p><strong>{t("home.hero.warningLead")}</strong> {t("home.hero.warningBody")}</p>
              </div>
            </div>
          </section>

          <div className="heroStage">
            <HeroDevice />
          </div>
          </div>

          <section className="featureSection" aria-labelledby="feature-heading">
            <div className="sectionHead">
              <span className="sectionPill"><IconEye size={13} /> {t("home.feature.pill")}</span>
              <h2 id="feature-heading">{t("home.feature.heading")}</h2>
            </div>
            <div className="featureShowcase">
              <article className="featureCard featureCamera">
                <div className="featureVisual" aria-hidden="true">
                  <CameraFramingArt />
                  <em className="featureBadge"><IconCheck size={13} /> {t("home.feature.badgeFramed")}</em>
                </div>
                <div className="featureCopy"><span>{t("home.feature.step1Index")}</span><h3>{t("home.feature.step1Title")}</h3><p>{t("home.feature.step1Body")}</p></div>
              </article>
              <article className="featureCard featureWatch">
                <div className="featureVisual" aria-hidden="true">
                  <NaturalWatchingArt />
                </div>
                <div className="featureCopy"><span>{t("home.feature.step2Index")}</span><h3>{t("home.feature.step2Title")}</h3><p>{t("home.feature.step2Body")}</p></div>
              </article>
              <article className="featureCard featureResult">
                <div className="featureVisual" aria-hidden="true">
                  <div className="featureResultCard"><small>{t("home.feature.cardStatus")}</small><strong><IconSignalHeld size={16} /> {t("home.feature.cardVerdict")}</strong><i><b style={{ width: "78%" }} /></i><span>{t("home.feature.cardMeta")}</span></div>
                </div>
                <div className="featureCopy"><span>{t("home.feature.step3Index")}</span><h3>{t("home.feature.step3Title")}</h3><p>{t("home.feature.step3Body")}</p></div>
              </article>
            </div>
          </section>

          <section className="flowSection" aria-labelledby="flow-heading">
            <div className="sectionHead">
              <span className="sectionPill"><IconRoute size={13} /> {t("home.flow.pill")}</span>
              <h2 id="flow-heading">{t("home.flow.heading")}</h2>
            </div>
            <ol className="flowStrip">
              {SESSION_FLOW.map((step, index) => (
                <li className="flowStep" key={step.label} data-tone={step.tone} style={{ "--i": index } as CSSProperties}>
                  <span className="flowMark" aria-hidden="true"><step.icon size={21} /></span>
                  <span className="flowIndex">0{index + 1}</span>
                  <strong>{t(step.label)}</strong>
                  <small>{t(step.hint)}</small>
                </li>
              ))}
            </ol>
          </section>

          <section className="homeSection evidenceSection" id="evidence" aria-labelledby="evidence-heading">
            <div className="sectionHead">
              <span className="sectionPill" data-tone="slate"><IconShieldCheck size={12} /> {t("home.evidence.pill")}</span>
              <h2 id="evidence-heading">{t("home.evidence.heading")}</h2>
              <p>{t("home.evidence.lead")}</p>
            </div>
            <div className="evidenceRow">
              <article id="privacy" className="evidenceCard privacy" style={{ "--i": 0 } as CSSProperties}>
                <span className="evidenceIcon" aria-hidden="true"><IconPrivacyShield size={26} /></span>
                <strong>{t("home.evidence.privacyTitle")}</strong>
                <p>{t("home.evidence.privacyBody")}</p>
              </article>
              <article className="evidenceCard" style={{ "--i": 1 } as CSSProperties}>
                <span className="evidenceNumber">15/23</span>
                <strong>{t("home.evidence.passTitle")}</strong>
                <p>{t("home.evidence.passBody")}</p>
              </article>
              <article className="evidenceCard" style={{ "--i": 2 } as CSSProperties}>
                <span className="evidenceNumber">0/9 · 4/6</span>
                <strong>{t("home.evidence.ruleTitle")}</strong>
                <p>{t("home.evidence.ruleBody")} <code>emitsReferral=false</code>.</p>
              </article>
            </div>
            <div className="evidenceActions">
              {/* One click from the home page on purpose: this is the screen
                  that answers "does it just refer everyone", and hunting for it
                  under stage pressure is how that answer goes unshown. */}
              <Link className="secondary" href="/perbandingan">
                <IconScanpathFocus size={15} /> {t("home.evidence.compare")}
              </Link>
              <button className="secondary" onClick={() => setStage("guide")}>
                <IconBook size={15} /> {t("home.evidence.readGuide")}
              </button>
            </div>
          </section>

          <section className="ctaSection" aria-labelledby="cta-heading">
            <div className="ctaBand">
              <div>
                <span className="sectionPill"><IconCamera size={12} /> {t("home.cta.pill")}</span>
                <h2 id="cta-heading">{t("home.cta.heading")}</h2>
                <p>{t("home.cta.body")}</p>
                <div className="ctaActions">
                  <button className="primary primaryArrow" onClick={() => start("live", scenario, "target_population_research")}>
                    {t("home.hero.start")} <span aria-hidden="true"><IconArrowRight size={16} /></span>
                  </button>
                </div>
              </div>
              <div className="ctaPreview" aria-hidden="true">
                <div className="ctaPreviewHead"><span>{t("home.cta.previewTitle")}</span><span>NG-0042</span></div>
                <div className="ctaPreviewRow"><span><IconGauge size={15} /> {t("home.cta.previewQuality")}</span><strong>{t("home.cta.previewQualityValue")}</strong></div>
                <div className="ctaPreviewRow"><span><IconScanpathFocus size={15} /> {t("home.cta.previewGaze")}</span><strong>{t("home.cta.previewGazeValue")}</strong></div>
                {/* Decimal separator follows the reader's locale: 4,8 ms in
                    Indonesian, 4.8 ms in English. */}
                <div className="ctaPreviewRow"><span><IconTimer size={15} /> {t("home.cta.previewLatency")}</span><strong>{(4.8).toLocaleString(bcp47, { minimumFractionDigits: 1 })} ms</strong></div>
                <div className="ctaPreviewRow"><span><IconPrivacyShield size={15} /> {t("home.cta.previewMedia")}</span><strong>{t("home.cta.previewMediaValue")}</strong></div>
              </div>
            </div>
          </section>

          <footer className="siteFooter">
            <div className="footerGrid">
              <div className="footerBrand">
                <Logo />
                <p>{t("home.footer.blurb")}</p>
              </div>
              <div className="footerCol">
                <h3>{t("home.footer.flowHeading")}</h3>
                <ul>
                  {SESSION_FLOW.map((step) => (
                    <li key={step.label}><step.icon size={14} />{t(step.label)}</li>
                  ))}
                </ul>
              </div>
              <div className="footerCol">
                <h3>{t("home.footer.guaranteeHeading")}</h3>
                <ul>
                  <li><IconCpu size={14} />{t("home.footer.guaranteeOnDevice")}</li>
                  <li><IconPrivacyShield size={14} />{t("home.footer.guaranteeNoUpload")}</li>
                  <li><IconOffline size={14} />{t("home.footer.guaranteeOffline")}</li>
                  <li><IconBook size={14} />{t("home.footer.guaranteeAudit")}</li>
                </ul>
              </div>
            </div>
            <div className="footerBase">
              <div>
                <span>{t("home.footer.event")}</span>
                <div className="footerMeta">
                  <a className="adminAccess" href="/admin"><IconShieldCheck size={14} /> {t("nav.technicalPanel")}</a>
                  <code>{t("chrome.version", { version: APP_VERSION })}</code>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}

      {stage === "guide" && (
        <section className="workspace guide">
          <button className="back" onClick={goHome}><IconArrowLeft size={16} /> {t("action.backHome")}</button>
          <span className="eyebrow">{t("guide.eyebrow")}</span>
          <h1 id="guide-heading" tabIndex={-1}>{t("guide.heading")}</h1>
          <p className="guideLead">{t("guide.lead")}</p>
          <GuideFilm />
          <div className="guideEssentials" aria-label={t("guide.essentialsAria")}>
            <article><span><IconChild size={22} /></span><div><small>{t("guide.essential1Label")}</small><strong>{t("guide.essential1Title")}</strong><p>{t("guide.essential1Body")}</p></div></article>
            <article><span><IconEye size={22} /></span><div><small>{t("guide.essential2Label")}</small><strong>{t("guide.essential2Title")}</strong><p>{t("guide.essential2Body")}</p></div></article>
            <article><span><IconTimer size={22} /></span><div><small>{t("guide.essential3Label")}</small><strong>{t("guide.essential3Title")}</strong><p>{t("guide.essential3Body")}</p></div></article>
          </div>
          <details className="operatorGuideDetails">
            <summary><IconBook size={16} /> {t("guide.technicalSummary")}</summary>
            <div className="operatorGuideGrid">
              <p><strong>{t("guide.technical1Lead")}</strong> {t("guide.technical1Body")}</p>
              <p><strong>{t("guide.technical2Lead")}</strong>{t("guide.technical2Body")}</p>
              <p><strong>{t("guide.technical3Lead")}</strong>{t("guide.technical3Body")}</p>
              <p><strong>{t("guide.technical4Lead")}</strong> {t("guide.technical4Body")}</p>
            </div>
          </details>
          <div className="cardActions guideActions">
            <button className="primary primaryArrow" onClick={() => start("live", scenario, "target_population_research")}><IconCamera size={16} /> {t("home.hero.start")}</button>
          </div>
          {/* The "same code, different source of gaze" framing used to appear
              twice in a row — once as a footnote here and again in the section
              lead below. It reads once, in the lead. */}
          <section className="guideDemoSection" aria-labelledby="replay-heading">
            <div className="sectionHead">
              <span className="sectionPill" data-tone="amber"><IconPlay size={11} /> {t("guide.demoPill")}</span>
              <h2 id="replay-heading">{t("guide.demoHeading")}</h2>
              <p>{t("guide.demoLead")}</p>
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
                    <strong>{t(SCENARIO_COPY[item.id].title)}</strong>
                    <small>{t(SCENARIO_COPY[item.id].hint)}</small>
                    <span className="scenarioLink">{t("guide.scenario.open")} <IconArrowRight size={14} /></span>
                  </button>
                );
              })}
            </div>
            {/* The threshold is held on every path above, so the referral layout
                never appears there. This is the one control that applies it, and
                it has to say why before anyone clicks it. */}
            <div className="demoAside">
              <div className="demoAsideHead">
                <strong>{t("guide.asideTitle")}</strong>
                <p>{t("guide.asideBody")}</p>
              </div>
              {/* Two different things used to sit in one stack of look-alike
                  buttons, under a single block of prose that explained both.
                  They are separate choices, so each one now carries only the
                  sentence a presenter needs before pressing it. */}
              <div className="demoAsideOptions">
                {/* Each registered recording has its own button. The presenter
                    must name the condition, so an ordinary-viewing session
                    cannot be narrated as the produced-pattern condition. */}
                <article className="demoAsideOption">
                  <h3>{t("guide.replayTitle")}</h3>
                  <p>{t("guide.replayBody")}</p>
                  <div className="demoAsideActions">
                    {recordingEntries.map((entry) => (
                      <button key={entry.file} className="secondary" onClick={() => void startQuickDemo({ demonstration: true, entry })}>
                        <IconResearch size={15} /> {t("guide.replayAction", { label: entry.label })}
                      </button>
                    ))}
                  </div>
                  {demoReplayError && <p className="demoReplayError" role="alert">{demoReplayError}</p>}
                </article>
                {/* Live camera, adult purpose, threshold applied under the same
                    banner. This explicit guide control is the only live entry
                    point for a stage demonstration. */}
                <article className="demoAsideOption">
                  <h3>{t("guide.liveTitle")}</h3>
                  <p>{t("guide.liveBody1")}</p>
                  <p>{t("guide.liveBody2")}</p>
                  <div className="demoAsideActions">
                    <button
                      className="secondary"
                      onClick={() => start("live", scenario, "stage_demo", { demonstration: true })}
                    >
                      <IconCamera size={15} /> {t("guide.liveAction")}
                    </button>
                  </div>
                </article>
              </div>
            </div>
          </section>

        </section>
      )}

      {isSessionStage && (
        <div className={`sessionShell ${stage === "calibration" ? "measurementShell" : ""}`}>
          {stage !== "calibration" && <Stepper stage={stage} />}
          <div className="sessionMain">
      {stage === "consent" && (
        <section className="workspace">
          <div className="sectionHeading">
            <span className="eyebrow">{t("consent.step")} · {t(isGateB ? "consent.purpose.gateB" : isGateA ? "consent.purpose.gateA" : isStageDemo ? "consent.purpose.stageDemo" : "consent.purpose.field")}</span>
            <h1>{t(isGateB ? "consent.title.gateB" : isGateA ? "consent.title.gateA" : isStageDemo ? "consent.title.stageDemo" : "consent.title.field")}</h1>
            <p>{t(isGateB ? "consent.lead.gateB" : isGateA ? "consent.lead.gateA" : isStageDemo ? "consent.lead.stageDemo" : "consent.lead.field")}</p>
          </div>
          <div className="formCard">
            <div className="formGrid">
              <label><span><IconChild size={14} />{t(isAdultParticipant ? "consent.field.participantId" : "consent.field.childId")}</span><input value={profile.childId} placeholder={isAdultParticipant ? undefined : t("consent.field.childIdPlaceholder")} onChange={(event) => setProfile({ ...profile, childId: event.target.value })} /></label>
              {isGateB
                ? <label><span><IconResearch size={14} />{t("consent.field.sessionKind")}</span><input value="Gate B · WebGazer agreement" disabled /></label>
                : isGateA
                  ? <label><span><IconResearch size={14} />{t("consent.field.sessionKind")}</span><select
                      value={positiveControl ? `kp-${positiveControl.condition}` : "engineering"}
                      onChange={(event) => setPositiveControl(event.target.value === "engineering"
                        ? null
                        : { condition: event.target.value === "kp-produksi" ? "produksi" : "biasa", attempt: positiveControl?.attempt ?? 1 })}
                    >
                      <option value="engineering">{t("consent.option.engineering")}</option>
                      <option value="kp-biasa">{t("consent.option.controlOrdinary")}</option>
                      <option value="kp-produksi">{t("consent.option.controlProduced")}</option>
                    </select></label>
                  : isStageDemo ? null
                  : <label><span><IconTimer size={14} />{t("consent.field.age")}</span><input type="number" min="16" max="30" value={profile.age} placeholder={t("consent.field.agePlaceholder")} onChange={(event) => setProfile({ ...profile, age: event.target.value })} /></label>}
              {positiveControl && <label><span><IconResearch size={14} />{t("consent.field.attempt")}</span><input type="number" min="1" max={MAX_POSITIVE_CONTROL_ATTEMPTS} value={positiveControl.attempt} onChange={(event) => setPositiveControl({ ...positiveControl, attempt: Number(event.target.value) })} /><small>{t("consent.field.attemptHint", { max: MAX_POSITIVE_CONTROL_ATTEMPTS })}</small></label>}
              {positiveControl && <label className="checkField"><span><IconResearch size={14} />{t("consent.field.speakerBehind")}</span><input type="checkbox" checked={Boolean(positiveControl.speakerBehind)} onChange={(event) => { const on = event.target.checked; if (!on) { callNameRef.current = ""; setCallNamePresent(false); setCallNameEnabled(false); } setPositiveControl({ ...positiveControl, speakerBehind: on }); }} /><small>{t("consent.field.speakerBehindHint")}</small></label>}
              {positiveControl && <label><span><IconTimer size={14} />{t("consent.field.viewingDistance")}</span><input type="number" min="200" max="1200" value={viewingDistanceMm} onChange={(event) => setViewingDistanceMm(Number(event.target.value))} /><small>{t("consent.field.viewingDistanceHint")}</small></label>}
              <label><span><IconLocation size={14} />{t("consent.field.site")}</span><input value={profile.site} placeholder={isAdultParticipant ? undefined : t("consent.field.sitePlaceholder")} onChange={(event) => setProfile({ ...profile, site: event.target.value })} /></label>
              <label><span><IconShieldCheck size={14} />{t("consent.field.operator")}</span><input value={profile.operator} placeholder={isAdultParticipant ? undefined : t("consent.field.operatorPlaceholder")} onChange={(event) => setProfile({ ...profile, operator: event.target.value })} /></label>
              {/* Response to name is quarantined out of the rule, but the index
                  is still reported, so a positive control may still supply a
                  name. Transient either way: it never reaches profile, the log,
                  or the network. */}

            </div>
            {isGateB && <div className="bridgeSetup" aria-label={t("consent.bridge.aria")}>
              <div className="bridgeSetupHead"><div><strong>{t("consent.bridge.title")}</strong><small>{t("consent.bridge.hint")}</small></div><span>{t("consent.bridge.tag")}</span></div>
              <div className="formGrid">
                <label><span>Pair ID</span><input value={bridgeMeta.pairId} onChange={(event) => setBridgeMeta({ ...bridgeMeta, pairId: event.target.value })} /></label>
                <label><span>Visit ID</span><input value={bridgeMeta.visitId} onChange={(event) => setBridgeMeta({ ...bridgeMeta, visitId: event.target.value })} /></label>
                <label><span>Tablet ID</span><input value={bridgeMeta.deviceId} onChange={(event) => setBridgeMeta({ ...bridgeMeta, deviceId: event.target.value })} /></label>
                <label><span>{t("consent.bridge.reference")}</span><input value={bridgeMeta.referenceDevice} disabled /></label>
                <label><span>{t("consent.bridge.acquisition")}</span><input value={t("consent.bridge.acquisitionValue")} disabled /></label>
                <label><span>{t("consent.bridge.order")}</span><input value={t("consent.bridge.orderValue")} disabled /></label>
                <label><span>{t("consent.bridge.screenWidth")}</span><input type="number" min="50" value={bridgeMeta.screenWidthMm} onChange={(event) => setBridgeMeta({ ...bridgeMeta, screenWidthMm: Number(event.target.value) })} /></label>
                <label><span>{t("consent.bridge.screenHeight")}</span><input type="number" min="50" value={bridgeMeta.screenHeightMm} onChange={(event) => setBridgeMeta({ ...bridgeMeta, screenHeightMm: Number(event.target.value) })} /></label>
                <label><span>{t("consent.field.viewingDistance")}</span><input type="number" min="200" value={bridgeMeta.viewingDistanceMm} onChange={(event) => setBridgeMeta({ ...bridgeMeta, viewingDistanceMm: Number(event.target.value) })} /></label>
              </div>
            </div>}
            {(!isEngineeringStudy || positiveControl?.speakerBehind) && <div className="nameCallField">
              <label className="checkRow optional">
                <input type="checkbox" checked={callNameEnabled} onChange={(event) => { const on = event.target.checked; setCallNameEnabled(on); if (!on) { callNameRef.current = ""; setCallNamePresent(false); } }} />
                <span><strong>{t("consent.name.toggleLead", { who: subjectWord })}</strong> {t("consent.name.toggleBody", { who: subjectWord })}</span>
              </label>
              {callNameEnabled && <label className="nameCallInput">
                <span><IconTimer size={14} />{t("consent.name.inputLabel", { who: subjectWord })}</span>
                <input key={String(positiveControl?.speakerBehind)} defaultValue="" placeholder={t("consent.name.inputPlaceholder")} onChange={(event) => { callNameRef.current = event.target.value; setCallNamePresent(event.target.value.trim().length > 0); }} />
                <small>{t("consent.name.inputHintBase")} {t(positiveControl ? "consent.name.inputHintControl" : "consent.name.inputHintField")}</small>
              </label>}
            </div>}
            <label className="checkRow">
              <input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} />
              <span><strong>{t(isAdultParticipant ? "consent.agree.participant" : "consent.agree.service")}</strong> {t(isGateB ? "consent.agree.gateB" : isGateA ? "consent.agree.gateA" : isStageDemo ? "consent.agree.stageDemo" : "consent.agree.field")}</span>
            </label>
            {isEngineeringStudy && <label className="checkRow optional">
              <input type="checkbox" checked={researchConsent} onChange={(event) => setResearchConsent(event.target.checked)} />
              <span><strong>{t(isGateB ? "consent.research.requiredLead" : "consent.research.optionalLead")}</strong> {t(isGateB ? "consent.research.gateB" : "consent.research.other")}</span>
            </label>}
            {consentIssues.length > 0 && (
              <p className="formBlockers" id="consent-blockers" role="status">
                <IconInfo size={15} aria-hidden="true" />
                <span>{t("consent.blockers", { issues: consentIssues.join(" · ") })}</span>
              </p>
            )}
            <div className="cardActions">
              <button className="secondary" onClick={() => { if (isAdminCapture) window.location.href = "/admin"; else goHome(); }}>{t("action.cancel")}</button>
              <button className="primary" disabled={consentIssues.length > 0} aria-describedby={consentIssues.length ? "consent-blockers" : undefined} onClick={beginAuditedSession}>{t(isGateA || isGateB ? "consent.next.device" : isStageDemo ? "consent.next.demo" : "consent.next.child")} <IconArrowRight size={16} /></button>
            </div>
          </div>
        </section>
      )}

      {stage === "preparation" && (
        <section className="workspace childPrepPage">
          <div className="sectionHeading">
            <span className="eyebrow">{t("prep.eyebrow")}</span>
            <h1>{t("prep.title")}</h1>
            <p>{t("prep.lead")}</p>
          </div>
          <div className="prepCard">
            <div className="prepIllustration" aria-hidden="true"><span><IconChild size={42} /></span><i><IconCamera size={24} /></i></div>
            <ol>
              <li><IconCheck size={16} /><span><strong>{t("prep.step1")}</strong><small>{t("prep.step1Hint")}</small></span></li>
              <li><IconCheck size={16} /><span><strong>{t("prep.step2")}</strong><small>{t("prep.step2Hint")}</small></span></li>
              <li><IconCheck size={16} /><span><strong>{t("prep.step3")}</strong><small>{t("prep.step3Hint")}</small></span></li>
              <li><IconCheck size={16} /><span><strong>{t("prep.step4")}</strong><small>{t("prep.step4Hint")}</small></span></li>
            </ol>
          </div>
          <div className="cardActions"><button className="primary" onClick={() => setStage("tutorial")}>{t("prep.next")} <IconArrowRight size={16} /></button></div>
        </section>
      )}

      {stage === "tutorial" && (
        <section className="workspace tutorialPage">
          <div className="sectionHeading"><span className="eyebrow">{t("tutorial.eyebrow")}</span><h1>{t("tutorial.title")}</h1><p>{t("tutorial.lead")}</p></div>
          <GuideFilm onComplete={() => setStage("device")} />
        </section>
      )}

      {stage === "device" && (
        <section className="workspace">
          <div className="sectionHeading">
            <span className="eyebrow">{t("device.eyebrow")}</span>
            <h1>{t(mode === "replay" ? "device.title.replay" : "device.title.live")}</h1>
            <p>{t(mode === "replay" ? "device.lead.replay" : "device.lead.live")}</p>
          </div>
          <div className="deviceGrid">
            <div className="cameraPanel">
              {mode === "live" ? (
                <><video ref={previewVideoRef} muted playsInline aria-label={t("device.previewAria")} /><TrackingOverlay snapshot={tracking} /></>
              ) : (
                <div className="replayVisual"><span><IconPlay size={11} /> REPLAY</span><i /><i /><i /></div>
              )}
              <span className={`cameraStatus ${deviceStatus}`}><i aria-hidden="true" />{t(deviceStatus === "passed" ? "device.status.passed" : deviceStatus === "failed" ? "device.status.failed" : deviceStatus === "checking" ? "device.status.checking" : "device.status.idle")}</span>
            </div>
            <div className="checkPanel">
              <div className="checkIntro"><span><IconGauge size={18} /></span><div><strong>{t("device.introTitle")}</strong><small>{t("device.introHint")}</small></div></div>
              <div className="readinessList">
                <div data-state={deviceDiagnostics ? (deviceDiagnostics.detections >= 9 ? "good" : "bad") : "idle"}><IconEye size={17} /><span><strong>{t("device.checkFace")}</strong><small>{t(deviceDiagnostics ? "device.checkFaceHint" : "device.checkFaceUnchecked")}</small></span><b>{deviceDiagnostics ? t(deviceDiagnostics.detections >= 9 ? "device.checkFaceOk" : "device.checkFaceBad") : "—"}</b></div>
                <div data-state={deviceDiagnostics ? (deviceDiagnostics.brightness >= 0.22 && deviceDiagnostics.brightness <= 0.92 ? "good" : "bad") : "idle"}><IconBrightness size={17} /><span><strong>{t("device.checkLight")}</strong><small>{t("device.checkLightHint")}</small></span><b>{deviceDiagnostics ? t(deviceDiagnostics.brightness >= 0.22 && deviceDiagnostics.brightness <= 0.92 ? "device.checkLightOk" : "device.checkLightBad") : "—"}</b></div>
                <div data-state={deviceDiagnostics ? (deviceDiagnostics.faceCoverage >= 0.08 && deviceDiagnostics.faceCoverage <= 0.6 ? "good" : "bad") : "idle"}><IconOrientation size={17} /><span><strong>{t("device.checkDistance")}</strong><small>{t("device.checkDistanceHint")}</small></span><b>{deviceDiagnostics ? t(deviceDiagnostics.faceCoverage < 0.08 ? "device.checkDistanceNear" : deviceDiagnostics.faceCoverage > 0.6 ? "device.checkDistanceFar" : "device.checkDistanceOk") : "—"}</b></div>
                <div data-state={deviceDiagnostics ? (deviceDiagnostics.detections >= 9 ? "good" : "bad") : "idle"}><IconChild size={17} /><span><strong>{t("device.checkFacing")}</strong><small>{t("device.checkFacingHint")}</small></span><b>{deviceDiagnostics ? t(deviceDiagnostics.detections >= 9 ? "device.checkFacingOk" : "device.checkFacingBad") : "—"}</b></div>
              </div>
              <div className={`deviceMessage ${deviceStatus}`} role="status" aria-live="polite">
                {deviceStatus === "passed" ? <IconCheck size={16} /> : deviceStatus === "failed" ? <IconAlert size={16} /> : <IconInfo size={16} />}
                <span>{t(deviceMessage)}</span>
              </div>
              <button className="primary wide" disabled={busy || (mode === "replay" && !model)} onClick={inspectDevice}>{busy ? <><span className="spinner" aria-hidden="true" /> {t("device.checking")}</> : <><IconGauge size={16} /> {t("device.runCheck")}</>}</button>
              <button className="secondary wide" disabled={deviceStatus !== "passed"} onClick={() => setStage("calibration")}>{t("device.startCalibration")} <IconArrowRight size={16} /></button>
              <details className="technicalDetails">
                <summary>{t("device.techSummary")}</summary>
                <dl>
                  <div><dt>{t("device.tech.mode")}</dt><dd>{t(mode === "live" ? (isGateB ? "device.tech.modeGateB" : isGateA ? "device.tech.modeGateA" : "device.tech.modeLive") : "device.tech.modeReplay")}</dd></div>
                  <div><dt>{t("device.tech.landmarks")}</dt><dd>{t("device.tech.landmarksValue")}</dd></div>
                  <div><dt>{t("device.tech.iris")}</dt><dd>{t("device.tech.irisValue")}</dd></div>
                  <div><dt>{t("device.tech.overlay")}</dt><dd>{t("device.tech.overlayValue")}</dd></div>
                  <div><dt>{t("device.tech.replayModel")}</dt><dd>{model ? model.model_version : modelError ? t(modelError) : t("device.tech.loading")}</dd></div>
                  <div><dt>{t("device.tech.liveClassification")}</dt><dd>{t("device.tech.liveClassificationValue")}</dd></div>
                  {deviceDiagnostics && <><div><dt>{t("device.tech.camera")}</dt><dd>{deviceDiagnostics.width}×{deviceDiagnostics.height} · {Math.round(deviceDiagnostics.frameRate)} fps</dd></div><div><dt>{t("device.tech.faceCoverage")}</dt><dd>{Math.round(deviceDiagnostics.faceCoverage * 100)}%</dd></div></>}
                </dl>
              </details>
            </div>
          </div>
        </section>
      )}

      {stage === "calibration" && (
        <section className="workspace calibrationPage" data-busy={busy ? "true" : "false"}>
          <div className="calibrationHud">
            <div className="calibrationHudBrand"><LogoMark size={25} /><span><small>{t("calib.step", { number: sessionStepPosition("calibration").number, total: sessionStepPosition("calibration").total })}</small><strong>{t("calib.hudTitle")}</strong></span></div>
            {busy && calibrationProgress ? <div className={`sampleProgress ${calibrationProgress.stable ? "stable" : ""}`} style={{ "--sample-progress": Math.min(1, calibrationProgress.accepted / CALIBRATION_STABLE_FRAMES) } as CSSProperties}><span><i /></span><div><strong>{calibrationProgress.target === activeTargets.length ? t("calib.finalCheck") : t("calib.position", { index: calibrationProgress.target + 1, total: activeTargets.length })}</strong><small>{t(calibrationProgress.stable ? "calib.stable" : "calib.waiting")}</small></div></div> : <span className="calibrationHudHint"><IconEye size={14} /> {t("calib.hudHint")}</span>}
            <button className="calibrationExit" disabled={busy} onClick={() => { void leaveMeasurementFullscreen(); setStage("device"); }}><IconArrowLeft size={15} /> {t("calib.exit")}</button>
          </div>
          <div className="calibrationBoard">
            {activeTargets.map(([x, y], index) => (
              <span key={`${x}-${y}`} className={`calibrationDot ${useTechnicalCalibration ? "technicalTarget" : "childTarget"} ${calibrationTarget === index ? "active" : calibrationTarget !== null && index < calibrationTarget ? "done" : ""}`} style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
                {useTechnicalCalibration
                  ? (calibrationTarget === index ? <i /> : index + 1)
                  // The character stays on screen while the target is active:
                  // the halo is drawn behind it, not instead of it.
                  : <><CalibrationCharacter active={calibrationTarget === index} />{calibrationTarget === index && <i />}</>}
              </span>
            ))}
            {calibrationTarget === activeTargets.length && <span className={`calibrationDot calibrationValidationDot active ${useTechnicalCalibration ? "technicalTarget" : "childTarget"}`} style={{ left: "50%", top: "50%" }}><i /></span>}
            {calibrationTarget === null && !calibration && !busy && <div className="calibrationSetup">
              {mode === "live" && <div className="calibrationSetupPreview"><video ref={calibrationVideoRef} muted playsInline aria-label={t("calib.previewAria")} /><TrackingOverlay snapshot={tracking} compact /></div>}
              <div className="calibrationSetupCopy">
                <span className="eyebrow">{t("calib.eyebrow")}</span>
                <h1>{t(useTechnicalCalibration ? "calib.title.technical" : "calib.title.child")}</h1>
                <p>{t(useTechnicalCalibration ? "calib.lead.technical" : "calib.lead.child")}</p>
                <div className="calibrationBriefGrid">
                  <article><span><IconCalibrationGrid size={17} /></span><div><strong>{t("calib.brief1")}</strong><small>{t(useTechnicalCalibration ? "calib.brief1Technical" : "calib.brief1Child")}</small></div></article>
                  <article><span><IconEye size={17} /></span><div><strong>{t("calib.brief2")}</strong><small>{t("calib.brief2Body")}</small></div></article>
                  <article><span><IconGauge size={17} /></span><div><strong>{t("calib.brief3")}</strong><small>{t("calib.brief3Body")}</small></div></article>
                </div>
                <div className="calibrationTruth"><IconInfo size={16} /><span>{isEngineeringStudy ? <><strong>{t(isGateB ? "calib.truth.gateB" : "calib.truth.gateA")}</strong> {t("calib.truth.engineeringBody")}</> : <><strong>{t("calib.truth.simLead")}</strong> {t("calib.truth.simBody")}</>}</span></div>
                {mode === "live" && <div className={`calibrationLiveState ${tracking?.accepted ? "good" : "bad"}`}><i /><span><strong>{trackingCopy(tracking, t).title}</strong><small>{tracking?.accepted ? t("calib.glassesHint") : trackingCopy(tracking, t).detail}</small></span></div>}
                <button className="primary amber" onClick={beginCalibration}><IconCalibrationGrid size={16} /> {t("calib.start", { what: t(useTechnicalCalibration ? "calib.startTechnical" : "calib.startChild") })}</button>
              </div>
            </div>}
            {calibrationTarget === TARGETS.length && <div className="validationLabel"><IconEye size={13} /> {t("calib.driftLabel")}</div>}
            {calibration && <div className={`calibrationResult ${calibration.errorDeg <= calibrationLimitDeg ? "passed" : "failed"}`}><strong>{t(calibration.errorDeg <= calibrationLimitDeg ? "calib.resultReady" : "calib.resultNotReady")}</strong><span>{t(calibration.errorDeg <= calibrationLimitDeg ? "calib.resultReadyHint" : "calib.resultNotReadyHint")}</span></div>}
          </div>
          <div className={`calibrationOutcome ${calibrationNote ? "visible" : ""}`}>
          {calibrationNote?.kind === "status" && !calibrationFailed && <p className="calibrationMessage passed" role="status" aria-live="polite"><IconCheck size={17} /> {t(calibrationNote.key, calibrationNote.label ? { label: calibrationNote.label } : undefined)}</p>}
          {calibrationFailed && <div className="recoveryCard" role="alert"><span><IconAlert size={20} /></span><div><small>{t(calibrationAttempts >= 2 ? "calib.limitReached" : "calib.whyFailed")}</small><strong>{recovery.title}</strong><p>{calibrationAttempts >= 2 ? t(sessionPurpose === "target_population_research" ? "calib.stopResearch" : "calib.stopOther") : recovery.action}</p></div>{calibrationAttempts < 2 && <button className="secondary" disabled={busy} onClick={beginCalibration}><IconRefresh size={15} /> {t("calib.retryOnce")}</button>}</div>}
          {calibration?.diagnostics && (
            <details className="calibrationTechnical">
              <summary>{t("calib.techSummary")}</summary>
              <div className="calibrationDiagnostics" aria-label={t("calib.diagnosticsAria")}>
              <Metric index={0} icon={IconCalibrationGrid} label={t("calib.metricCoverage")} value={`${calibration.diagnostics.trainingTargets}/9`} status={calibration.diagnostics.trainingTargets === 9 ? "good" : "bad"} />
              <Metric index={1} icon={IconSamples} label={t("calib.metricSamples")} value={`${calibration.diagnostics.trainingSamples}/${calibration.diagnostics.validationSamples}`} />
              <Metric index={2} icon={IconCoverage} label={t("calib.metricRange")} value={`${calibration.diagnostics.signalRangeU.toFixed(3)} / ${calibration.diagnostics.signalRangeV.toFixed(3)}`} />
              <Metric index={3} icon={IconGauge} label={t("calib.metricRmse")} value={`${calibration.diagnostics.trainingRmseDeg.toFixed(1)}°`} status={calibration.diagnostics.trainingRmseDeg <= 5 ? "good" : "bad"} />
              <Metric index={4} icon={IconGauge} label={t("calib.metricGridError", { limit: calibrationLimitDeg })} value={`${calibration.diagnostics.gridMedianErrorDeg.toFixed(1)}°`} status={calibration.diagnostics.gridMedianErrorDeg <= calibrationLimitDeg ? "good" : "bad"} />
              <Metric index={5} icon={IconEye} label={t("calib.metricDrift")} value={`${calibration.diagnostics.centerDriftDeg.toFixed(1)}°`} status={calibration.diagnostics.centerDriftDeg <= 5 ? "good" : undefined} />
              </div>
            </details>
          )}
          <div className="calibrationActions">
            <button className="secondary" onClick={() => { void leaveMeasurementFullscreen(); setStage("device"); }}><IconArrowLeft size={15} /> {t("action.back")}</button>
            {auditLog && sessionPurpose !== "target_population_research" && <button className="secondary" onClick={() => downloadCurrentAudit("operator_audit")}><IconDownload size={15} /> {t("calib.downloadAnalysis")}</button>}
            {auditLog && sessionPurpose === "target_population_research" && calibrationAttempts >= 2 && calibrationFailed && <button className="secondary" onClick={() => downloadCurrentAudit("operator_audit")}><IconDownload size={15} /> {t("calib.downloadDiagnostic")}</button>}
            {calibration && calibrationAttempts < 2 && <button className="primary amber" disabled={busy} onClick={beginCalibration}><IconRefresh size={16} /> {t("calib.retryOnce")}</button>}
            {calibrationAttempts >= 2 && calibrationFailed && <button className="secondary" onClick={goHome}>{t("calib.endTest")}</button>}
            <button className="primary dark" disabled={!calibration || calibration.errorDeg > calibrationLimitDeg} onClick={() => setStage("sanity")}>{t("calib.next")} <IconArrowRight size={16} /></button>
          </div>
          </div>
        </section>
      )}

      {stage === "sanity" && (
        <section className="workspace sanityPage">
          <div className="sectionHeading">
            <span className="eyebrow">{t("sanity.eyebrow")}</span>
            <h1>{t(sanityPassed === false ? (sanityAttempts >= 2 ? "sanity.title.blocked" : "sanity.title.failed") : "sanity.title.ready")}</h1>
            <p>{t(sanityPassed === false ? (sanityAttempts >= 2 ? "sanity.lead.blocked" : "sanity.lead.failed") : "sanity.lead.ready")}</p>
          </div>
          <div className={`sanityStage ${sanityPassed === true ? "passed" : sanityPassed === false ? "failed" : ""}`}>
            {sanityTarget ? <span className={`sanityCharacter ${sanityTarget}`} aria-label={t("sanity.characterAria", { side: t(sanityTarget === "left" ? "sanity.side.left" : sanityTarget === "right" ? "sanity.side.right" : "sanity.side.center") })}><IconChild size={34} /></span> : <span className="sanityPlaceholder"><IconEye size={34} /><strong>{t(sanityPassed === true ? "sanity.passedLabel" : "sanity.readyLabel")}</strong></span>}
          </div>
          {sanityPassed === false && <div className="falloutNotice" role="alert"><IconAlert size={20} /><div><strong>{t(sanityAttempts >= 2 ? "sanity.noticeBlocked" : "sanity.noticeRetry")}</strong><p>{t("sanity.noticeBody")}</p></div></div>}
          <div className="cardActions">
            {sanityPassed !== true && sanityAttempts < 2 && <button className="primary" disabled={busy} onClick={sanityPassed === false ? () => setStage("calibration") : runSanityCheck}>{t(busy ? "sanity.checking" : sanityPassed === false ? "sanity.retryCalibration" : "sanity.start")}</button>}
            {sanityPassed === false && sanityAttempts >= 2 && <><button className="secondary" onClick={() => setStage("device")}>{t("sanity.backToDevice")}</button><button className="primary" onClick={holdAfterSanityFailure}>{t("calib.endTest")}</button></>}
            {sanityPassed === true && <button className="primary" onClick={() => setStage("stimulus")}>{t("sanity.next")} <IconArrowRight size={16} /></button>}
          </div>
        </section>
      )}

      {stage === "quality" && quality && (
        <section className="workspace">
          <div className="sectionHeading">
            <span className="eyebrow">{t("quality.eyebrow")}</span>
            <h1>{t(quality.passed ? "quality.title.passed" : validity?.outcome === "RETRY_STAGE" ? "quality.title.retry" : "quality.title.failed")}</h1>
            <p>{quality.passed ? t("quality.lead.passed") : validity?.userMessage ?? t("quality.lead.fallback")}</p>
          </div>
          <div className="qualitySimpleGrid" aria-label={t("quality.summaryAria")}>
            <article><IconEye size={20} /><span><strong>{t("quality.face")}</strong><small>{t(quality.faceRate >= 0.85 ? "quality.faceGood" : "quality.faceBad")}</small></span></article>
            <article><IconCalibrationGrid size={20} /><span><strong>{t("quality.direction")}</strong><small>{t(validity?.primaryReasonCode === "CENTER_LOCK" || validity?.primaryReasonCode === "DIRECTION_REVERSED" ? "quality.directionBad" : "quality.directionOk")}</small></span></article>
            <article><IconJointAttention size={20} /><span><strong>{t("quality.phases")}</strong><small>{t(validity?.outcome === "RETRY_STAGE" ? "quality.phasesRetry" : quality.passed ? "quality.phasesOk" : "quality.phasesBad")}</small></span></article>
          </div>
          <details className="technicalDetails qualityTechnical">
            <summary>{t("quality.techSummary")}</summary>
            <div className="qualityGrid">
            <Metric index={0} icon={IconEye} label={t("quality.metricFace")} value={`${(quality.faceRate * 100).toFixed(0)}%`} status={quality.faceRate >= 0.85 ? "good" : "bad"} />
            <Metric index={1} icon={IconSignalHeld} label={t("quality.metricDropout")} value={`${(quality.gazeDropout * 100).toFixed(0)}%`} status={quality.gazeDropout <= 0.2 ? "good" : "bad"} />
            <Metric index={2} icon={IconCalibrationGrid} label={t("quality.metricCalibration", { limit: quality.calibrationLimitDeg ?? 5 })} value={`${decimal(quality.calibrationErrorDeg, 1, bcp47)}°`} status={quality.calibrationErrorDeg <= (quality.calibrationLimitDeg ?? 5) ? "good" : "bad"} />
            <Metric index={3} icon={IconBrightness} label={t("quality.metricBrightness")} value={`${Math.round(quality.brightness * 100)}%`} status={quality.brightness >= 0.22 && quality.brightness <= 0.92 ? "good" : "bad"} />
            <Metric index={4} icon={IconSamples} label={t("quality.metricSamples")} value={String(points.length)} status={points.length >= 100 ? "good" : "bad"} />
            {gazeDiagnostics && <Metric index={5} icon={IconRoute} label={t("quality.metricSegments")} value={`${gazeDiagnostics.segments} / ${Math.round(gazeDiagnostics.longestGapMs)} ms`} status={gazeDiagnostics.longestGapMs <= 180 ? "good" : "neutral"} />}
            <Metric index={6} icon={IconCoverage} label={t("quality.metricCoverage")} value={oodAssessment ? `${Math.round(oodAssessment.coverage * 100)}%` : t("quality.metricCoverageNone")} status={oodAssessment ? (oodAssessment.coverage === 1 ? "good" : "bad") : "neutral"} />
            <Metric index={7} icon={IconShieldCheck} label={t(mode === "live" ? "quality.metricReferenceLive" : "quality.metricReferenceReplay")} value={oodAssessment ? (oodAssessment.passed ? t("quality.metricReferenceIn") : t("quality.metricReferenceOut", { count: oodAssessment.flaggedFeatures.length })) : t("quality.metricNotAssessed")} status={mode === "live" ? "neutral" : oodAssessment ? (oodAssessment.passed ? "good" : "bad") : "neutral"} />
            <Metric index={8} icon={IconJointAttention} label={t("quality.metricPhaseCoverage")} value={`${Math.round((cueSummary?.phaseCoverage ?? 0) * 100)}%`} status={cueSummary?.phaseCoverage === 1 ? "good" : "bad"} />
            <Metric index={9} icon={IconTimer} label={t("quality.metricLatency")} value={latencyMs === null ? "—" : `${decimal(latencyMs, 1, bcp47)} ms`} status={latencyMs !== null && latencyMs < 100 ? "good" : "neutral"} />
            </div>
          </details>
          <div className={`gateDecision ${quality.passed ? "passed" : "failed"}`}>
            <span aria-hidden="true">{quality.passed ? <IconCheck size={20} /> : <IconAlert size={20} />}</span>
            <div><strong>{t(quality.passed ? "quality.gatePassed" : validity?.outcome === "RETRY_STAGE" ? "quality.gateRetry" : "quality.gateHeld")}</strong><p>{quality.passed ? t(mode === "live" && !isEngineeringStudy ? "quality.gateBodyField" : mode === "live" ? "quality.gateBodyLive" : "quality.gateBodyReplay") : validity?.operatorAction ?? t("quality.gateBodyFallback")}</p></div>
          </div>
          <div className="cardActions">
            <button className="secondary" onClick={validity?.outcome === "RETRY_STAGE" ? () => { setProgress(0); setStage("stimulus"); } : restart}><IconRefresh size={15} /> {t(validity?.outcome === "RETRY_STAGE" ? "quality.retryPhase" : "quality.retrySession")}</button>
            <button className="primary" onClick={() => setStage("report")}><IconReport size={16} /> {t(quality.passed ? "quality.openReport" : "quality.openHeldReport")}</button>
          </div>
        </section>
      )}

      {stage === "report" && quality && (
        <section className="workspace reportPage">
          {/* Label and badge on their own row, the conclusion beneath them at
              full width. Side by side, the badge took a quarter of the column
              and the headline broke over four lines in the remainder — the one
              sentence the room reads was the worst-set text on the page. */}
          <div className="reportHeader" data-verdict={verdict?.tone ?? "none"}>
            <div className="reportHeaderTop">
              <span className="eyebrow">{t("report.eyebrow", { id: profile.childId })}</span>
              <span className={`decisionBadge ${badge.tone}`}>
                {badge.tone === "research" ? <IconResearch size={14} /> : badge.tone === "refer" || (badge.tone === "demonstration" && referral.recommendsFollowUp) ? <IconScanpathSpread size={14} /> : badge.tone === "withheld" ? <IconSignalHeld size={14} /> : <IconScanpathFocus size={14} />}
                {badge.label}
              </span>
            </div>
            <h1>{isGateB ? t(quality.passed ? "report.title.gateBPassed" : "report.title.gateBHeld") : isGateA ? t(quality.passed ? "report.title.gateAPassed" : "report.title.gateAHeld") : reportPresentation.pageTitle}</h1>
            <p>{isGateB ? `${bridgeMeta.pairId} · ${bridgeMeta.visitId}` : isGateA ? t("report.metaGateA") : t("report.metaAgeMonths", { age: profile.age })} · {profile.site} · {new Date().toLocaleString(bcp47)}</p>
          </div>
          {/* One notice stack, one geometry. These used to be two full-width
              blocks with different borders, backgrounds and type sizes, and a
              third (the replay banner) further down inside the report — three
              screens of caveat before the reader reached the conclusion. Same
              sentences, one shell, read in one pass. */}
          <div className="reportNotices">
            <div className="reportNotice" data-kind={reportNotice.tone} role="status">
              <span aria-hidden="true">{reportNotice.tone === "demonstration" ? <IconResearch size={17} /> : <IconAlert size={17} />}</span>
              <p><strong>{reportNotice.lead}</strong> {reportNotice.body}</p>
            </div>
          </div>
          {!isEngineeringStudy && <CaregiverReport sections={reportPresentation.sections} surface="screen" />}
          <details className="reportPractitioner">
            <summary>
              <span>{t("report.practitionerSummary")}</span>
              <small>{t("report.practitionerHint")}</small>
            </summary>
            <div className="practitionerReport">
          {!isEngineeringStudy && quality.passed ? (
            <div className="observationReport">
              {/* The decision, before the measurement.
                  What used to greet a reader here was "92% waktu pada pola
                  geometrik" — a number, and a number is not an answer. The
                  sentence that answered it lived a screen and a half further
                  down at 1,4rem. Everything in this block was already on the
                  report; what changed is the order and the size. */}
              {verdict && <section className="sessionVerdict" data-tone={verdict.tone} aria-labelledby="verdict-heading">
                <div className="verdictHead">
                  <span className="verdictMark" aria-hidden="true">
                    {verdict.tone === "follow_up" ? <IconAlert size={26} /> : <IconCheck size={26} />}
                  </span>
                  <div>
                    <small>{verdict.demonstration ? t("report.verdictDemo") : t("report.verdictBasis", { lane: t(verdict.tone === "follow_up" ? "report.verdictLaneFollowUp" : "report.verdictLaneNone") })}</small>
                    <h2 id="verdict-heading">{verdict.subline}</h2>
                  </div>
                </div>
                {/* The composite lane's per-signal reasoning, stated once.
                    It used to be printed twice — here, and again as cards in
                    the section below, same label, same number, same citation —
                    because the verdict's reasons are the referral's signals
                    mapped one to one. What only the cards carried was the
                    assessable/deviant status, so that moves up here and the
                    duplicate goes away. */}
                <ol className="verdictReasons">
                  {verdict.reasons.map((reason) => {
                    const signal = referral.signals.find((item) => item.id === reason.id);
                    return <li key={reason.id} data-status={signal?.status ?? "none"}>
                      <div className="verdictReasonTop">
                        <strong>{reason.label}</strong>
                        {signal && <span className="signalStatus">{signalStatusLabel(signal.status, t)}</span>}
                      </div>
                      <p className="verdictMeasured">{reason.measured}</p>
                      <p>{reason.body}</p>
                      <small>{reason.source}</small>
                    </li>;
                  })}
                </ol>
                <p className="verdictCaveat"><IconSignalHeld size={15} /> <span>{verdict.caveat}</span></p>
              </section>}
              {/* Lane 1, in one container instead of three.
                  The headline, the six indices and the per-scene numbers are
                  one thought — what this session measured — and they were three
                  separately-bordered blocks with three different paddings. Each
                  index now leads with its number and carries its provenance in
                  the size provenance deserves, so a card is a number with a
                  short caption. */}
              <section className="measurementLane" data-demoted={String(Boolean(verdict))} aria-labelledby="measurement-heading">
                <div className="laneHead">
                  <small>{t("report.measuredKicker")}</small>
                  <h2 id="measurement-heading">{sessionOutcome.headline}</h2>
                  <p>{sessionOutcome.summaryLine}</p>
                  <span className="observationStatus"><IconCheck size={14} /> {geoprefResult ? t("report.samplesInArea", { count: geoprefResult.validSamples }) : t("report.notMeasured")} <i /> <IconSignalHeld size={14} /> {t("report.notDiagnosis")}</span>
                </div>
                <div className="observationMetrics" role="list" aria-label={t("report.indicesAria")}>
                  <article role="listitem"><span><IconScanpathSpread size={17} /> {t("report.indexGeometric")}</span><strong>{geoprefResult?.percentGeometric == null ? "—" : <Ticker value={geoprefResult.percentGeometric * 100} format={(n) => `${Math.round(n)}%`} />}</strong><p>{geoprefResult?.percentGeometricCi
                    ? t("report.indexGeometricCi", { low: Math.round(geoprefResult.percentGeometricCi[0] * 100), high: Math.round(geoprefResult.percentGeometricCi[1] * 100) })
                    : t("report.indexGeometricHeld")}</p></article>
                  <article role="listitem"><span><IconJointAttention size={17} /> {t("report.indexCue")}</span><strong>{jointAttention ? `${jointAttention.trialsFollowed}/${jointAttention.trialsScored}` : "—"}</strong><p>{jointAttention?.pValue == null ? t("report.indexCueNone") : t("report.indexCueP", { p: decimal(jointAttention.pValue, 3, bcp47) })}</p></article>
                  <article role="listitem"><span><IconEye size={17} /> {t("report.indexFacing")}</span><strong>{phenotype.facingForward.proportion == null ? "—" : `${Math.round(phenotype.facingForward.proportion * 100)}%`}</strong><p>{t("report.indexFacingNote")}</p></article>
                  <article role="listitem"><span><IconRoute size={17} /> {t("report.indexHead")}</span><strong>{phenotype.headMovement.rangePerSecond == null ? "—" : decimal(phenotype.headMovement.rangePerSecond, 3, bcp47)}</strong><p>{t("report.indexHeadNote")}</p></article>
                  <article role="listitem"><span><IconTimer size={17} /> {t("report.indexName")}</span><strong>{phenotype.responseToName.proportion == null ? "—" : `${phenotype.responseToName.responses}/${phenotype.responseToName.callsDelivered}`}</strong><p>{phenotype.responseToName.medianLatencyMs == null ? t("report.indexNameNone") : t("report.indexNameMedian", { ms: Math.round(phenotype.responseToName.medianLatencyMs) })}</p></article>
                  <article role="listitem"><span><IconGauge size={17} /> {t("report.indexBlink")}</span><strong>{phenotype.blinkSocial.blinksPerMinute == null ? "—" : t("report.indexBlinkUnit", { value: decimal(phenotype.blinkSocial.blinksPerMinute, 1, bcp47) })}</strong><p>{t("report.indexBlinkNote")}</p></article>
                </div>
                {cueSummary && <section className="reportTechnical observationDetails"><h3>{t("report.sceneNumbers")}</h3><div className="cueRows">{STIMULUS_PHASES.filter((phase) => phase.target === "left" || phase.target === "right").map((phase) => { const response = cueSummary.targetResponse[phase.id]; const face = cueSummary.dwellShare[phase.id]?.face; return <div key={phase.id}><span>{phaseLabel(phase.id, phase.label, locale)}</span><strong>{response ? t("report.sceneOnTarget", { percent: Math.round(response.probability * 100) }) : t("report.sceneUnread")}</strong><small>{face == null ? t("report.sceneFaceNa") : t("report.sceneFace", { percent: Math.round(face * 100) })}{response?.latencyMs == null ? "" : t("report.sceneLatency", { ms: Math.round(response.latencyMs) })}</small></div>; })}</div><p>{t("report.sceneNote")}</p></section>}
              </section>
              {/* Lane 2's rule, kept separable from lane 1 and stated once.
                  The signal cards live in the verdict above whenever there is a
                  verdict; here they would be the same four lines a second time.
                  Without a verdict — nothing assessable — this is the only place
                  the signals appear, so they stay. */}
              {!isEngineeringStudy && <section className="referralLane" aria-labelledby="referral-heading" data-recommends={String(referral.recommendsFollowUp)} data-compact={String(Boolean(verdict))}>
                <div className="laneHead">
                  <small>{t("report.referralKicker")}</small>
                  <h2 id="referral-heading">{compositeHeadline}</h2>
                  {/* Counted from the rule, not retyped: the copy said "empat sinyal" for a
                      while after the blink signal was dropped and the rule became three. */}
                  <p>{t("report.referralExplainer", {
                    countWord: numberWordCapitalized(referral.signals.length, locale),
                    restWord: numberWord(referral.signals.length - 1, locale),
                    threshold: referral.threshold,
                  })}</p>
                </div>
                {!verdict && <ul className="referralSignals">
                  {referral.signals.map((item) => <li key={item.id} data-status={item.status}>
                    <div className="referralSignalTop"><strong>{item.label}</strong><span className="signalStatus">{signalStatusLabel(item.status, t)}</span></div>
                    <p className="referralMeasured">{item.measured}</p>
                    <p className="referralReason">{item.reason}</p>
                    <small>{item.source}</small>
                  </li>)}
                </ul>}
                <p className="referralLimit">{t("report.referralLimit")}</p>
              </section>}
              {/* The fallback, not the main event.
                  The verdict block above says all of this and says it first, so
                  keeping both would have the report explain its conclusion twice
                  and make the conclusion feel less settled for it. What this
                  still covers is the session with nothing assessable — the
                  shipped field path today — where there is no verdict to state
                  and the reader is owed the explanation anyway. */}
              {!verdict && <section className="observationAnswer">
                <span className="observationQuestion"><IconInfo size={20} /></span>
                {/* Three answers, because there are three situations.
                    This section used to switch on emitsReferral alone, which
                    demonstration mode forces to false — so a report whose
                    composite lane had just recommended a follow-up asked, one
                    heading later, why the result did not mean the child was
                    safe. The app disagreeing with itself in front of an
                    audience costs more than the sentence it saved.
                    recommendsFollowUp without emitsReferral is reachable only
                    in a demonstration: in the field the composite needs the
                    geometric signal assessable, and that needs the threshold
                    applied. */}
                <div><small>{t("report.howToRead")}</small><h2>{t(sessionOutcome.emitsReferral || referral.recommendsFollowUp ? "report.whyFollowUp" : "report.whyNotSafe")}</h2><p>{sessionOutcome.emitsReferral
                  ? t("report.whyEmits")
                  : referral.recommendsFollowUp
                    ? t("report.whyDemo", {
                        trials: jointAttention
                          ? t("report.whyDemoTrials", { followed: jointAttention.trialsFollowed, scored: jointAttention.trialsScored })
                          : t("report.whyDemoTrialsFallback"),
                      })
                    : t("report.whyBelow")}</p></div>
              </section>}
              {/* A legend, sized like one. Three states of lane 1 with the
                  session's own state marked; it explains the report rather than
                  adding to it, so it reads at reference size, not at the size
                  of the conclusion it sits under. */}
              <section className="decisionRules" aria-labelledby="decision-rules-heading">
                <div className="laneHead">
                  <small>{t("report.rulesKicker")}</small>
                  <h2 id="decision-rules-heading">{t("report.rulesHeading")}</h2>
                </div>
                <div className="decisionRuleGrid">
                  <article aria-current={sessionOutcome.kind === "WITHHELD" ? "true" : undefined} className={sessionOutcome.kind === "WITHHELD" ? "current" : ""}><span className="ruleIcon withheld"><IconSignalHeld size={16} /></span><div><small>{t("report.ruleHeldLabel")}</small><strong>{t("report.ruleHeldTitle")}</strong><p>{t("report.ruleHeldBody")}</p></div></article>
                  <article aria-current={sessionOutcome.kind === "MEASURED_NO_RULE_IN" || sessionOutcome.kind === "MEASURED_PROTOCOL_ABBREVIATED" ? "true" : undefined} className={sessionOutcome.kind === "MEASURED_NO_RULE_IN" || sessionOutcome.kind === "MEASURED_PROTOCOL_ABBREVIATED" ? "current" : ""}><span className="ruleIcon measured"><IconResearch size={16} /></span><div><small>{t("report.ruleMeasuredLabel")}</small><strong>{t("report.ruleMeasuredTitle")}</strong><p>{t("report.ruleMeasuredBody")}</p></div></article>
                  <article aria-current={sessionOutcome.emitsReferral ? "true" : undefined} className={sessionOutcome.emitsReferral ? "current" : ""}><span className="ruleIcon alert"><IconAlert size={16} /></span><div><small>{t("report.ruleReferLabel")}</small><strong>{t("report.ruleReferTitle")}</strong><p>{t("report.ruleReferBody")}</p></div></article>
                </div>
              </section>
              <section className="resultNext"><span><IconRoute size={20} /></span><div><small>{t("report.nextKicker")}</small><h2>{t("report.nextHeading")}</h2><p>{t("report.nextBody")}</p></div></section>
            </div>
          ) : mode === "live" && isEngineeringStudy ? (
            <div className="researchPanel">
              <span className={`stateArt ${quality.passed ? "passed" : "withheld"}`} aria-hidden="true">{quality.passed ? <IconCheck size={26} /> : <IconSignalHeld size={26} />}</span>
              <div>
                <span className="reportKicker">{t("report.engKicker")}</span>
                <h2>{t(quality.passed ? "report.engPassed" : "report.engFailed")}</h2>
                <p>{quality.passed ? t("report.engPassedBody") : quality.reasons.join(" ")}</p>
                <div className="reportOutcomeGrid">
                  <article><span><IconCamera size={16} /> {t("report.engCamera")}</span><strong>{t("report.engFramesRead", { percent: Math.round(quality.faceRate * 100) })}</strong><small>{deviceDiagnostics?.frameRate ? `${Math.round(deviceDiagnostics.frameRate)} fps · ` : ""}{quality.gazeDropout === 0 ? t("report.engNoDropout") : t("report.engDropout", { percent: Math.round(quality.gazeDropout * 100) })}</small></article>
                  <article><span><IconCalibrationGrid size={16} /> {t("report.engCalibration")}</span><strong>{decimal(quality.calibrationErrorDeg, 1, bcp47)}° · {t(quality.calibrationErrorDeg <= (quality.calibrationLimitDeg ?? 5) ? "report.engPass" : "report.engFail")}</strong><small>{t("report.engCalibrationLimit", { limit: quality.calibrationLimitDeg ?? 5 })}{calibration?.diagnostics?.validationErrorDeg != null ? t("report.engCalibrationValidation", { value: decimal(calibration.diagnostics.validationErrorDeg, 1, bcp47) }) : ""}</small></article>
                  <article><span><IconJointAttention size={16} /> {t("report.engStimulus")}</span><strong>{t("report.engPhaseCoverage", { percent: Math.round((cueSummary?.phaseCoverage ?? 0) * 100) })}</strong><small>{t("report.engPhaseDetail", { samples: points.length, adequate: cueSummary?.adequatePhaseCount ?? 0, expected: cueSummary?.expectedPhaseCount ?? 0 })}</small></article>
                </div>
                <div className="validationLadder" aria-label={t("report.ladderAria")}>
                  {isGateB ? <>
                    <article data-state={quality.passed ? "passed" : "failed"}><span>{quality.passed ? <IconCheck size={15} /> : <IconAlert size={15} />}</span><div><strong>{t("report.ladderTablet", { state: t(quality.passed ? "report.ladderTabletReady" : "report.ladderTabletHeld") })}</strong><small>{t("report.ladderTabletNote")}</small></div></article>
                    <article data-state="pending"><span><IconTimer size={15} /></span><div><strong>{t("report.ladderPair")}</strong><small>{t("report.ladderPairNote")}</small></div></article>
                  </> : <>
                    <article data-state={quality.passed ? "passed" : "failed"}><span>{quality.passed ? <IconCheck size={15} /> : <IconAlert size={15} />}</span><div><strong>{t(quality.passed ? "report.ladderGateAPass" : "report.ladderGateAFail")}</strong><small>{t("report.ladderGateANote")}</small></div></article>
                    <article data-state="passed"><span><IconCheck size={15} /></span><div><strong>{t("report.ladderGateB")}</strong><small>{t("report.ladderGateBNote")}</small></div></article>
                  </>}
                  <article data-state="locked"><span><IconShieldCheck size={15} /></span><div><strong>{t("report.ladderGateC")}</strong><small>{t("report.ladderGateCNote")}</small></div></article>
                </div>
                <div className="reportNextStep">
                  <span><IconRoute size={18} /></span>
                  <div><strong>{t("report.nextKicker")}</strong><p>{t(isGateB ? "report.engNextGateB" : "report.engNextGateA")}</p></div>
                </div>
                {positiveControl && <div className="positiveControlReadout">
                  <div className="positiveControlHead">
                    <div>
                      <strong>{t("report.controlTitle")}</strong>
                      <small>{t("report.controlMeta", { condition: t(positiveControl.condition === "biasa" ? "report.controlOrdinary" : "report.controlProduced"), attempt: positiveControl.attempt })}</small>
                    </div>
                    <span>{t("report.controlCopy")}</span>
                  </div>
                  <dl>
                    <div><dt>sinyal_geopref</dt><dd>{referral.signals.find((item) => item.id === "geometric_preference")?.status ?? "-"}</dd></div>
                    <div><dt>sinyal_isyarat</dt><dd>{referral.signals.find((item) => item.id === "cue_following")?.status ?? "-"}</dd></div>
                    {/* Descriptive only. The signal is quarantined out of the rule,
                        so the sheet records what was measured, not a verdict. */}
                    <div><dt>sinyal_nama</dt><dd>{positiveControl?.speakerBehind ? t("report.controlQuarantined", { responses: phenotype.responseToName.responses, calls: phenotype.responseToName.callsDelivered }) : t("report.controlUnused")}</dd></div>
                    <div><dt>komposit_menyala</dt><dd>{t(referral.recommendsFollowUp ? "report.controlYes" : "report.controlNo")}</dd></div>
                    <div><dt>outcome</dt><dd>{geoprefResult?.outcome ?? "-"}</dd></div>
                  </dl>
                  {/* The rule firing here says the instrument moved when a pattern
                      was produced on request. It says nothing about the adult who
                      produced it, and this session emits no referral either way. */}
                  <p><strong>{t("report.controlNoteLead")}</strong> {t("report.controlNoteBody")}</p>
                </div>}
                {cueSummary && <div className="cueReadout">
                  <div className="cueReadoutHead"><div><strong>{t("report.cueTitle")}</strong><small>{t("report.cueHint")}</small></div><span>{t("report.cueTag")}</span></div>
                  <div className="cueRows">
                    {STIMULUS_PHASES.filter((phase) => phase.target === "left" || phase.target === "right").map((phase) => {
                      const response = cueSummary.targetResponse[phase.id];
                      return <div key={phase.id}><span>{phaseLabel(phase.id, phase.label, locale)}</span><strong>{response ? t("report.cuePostCue", { percent: Math.round(response.probability * 100) }) : t("report.sceneUnread")}</strong><small>{response?.latencyMs == null ? t("report.cueLatencyNa") : t("report.cueLatency", { ms: Math.round(response.latencyMs) })}{response?.targetLift == null ? "" : t("report.cueLift", { sign: response.targetLift >= 0 ? "+" : "", points: Math.round(response.targetLift * 100) })}</small></div>;
                    })}
                  </div>
                  <p>{t("report.cueNote")}</p>
                </div>}
                <section className="reportTechnical">
                  <h3>{t("report.techTitle")}</h3>
                  <dl>
                    <div><dt>{t("report.techCarette")}</dt><dd>{riskInterpretable ? decimal(risk ?? 0, 2, bcp47) : t("report.techCaretteRejected")}</dd></div>
                    <div><dt>{t("report.techOutOfRange")}</dt><dd>{oodAssessment?.flaggedFeatures.length ? oodAssessment.flaggedFeatures.slice(0, 3).join(", ") : t("report.techNone")}</dd></div>
                    <div><dt>{t("report.techCoverage")}</dt><dd>{oodAssessment ? t("report.techCoverageValue", { percent: Math.round(oodAssessment.coverage * 100), verdict: t(oodAssessment.passed ? "report.engPass" : "report.techFlag") }) : t("quality.metricNotAssessed")}</dd></div>
                    <div><dt>{t("report.techStimulus")}</dt><dd>{STIMULUS_VERSION}</dd></div>
                    <div><dt>{t("report.techLatency")}</dt><dd>{latencyMs === null ? "n/a" : `${decimal(latencyMs, 1, bcp47)} ms`}</dd></div>
                    <div><dt>{t("report.techAoi")}</dt><dd>{AOI_VERSION} / {Object.keys(cueSummary?.occupancy ?? {}).length}</dd></div>
                    <div><dt>{t("report.techBattery")}</dt><dd>{deviceDiagnostics?.batteryLevel == null ? t("report.techBatteryNa") : `${Math.round(deviceDiagnostics.batteryLevel * 100)}%`}</dd></div>
                    <div><dt>{t("report.techThermal")}</dt><dd>{t("report.techThermalNa")}</dd></div>
                    <div><dt>{t("report.techSessionId")}</dt><dd>{auditLog?.sessionId.slice(0, 12) ?? "n/a"}</dd></div>
                    <div><dt>{t("report.techMedia")}</dt><dd>{t("report.techMediaValue")}</dd></div>
                  </dl>
                </section>
              </div>
            </div>
          ) : (
            <div className={`withheldPanel ${mode === "live" && !isEngineeringStudy && quality.passed ? "validCapture" : ""}`}>
              <span className={`stateArt ${mode === "live" && !isEngineeringStudy && quality.passed ? "passed" : "withheld"}`} aria-hidden="true">{mode === "live" && !isEngineeringStudy && quality.passed ? <IconCheck size={26} /> : <IconSignalHeld size={26} />}</span>
              {mode === "live" && !isEngineeringStudy && quality.passed ? <div><small>{t("report.modelMissingKicker")}</small><h2>{t("report.modelMissingTitle")}</h2><p>{t("report.modelMissingBody")}</p><div className="captureStatusGrid"><article><span>{t("report.captureQuality")}</span><strong>{t("report.capturePassed")}</strong><small>{t("report.captureQualityDetail", { face: Math.round(quality.faceRate * 100), dropout: Math.round(quality.gazeDropout * 100) })}</small></article><article><span>{t("report.engStimulus")}</span><strong>{t("report.capturePhases", { adequate: cueSummary?.adequatePhaseCount ?? 0, expected: cueSummary?.expectedPhaseCount ?? 0 })}</strong><small>{t("report.captureSamples", { count: points.length })}</small></article><article><span>{t("report.captureEstimate")}</span><strong>{t("report.captureHeld")}</strong><small>{t("report.captureCheckModel")}</small></article></div><div className="reportNextStep"><span><IconDownload size={18} /></span><div><strong>{t("report.nextKicker")}</strong><p>{t("report.modelMissingNext")}</p></div></div><section className="reportTechnical"><h3>{t("report.techSessionSummary")}</h3><p><strong>{t("report.techStatusLabel")}</strong> {t("report.techStatusValue")}</p><p><strong>{t("report.techCalibrationLabel")}</strong> {decimal(quality.calibrationErrorDeg, 2, bcp47)}°.</p><p><strong>{t("report.techModelLabel")}</strong> {modelError ? t(modelError) : t("report.techModelFallback")}.</p></section></div> : <div><small>{t("report.heldKicker")}</small><h2>{t("report.heldTitle")}</h2><p>{validity?.userMessage ?? t("report.heldBody")}</p><h3>{t("report.heldWhatNow")}</h3><ol><li>{t("report.heldStep1")}</li><li>{t("report.heldStep2")}</li><li>{t("report.heldStep3")}</li><li>{t("report.heldStep4")}</li></ol>{validity?.primaryReasonCode && <section className="reportTechnical"><h3>{t("report.heldDetail")}</h3><p><strong>{t("report.heldMainIssue")}</strong> {validity.userMessage}</p>{validity.invalidStages.length > 0 && <p><strong>{t("report.heldStages")}</strong> {validity.invalidStages.join(", ")}</p>}<p><strong>{t("report.heldAdvice")}</strong> {validity.operatorAction}</p><code>reasonCode={validity.primaryReasonCode}</code></section>}</div>}
            </div>
          )}
          {/* Research panel. The Carette model ships, runs, and produces a
              number every session; the guard decides whether that number may be
              read. Until now the refusal was invisible, so the strongest piece
              of engineering in the project looked from the outside like an
              absence of one. This shows the refusal happening. */}
          <section className="researchLane" aria-labelledby="research-panel-heading">
            <div className="laneHead">
              <small>{t("report.researchKicker")}</small>
              <h2 id="research-panel-heading">{t("report.researchHeading")}</h2>
              <p>{t("report.researchLead")}</p>
            </div>
            <div className="researchLaneGrid">
              <article><span>{t("report.researchModel")}</span><strong>{model?.model_version ?? t("report.researchModelNone")}</strong><small>{modelError ? t(modelError) : t("report.researchModelNote")}</small></article>
              <article data-verdict={oodAssessment ? (oodAssessment.passed ? "pass" : "reject") : "none"}><span>{t("report.researchGuard")}</span><strong>{t(oodAssessment ? (oodAssessment.passed ? "report.researchGuardPass" : "report.researchGuardReject") : "report.researchGuardNone")}</strong><small>{oodAssessment ? t("report.researchGuardNote", { count: oodAssessment.flaggedFeatures.length, coverage: Math.round(oodAssessment.coverage * 100) }) : t("report.researchGuardNoRef")}</small></article>
              <article><span>{t("report.researchOutput")}</span><strong>{riskInterpretable && risk !== null ? decimal(risk, 2, bcp47) : t("report.researchOutputHeld")}</strong><small>{t(riskInterpretable ? "report.researchOutputNote" : "report.researchOutputRejected")}</small></article>
              <article><span>{t("report.researchDistance")}</span><strong>{oodAssessment && Number.isFinite(oodAssessment.maxRobustZ) ? t("report.researchDistanceZ", { value: decimal(oodAssessment.maxRobustZ, 1, bcp47) }) : "—"}</strong><small>{oodAssessment?.multivariateDistance == null ? t("report.researchDistanceNote") : t("report.researchMahalanobis", { value: decimal(oodAssessment.multivariateDistance, 1, bcp47) })}</small></article>
            </div>
            {/* When a session is withheld the operator is told to try again but
                never told which gate refused. That is the one thing they need
                in order to change anything about the next attempt. */}
            {!quality.passed && quality.reasons.length > 0 && <div className="gateReasons">
              <strong>{t("report.gateReasons")}</strong>
              <ul>{quality.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            </div>}
            {oodAssessment && oodAssessment.featureDistance.length > 0 && <section className="reportTechnical">
              <h3>{t("report.oodTitle")}</h3>
              {/* Five columns of numbers do not fit a phone. They scroll inside
                  their own box rather than pushing the whole report sideways. */}
              <div className="tableScroll" tabIndex={0} role="region" aria-label={t("report.oodAria")}>
                <table className="oodTable">
                  <thead><tr><th scope="col">{t("report.oodFeature")}</th><th scope="col">{t("report.oodSession")}</th><th scope="col">{t("report.oodMedian")}</th><th scope="col">{t("report.oodRobustZ")}</th><th scope="col">{t("report.oodStatus")}</th></tr></thead>
                  <tbody>
                    {oodAssessment.featureDistance.map((item) => <tr key={item.name} data-outside={String(item.outside)}>
                      <th scope="row">{item.name}</th>
                      <td>{item.value == null ? "—" : decimal(item.value, 3, bcp47)}</td>
                      <td>{decimal(item.median, 3, bcp47)}</td>
                      <td>{item.robustZ == null ? "—" : decimal(item.robustZ, 1, bcp47)}</td>
                      <td>{t(item.robustZ == null ? "report.oodNotComputed" : item.outside ? "report.oodOutside" : "report.oodInside")}</td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
              <p>{t("report.oodNote")}</p>
            </section>}
          </section>
            </div>
          </details>
          {/* Paper hand-off. A kader gives the Puskesmas a sheet, not audit.json,
              so the printed page carries the result, its provenance, and the
              claim limits without any of the on-screen chrome. */}
          <PrintableReport
            title={t("print.title")}
            metadata={[
              { label: t("print.childId"), value: profile.childId },
              { label: t("print.age"), value: profile.age ? t("report.metaAgeMonths", { age: profile.age }) : "—" },
              { label: t("print.site"), value: profile.site },
              { label: t("print.operator"), value: profile.operator },
              { label: t("print.time"), value: new Date().toLocaleString(bcp47, { dateStyle: "long", timeStyle: "short" }) },
              { label: t("print.source"), value: reportSourceKind === "live" ? t("print.sourceLive") : reportSourceKind === "recorded_replay" && recording ? t("print.sourceRecording", { label: recording.label }) : t("print.sourceSynthetic") },
              { label: t("print.appVersion"), value: t("chrome.version", { version: APP_VERSION }) },
            ]}
            sections={reportPresentation.sections}
            disclaimer={t("print.disclaimer")}
            demonstrationBanner={reportPresentation.demoBanner}
            qualityPassed={quality.passed}
            validityCanScore={Boolean(validity?.canScore)}
            technicalSummary={<>
            {/* The sheet leads with the same sentence the screen led with. A
                printout whose first line is a percentage hands the reader the
                job of drawing the conclusion, which is the job the report is
                supposed to have done. The per-signal reasons are not repeated
                here — the composite table below already carries them. */}
            {verdict && <>
              <h2>{t("print.conclusion")}</h2>
              <p className="printVerdict" data-tone={verdict.tone}>{verdict.headline}</p>
              <p>{verdict.subline}</p>
              {verdict.reasons.filter((reason) => reason.id === "posterior_odds").map((reason) => (
                <p key={reason.id}><strong>{reason.label}: {reason.measured}.</strong> {reason.body}</p>
              ))}
              <p>{verdict.caveat}</p>
            </>}
            <h2>{t("print.measurementSummary")}</h2>
            <p className="printHeadline">{sessionOutcome.headline}</p>
            <p>{sessionOutcome.summaryLine}</p>
            <p><strong>{t("print.autoReferral")}</strong> {t(sessionOutcome.emitsReferral ? "print.autoReferralYes" : "print.autoReferralNo")}</p>
            {!isEngineeringStudy && <>
              <h2>{t("print.compositeHeading")}</h2>
              <p className="printHeadline">{compositeHeadline}</p>
              <table>
                <tbody>
                  {referral.signals.map((item) => <tr key={item.id}>
                    <th scope="row">{item.label}</th>
                    <td>{signalStatusLabel(item.status, t)}</td>
                    <td>{item.measured}. {item.reason} ({item.source})</td>
                  </tr>)}
                </tbody>
              </table>
              <p>{t("print.compositeNote", { threshold: referral.threshold })}</p>
            </>}
            <h2>{t("print.measuredHeading")}</h2>
            <table>
              <tbody>
                <tr><th scope="row">{t("print.rowGeometric")}</th><td>{geoprefResult?.percentGeometric == null ? "—" : `${Math.round(geoprefResult.percentGeometric * 100)}%${geoprefResult.percentGeometricCi ? ` (${Math.round(geoprefResult.percentGeometricCi[0] * 100)}–${Math.round(geoprefResult.percentGeometricCi[1] * 100)}%)` : ""}`}</td><td>{t("print.rowGeometricNote")}</td></tr>
                <tr><th scope="row">{t("print.rowCue")}</th><td>{jointAttention ? `${jointAttention.trialsFollowed}/${jointAttention.trialsScored}` : "—"}</td><td>{t("print.rowDescriptive")}</td></tr>
                <tr><th scope="row">{t("print.rowFacing")}</th><td>{phenotype.facingForward.proportion == null ? "—" : `${Math.round(phenotype.facingForward.proportion * 100)}%`}</td><td>{t("print.rowFacingNote")}</td></tr>
                <tr><th scope="row">{t("print.rowHead")}</th><td>{phenotype.headMovement.rangePerSecond == null ? "—" : decimal(phenotype.headMovement.rangePerSecond, 3, bcp47)}</td><td>{t("print.rowHeadNote")}</td></tr>
                <tr><th scope="row">{t("print.rowName")}</th><td>{phenotype.responseToName.proportion == null ? "—" : `${phenotype.responseToName.responses}/${phenotype.responseToName.callsDelivered}`}</td><td>{t("print.rowDescriptive")}</td></tr>
                <tr><th scope="row">{t("print.rowBlink")}</th><td>{phenotype.blinkSocial.blinksPerMinute == null ? "—" : t("report.indexBlinkUnit", { value: decimal(phenotype.blinkSocial.blinksPerMinute, 1, bcp47) })}</td><td>{t("print.rowDescriptive")}</td></tr>
                <tr><th scope="row">{t("print.rowQuality")}</th><td>{t(quality.passed ? "print.rowQualityPassed" : "print.rowQualityHeld")}</td><td>{t("print.rowQualityNote", { face: Math.round(quality.faceRate * 100), error: decimal(quality.calibrationErrorDeg, 1, bcp47) })}</td></tr>
              </tbody>
            </table>
            <h2>{t("print.limitsHeading")}</h2>
            <ul>
              <li>{t("print.limit1")}</li>
              <li>{t("print.limit2")}</li>
              <li>{t("print.limit3")}</li>
              <li>{t("print.limit4")}</li>
            </ul>
            <p className="printFooter">{t("print.signature")}</p>
            </>}
          />
          {sessionPurpose === "target_population_research" && auditLog && <label className="checkRow optional researchExportConsent">
            <input type="checkbox" checked={researchConsent} onChange={(event) => setResearchLogPermission(event.target.checked)} />
            <span id="research-export-help"><strong>{t("report.researchExportLead")}</strong> {t("report.researchExportBody")}</span>
          </label>}
          <div className="cardActions">
            <button className="secondary" onClick={() => { if (isAdminCapture) window.location.href = "/admin"; else goHome(); }}><IconCheck size={15} /> {t(isAdminCapture ? "report.backToAdmin" : "report.done")}</button>
            {auditLog && (sessionPurpose === "target_population_research"
              ? <button className="secondary" disabled={!researchConsent} aria-describedby="research-export-help" onClick={() => downloadCurrentAudit("research_analysis")}><IconDownload size={15} /> {t("report.downloadResearchLog")}</button>
              : <button className="secondary" onClick={() => downloadCurrentAudit("operator_audit")}><IconDownload size={15} /> {t("report.downloadAuditLog")}</button>)}
            <button className="secondary" onClick={() => window.print()}><IconReport size={15} /> {t("report.printSummary")}</button>

            {auditLog && <button className="textButton danger" onClick={confirmDeleteCurrentAudit}><IconTrash size={15} /> {t("report.deleteLog")}</button>}
            <button className="primary" onClick={restart}><IconRefresh size={15} /> {t("report.restart")}</button>
          </div>
        </section>
      )}
          </div>
        </div>
      )}

      {stage === "stimulus" && (
        <section className="stimulusPage">
          {!busy && <div className="stimulusHeader"><Logo /><span>{t(isEngineeringStudy ? "stimulus.headerAdult" : "stimulus.headerChild")} · {t("stimulus.headerReady")}</span>{mode === "live" && <span className={`stimulusTracking ${tracking?.accepted ? "good" : "bad"}`}><i />{trackingCopy(tracking, t).title}</span>}<button onClick={restart}><IconArrowLeft size={15} /> {t("action.back")}</button></div>}
          {busy && <div className="stimulusOperatorControls"><button onClick={toggleStimulusPause} aria-pressed={stimulusPaused}>{stimulusPaused ? <><IconPlay size={14} /> {t("stimulus.resume")}</> : t("stimulus.pause")}</button><button onClick={restart} aria-label={t("stimulus.stopAria")}><IconArrowLeft size={14} /> {t("stimulus.stop")}</button></div>}
          {stageMirror && (
            <aside className="stageMirror" aria-label={t("stimulus.mirrorAria")} aria-live="polite">
              <p className="stageMirrorNarration">{stageMirror.narration}</p>
              <dl className="stageMirrorRows">
                {stageMirror.rows.map((row) => (
                  <div key={row.id} data-tone={row.tone}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
              <small>{stageMirror.notice}</small>
            </aside>
          )}
          <div className={`stimulusCanvas phase-${stimulusPhase?.id ?? "ready"}`} aria-label={t("stimulus.canvasAria")}>
            <StimulusScene
              visualCue={stimulusPhase?.visualCue ?? "attention"}
              cueActive={stimulusCueActive}
              ostensiveActive={stimulusOstensiveActive}
              paused={stimulusPaused}
              geoprefSource={geoprefAsset.path}
              geometricSide={geoprefLayout(counterbalanceKey ?? "NG-0000").geometricSide}
              geoprefMediaKey={mediaGeneration}
              geoprefVideoRef={geoprefVideoRef}
              onGeoprefCanPlay={() => transitionMediaGeneration("can_play", mediaGeneration)}
              onGeoprefPlaying={() => transitionMediaGeneration("playing", mediaGeneration)}
              onGeoprefWaiting={() => transitionMediaGeneration("waiting", mediaGeneration)}
              onGeoprefError={() => transitionMediaGeneration("error", mediaGeneration)}
            />
            {!busy && progress === 0 && <div className={`stimulusIntro ${isEngineeringStudy ? "gateA" : "child"}`}>
              <span className="stimulusAudience">{introCopy.audience}</span>
              <strong>{introCopy.task}</strong>
              <p>{introCopy.detail}</p>
              <div className="stimulusSteps" aria-label={t("stimulus.stepsAria")}>
                {introCopy.steps.map((step, index) => <span key={step}><b>{index + 1}</b>{step}</span>)}
              </div>
              <small>{t(isEngineeringStudy ? "stimulus.noteAdult" : "stimulus.noteChild", { seconds: sessionSeconds })}</small>
              {mediaReadiness.status === "loading" && <small role="status">{t("stimulus.mediaLoading")}</small>}
              {isMediaFailure(mediaReadiness.status) && <div className="falloutNotice" role="alert"><IconAlert size={18} /><div><strong>{t("stimulus.mediaFailed")}</strong><p>{mediaFailure(mediaReadiness.status, locale).operatorAction}</p></div></div>}
              <button className="startStimulus" disabled={!calibration || sanityPassed !== true || (mode === "replay" && !model)} onClick={() => void runStimulus()}><IconPlay size={15} />{t(mode === "replay" ? "stimulus.startReplay" : isEngineeringStudy ? "stimulus.startAdult" : "stimulus.startChild")}</button>
            </div>}
            </div>
          {!busy && <p className="stimulusNote">{t("stimulus.hideNote")}</p>}
        </section>
      )}
    </main>
  );
}
