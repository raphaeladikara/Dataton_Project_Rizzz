import type { SVGProps } from "react";

/**
 * Inline SVG icon set for Neurogaze.
 *
 * Everything is drawn on a 24x24 grid with `currentColor` so icons inherit the
 * semantic colour of whatever surface they sit on, stay crisp on tablet DPRs,
 * and remain available offline without an extra network/cache entry.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* ── Gaze & measurement ────────────────────────────────────────────────── */

export function IconEye(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.4 12S6 5.8 12 5.8 21.6 12 21.6 12 18 18.2 12 18.2 2.4 12 2.4 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

/** Refer: a scanpath that scatters outward, fixations drifting off-centre. */
export function IconScanpathSpread(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M4.6 19.4C6.4 15 9 12.6 12 12.2M12 12.2c3.2-.5 5.4-3.1 6.8-7.6M12 12.2c-2.4-2.6-4.1-4-5.2-4.2M12 12.2c3 1.5 5.3 2.3 6.9 2.4"
        strokeDasharray="0.1 3.1"
        opacity=".7"
      />
      <circle cx="12" cy="12.2" r="2.6" fill="currentColor" stroke="none" />
      <circle cx="4.6" cy="19.4" r="1.9" fill="currentColor" stroke="none" opacity=".8" />
      <circle cx="19" cy="4" r="1.9" fill="currentColor" stroke="none" opacity=".8" />
      <circle cx="6.2" cy="7.6" r="1.5" fill="currentColor" stroke="none" opacity=".55" />
      <circle cx="19.4" cy="14.8" r="1.5" fill="currentColor" stroke="none" opacity=".55" />
    </Svg>
  );
}

/** Monitor: the same scanpath, but converging calmly on a centre point. */
export function IconScanpathFocus(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.4" strokeDasharray="0.1 3.2" opacity=".8" />
      <circle cx="12" cy="12" r="4.3" strokeDasharray="0.1 3" />
      <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="19.4" cy="8.6" r="1.2" fill="currentColor" stroke="none" opacity=".55" />
      <circle cx="6.2" cy="16.8" r="1.2" fill="currentColor" stroke="none" opacity=".55" />
    </Svg>
  );
}

/** Withheld: the eye is watching, but the reading is deliberately held back. */
export function IconSignalHeld(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.6 10.6C4.8 7.4 7.9 5.8 12 5.8s7.2 1.6 9.4 4.8c-.9 1.3-1.9 2.4-3 3.2" />
      <path d="M16.3 15.7c-1.4.5-2.8.8-4.3.8-4.1 0-7.2-1.6-9.4-4.8" opacity=".45" />
      <circle cx="12" cy="10.6" r="2.5" />
      <rect x="13.4" y="14.6" width="8.2" height="7" rx="2.3" fill="currentColor" stroke="none" />
      <path d="M16.2 16.8v2.6M18.8 16.8v2.6" stroke="var(--icon-knockout, #fffdf8)" strokeWidth="1.6" />
    </Svg>
  );
}

/** Privacy: analysis stays on the device — shield around an eye, with a lock. */
export function IconPrivacyShield(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.9 4.6 5.8v5.9c0 4.2 3 7.7 7.4 9.4 4.4-1.7 7.4-5.2 7.4-9.4V5.8Z" />
      <circle cx="12" cy="10.6" r="2.5" />
      <path d="M8.3 10.6c1-1.6 2.2-2.4 3.7-2.4s2.7.8 3.7 2.4" opacity=".5" />
      <path d="M9.7 16.4h4.6" opacity=".6" />
    </Svg>
  );
}

/** Calibration: the 9-point grid with a live target. */
export function IconCalibrationGrid(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="5" cy="5" r="1.3" fill="currentColor" stroke="none" opacity=".45" />
      <circle cx="12" cy="5" r="1.3" fill="currentColor" stroke="none" opacity=".45" />
      <circle cx="19" cy="5" r="1.3" fill="currentColor" stroke="none" opacity=".45" />
      <circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" opacity=".45" />
      <circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none" opacity=".45" />
      <circle cx="5" cy="19" r="1.3" fill="currentColor" stroke="none" opacity=".45" />
      <circle cx="12" cy="19" r="1.3" fill="currentColor" stroke="none" opacity=".45" />
      <circle cx="19" cy="19" r="1.3" fill="currentColor" stroke="none" opacity=".45" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Stimulus: a face giving a joint-attention cue toward a target. */
export function IconJointAttention(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8.4" cy="9.2" r="5.3" />
      <circle cx="6.7" cy="8.6" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.3" cy="8.6" r="1" fill="currentColor" stroke="none" />
      <path d="M6.9 11.6c.9.8 2.9.8 3.8 0" />
      <path d="M14.6 13.6c1.6.9 2.6 1.8 3.4 3" strokeDasharray="0.1 2.8" />
      <circle cx="19.1" cy="18.4" r="2.5" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Quality gate: a dial reading a measurement. */
export function IconGauge(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.6 17.4a9.4 9.4 0 1 1 16.8 0" />
      <path d="M12 17.2 16.2 10" />
      <circle cx="12" cy="17.4" r="1.7" fill="currentColor" stroke="none" />
      <path d="M4.6 12.6 6 13M19.4 12.6 18 13M12 4.2v1.5" opacity=".55" />
    </Svg>
  );
}

/** Camera / device check. */
export function IconCamera(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 8.4a2.4 2.4 0 0 1 2.4-2.4h1.7l1.3-2h6.4l1.3 2h2a2.4 2.4 0 0 1 2.4 2.4v8.2a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 16.6Z" />
      <circle cx="12" cy="12.4" r="3.4" />
    </Svg>
  );
}

export function IconReport(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3.2h7.6L19 8.6v12.2H6Z" />
      <path d="M13.4 3.2v5.4H19" />
      <path d="M9 17.4v-3.2M12.4 17.4v-5.6M15.8 17.4v-1.9" />
    </Svg>
  );
}

/* ── Status & feedback ─────────────────────────────────────────────────── */

export function IconCheck(props: IconProps) {
  return (
    <Svg strokeWidth={2.2} {...props}>
      <path d="M4.6 12.6 9.4 17.2 19.4 6.8" />
    </Svg>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.6 21.4 20H2.6Z" />
      <path d="M12 9.6v4.2" strokeWidth={2} />
      <circle cx="12" cy="16.9" r="1.15" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 11.2v5" strokeWidth={2} />
      <circle cx="12" cy="7.9" r="1.15" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconResearch(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.6 3.2v5.5L4.9 17a2.6 2.6 0 0 0 2.3 3.9h9.6a2.6 2.6 0 0 0 2.3-3.9l-4.7-8.3V3.2Z" />
      <path d="M8.2 3.2h7.6" />
      <path d="M7.2 14.2h9.6" opacity=".55" />
      <circle cx="10.6" cy="17" r="1" fill="currentColor" stroke="none" opacity=".7" />
      <circle cx="13.9" cy="18.2" r="1.3" fill="currentColor" stroke="none" opacity=".7" />
    </Svg>
  );
}

/* ── Chrome & actions ──────────────────────────────────────────────────── */

export function IconArrowRight(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <path d="M4.6 12h14.2M13.2 6.4 18.8 12l-5.6 5.6" />
    </Svg>
  );
}

export function IconArrowLeft(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <path d="M19.4 12H5.2M10.8 6.4 5.2 12l5.6 5.6" />
    </Svg>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.6v11.2M7.4 10.6 12 15.2l4.6-4.6" />
      <path d="M4.4 18.2v1.2a1.2 1.2 0 0 0 1.2 1.2h12.8a1.2 1.2 0 0 0 1.2-1.2v-1.2" />
    </Svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.6 6.6h14.8M9.4 6.6V4.4h5.2v2.2" />
      <path d="M6.6 6.6 7.5 19.6h9l.9-13" />
      <path d="M10.4 10.2v5.8M13.6 10.2v5.8" opacity=".6" />
    </Svg>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20.4 4v4.6h-4.6" />
    </Svg>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7.6 4.9 19 12 7.6 19.1Z" fill="currentColor" />
    </Svg>
  );
}

export function IconOffline(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.4 16.6a4 4 0 0 1 .7-7.9h.6A5.6 5.6 0 0 1 17.7 7" opacity=".9" />
      <path d="M18.6 9.2a4.2 4.2 0 0 1 .8 7.4" opacity=".55" />
      <path d="M8 16.6h8.6" />
      <path d="M4 4l16 16" strokeWidth={1.9} />
    </Svg>
  );
}

export function IconCloudLocal(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.2" y="5" width="17.6" height="11.4" rx="2.2" />
      <path d="M8 20h8" />
      <path d="M12 16.4V20" opacity=".6" />
      <circle cx="12" cy="10.7" r="2.4" opacity=".8" />
    </Svg>
  );
}

export function IconTimer(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="13.4" r="7.6" />
      <path d="M12 9.4v4h3" />
      <path d="M9.4 2.9h5.2" />
    </Svg>
  );
}

export function IconBrightness(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4.1" />
      <path d="M12 2.6v2.3M12 19.1v2.3M2.6 12h2.3M19.1 12h2.3M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6" />
    </Svg>
  );
}

export function IconSamples(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.8 12h2.6l2-5.4 2.8 11L13 8.2l1.8 3.8h6.4" />
    </Svg>
  );
}

export function IconCoverage(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m12 3 8.4 4.5v9L12 21l-8.4-4.5v-9Z" />
      <path d="M12 12 3.6 7.5M12 12l8.4-4.5M12 12v9" opacity=".55" />
    </Svg>
  );
}

export function IconOrientation(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.4" y="6.4" width="19.2" height="11.2" rx="2.2" />
      <path d="M6.6 12h1.6M15.8 9.6v4.8" opacity=".7" />
    </Svg>
  );
}

export function IconCpu(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="6.2" y="6.2" width="11.6" height="11.6" rx="2" />
      <rect x="9.8" y="9.8" width="4.4" height="4.4" rx="1" fill="currentColor" stroke="none" opacity=".75" />
      <path d="M9.6 2.9v3.3M14.4 2.9v3.3M9.6 17.8v3.3M14.4 17.8v3.3M2.9 9.6h3.3M2.9 14.4h3.3M17.8 9.6h3.3M17.8 14.4h3.3" />
    </Svg>
  );
}

export function IconChild(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="7.2" r="4" />
      <path d="M4.8 20.4a7.2 7.2 0 0 1 14.4 0" />
      <path d="M10.4 6.6h.02M13.6 6.6h.02" strokeWidth={2.1} />
    </Svg>
  );
}

export function IconLocation(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21.2s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </Svg>
  );
}

export function IconShieldCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.9 4.6 5.8v5.9c0 4.2 3 7.7 7.4 9.4 4.4-1.7 7.4-5.2 7.4-9.4V5.8Z" />
      <path d="m8.8 11.9 2.4 2.4 4.2-4.6" strokeWidth={2} />
    </Svg>
  );
}

export function IconRoute(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="5.6" cy="6" r="2.6" />
      <circle cx="18.4" cy="18" r="2.6" />
      <path d="M8.2 6h5.4a3.4 3.4 0 0 1 0 6.8h-3.2a3.4 3.4 0 0 0 0 6.8h5.4" strokeDasharray="0.1 3" />
    </Svg>
  );
}

export function IconBook(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.6 4.6h5.2A3.2 3.2 0 0 1 12 7.8v12a2.6 2.6 0 0 0-2.6-2.6H3.6Z" />
      <path d="M20.4 4.6h-5.2A3.2 3.2 0 0 0 12 7.8v12a2.6 2.6 0 0 1 2.6-2.6h5.8Z" />
    </Svg>
  );
}

/* ── Brand mark ────────────────────────────────────────────────────────── */

/** Neurogaze mark: an eye whose pupil is a gaze node with a scanpath tail. */
export function LogoMark({ size = 30, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path
        d="M2.6 16.4c3.3-5.6 7.8-8.4 13.4-8.4s10.1 2.8 13.4 8.4c-3.3 5.6-7.8 8.4-13.4 8.4S5.9 22 2.6 16.4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16.4" r="4.5" fill="var(--mark-pupil, currentColor)" />
      <circle cx="17.7" cy="14.6" r="1.4" fill="var(--mark-glint, rgba(255,255,255,.85))" />
      <path
        d="M22.6 9.4c1.9-1.1 3.7-1.4 5.4-1"
        stroke="var(--mark-trail, currentColor)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="0.1 3.4"
        opacity=".75"
      />
    </svg>
  );
}
