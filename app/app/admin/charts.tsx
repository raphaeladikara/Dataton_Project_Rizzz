"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./charts.module.css";
import { useT } from "../../src/i18n/useT";
import { decimal } from "../../src/i18n/format";

/**
 * Chart primitives for the technical panel.
 *
 * No charting library. Every mark here is HTML or hand-written SVG, because the
 * PWA has to install and run offline on a mid-range tablet, and a 200 kB plotting
 * bundle to draw thirty bars is not a trade this product can make.
 *
 * Colour rules, in order of precedence:
 *   1. When a mark *means* good or bad — a pass, a missed case, a withheld
 *      session — it wears the semantic token from app/tokens.css. Teal passes,
 *      coral is the hard limit, amber wants attention, slate is withheld.
 *   2. When a mark only means *which series*, it takes a slot from the local
 *      categorical scale in charts.module.css. That scale is three hues, ordered,
 *      and validated for protanopia/deuteranopia separation rather than eyeballed.
 * Text never wears a series colour; identity comes from the swatch beside it.
 */

// ── Motion window ───────────────────────────────────────────────────────────

/** Longest entrance in charts.module.css, plus room for its stagger. */
const MOTION_WINDOW_MS = 2400;

/**
 * Opens the window in which chart entrances are allowed to run, then closes it.
 *
 * The animations start marks at zero length, so anywhere they are paused rather
 * than played — a background tab, a print job, a headless screenshot, a browser
 * with JS off — the chart would render empty. Gating them on an attribute this
 * hook sets and then removes means a paused animation cannot exist: outside the
 * window there is nothing to pause. Call it once, from the page component.
 */
export function useChartMotion() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.chartsReady = "true";
    const timer = window.setTimeout(() => {
      delete root.dataset.chartsReady;
    }, MOTION_WINDOW_MS);
    return () => {
      window.clearTimeout(timer);
      delete root.dataset.chartsReady;
    };
  }, []);
}

// ── Formatting ──────────────────────────────────────────────────────────────

/** Indonesian decimal comma. Every number rendered here goes through this. */
/**
 * Formatters used to live here with a hard-coded comma separator. They now come
 * from the i18n module, which picks the separator from the reader's locale
 * instead of assuming one.
 */

// ── Frame ───────────────────────────────────────────────────────────────────

export function Figure({
  title,
  note,
  legend,
  footnote,
  children,
}: {
  title: string;
  note?: string;
  legend?: readonly LegendItem[];
  footnote?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <figure className={styles.figure}>
      <figcaption>
        <strong>{title}</strong>
        {note ? <span>{note}</span> : null}
      </figcaption>
      {legend ? <Legend items={legend} /> : null}
      <div className={styles.plot}>{children}</div>
      {footnote ? <p className={styles.footnote}>{footnote}</p> : null}
    </figure>
  );
}

export type LegendItem = { label: string; color: string; value?: string; shape?: "dot" | "rule" };

/**
 * Always rendered for two or more series. One series needs no legend — the
 * figure title already names what is plotted.
 */
export function Legend({ items }: { items: readonly LegendItem[] }) {
  return (
    <ul className={styles.legend}>
      {items.map((item) => (
        <li key={item.label}>
          <i data-shape={item.shape ?? "dot"} style={{ background: item.color }} />
          <span>{item.label}</span>
          {item.value ? <b>{item.value}</b> : null}
        </li>
      ))}
    </ul>
  );
}

// ── Horizontal bars ─────────────────────────────────────────────────────────

export type BarRow = {
  label: string;
  sublabel?: string;
  value: number;
  display: string;
  /** Semantic role of this bar, when the value means good or bad. */
  tone?: "good" | "warn" | "bad" | "calm" | "series-1" | "series-2" | "series-3";
};

/**
 * The workhorse. One series, thin marks, a rounded data-end, and an optional
 * threshold rule so the reader never has to hold the pass mark in their head.
 */
export function BarRows({
  rows,
  max,
  threshold,
  thresholdLabel,
  thresholdSide = "min",
}: {
  rows: readonly BarRow[];
  max: number;
  threshold?: number;
  thresholdLabel?: string;
  /** "min" — bars must clear the rule. "max" — bars must stay under it. */
  thresholdSide?: "min" | "max";
}) {
  const { t, bcp47 } = useT();
  return (
    <div className={styles.bars}>
      {threshold !== undefined ? (
        <p className={styles.thresholdKey}>
          <i /> {thresholdLabel ?? t("chart.threshold", { value: decimal(threshold, 1, bcp47) })}
        </p>
      ) : null}
      <div className={styles.barGrid}>
        {rows.map((row, index) => {
          const clears =
            threshold === undefined
              ? undefined
              : thresholdSide === "min"
                ? row.value >= threshold
                : row.value <= threshold;
          return (
            <div key={row.label} className={styles.barRow}>
              <p className={styles.barLabel}>
                {row.label}
                {row.sublabel ? <small>{row.sublabel}</small> : null}
              </p>
              <div
                className={styles.track}
                data-threshold={threshold === undefined ? undefined : ""}
                style={
                  {
                    "--thr": threshold === undefined ? undefined : `${(threshold / max) * 100}%`,
                    "--i": index,
                  } as React.CSSProperties
                }
              >
                <span
                  className={styles.fill}
                  data-tone={row.tone ?? (clears === false ? "warn" : "good")}
                  style={{ width: `${Math.min(100, (row.value / max) * 100)}%` }}
                />
              </div>
              <b className={styles.barValue} data-clears={clears}>
                {row.display}
              </b>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Part to whole ───────────────────────────────────────────────────────────

export type Slice = { label: string; value: number; color: string };

/**
 * Composition at a glance, four segments at most. The 2px separation between
 * segments is surface colour, not a stroke — a stroke would add ink that is not
 * data.
 */
export function Donut({
  slices,
  centre,
  centreNote,
  size = 172,
}: {
  slices: readonly Slice[];
  centre: string;
  centreNote: string;
  size?: number;
}) {
  const { t, bcp47 } = useT();
  const stroke = 26;
  const radius = (size - stroke) / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const gap = 3;

  let cursor = 0;
  const arcs = slices.map((slice) => {
    const length = (slice.value / total) * circumference;
    const arc = {
      ...slice,
      dash: Math.max(0, length - gap),
      offset: -cursor - gap / 2,
    };
    cursor += length;
    return arc;
  });

  return (
    <div className={styles.donutWrap}>
      <svg
        className={styles.donut}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label={t("chart.donutAria", {
          parts: slices
            .map((s) => t("chart.donutPart", { label: s.label, value: decimal((s.value / total) * 100, 1, bcp47) }))
            .join(", "),
        })}
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {arcs.map((arc, index) => (
            <circle
              key={arc.label}
              className={styles.arc}
              style={{ "--i": index } as React.CSSProperties}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={stroke}
              strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
              strokeDashoffset={arc.offset}
            />
          ))}
        </g>
      </svg>
      <div className={styles.donutCentre}>
        <strong>{centre}</strong>
        <small>{centreNote}</small>
      </div>
    </div>
  );
}

/** One bar, several segments. Inline labels only where the segment can hold them. */
export function SplitBar({
  segments,
  total,
}: {
  segments: readonly (Slice & { display: string })[];
  total: number;
}) {
  // Grid rather than flex: `fr` shares out what is left after the 2px surface
  // gaps and ignores the segment's own text, so a labelled segment cannot claim
  // extra width and quietly put the bar off scale.
  return (
    <div
      className={styles.splitBar}
      style={{ gridTemplateColumns: segments.map((segment) => `${segment.value}fr`).join(" ") }}
    >
      {segments.map((segment, index) => {
        const share = segment.value / total;
        return (
          <span
            key={segment.label}
            className={styles.splitSegment}
            style={{ background: segment.color, "--i": index } as React.CSSProperties}
            title={`${segment.label}: ${segment.display}`}
          >
            {share >= 0.14 ? <b>{segment.display}</b> : null}
          </span>
        );
      })}
    </div>
  );
}

// ── Deviation from a baseline ───────────────────────────────────────────────

/**
 * Diverging bars around zero. Used where the story is "how far off", not "how
 * much" — the sign carries as much meaning as the magnitude.
 */
export function DeltaBars({
  rows,
  domain,
  domainLabel,
}: {
  rows: readonly { label: string; value: number; display: string }[];
  domain: number;
  domainLabel: string;
}) {
  return (
    <div className={styles.deltaWrap}>
      <div className={styles.deltaScale}>
        <b>
          <span>−{domainLabel}</span>
          <span>0</span>
          <span>+{domainLabel}</span>
        </b>
      </div>
      <div className={styles.barGrid}>
        {rows.map((row, index) => {
          const width = (Math.abs(row.value) / domain) * 50;
          const negative = row.value < 0;
          return (
            <div key={row.label} className={styles.barRow}>
              <p className={styles.barLabel}>{row.label}</p>
              <div className={styles.deltaTrack} style={{ "--i": index } as React.CSSProperties}>
                <span
                  className={styles.deltaFill}
                  data-sign={negative ? "neg" : "pos"}
                  style={{
                    width: `${Math.min(50, width)}%`,
                    [negative ? "right" : "left"]: "50%",
                  }}
                />
              </div>
              <b className={styles.barValue}>{row.display}</b>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── One value against a limit ───────────────────────────────────────────────

export function Meter({
  value,
  limit,
  max,
  display,
  limitLabel,
  side = "max",
}: {
  value: number;
  limit: number;
  max: number;
  display: string;
  limitLabel: string;
  side?: "min" | "max";
}) {
  const clears = side === "max" ? value <= limit : value >= limit;
  return (
    <div className={styles.meter}>
      <div className={styles.meterTrack} style={{ "--thr": `${(limit / max) * 100}%` } as React.CSSProperties}>
        <span
          className={styles.fill}
          data-tone={clears ? "good" : "bad"}
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
      </div>
      <div className={styles.meterFoot}>
        <b>{display}</b>
        <span>{limitLabel}</span>
      </div>
    </div>
  );
}

// ── Confusion matrix ────────────────────────────────────────────────────────

export function ConfusionMatrix({
  truePositive,
  falseNegative,
  falsePositive,
  trueNegative,
}: {
  truePositive: string;
  falseNegative: string;
  falsePositive: string;
  trueNegative: string;
}) {
  const { t } = useT();
  return (
    <div className={styles.matrixGrid}>
      <span className={styles.matrixCorner} />
      <span className={styles.matrixHead}>{t("chart.matrixReferred")}</span>
      <span className={styles.matrixHead}>{t("chart.matrixNotReferred")}</span>

      <span className={styles.matrixSide}>{t("chart.matrixTarget")}</span>
      <MatrixCell tone="good" value={truePositive} code="TP" label={t("chart.matrixCaught")} />
      <MatrixCell tone="bad" value={falseNegative} code="FN" label={t("chart.matrixMissed")} />

      <span className={styles.matrixSide}>{t("chart.matrixNotTarget")}</span>
      <MatrixCell tone="warn" value={falsePositive} code="FP" label={t("chart.matrixWrong")} />
      <MatrixCell tone="calm" value={trueNegative} code="TN" label={t("chart.matrixCorrect")} />
    </div>
  );
}

function MatrixCell({
  tone,
  value,
  code,
  label,
}: {
  tone: "good" | "bad" | "warn" | "calm";
  value: string;
  code: string;
  label: string;
}) {
  return (
    <span className={styles.matrixCell} data-tone={tone}>
      <small>{code}</small>
      <b>{value}</b>
      <em>{label}</em>
    </span>
  );
}

// ── Referral cost ───────────────────────────────────────────────────────────

/**
 * One dot per referral, one of them the child the rule was right about. At low
 * prevalence the ratio is the whole argument, and a number hides it.
 */
export function RatioDots({ total, note }: { total: number; note: string }) {
  const capped = Math.min(Math.round(total), 80);
  return (
    <div className={styles.ratio}>
      <div className={styles.ratioDots} aria-hidden="true">
        {Array.from({ length: capped }, (_, index) => (
          <i key={index} data-hit={index === 0 || undefined} style={{ "--i": index } as React.CSSProperties} />
        ))}
        {Math.round(total) > capped ? <b>+{Math.round(total) - capped}</b> : null}
      </div>
      <p>{note}</p>
    </div>
  );
}

// ── Nested proportions ──────────────────────────────────────────────────────

export function FunnelBars({
  steps,
  total,
}: {
  steps: readonly { label: string; value: number; display: string; tone?: "good" | "warn" | "calm" }[];
  total: number;
}) {
  return (
    <div className={styles.funnel}>
      {steps.map((step, index) => (
        <div key={step.label} className={styles.funnelRow}>
          <p className={styles.barLabel}>{step.label}</p>
          <div className={styles.funnelTrack}>
            <span
              className={styles.fill}
              data-tone={step.tone ?? "calm"}
              style={{ width: `${(step.value / total) * 100}%`, "--i": index } as React.CSSProperties}
            />
          </div>
          <b className={styles.barValue}>{step.display}</b>
        </div>
      ))}
    </div>
  );
}

// ── Separation between two conditions ───────────────────────────────────────

export type RangeStrip = {
  label: string;
  domain: readonly [number, number];
  ticks: readonly string[];
  a: { from: number; to: number; display: string };
  b: { from: number; to: number; display: string };
  gap: string;
};

/**
 * Small multiples, one strip per signal. Each signal keeps its own axis because
 * they are measured in different units — a shared axis here would be a lie.
 */
export function RangeStrips({ strips, aLabel, bLabel }: { strips: readonly RangeStrip[]; aLabel: string; bLabel: string }) {
  const place = (strip: RangeStrip, value: number) =>
    ((value - strip.domain[0]) / (strip.domain[1] - strip.domain[0])) * 100;

  return (
    <div className={styles.strips}>
      {strips.map((strip, index) => (
        <div key={strip.label} className={styles.strip}>
          <p className={styles.stripLabel}>
            {strip.label}
            <small>celah {strip.gap}</small>
          </p>
          <div className={styles.stripTrack} style={{ "--i": index } as React.CSSProperties}>
            <span
              className={styles.stripRange}
              data-series="a"
              style={{ left: `${place(strip, strip.a.from)}%`, width: `${place(strip, strip.a.to) - place(strip, strip.a.from)}%` }}
              title={`${aLabel}: ${strip.a.display}`}
            />
            <span
              className={styles.stripRange}
              data-series="b"
              style={{ left: `${place(strip, strip.b.from)}%`, width: `${place(strip, strip.b.to) - place(strip, strip.b.from)}%` }}
              title={`${bLabel}: ${strip.b.display}`}
            />
          </div>
          <div className={styles.stripTicks}>
            {strip.ticks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Estimate with an interval ───────────────────────────────────────────────

/**
 * A point estimate never travels alone here. The bar is the interval, the pip is
 * the estimate, and the rule is whatever the number has to beat — so an AUC that
 * looks strong and an AUC whose interval still touches chance look different.
 */
export function IntervalPlot({
  domain,
  ticks,
  intervals,
}: {
  domain: readonly [number, number];
  ticks: readonly string[];
  intervals: readonly {
    label: string;
    from: number;
    to: number;
    point: number;
    display: string;
    rule?: { at: number; label: string };
  }[];
}) {
  const place = (value: number) => ((value - domain[0]) / (domain[1] - domain[0])) * 100;
  return (
    <div className={styles.strips}>
      {intervals.map((interval, index) => (
        <div key={interval.label} className={styles.strip}>
          <p className={styles.stripLabel}>
            {interval.label}
            <small>{interval.display}</small>
          </p>
          <div className={styles.stripTrack} style={{ "--i": index } as React.CSSProperties}>
            {interval.rule ? (
              <span className={styles.stripRule} style={{ left: `${place(interval.rule.at)}%` }} />
            ) : null}
            <span
              className={styles.stripRange}
              data-series="interval"
              style={{ left: `${place(interval.from)}%`, width: `${place(interval.to) - place(interval.from)}%` }}
            />
            <span className={styles.stripPoint} style={{ left: `${place(interval.point)}%` }} />
          </div>
          <div className={styles.stripTicks}>
            {ticks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Fired / did not fire ────────────────────────────────────────────────────

/** One dot per session. Filled means the rule fired on that session. */
export function OutcomeDots({
  rows,
}: {
  rows: readonly { label: string; fired: number; total: number; display: string }[];
}) {
  return (
    <div className={styles.outcomes}>
      {rows.map((row) => (
        <div key={row.label} className={styles.outcomeRow}>
          <p className={styles.barLabel}>{row.label}</p>
          <div className={styles.outcomeDots} aria-hidden="true">
            {Array.from({ length: row.total }, (_, index) => (
              <i key={index} data-fired={index < row.fired || undefined} style={{ "--i": index } as React.CSSProperties} />
            ))}
          </div>
          <b className={styles.barValue}>{row.display}</b>
        </div>
      ))}
    </div>
  );
}

// ── PPV against prevalence ──────────────────────────────────────────────────

/**
 * The one chart that explains why Gate C is measured in wrong referrals. PPV is
 * not a property of the test; it collapses as prevalence falls, and a screening
 * tool for a 1-in-100 condition lives at the bottom of this curve.
 */
export function PpvCurve({
  sensitivity,
  specificity,
  prevalence,
}: {
  sensitivity: number;
  specificity: number;
  prevalence: number;
}) {
  const { t, bcp47 } = useT();
  /** Percentage with the reader's separator — used a dozen times in this one chart. */
  const pctL = (value: number, digits = 1) => `${decimal(value * 100, digits, bcp47)}%`;
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ x: number; p: number; ppv: number } | null>(null);

  const width = 460;
  const height = 190;
  const pad = { top: 14, right: 16, bottom: 26, left: 42 };
  const maxPrevalence = Math.max(0.05, prevalence * 1.6);

  const ppvAt = (p: number) => {
    const positives = sensitivity * p;
    const denominator = positives + (1 - specificity) * (1 - p);
    return denominator ? positives / denominator : 0;
  };

  const maxPpv = Math.min(1, Math.ceil(ppvAt(maxPrevalence) * 20) / 20) || 0.05;
  const x = (p: number) => pad.left + (p / maxPrevalence) * (width - pad.left - pad.right);
  const y = (v: number) => height - pad.bottom - (v / maxPpv) * (height - pad.top - pad.bottom);

  const samples = Array.from({ length: 81 }, (_, index) => (index / 80) * maxPrevalence);
  const path = samples.map((p, index) => `${index === 0 ? "M" : "L"}${x(p).toFixed(2)} ${y(ppvAt(p)).toFixed(2)}`).join(" ");
  const area = `${path} L${x(maxPrevalence).toFixed(2)} ${height - pad.bottom} L${x(0).toFixed(2)} ${height - pad.bottom} Z`;

  const track = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const local = ((event.clientX - box.left) / box.width) * width;
    const clamped = Math.min(width - pad.right, Math.max(pad.left, local));
    const p = ((clamped - pad.left) / (width - pad.left - pad.right)) * maxPrevalence;
    setHover({ x: clamped, p, ppv: ppvAt(p) });
  };

  const active = hover ?? { x: x(prevalence), p: prevalence, ppv: ppvAt(prevalence) };

  return (
    <div className={styles.curveWrap}>
      <svg
        ref={svgRef}
        className={styles.curve}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t("chart.ppvAria", {
          high: pctL(ppvAt(maxPrevalence)),
          highPrev: pctL(maxPrevalence, 0),
          low: pctL(ppvAt(0.002)),
          lowPrev: pctL(0.002, 1),
        })}
        onPointerMove={track}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((step) => (
          <g key={step}>
            <line
              className={styles.grid}
              x1={pad.left}
              x2={width - pad.right}
              y1={y(maxPpv * step)}
              y2={y(maxPpv * step)}
            />
            <text className={styles.tick} x={pad.left - 8} y={y(maxPpv * step) + 4} textAnchor="end">
              {decimal(maxPpv * step * 100, 0, bcp47)}%
            </text>
          </g>
        ))}

        <path className={styles.curveArea} d={area} fill={`url(#${gradientId})`} />
        <path className={styles.curveLine} d={path} />

        <line className={styles.crosshair} x1={active.x} x2={active.x} y1={pad.top} y2={height - pad.bottom} />
        <circle className={styles.curveDot} cx={active.x} cy={y(active.ppv)} r={5} />

        <text className={styles.tick} x={pad.left} y={height - 8}>0%</text>
        <text className={styles.tick} x={width - pad.right} y={height - 8} textAnchor="end">
          {decimal(maxPrevalence * 100, 1, bcp47)}%
        </text>
        <text className={styles.axisTitle} x={width / 2} y={height - 8} textAnchor="middle">
          {t("chart.ppvAxis")}
        </text>
      </svg>
      <p className={styles.curveRead}>
        <b>{pctL(active.ppv)}</b> {t("chart.ppvRead", { prevalence: pctL(active.p) })}
        <span>{t(hover ? "chart.ppvCursor" : "chart.ppvCurrent")}</span>
      </p>
    </div>
  );
}

// ── Frame geometry ──────────────────────────────────────────────────────────

/**
 * The GeoPref clip drawn to scale. The two panels really do sit inside that much
 * black, and stating "19,8%" in prose never lands the way the picture does.
 */
export function FrameGeometry({
  panelShare,
  panelLabelLeft,
  panelLabelRight,
}: {
  panelShare: number;
  panelLabelLeft: string;
  panelLabelRight: string;
}) {
  const { t, bcp47 } = useT();
  // Two panels, side by side, together covering panelShare of a 640x360 frame.
  const frameW = 640;
  const frameH = 360;
  const panelArea = (panelShare * frameW * frameH) / 2;
  const panelH = Math.sqrt(panelArea / 1.55);
  const panelW = panelArea / panelH;
  const gap = 46;
  const top = (frameH - panelH) / 2;
  const leftX = frameW / 2 - gap / 2 - panelW;
  const rightX = frameW / 2 + gap / 2;

  return (
    <svg
      className={styles.frame}
      viewBox={`0 0 ${frameW} ${frameH}`}
      role="img"
      aria-label={t("chart.frameAria", { share: decimal(panelShare * 100, 1, bcp47) })}
    >
      <rect x="0" y="0" width={frameW} height={frameH} rx="10" className={styles.frameBg} />
      <rect x={leftX} y={top} width={panelW} height={panelH} rx="4" className={styles.framePanel} data-side="left" />
      <rect x={rightX} y={top} width={panelW} height={panelH} rx="4" className={styles.framePanel} data-side="right" />
      <text className={styles.frameLabel} x={leftX + panelW / 2} y={top + panelH + 22} textAnchor="middle">
        {panelLabelLeft}
      </text>
      <text className={styles.frameLabel} x={rightX + panelW / 2} y={top + panelH + 22} textAnchor="middle">
        {panelLabelRight}
      </text>
      <text className={styles.frameNote} x="16" y="28">
        {t("chart.frameUsed", { share: decimal(panelShare * 100, 1, bcp47) })}
      </text>
    </svg>
  );
}

/** Two rectangles at the same scale: what the paper reported, and what ships. */
export function SubtenseCompare({
  reference,
  shipped,
}: {
  reference: { w: number; h: number; label: string };
  shipped: { w: number; h: number; label: string };
}) {
  const { t, bcp47 } = useT();
  const scale = 220 / reference.w;
  const width = 300;
  const height = reference.h * scale + 46;
  const refW = reference.w * scale;
  const refH = reference.h * scale;
  const shipW = shipped.w * scale;
  const shipH = shipped.h * scale;

  return (
    <svg
      className={styles.subtense}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={t("chart.subtenseAria", {
        shippedW: decimal(shipped.w, 1, bcp47),
        shippedH: decimal(shipped.h, 1, bcp47),
        refW: decimal(reference.w, 1, bcp47),
        refH: decimal(reference.h, 1, bcp47),
      })}
    >
      <rect x="10" y="10" width={refW} height={refH} rx="4" className={styles.subtenseRef} />
      <rect x="10" y={10 + refH - shipH} width={shipW} height={shipH} rx="4" className={styles.subtenseShipped} />
      <text className={styles.frameLabel} x="10" y={height - 24}>
        {reference.label}
      </text>
      <text className={styles.frameLabel} x="10" y={height - 8} data-tone="shipped">
        {shipped.label}
      </text>
    </svg>
  );
}

// ── Trial timeline ──────────────────────────────────────────────────────────

export function TrialStrip({
  totalMs,
  bands,
  markers,
}: {
  totalMs: number;
  bands: readonly { label: string; fromMs: number; toMs: number; tone: "rest" | "ostensive" | "response" }[];
  markers: readonly { label: string; atMs: number }[];
}) {
  const { t, bcp47 } = useT();
  return (
    <div className={styles.trial}>
      <div
        className={styles.trialBands}
        style={{ gridTemplateColumns: bands.map((band) => `${band.toMs - band.fromMs}fr`).join(" ") }}
      >
        {bands.map((band, index) => {
          const share = (band.toMs - band.fromMs) / totalMs;
          return (
            <span
              key={band.label}
              className={styles.trialBand}
              data-tone={band.tone}
              style={{ "--i": index } as React.CSSProperties}
              title={t("chart.bandTitle", {
                label: band.label,
                from: decimal(band.fromMs / 1000, 1, bcp47),
                to: decimal(band.toMs / 1000, 1, bcp47),
              })}
            >
              {/* A band narrower than this cannot hold its name without clipping
                  it, so the name moves to the legend rather than losing letters. */}
              {share >= 0.18 ? band.label : null}
            </span>
          );
        })}
      </div>
      <div className={styles.trialAxis}>
        {markers.map((marker) => (
          <span key={marker.label} className={styles.trialMarker} style={{ left: `${(marker.atMs / totalMs) * 100}%` }}>
            <i />
            <small>{marker.label}</small>
          </span>
        ))}
        <span className={styles.trialEnd}>{t("chart.trialEnd", { value: decimal(totalMs / 1000, 1, bcp47) })}</span>
      </div>
    </div>
  );
}

// ── Gate ladder ─────────────────────────────────────────────────────────────

export function GateLadder({
  gates,
}: {
  gates: readonly { id: string; label: string; passed: boolean }[];
}) {
  return (
    <ol className={styles.ladder}>
      {gates.map((gate, index) => (
        <li key={gate.id} data-state={gate.passed ? "passed" : "open"} style={{ "--i": index } as React.CSSProperties}>
          <span className={styles.ladderMark} data-gate={gate.id}>
            {gate.id}
          </span>
          <p>{gate.label}</p>
        </li>
      ))}
    </ol>
  );
}
