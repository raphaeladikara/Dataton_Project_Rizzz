"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  IconAlert,
  IconArrowRight,
  IconCheck,
  IconInfo,
  IconResearch,
  IconShieldCheck,
  LogoMark,
} from "../../src/ui/icons";
import styles from "./admin.module.css";
import { GATE_EVIDENCE_STATUS } from "../../src/validation/evidenceStatus";
import { gateCopy } from "../../src/validation/evidenceStatusCopy";
import { DEFAULT_GATE_C_SIMULATION, simulateGateC } from "../../src/validation/gateCSimulation";
import {
  SCORED_TRIAL_COUNT,
  STIMULUS_PHASES,
  STIMULUS_TOTAL_SECONDS,
  STIMULUS_VERSION,
} from "../../src/stimulus/protocol";
import {
  BarRows,
  ConfusionMatrix,
  DeltaBars,
  Donut,
  Figure,
  FrameGeometry,
  FunnelBars,
  GateLadder,
  IntervalPlot,
  Meter,
  OutcomeDots,
  PpvCurve,
  RangeStrips,
  RatioDots,
  SplitBar,
  SubtenseCompare,
  TrialStrip,
  useChartMotion,
} from "./charts";
import { LanguageToggle } from "../../src/i18n/LanguageToggle";
import { useT } from "../../src/i18n/useT";
import { isMessageKey, type MessageKey } from "../../src/i18n/dictionary";
import { decimal } from "../../src/i18n/format";

/**
 * A metric cell as the page stores it: two dictionary keys and a value.
 *
 * The value is sometimes a plain number ("100") that reads the same in both
 * languages and sometimes a decimal that does not ("2,2°" / "2.2°"). Rather
 * than have two kinds of metric, every value is either a raw number the page
 * formats with Intl, or a key resolved like any other string.
 */
type Metric = {
  label: MessageKey;
  /** A number formatted at render, or a dictionary key, or a literal. */
  value: MessageKey | { readonly n: number; readonly digits: number; readonly unit?: string } | string;
  note: MessageKey;
};

const GATE_A_METRICS: readonly Metric[] = [
  { label: "admin.gateA.mTotal", value: "100", note: "admin.gateA.mTotalNote" },
  { label: "admin.gateA.mDone", value: "94%", note: "admin.gateA.mDoneNote" },
  { label: "admin.gateA.mError", value: { n: 2.2, digits: 1, unit: "°" }, note: "admin.gateA.mErrorNote" },
  { label: "admin.gateA.mFrames", value: { n: 96.4, digits: 1, unit: "%" }, note: "admin.gateA.mFramesNote" },
  { label: "admin.gateA.mDropout", value: { n: 3.6, digits: 1, unit: "%" }, note: "admin.gateA.mDropoutNote" },
  { label: "admin.gateA.mOffline", value: "100%", note: "admin.gateA.mOfflineNote" },
];

/**
 * Same four rows as the table below the chart, plotted. Two figures rather than
 * one with two scales: completion is a percentage and calibration error is an
 * angle, and putting them on one plot would invent a relationship between them.
 */
const GATE_A_CONDITIONS = [
  { label: "admin.gateA.condNormalLight", sessions: 50, success: 98, error: 1.9 },
  { label: "admin.gateA.condDimLight", sessions: 25, success: 88, error: 2.8 },
  { label: "admin.gateA.condNoGlasses", sessions: 70, success: 97, error: 2.0 },
  { label: "admin.gateA.condGlasses", sessions: 30, success: 87, error: 2.9 },
] as const satisfies readonly { label: MessageKey; sessions: number; success: number; error: number }[];

/** The six sessions that produced no report, and why each one did not. */
const GATE_A_OUTCOMES = [
  { label: "admin.gateA.outReported", value: 94, color: "var(--teal-500)" },
  { label: "admin.gateA.outGlasses", value: 3, color: "var(--slate-700)" },
  { label: "admin.gateA.outTilt", value: 2, color: "var(--slate-500)" },
  { label: "admin.gateA.outOrientation", value: 1, color: "var(--slate-200)" },
] as const satisfies readonly { label: MessageKey; value: number; color: string }[];

const GATE_B_METRICS: readonly Metric[] = [
  { label: "admin.gateB.mPairs", value: "30", note: "admin.gateB.mPairsNote" },
  { label: "admin.gateB.mReady", value: "27", note: "admin.gateB.mReadyNote" },
  { label: "admin.gateB.mError", value: "admin.gateB.mErrorValue", note: "admin.gateB.mErrorNote" },
  { label: "admin.gateB.mAoi", value: "admin.gateB.mAoiValue", note: "admin.gateB.mAoiNote" },
  { label: "admin.gateB.mPrimary", value: "27/27", note: "admin.gateB.mPrimaryNote" },
  { label: "admin.gateB.mHeld", value: "3", note: "admin.gateB.mHeldNote" },
];

/**
 * Attention shares from the same 27 ready pairs the table reports. Hue here does
 * identity work only, so the three panels take the local categorical slots; the
 * background AOI takes the de-emphasis step, because that is what it is.
 */
const AOI_DISTRIBUTION = [
  { label: "admin.gateB.aoiFace", webgazer: 17.1628, neurogaze: 17.1374, color: "var(--chart-1)" },
  { label: "admin.gateB.aoiLeft", webgazer: 32.7535, neurogaze: 32.8137, color: "var(--chart-2)" },
  { label: "admin.gateB.aoiRight", webgazer: 33.2116, neurogaze: 33.2336, color: "var(--chart-3)" },
  { label: "admin.gateB.aoiBackground", webgazer: 16.872, neurogaze: 16.8152, color: "var(--chart-rest)" },
] as const satisfies readonly { label: MessageKey; webgazer: number; neurogaze: number; color: string }[];

const GATE_C_METRICS: readonly Metric[] = [
  { label: "admin.gateC.mScanpaths", value: "547", note: "admin.gateC.mScanpathsNote" },
  { label: "admin.gateC.mParticipants", value: "54", note: "admin.gateC.mParticipantsNote" },
  { label: "admin.gateC.mAuc", value: "admin.gateC.mAucValue", note: "admin.gateC.mAucNote" },
  { label: "admin.gateC.mTarget", value: "admin.gateC.mTargetValue", note: "admin.gateC.mTargetNote" },
];

const STIMULUS_METRICS: readonly Metric[] = [
  { label: "admin.scene.mDuration", value: "admin.scene.mDurationValue", note: "admin.scene.mDurationNote" },
  { label: "admin.scene.mTrials", value: String(SCORED_TRIAL_COUNT), note: "admin.scene.mTrialsNote" },
  { label: "admin.scene.mPreCue", value: "admin.scene.mPreCueValue", note: "admin.scene.mPreCueNote" },
  { label: "admin.scene.mResponse", value: "admin.scene.mResponseValue", note: "admin.scene.mResponseNote" },
];

const TRIAL_TIMELINE = [
  ["admin.scene.tl1Time", "admin.scene.tl1Title", "admin.scene.tl1Note"],
  ["admin.scene.tl2Time", "admin.scene.tl2Title", "admin.scene.tl2Note"],
  ["admin.scene.tl3Time", "admin.scene.tl3Title", "admin.scene.tl3Note"],
  ["admin.scene.tl4Time", "admin.scene.tl4Title", "admin.scene.tl4Note"],
] as const satisfies readonly (readonly [MessageKey, MessageKey, MessageKey])[];

/** Confound controls. Each one names what it removes, then why that matters. */
const DESIGN_CHOICES = [
  ["admin.choice1", "admin.choice1Body"],
  ["admin.choice2", "admin.choice2Body"],
  ["admin.choice3", "admin.choice3Body"],
  ["admin.choice4", "admin.choice4Body"],
  ["admin.choice5", "admin.choice5Body"],
  ["admin.choice6", "admin.choice6Body"],
  ["admin.choice7", "admin.choice7Body"],
  ["admin.choice8", "admin.choice8Body"],
  ["admin.choice9", "admin.choice9Body"],
  ["admin.choice10", "admin.choice10Body"],
] as const satisfies readonly (readonly [MessageKey, MessageKey])[];

// ── Kontrol positif · research/hasil/kontrol_positif/ringkasan.json ─────────
const POSITIVE_CONTROL_METRICS: readonly Metric[] = [
  { label: "admin.pc.mParticipants", value: "12", note: "admin.pc.mParticipantsNote" },
  { label: "admin.pc.mSessions", value: "23", note: "admin.pc.mSessionsNote" },
  { label: "admin.pc.mPassed", value: "15", note: "admin.pc.mPassedNote" },
  { label: "admin.pc.mFired", value: "0 / 9", note: "admin.pc.mFiredNote" },
];

/**
 * Every cell here is a quoted result, not a computed one, so each is a key.
 * The alternative — storing numbers and formatting them — would be wrong for
 * the mixed cells ("8 dari 8", "5,8 × 10⁻⁴") and would give the table two
 * different provenances for values that all came from the same JSON.
 */
const POSITIVE_CONTROL_SIGNALS = [
  {
    signal: "admin.pc.sigGeometric",
    ordinary: "admin.pcRow1.ordinary",
    ordinaryRange: "admin.pcRow1.ordinaryRange",
    produced: "admin.pcRow1.produced",
    producedRange: "admin.pcRow1.producedRange",
    margin: "admin.pcRow1.margin",
    p: "admin.pcRow1.p",
  },
  {
    signal: "admin.pc.sigTrials",
    ordinary: "admin.pcRow2.ordinary",
    ordinaryRange: "admin.pcRow2.ordinaryRange",
    produced: "admin.pcRow2.produced",
    producedRange: "admin.pcRow2.producedRange",
    margin: "admin.pcRow2.margin",
    p: "admin.pcRow2.p",
  },
  {
    signal: "admin.pc.sigDispersion",
    ordinary: "admin.pcRow3.ordinary",
    ordinaryRange: "admin.pcRow3.ordinaryRange",
    produced: "admin.pcRow3.produced",
    producedRange: "admin.pcRow3.producedRange",
    margin: "admin.pcRow3.margin",
    p: "admin.pcRow3.p",
  },
] as const satisfies readonly Record<string, MessageKey>[];

/**
 * Small multiples, one axis per signal, because the three are measured in
 * different units. A shared axis would put "8 percobaan" and "0,73 preferensi"
 * on the same ruler and make the gaps look comparable when they are not.
 */
const POSITIVE_CONTROL_RANGES = [
  {
    label: "admin.pc.sigGeometric",
    domain: [0, 1] as const,
    ticks: ["admin.pcRange1.tick0", "admin.pcRange1.tick1", "admin.pcRange1.tick2"],
    a: { from: 0.08, to: 0.73, display: "admin.pcRow1.ordinaryRange" },
    b: { from: 0.89, to: 1.0, display: "admin.pcRow1.producedRange" },
    gap: "admin.pcRow1.margin",
  },
  {
    label: "admin.pc.sigTrials",
    domain: [0, 8] as const,
    ticks: ["admin.pcRange2.tick0", "admin.pcRange2.tick1", "admin.pcRange2.tick2"],
    a: { from: 5, to: 8, display: "admin.pcRange2.aDisplay" },
    b: { from: 0, to: 1, display: "admin.pcRange2.bDisplay" },
    gap: "admin.pcRow2.margin",
  },
  {
    label: "admin.pc.sigDispersion",
    domain: [0, 0.5] as const,
    ticks: ["admin.pcRange3.tick0", "admin.pcRange3.tick1", "admin.pcRange3.tick2"],
    a: { from: 0.07, to: 0.4, display: "admin.pcRow3.ordinaryRange" },
    b: { from: 0.03, to: 0.06, display: "admin.pcRow3.producedRange" },
    gap: "admin.pcRow3.margin",
  },
] as const;

const POSITIVE_CONTROL_CONFOUNDS = [
  ["admin.pc.confound1", "admin.pc.confound1Body"],
  ["admin.pc.confound2", "admin.pc.confound2Body"],
  ["admin.pc.confound3", "admin.pc.confound3Body"],
] as const satisfies readonly (readonly [MessageKey, MessageKey])[];

// ── Validasi klip GeoPref · app/public/stimuli/…ccby.json ───────────────────
const CLIP_CONTAINER: readonly Metric[] = [
  { label: "admin.clip.mVideo", value: "1", note: "admin.clip.mVideoNote" },
  { label: "admin.clip.mAudio", value: "0", note: "admin.clip.mAudioNote" },
  { label: "admin.clip.mDuration", value: "admin.clip.mDurationValue", note: "admin.clip.mDurationNote" },
  { label: "admin.clip.mLicense", value: "CC BY 4.0", note: "admin.clip.mLicenseNote" },
];

const CLIP_ASSETS = [
  {
    title: "admin.clip.asset1Title",
    duration: "admin.clip.asset1Duration",
    status: "shipped" as const,
    statusLabel: "admin.clip.asset1Status",
    operating: "admin.clip.asset1Operating",
    note: "admin.clip.asset1Note",
  },
  {
    title: "admin.clip.asset2Title",
    duration: "admin.clip.asset2Duration",
    status: "requested" as const,
    statusLabel: "admin.clip.asset2Status",
    operating: "admin.clip.asset2Operating",
    note: "admin.clip.asset2Note",
  },
  {
    title: "admin.clip.asset3Title",
    duration: "admin.clip.asset3Duration",
    status: "requested" as const,
    statusLabel: "admin.clip.asset3Status",
    operating: "admin.clip.asset3Operating",
    note: "admin.clip.asset3Note",
  },
] as const;

/** What the cutoff was derived on, next to what the app actually plays. */
const CLIP_DURATIONS = [
  { label: "admin.clip.durShipped", sublabel: "admin.clip.durShippedSub", value: 16.75, display: "admin.clip.durShippedValue", tone: "warn" as const },
  { label: "admin.clip.durOriginal", sublabel: "admin.clip.durOriginalSub", value: 62.22, display: "admin.clip.durOriginalValue", tone: "calm" as const },
  { label: "admin.clip.durComplex", sublabel: "admin.clip.durComplexSub", value: 90, display: "admin.clip.durComplexValue", tone: "calm" as const },
] as const satisfies readonly { label: MessageKey; sublabel: MessageKey; value: number; display: MessageKey; tone: "warn" | "calm" }[];

/**
 * The trial strip reads its geometry from the protocol module rather than the
 * copy beside it, so a timing change cannot leave the picture describing a trial
 * the app no longer runs.
 */
const SCORED_TRIAL = STIMULUS_PHASES.find((phase) => phase.scored);
const TRIAL_MS = SCORED_TRIAL?.durationMs ?? 5000;
const TRIAL_OSTENSIVE_MS = SCORED_TRIAL?.ostensiveOnsetMs ?? 1200;
const TRIAL_CUE_MS = SCORED_TRIAL?.cueOnsetMs ?? 1700;

const TRIAL_BANDS = [
  { label: "admin.scene.bandRest", fromMs: 0, toMs: TRIAL_OSTENSIVE_MS, tone: "rest" as const },
  { label: "admin.scene.bandOstensive", fromMs: TRIAL_OSTENSIVE_MS, toMs: TRIAL_CUE_MS, tone: "ostensive" as const },
  { label: "admin.scene.bandResponse", fromMs: TRIAL_CUE_MS, toMs: TRIAL_MS, tone: "response" as const },
] as const satisfies readonly { label: MessageKey; fromMs: number; toMs: number; tone: "rest" | "ostensive" | "response" }[];

/**
 * Section ids stay Indonesian: they are anchor fragments, and a link someone
 * bookmarked or pasted into a review comment should not stop resolving because
 * the reader switched language.
 */
const NAV_GROUPS = [
  {
    group: "admin.nav.summaryGroup",
    items: [{ id: "ringkasan", label: "admin.nav.summary" }],
  },
  {
    // The rail carries pass state too. A reader who lands mid-page should not
    // have to scroll back to the summary to learn which gates are still open.
    group: "admin.nav.gatesGroup",
    items: [
      { id: "gate-a", label: "admin.nav.gateA", state: "passed" },
      { id: "gate-b", label: "admin.nav.gateB", state: "passed" },
      { id: "gate-c", label: "admin.nav.gateC", state: "open" },
      { id: "gate-d", label: "admin.nav.gateD", state: "open" },
    ],
  },
  {
    group: "admin.nav.fieldGroup",
    items: [{ id: "kontrol-positif", label: "admin.nav.positiveControl" }],
  },
  {
    group: "admin.nav.instrumentGroup",
    items: [
      { id: "klip-geopref", label: "admin.nav.clip" },
      { id: "adegan-vektor", label: "admin.nav.scene" },
    ],
  },
] as const;

const SECTION_IDS = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.id));

function Metrics({ items, columns = 4 }: { items: readonly Metric[]; columns?: 3 | 4 }) {
  const { t, bcp47 } = useT();
  const render = (value: Metric["value"]) => {
    if (typeof value === "object") return `${decimal(value.n, value.digits, bcp47)}${value.unit ?? ""}`;
    // A real membership test, not a prefix guess: anything that is not a key is
    // a bare figure reading identically in both languages ("100", "27/27") and
    // is printed as written.
    return isMessageKey(value) ? t(value) : value;
  };
  return (
    <div className={styles.metrics} data-columns={columns}>
      {items.map((item) => (
        <article key={item.label}>
          <small>{t(item.label)}</small>
          <strong>{render(item.value)}</strong>
          <span>{t(item.note)}</span>
        </article>
      ))}
    </div>
  );
}

function SectionHead({
  id,
  gate,
  title,
  lead,
  status,
  tone = "neutral",
}: {
  id: string;
  gate?: string;
  title: string;
  lead: string;
  status?: string;
  tone?: "passed" | "open" | "warn" | "neutral";
}) {
  const { t } = useT();
  return (
    <header className={styles.sectionHead}>
      <div>
        <h2 id={`${id}-title`}>
          {gate ? (
            <span className={styles.gateMark} data-gate={gate}>
              <span aria-hidden="true">{gate}</span>
              <span className={styles.srOnly}>{t("admin.gatePrefix", { gate })}</span>
            </span>
          ) : null}
          {title}
        </h2>
        <p>{lead}</p>
      </div>
      {status ? <span className={styles.statusPill} data-tone={tone}>{status}</span> : null}
    </header>
  );
}

function Note({
  kind,
  title,
  children,
}: {
  kind: "limit" | "claim" | "source";
  title: string;
  children: React.ReactNode;
}) {
  const Icon = kind === "limit" ? IconAlert : kind === "claim" ? IconShieldCheck : IconResearch;
  return (
    <div className={styles.note} data-kind={kind}>
      <Icon size={16} />
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  );
}

export function AdminConsole() {
  const { t, locale, bcp47 } = useT();
  const [gateCSimulationInput, setGateCSimulationInput] = useState(DEFAULT_GATE_C_SIMULATION);
  const gateCSimulation = useMemo(() => simulateGateC(gateCSimulationInput), [gateCSimulationInput]);
  const [activeSection, setActiveSection] = useState<string>(SECTION_IDS[0]);
  const [navOpen, setNavOpen] = useState(false);

  useChartMotion();

  // Scrollspy against a reading line a third of the way down the viewport: the
  // last section whose top has crossed it is the one being read. Deliberately
  // not an IntersectionObserver — sections here run 600–1700 px tall, so several
  // are in view at once and "is it intersecting" cannot rank them without a
  // margin band that has to be retuned every time a section changes length.
  useEffect(() => {
    const pick = () => {
      const readingLine = window.innerHeight * 0.3;
      const atBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActiveSection(SECTION_IDS[SECTION_IDS.length - 1]);
        return;
      }
      let current = SECTION_IDS[0];
      for (const id of SECTION_IDS) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= readingLine) current = id;
      }
      // Same value is a no-op in React, so scrolling inside one section does not
      // re-render the sidebar.
      setActiveSection(current);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick, { passive: true });
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, []);

  const percent = (value: number, digits = 1) => `${decimal(value * 100, digits, bcp47)}%`;

  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#ringkasan">{t("admin.skip")}</a>

      <aside className={styles.sidebar} data-open={navOpen}>
        <div className={styles.sidebarTop}>
          <Link href="/" className={styles.brand}>
            <LogoMark size={24} className={styles.brandMark} /> Neurogaze
          </Link>
          <button
            type="button"
            className={styles.navToggle}
            onClick={() => setNavOpen((open) => !open)}
            aria-expanded={navOpen}
            aria-controls="panel-nav"
          >
            {t(navOpen ? "admin.navClose" : "nav.menu")}
          </button>
        </div>

        <div className={styles.sidebarRoleRow}>
          <p className={styles.sidebarRole}>{t("admin.role")}</p>
          <LanguageToggle />
        </div>

        <nav id="panel-nav" className={styles.nav} aria-label={t("admin.navAria")}>
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group} className={styles.navGroup}>
              <p className={styles.navGroupLabel}>{t(group)}</p>
              {items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  aria-current={activeSection === item.id ? "true" : undefined}
                  onClick={() => setNavOpen(false)}
                >
                  {"state" in item ? (
                    <i className={styles.navState} data-state={item.state} aria-hidden="true" />
                  ) : null}
                  {t(item.label)}
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <Link href="/validation">{t("admin.publicEvidence")} <IconArrowRight size={13} /></Link>
          <p>{t("admin.updatedAt", { date: GATE_EVIDENCE_STATUS.updatedAt })}</p>
        </div>
      </aside>

      <main className={styles.content}>
        {/* The page had no h1 at all: the first heading a screen reader met was
            the h2 of the summary section, so the document announced itself as a
            fragment of something else. */}
        <header className={styles.pageHead}>
          <div>
            <h1>{t("admin.title")}</h1>
            <p>{t("admin.lead")}</p>
          </div>
          <dl className={styles.pageHeadMeta}>
            <div>
              <dt>{t("admin.updated")}</dt>
              <dd>{GATE_EVIDENCE_STATUS.updatedAt}</dd>
            </div>
            <div>
              <dt>{t("admin.stimulusVersion")}</dt>
              <dd>{STIMULUS_VERSION}</dd>
            </div>
          </dl>
        </header>

        {/* ── Ringkasan ──────────────────────────────────────────────────── */}
        <section id="ringkasan" className={styles.section} aria-labelledby="ringkasan-title">
          <SectionHead
            id="ringkasan"
            title={t("admin.summary.title")}
            lead={t("admin.summary.lead")}
          />

          <Figure
            title={t("admin.summary.figureTitle")}
            note={t("admin.summary.figureNote")}
          >
            <GateLadder
              gates={GATE_EVIDENCE_STATUS.gates.map((gate) => ({
                id: gate.id,
                label: gateCopy(gate.id, locale).title,
                passed: gate.status === "passed",
              }))}
            />
          </Figure>

          <div className={styles.gateGrid}>
            {GATE_EVIDENCE_STATUS.gates.map((gate) => {
              const passed = gate.id === "A" || gate.id === "B";
              const text = gateCopy(gate.id, locale);
              return (
                <article key={gate.id} className={styles.gateCard} data-state={passed ? "passed" : "open"}>
                  <div className={styles.gateCardTop}>
                    <span className={styles.gateMark} data-gate={gate.id}>{gate.id}</span>
                    <span className={styles.statusPill} data-tone={passed ? "passed" : "open"}>
                      {passed ? <IconCheck size={12} /> : null}
                      {text.statusLabel}
                    </span>
                  </div>
                  <h3>{text.title}</h3>
                  <p>{text.statement}</p>
                </article>
              );
            })}
          </div>

          <Note kind="limit" title={t("admin.summary.limitTitle")}>
            {t("admin.summary.limitBody")}
          </Note>
        </section>

        {/* ── Gate A ─────────────────────────────────────────────────────── */}
        <section id="gate-a" className={styles.section} aria-labelledby="gate-a-title">
          <SectionHead
            id="gate-a"
            gate="A"
            title={t("admin.gateA.title")}
            lead={t("admin.gateA.lead")}
            status={t("admin.gateA.status")}
            tone="passed"
          />

          <Metrics items={GATE_A_METRICS} />

          <div className={styles.figures}>
            <Figure
              title={t("admin.gateA.successTitle")}
              note={t("admin.gateA.successNote")}
            >
              <BarRows
                rows={GATE_A_CONDITIONS.map((row) => ({
                  label: t(row.label),
                  sublabel: t("admin.gateA.sessionsSuffix", { count: row.sessions }),
                  value: row.success,
                  display: `${row.success}%`,
                }))}
                max={100}
                threshold={90}
                thresholdLabel={t("admin.gateA.successThreshold")}
              />
            </Figure>

            <Figure
              title={t("admin.gateA.errorTitle")}
              note={t("admin.gateA.errorNote")}
            >
              <BarRows
                rows={GATE_A_CONDITIONS.map((row) => ({
                  label: t(row.label),
                  value: row.error,
                  display: `${decimal(row.error, 1, bcp47)}°`,
                }))}
                max={4}
                threshold={3}
                thresholdSide="max"
                thresholdLabel={t("admin.gateA.errorThreshold")}
              />
            </Figure>
          </div>

          <Figure
            title={t("admin.gateA.outcomeTitle")}
            note={t("admin.gateA.outcomeNote")}
            legend={GATE_A_OUTCOMES.map((slice) => ({
              label: t(slice.label),
              color: slice.color,
              value: String(slice.value),
            }))}
          >
            <SplitBar
              total={100}
              segments={GATE_A_OUTCOMES.map((slice) => ({
                label: t(slice.label),
                value: slice.value,
                color: slice.color,
                display: t("admin.gateA.outcomeUnit", { count: slice.value }),
              }))}
            />
          </Figure>

          <div className={styles.split}>
            <div className={styles.tableWrap}>
              <table>
                <caption>{t("admin.gateA.tableCaption")}</caption>
                <thead>
                  <tr><th scope="col">{t("admin.gateA.colCondition")}</th><th scope="col">{t("admin.gateA.colSessions")}</th><th scope="col">{t("admin.gateA.colSuccess")}</th><th scope="col">{t("admin.gateA.colError")}</th></tr>
                </thead>
                {/* Derived from the same table the charts above read, rather
                    than typed out again: the two used to be able to disagree. */}
                <tbody>
                  {GATE_A_CONDITIONS.map((row) => (
                    <tr key={row.label}>
                      <td>{t(row.label)}</td>
                      <td>{row.sessions}</td>
                      <td>{Math.round((row.sessions * row.success) / 100)} · {row.success}%</td>
                      <td>{decimal(row.error, 1, bcp47)}°</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.criteria}>
              <h3>{t("admin.passCriteria")}</h3>
              <ul>
                <li>{t("admin.gateA.crit1")}</li>
                <li>{t("admin.gateA.crit2")}</li>
                <li>{t("admin.gateA.crit3")}</li>
                <li>{t("admin.gateA.crit4")}</li>
                <li>{t("admin.gateA.crit5")}</li>
              </ul>
              <p>{t("admin.gateA.critNote")}</p>
            </div>
          </div>

          <Note kind="source" title={t("admin.gateA.noteTitle")}>
            {t("admin.gateA.noteBody")}
          </Note>
        </section>

        {/* ── Gate B ─────────────────────────────────────────────────────── */}
        <section id="gate-b" className={styles.section} aria-labelledby="gate-b-title">
          <SectionHead
            id="gate-b"
            gate="B"
            title={t("admin.gateB.title")}
            lead={t("admin.gateB.lead")}
            status={t("admin.gateB.status")}
            tone="passed"
          />

          <Metrics items={GATE_B_METRICS} />

          <div className={styles.figures}>
            <Figure
              title={t("admin.gateB.donutTitle")}
              note={t("admin.gateB.donutNote")}
              legend={AOI_DISTRIBUTION.map((area) => ({
                label: t(area.label),
                color: area.color,
                value: `${decimal(area.neurogaze, 1, bcp47)}%`,
              }))}
            >
              <Donut
                slices={AOI_DISTRIBUTION.map((area) => ({
                  label: t(area.label),
                  value: area.neurogaze,
                  color: area.color,
                }))}
                centre={t("admin.gateB.donutCentre")}
                centreNote={t("admin.gateB.donutCentreNote")}
              />
            </Figure>

            <Figure
              title={t("admin.gateB.deltaTitle")}
              note={t("admin.gateB.deltaNote")}
              footnote={t("admin.gateB.deltaFootnote")}
            >
              <DeltaBars
                domain={0.08}
                domainLabel={t("admin.gateB.deltaDomainLabel")}
                rows={AOI_DISTRIBUTION.map((area) => {
                  const delta = area.neurogaze - area.webgazer;
                  return {
                    label: t(area.label),
                    value: delta,
                    display: `${delta > 0 ? "+" : "−"}${decimal(Math.abs(delta), 3, bcp47)}`,
                  };
                })}
              />
            </Figure>
          </div>

          <div className={styles.figures}>
            <Figure
              title={t("admin.gateB.meterTitle")}
              note={t("admin.gateB.meterNote")}
            >
              <Meter
                value={0.040997}
                limit={0.05}
                max={0.08}
                display={t("admin.gateB.meterDisplay")}
                limitLabel={t("admin.gateB.meterLimit")}
              />
            </Figure>

            <Figure
              title={t("admin.gateB.pairsTitle")}
              note={t("admin.gateB.pairsNote")}
              legend={[
                { label: t("admin.gateB.pairsReady"), color: "var(--teal-500)", value: "27" },
                { label: t("admin.gateB.pairsHeld"), color: "var(--slate-500)", value: "3" },
              ]}
            >
              <SplitBar
                total={30}
                segments={[
                  { label: t("admin.gateB.pairsReady"), value: 27, display: t("admin.gateB.pairsReadyUnit"), color: "var(--teal-500)" },
                  { label: t("admin.gateB.pairsHeld"), value: 3, display: "3", color: "var(--slate-500)" },
                ]}
              />
            </Figure>
          </div>

          <div className={styles.split}>
            <div className={styles.tableWrap}>
              <table>
                <caption>{t("admin.gateB.tableCaption")}</caption>
                <thead>
                  <tr><th scope="col">{t("admin.gateB.colArea")}</th><th scope="col">WebGazer</th><th scope="col">Neurogaze</th></tr>
                </thead>
                <tbody>
                  {AOI_DISTRIBUTION.map((area) => (
                    <tr key={area.label}>
                      <td>{t(area.label)}</td>
                      <td>{decimal(area.webgazer, 4, bcp47)}%</td>
                      <td>{decimal(area.neurogaze, 4, bcp47)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.criteria}>
              <h3>{t("admin.passCriteria")}</h3>
              <ul>
                <li>{t("admin.gateB.crit1")}</li>
                <li>{t("admin.gateB.crit2")}</li>
                <li>{t("admin.gateB.crit3")}</li>
                <li>{t("admin.gateB.crit4")}</li>
                <li>{t("admin.gateB.crit5")}</li>
              </ul>
              <p>{t("admin.gateB.critNote")}</p>
            </div>
          </div>

          <Note kind="source" title={t("admin.gateB.noteTitle")}>
            {t("admin.gateB.noteBody")}
          </Note>
        </section>

        {/* ── Gate C ─────────────────────────────────────────────────────── */}
        <section id="gate-c" className={styles.section} aria-labelledby="gate-c-title">
          <SectionHead
            id="gate-c"
            gate="C"
            title={t("admin.gateC.title")}
            lead={t("admin.gateC.lead")}
            status={t("admin.gateC.status")}
            tone="open"
          />

          <Metrics items={GATE_C_METRICS} />

          <Figure
            title={t("admin.gateC.aucTitle")}
            note={t("admin.gateC.aucNote")}
            legend={[
              { label: t("admin.gateC.legendInterval"), color: "var(--teal-200)" },
              { label: t("admin.gateC.legendPoint"), color: "var(--teal-600)" },
            ]}
            footnote={t("admin.gateC.aucFootnote")}
          >
            <IntervalPlot
              domain={[0.5, 1]}
              ticks={[t("admin.gateC.tickRandom"), t("admin.gateC.tick75"), t("admin.gateC.tick100")]}
              intervals={[
                {
                  label: t("admin.gateC.intervalLabel"),
                  from: 0.774,
                  to: 0.968,
                  point: 0.8819,
                  display: t("admin.gateC.intervalDisplay"),
                },
              ]}
            />
          </Figure>

          <div className={styles.split}>
            <div className={styles.prose}>
              <h3>{t("admin.gateC.dataTitle")}</h3>
              <p>{t("admin.gateC.dataBody")}</p>
              <p className={styles.linkRow}>
                <a className={styles.link} href="https://doi.org/10.5220/0007402601030112" target="_blank" rel="noreferrer">
                  {t("admin.gateC.linkPaper")} <IconArrowRight size={13} />
                </a>
                <a className={styles.link} href="https://figshare.com/articles/dataset/Visualization_of_Eye-Tracking_Scanpaths_in_Autism_Spectrum_Disorder_Image_Dataset/7073087/1" target="_blank" rel="noreferrer">
                  {t("admin.gateC.linkDataset")} <IconArrowRight size={13} />
                </a>
              </p>
            </div>

            <div className={styles.criteria} data-tone="open">
              <h3>{t("admin.gateC.whyOpen")}</h3>
              <ul>
                <li>{t("admin.gateC.why1")}</li>
                <li>{t("admin.gateC.why2")}</li>
                <li>{t("admin.gateC.why3")}</li>
                <li>{t("admin.gateC.why4")}</li>
                <li>{t("admin.gateC.why5")}</li>
                <li>{t("admin.gateC.why6")}</li>
              </ul>
            </div>
          </div>

          <Note kind="claim" title={t("admin.gateC.cnnTitle")}>
            {t("admin.gateC.cnnBody")}
          </Note>

          <div className={styles.simulation} aria-labelledby="simulation-title">
            <div className={styles.simulationHead}>
              <div>
                <h3 id="simulation-title">{t("admin.sim.title")}</h3>
                <p>{t("admin.sim.lead")}</p>
              </div>
              <span className={styles.statusPill} data-tone="warn">{t("admin.sim.badge")}</span>
            </div>

            <div className={styles.simulationInputs}>
              <label>
                <span>{t("admin.sim.cohortSize")}</span>
                <input type="number" min="1" max="1000000" step="1" value={gateCSimulationInput.cohortSize}
                  onChange={(event) => setGateCSimulationInput((current) => ({ ...current, cohortSize: Number(event.target.value) }))} />
              </label>
              <label>
                <span>{t("admin.sim.prevalence")}</span>
                <div className={styles.inputSuffix}>
                  <input type="number" min="0" max="100" step="0.1" value={gateCSimulationInput.prevalence * 100}
                    onChange={(event) => setGateCSimulationInput((current) => ({ ...current, prevalence: Number(event.target.value) / 100 }))} />
                  <b>%</b>
                </div>
              </label>
              <label>
                <span>{t("admin.sim.coverage")}</span>
                <div className={styles.inputSuffix}>
                  <input type="number" min="0" max="100" step="1" value={gateCSimulationInput.technicalCoverage * 100}
                    onChange={(event) => setGateCSimulationInput((current) => ({ ...current, technicalCoverage: Number(event.target.value) / 100 }))} />
                  <b>%</b>
                </div>
              </label>
              <label>
                <span>{t("admin.sim.sensitivity")}</span>
                <div className={styles.inputSuffix}><input value={t("admin.sim.sensitivityValue")} disabled /><b>%</b></div>
              </label>
              <label>
                <span>{t("admin.sim.specificity")}</span>
                <div className={styles.inputSuffix}><input value={t("admin.sim.specificityValue")} disabled /><b>%</b></div>
              </label>
              <label>
                <span>{t("admin.sim.threshold")}</span>
                <input value={t("admin.sim.thresholdValue")} disabled />
              </label>
            </div>

            <div className={styles.metrics} data-columns={4}>
              <article><small>{t("admin.sim.assessable")}</small><strong>{gateCSimulation.assessable.toFixed(0)}</strong><span>{t("admin.sim.withheld", { count: gateCSimulation.withheld.toFixed(0) })}</span></article>
              <article><small>{t("admin.sim.referralRate")}</small><strong>{percent(gateCSimulation.referralRate)}</strong><span>{t("admin.sim.ofAssessed", { count: decimal(gateCSimulation.truePositive + gateCSimulation.falsePositive, 1, bcp47) })}</span></article>
              <article><small>{t("admin.sim.ppv")}</small><strong>{percent(gateCSimulation.positivePredictiveValue)}</strong><span>{t("admin.sim.ppvNote")}</span></article>
              <article><small>{t("admin.sim.perTruePositive")}</small><strong>{Number.isFinite(gateCSimulation.referralsPerTruePositive) ? decimal(gateCSimulation.referralsPerTruePositive, 1, bcp47) : "n/a"}</strong><span>{t("admin.sim.perTruePositiveNote")}</span></article>
            </div>

            <div className={styles.figures}>
              <Figure
                title={t("admin.sim.matrixTitle")}
                note={t("admin.sim.matrixNote")}
              >
                <ConfusionMatrix
                  truePositive={decimal(gateCSimulation.truePositive, 1, bcp47)}
                  falseNegative={decimal(gateCSimulation.falseNegative, 1, bcp47)}
                  falsePositive={decimal(gateCSimulation.falsePositive, 1, bcp47)}
                  trueNegative={decimal(gateCSimulation.trueNegative, 1, bcp47)}
                />
              </Figure>

              <Figure
                title={t("admin.sim.funnelTitle")}
                note={t("admin.sim.funnelNote")}
              >
                <FunnelBars
                  total={gateCSimulation.cohortSize}
                  steps={[
                    {
                      label: t("admin.sim.stepCohort"),
                      value: gateCSimulation.cohortSize,
                      display: gateCSimulation.cohortSize.toLocaleString(bcp47),
                      tone: "calm",
                    },
                    {
                      label: t("admin.sim.stepAssessable"),
                      value: gateCSimulation.assessable,
                      display: gateCSimulation.assessable.toFixed(0),
                      tone: "calm",
                    },
                    {
                      label: t("admin.sim.stepReferred"),
                      value: gateCSimulation.truePositive + gateCSimulation.falsePositive,
                      display: (gateCSimulation.truePositive + gateCSimulation.falsePositive).toFixed(0),
                      tone: "warn",
                    },
                    {
                      label: t("admin.sim.stepCorrect"),
                      value: gateCSimulation.truePositive,
                      display: decimal(gateCSimulation.truePositive, 1, bcp47),
                      tone: "good",
                    },
                  ]}
                />
              </Figure>
            </div>

            <div className={styles.figures}>
              <Figure
                title={t("admin.sim.ratioTitle")}
                note={t("admin.sim.ratioNote")}
              >
                <RatioDots
                  total={
                    Number.isFinite(gateCSimulation.referralsPerTruePositive)
                      ? gateCSimulation.referralsPerTruePositive
                      : 0
                  }
                  note={
                    Number.isFinite(gateCSimulation.referralsPerTruePositive)
                      ? t("admin.sim.ratioBody", { ratio: decimal(gateCSimulation.referralsPerTruePositive, 1, bcp47) })
                      : t("admin.sim.ratioUndefined")
                  }
                />
              </Figure>

              <Figure
                title={t("admin.sim.ppvTitle")}
                note={t("admin.sim.ppvCurveNote")}
                footnote={t("admin.sim.ppvFootnote")}
              >
                <PpvCurve
                  sensitivity={gateCSimulation.sensitivity}
                  specificity={gateCSimulation.specificity}
                  prevalence={gateCSimulation.prevalence}
                />
              </Figure>
            </div>

            <Note kind="limit" title={t("admin.sim.interpretTitle")}>
              {t("admin.sim.interpretBody", {
                cohort: gateCSimulation.cohortSize.toLocaleString(bcp47),
                prevalence: percent(gateCSimulation.prevalence),
                coverage: percent(gateCSimulation.technicalCoverage, 0),
                referralRate: percent(gateCSimulation.referralRate),
                ppv: percent(gateCSimulation.positivePredictiveValue),
              })}
            </Note>

            <p className={styles.simulationFoot}>{t("admin.sim.foot")}</p>
          </div>
        </section>

        {/* ── Gate D ─────────────────────────────────────────────────────── */}
        <section id="gate-d" className={styles.section} aria-labelledby="gate-d-title">
          <SectionHead
            id="gate-d"
            gate="D"
            title={t("admin.gateD.title")}
            lead={t("admin.gateD.lead")}
            status={t("admin.gateD.status")}
            tone="open"
          />

          <div className={styles.split}>
            <div className={styles.prose}>
              <h3>{t("admin.gateD.feasibility")}</h3>
              <p>{t("admin.gateD.body1")}</p>
              <p>{t("admin.gateD.body2")}</p>
            </div>

            <div className={styles.criteria} data-tone="open">
              <h3>{t("admin.gateD.needed")}</h3>
              <ul>
                <li>{t("admin.gateD.need1")}</li>
                <li>{t("admin.gateD.need2")}</li>
                <li>{t("admin.gateD.need3")}</li>
                <li>{t("admin.gateD.need4")}</li>
                <li>{t("admin.gateD.need5")}</li>
                <li>{t("admin.gateD.need6")}</li>
              </ul>
            </div>
          </div>

          <Note kind="limit" title={t("admin.gateD.limitTitle")}>
            {t("admin.gateD.limitBody")}
          </Note>
        </section>

        {/* ── Kontrol positif ────────────────────────────────────────────── */}
        <section id="kontrol-positif" className={styles.section} aria-labelledby="kontrol-positif-title">
          <SectionHead
            id="kontrol-positif"
            title={t("admin.pc.title")}
            lead={t("admin.pc.lead")}
            status={t("admin.pc.status")}
            tone="passed"
          />

          <Metrics items={POSITIVE_CONTROL_METRICS} />

          <Figure
            title={t("admin.pc.rangeTitle")}
            note={t("admin.pc.rangeNote")}
            legend={[
              { label: t("admin.pc.condOrdinary"), color: "var(--slate-500)" },
              { label: t("admin.pc.condProduced"), color: "var(--coral-500)" },
            ]}
            footnote={t("admin.pc.rangeFootnote")}
          >
            <RangeStrips
              strips={POSITIVE_CONTROL_RANGES.map((strip) => ({
                label: t(strip.label),
                domain: strip.domain,
                ticks: strip.ticks.map((tick) => t(tick)),
                a: { from: strip.a.from, to: strip.a.to, display: t(strip.a.display) },
                b: { from: strip.b.from, to: strip.b.to, display: t(strip.b.display) },
                gap: t(strip.gap),
              }))}
              aLabel={t("admin.pc.condOrdinary")}
              bLabel={t("admin.pc.condProduced")}
            />
          </Figure>

          <div className={styles.tableWrap}>
            <table>
              <caption>{t("admin.pc.tableCaption")}</caption>
              <thead>
                <tr>
                  <th scope="col">{t("admin.pc.colSignal")}</th>
                  <th scope="col">{t("admin.pc.condOrdinary")}</th>
                  <th scope="col">{t("admin.pc.condProduced")}</th>
                  <th scope="col">{t("admin.pc.colMargin")}</th>
                  <th scope="col">{t("admin.pc.colP")}</th>
                </tr>
              </thead>
              <tbody>
                {POSITIVE_CONTROL_SIGNALS.map((row) => (
                  <tr key={row.signal}>
                    <th scope="row">{t(row.signal)}</th>
                    <td>{t(row.ordinary)}<small>{t(row.ordinaryRange)}</small></td>
                    <td>{t(row.produced)}<small>{t(row.producedRange)}</small></td>
                    <td data-emphasis="true">{t(row.margin)}</td>
                    <td>{t(row.p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Note kind="source" title={t("admin.pc.noteTitle")}>
            {t("admin.pc.noteBody")}
          </Note>

          <div className={styles.split}>
            <div className={styles.prose}>
              <h3>{t("admin.pc.ruleTitle")}</h3>
              <p><strong>{t("admin.pc.ruleShippedLead")}</strong> {t("admin.pc.ruleShippedBody")}</p>
              <p><strong>{t("admin.pc.ruleDemoLead")}</strong> {t("admin.pc.ruleDemoBody")}</p>
            </div>

            <Figure
              title={t("admin.pc.dotsTitle")}
              note={t("admin.pc.dotsNote")}
              legend={[
                { label: t("admin.pc.fired"), color: "var(--coral-500)" },
                { label: t("admin.pc.notFired"), color: "var(--slate-200)" },
              ]}
              footnote={t("admin.pc.dotsFootnote")}
            >
              <OutcomeDots
                rows={[
                  { label: t("admin.pc.condOrdinary"), fired: 0, total: 9, display: "0 / 9" },
                  { label: t("admin.pc.condProduced"), fired: 4, total: 6, display: "4 / 6" },
                ]}
              />
            </Figure>
          </div>

          <div className={styles.tableWrap}>
            <table>
              <caption>{t("admin.pc.demoTableCaption")}</caption>
              <thead>
                <tr><th scope="col">{t("admin.pc.colCondition")}</th><th scope="col">{t("admin.pc.fired")}</th><th scope="col">{t("admin.pc.notFired")}</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">{t("admin.pc.condOrdinary")}</th><td data-emphasis="true">0</td><td>9</td></tr>
                <tr><th scope="row">{t("admin.pc.condProduced")}</th><td>4</td><td>2</td></tr>
              </tbody>
            </table>
          </div>

          <Note kind="claim" title={t("admin.pc.claimTitle")}>
            {t("admin.pc.claimBody")}
          </Note>

          <h3 className={styles.subhead}>{t("admin.pc.confoundHeading")}</h3>
          <div className={styles.choices}>
            {POSITIVE_CONTROL_CONFOUNDS.map(([title, body]) => (
              <article key={title}><strong>{t(title)}</strong><p>{t(body)}</p></article>
            ))}
          </div>

          <Note kind="limit" title={t("admin.pc.limitTitle")}>
            {t("admin.pc.limitBody")}
          </Note>
        </section>

        {/* ── Validasi klip GeoPref ──────────────────────────────────────── */}
        <section id="klip-geopref" className={styles.section} aria-labelledby="klip-geopref-title">
          <SectionHead
            id="klip-geopref"
            title={t("admin.clip.title")}
            lead={t("admin.clip.lead")}
            status={t("admin.clip.status")}
            tone="warn"
          />

          <Metrics items={CLIP_CONTAINER} />

          <div className={styles.hashRow}>
            <span>SHA-256</span>
            <code>38576193099bec758837036582b7814a2728c431829e22f9d0e92ffe91fedf2f</code>
          </div>

          <Figure
            title={t("admin.clip.durationTitle")}
            note={t("admin.clip.durationNote")}
            legend={[
              { label: t("admin.clip.legendShipped"), color: "var(--amber-600)" },
              { label: t("admin.clip.legendPublished"), color: "var(--slate-500)" },
            ]}
          >
            <BarRows
              rows={CLIP_DURATIONS.map((clip) => ({
                label: t(clip.label),
                sublabel: t(clip.sublabel),
                value: clip.value,
                display: t(clip.display),
                tone: clip.tone === "warn" ? "warn" : "calm",
              }))}
              max={90}
            />
          </Figure>

          <div className={styles.figures}>
            <Figure
              title={t("admin.clip.frameTitle")}
              note={t("admin.clip.frameNote")}
            >
              <FrameGeometry panelShare={0.198} panelLabelLeft={t("admin.clip.panelSocial")} panelLabelRight={t("admin.clip.panelGeometric")} />
            </Figure>

            <Figure
              title={t("admin.clip.subtenseTitle")}
              note={t("admin.clip.subtenseNote")}
              footnote={t("admin.clip.subtenseFootnote")}
            >
              <SubtenseCompare
                reference={{ w: 12.9, h: 9.1, label: t("admin.clip.subtenseReference") }}
                shipped={{ w: 7.6, h: 4.9, label: t("admin.clip.subtenseShipped") }}
              />
            </Figure>
          </div>

          <div className={styles.split}>
            <div className={styles.prose}>
              <h3>{t("admin.clip.geometryTitle")}</h3>
              <p>
                {t("admin.clip.geometryBody1Pre")}<strong>{t("admin.clip.geometryShare")}</strong>
                {t("admin.clip.geometryBody1Post")}
              </p>
              <p>
                {t("admin.clip.geometryBody2Pre")}<code>geoprefPanelDegrees()</code>
                {t("admin.clip.geometryBody2Post")}
              </p>
            </div>

            <div className={styles.criteria} data-tone="warn">
              <h3>{t("admin.clip.deliberate")}</h3>
              <ul>
                <li><strong>{t("admin.clip.deliberate1Lead")}</strong> {t("admin.clip.deliberate1Body")}</li>
                <li><strong>{t("admin.clip.deliberate2Lead")}</strong> {t("admin.clip.deliberate2Body")}</li>
                <li><strong>{t("admin.clip.deliberate3Lead")}</strong> {t("admin.clip.deliberate3Body")}</li>
              </ul>
            </div>
          </div>

          <h3 className={styles.subhead}>{t("admin.clip.assetsHeading")}</h3>
          <div className={styles.assets}>
            {CLIP_ASSETS.map((asset) => (
              <article key={asset.title} data-status={asset.status}>
                <div className={styles.assetTop}>
                  <h4>{t(asset.title)}</h4>
                  <span className={styles.statusPill} data-tone={asset.status === "shipped" ? "passed" : "open"}>
                    {t(asset.statusLabel)}
                  </span>
                </div>
                <dl>
                  <div><dt>{t("admin.clip.assetDuration")}</dt><dd>{t(asset.duration)}</dd></div>
                  <div><dt>{t("admin.clip.assetOperating")}</dt><dd>{t(asset.operating)}</dd></div>
                </dl>
                <p>{t(asset.note)}</p>
              </article>
            ))}
          </div>

          <Note kind="limit" title={t("admin.clip.limitTitle")}>
            {t("admin.clip.limitBody1")}<code>validatedProtocol</code>{t("admin.clip.limitBody2")}
          </Note>
        </section>

        {/* ── Adegan vektor ──────────────────────────────────────────────── */}
        <section id="adegan-vektor" className={styles.section} aria-labelledby="adegan-vektor-title">
          <SectionHead
            id="adegan-vektor"
            title={t("admin.scene.title")}
            lead={t("admin.scene.lead", { version: STIMULUS_VERSION })}
            status={t("admin.scene.status", { seconds: STIMULUS_TOTAL_SECONDS })}
            tone="neutral"
          />

          <Metrics items={STIMULUS_METRICS.map((metric) => (
            // The total duration is read from the protocol module, so its cell
            // is the one metric whose value carries a placeholder.
            metric.label === "admin.scene.mDuration"
              ? { ...metric, value: t("admin.scene.mDurationValue", { seconds: STIMULUS_TOTAL_SECONDS }) }
              : metric
          ))} />

          <h3 className={styles.subhead}>{t("admin.scene.trialHeading")}</h3>

          <Figure
            title={t("admin.scene.stripTitle")}
            note={t("admin.scene.stripNote")}
            legend={TRIAL_BANDS.map((band) => ({
              label: t(band.label),
              color:
                band.tone === "rest"
                  ? "var(--slate-100)"
                  : band.tone === "ostensive"
                    ? "var(--teal-200)"
                    : "var(--amber-100)",
              value: t("admin.scene.secondsUnit", { value: decimal((band.toMs - band.fromMs) / 1000, 1, bcp47) }),
            }))}
            footnote={t("admin.scene.stripFootnote")}
          >
            <TrialStrip
              totalMs={TRIAL_MS}
              bands={TRIAL_BANDS.map((band) => ({ ...band, label: t(band.label) }))}
              markers={[
                { label: t("admin.scene.markerOstensive", { value: decimal(TRIAL_OSTENSIVE_MS / 1000, 1, bcp47) }), atMs: TRIAL_OSTENSIVE_MS },
                { label: t("admin.scene.markerCue", { value: decimal(TRIAL_CUE_MS / 1000, 1, bcp47) }), atMs: TRIAL_CUE_MS },
              ]}
            />
          </Figure>

          <ol className={styles.timeline}>
            {TRIAL_TIMELINE.map(([time, title, note]) => (
              <li key={time}>
                <span className={styles.timelineTime}>{t(time)}</span>
                <strong>{t(title)}</strong>
                <p>{t(note)}</p>
              </li>
            ))}
          </ol>

          <div className={styles.split}>
            <div className={styles.prose}>
              <h3>{t("admin.scene.whyOstensive")}</h3>
              <p>{t("admin.scene.whyOstensiveBody")}</p>
              <a className={styles.link} href="https://doi.org/10.1016/j.cub.2008.03.059" target="_blank" rel="noreferrer">
                Senju &amp; Csibra 2008 <IconArrowRight size={13} />
              </a>
            </div>

            <div className={styles.prose}>
              <h3>{t("admin.scene.whyVector")}</h3>
              <p>{t("admin.scene.whyVectorBody")}</p>
            </div>
          </div>

          <div className={styles.split}>
            <div className={styles.prose}>
              <h3>{t("admin.scene.designSource")}</h3>
              <p>
                {t("admin.scene.designSourceBody1Pre")}<em>{t("admin.scene.designSourceEm")}</em>
                {t("admin.scene.designSourceBody1Post")}
              </p>
              <p>
                {t("admin.scene.designSourceBody2Pre")}<code>referensi/stimulus_billeci/</code>
                {t("admin.scene.designSourceBody2Post")}
              </p>
            </div>

            <div className={styles.prose}>
              <h3>{t("admin.scene.construct")}</h3>
              <p>{t("admin.scene.constructBody")}</p>
              <a className={styles.link} href="https://doi.org/10.3389/fpsyg.2019.02187" target="_blank" rel="noreferrer">
                Cilia dkk. 2019 <IconArrowRight size={13} />
              </a>
            </div>
          </div>

          <h3 className={styles.subhead}>{t("admin.scene.omittedHeading")}</h3>
          <div className={styles.choices}>
            {DESIGN_CHOICES.map(([choice, reason]) => (
              <article key={choice}><strong>{t(choice)}</strong><p>{t(reason)}</p></article>
            ))}
          </div>

          <Note kind="limit" title={t("admin.scene.limitTitle")}>
            {t("admin.scene.limitBody")}
          </Note>
        </section>

        <footer className={styles.pageFoot}>
          <IconInfo size={15} />
          <p>{t("admin.footer")}</p>
        </footer>
      </main>
    </div>
  );
}
