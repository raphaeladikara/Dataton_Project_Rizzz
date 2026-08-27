"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CHILD_TARGETS } from "../capture/calibrationTargets";
import type { MessageKey } from "../i18n/dictionary";
import { useT, type Translate } from "../i18n/useT";
import {
  IconBrightness,
  IconCalibrationGrid,
  IconCamera,
  IconCheck,
  IconChild,
  IconEye,
  IconGauge,
  IconJointAttention,
  IconOrientation,
  IconPlay,
  IconReport,
  IconShieldCheck,
} from "./icons";

const STEP_DURATION = 2600;

/**
 * The rail's nine steps. Labels are keys: this illustration reuses the session
 * rail's wording, and two copies of the same nine labels is two places for them
 * to drift apart.
 */
const FLOW = [
  { key: "consent", label: "rail.consent", hint: "rail.consentHint", icon: IconShieldCheck },
  { key: "preparation", label: "rail.preparation", hint: "rail.preparationHint", icon: IconChild },
  { key: "tutorial", label: "rail.tutorial", hint: "hero.flow.tutorialHint", icon: IconPlay },
  { key: "device", label: "rail.device", hint: "rail.deviceHint", icon: IconCamera },
  { key: "calibration", label: "rail.calibration", hint: "rail.calibrationHint", icon: IconCalibrationGrid },
  { key: "sanity", label: "rail.sanity", hint: "rail.sanityHint", icon: IconEye },
  { key: "stimulus", label: "rail.stimulus", hint: "hero.flow.stimulusHint", icon: IconJointAttention },
  { key: "quality", label: "rail.quality", hint: "rail.qualityHint", icon: IconGauge },
  { key: "report", label: "rail.report", hint: "rail.reportHint", icon: IconReport },
] as const satisfies readonly { key: string; label: MessageKey; hint: MessageKey; icon: (p: { size?: number }) => React.ReactElement }[];

const LOOP = FLOW.length * STEP_DURATION;
// Derived, so the illustration cannot go on advertising a grid the app stopped
// running. It showed the four-corner square for as long as the square was the
// reason sessions were coming back unscorable.
const CALIBRATION_TARGETS = CHILD_TARGETS.map(([x, y]) => [x * 100, y * 100] as const);

const PREP_ITEMS = [
  ["hero.prep.item1", "hero.prep.item1Note"],
  ["hero.prep.item2", "hero.prep.item2Note"],
  ["hero.prep.item3", "hero.prep.item3Note"],
] as const satisfies readonly (readonly [MessageKey, MessageKey])[];

const SANITY_POSITIONS = ["hero.sanity.left", "hero.sanity.centre", "hero.sanity.right"] as const;

function MockCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`heroMockCard ${className}`}>{children}</div>;
}

function FlowScreen({ index, phase, t }: { index: number; phase: number; t: Translate }) {
  const activeCalibration = Math.min(4, Math.floor(phase * 5));
  const sanityPosition = Math.min(2, Math.floor(phase * 3));
  const stimulusScene = Math.min(10, 1 + Math.floor(phase * 10));

  if (index === 0) return <div className="heroFlowScreen heroConsent">
    <div className="heroMockHeading"><span>{t("hero.consent.kicker")}</span><strong>{t("hero.consent.title")}</strong><small>{t("hero.consent.note")}</small></div>
    <div className="heroMockFields"><MockCard><small>{t("hero.consent.childId")}</small><strong>NG-024</strong></MockCard><MockCard><small>{t("hero.consent.age")}</small><strong>{t("hero.consent.ageValue")}</strong></MockCard></div>
    <MockCard className="heroMockCheck"><span><IconCheck size={13} /></span><div><strong>{t("hero.consent.given")}</strong><small>{t("hero.consent.givenNote")}</small></div></MockCard>
  </div>;

  if (index === 1) return <div className="heroFlowScreen heroPreparation">
    <div className="heroMockHeading"><span>{t("hero.prep.kicker")}</span><strong>{t("hero.prep.title")}</strong><small>{t("hero.prep.note")}</small></div>
    <MockCard className="heroPrepMock">
      <div className="heroPrepPerson"><IconChild size={34} /><i><IconCamera size={16} /></i></div>
      <div>{PREP_ITEMS.map(([title, detail]) => <span key={title}><IconCheck size={12} /><b>{t(title)}<small>{t(detail)}</small></b></span>)}</div>
    </MockCard>
  </div>;

  if (index === 2) return <div className="heroFlowScreen heroTutorialMock">
    <div className="heroMockHeading"><span>{t("hero.tutorial.kicker")}</span><strong>{t("hero.tutorial.title")}</strong><small>{t("hero.tutorial.note")}</small></div>
    <div className="heroTutorialFilm"><span><IconPlay size={22} /></span><div><strong>{t("hero.tutorial.filmTitle")}</strong><small>{t("hero.tutorial.filmNote")}</small></div><i><b style={{ "--p": phase } as CSSProperties} /></i></div>
  </div>;

  if (index === 3) return <div className="heroFlowScreen heroDeviceMock">
    <div className="heroMockHeading"><span>{t("hero.device.kicker")}</span><strong>{t("hero.device.title2")}</strong><small>{t("hero.device.note")}</small></div>
    <div className="heroDeviceMockGrid">
      <div className="heroCameraPreview"><div className="heroCameraFigure"><i className="heroCameraHead" /><i className="heroCameraNeck" /><i className="heroCameraShoulders" /></div><i className="heroFaceBox" /><i className="heroEye left" /><i className="heroEye right" /><span><IconCheck size={10} /> {t("hero.device.faceRead")}</span></div>
      <div className="heroReadyList"><span><IconEye size={13} /><b>{t("hero.device.faceVisible")}</b><small>{t("hero.device.ready")}</small></span><span><IconBrightness size={13} /><b>{t("hero.device.light")}</b><small>{t("hero.device.lightOk")}</small></span><span><IconOrientation size={13} /><b>{t("hero.device.framing")}</b><small>{t("hero.device.ready")}</small></span></div>
    </div>
  </div>;

  if (index === 4) return <div className="heroFlowScreen heroCalibrationMock">
    <div className="heroCalibrationTop"><span><IconCalibrationGrid size={14} /><b>{t("hero.calib.title")}</b></span><small>{t("hero.calib.position", { index: activeCalibration + 1 })}</small></div>
    <div className="heroCalibrationBoard">{CALIBRATION_TARGETS.map(([x, y], targetIndex) => <span key={`${x}-${y}`} data-state={targetIndex < activeCalibration ? "done" : targetIndex === activeCalibration ? "active" : ""} style={{ left: `${x}%`, top: `${y}%` }}><IconChild size={targetIndex === activeCalibration ? 22 : 13} /></span>)}</div>
    <small className="heroScreenNote">{t("hero.calib.note")}</small>
  </div>;

  if (index === 5) return <div className="heroFlowScreen heroSanityMock">
    <div className="heroMockHeading"><span>{t("hero.sanity.kicker")}</span><strong>{t("hero.sanity.title")}</strong><small>{t("hero.sanity.note")}</small></div>
    <div className="heroSanityStage">{SANITY_POSITIONS.map((label, positionIndex) => <span key={label} data-active={sanityPosition === positionIndex}><IconChild size={positionIndex === sanityPosition ? 28 : 17} /><small>{t(label)}</small></span>)}</div>
  </div>;

  if (index === 6) return <div className="heroFlowScreen heroStimulusMock">
    <div className="heroStimulusStatus"><span>{t("hero.stimulus.status")}</span><small>{t("hero.stimulus.scene", { index: stimulusScene })}</small></div>
    <div className="heroStimulusScene"><span className="heroToy left">◆</span><div className="heroPerson"><i /><b /><span /></div><span className="heroToy right">●</span></div>
    <div className="heroSceneProgress"><i style={{ "--p": phase } as CSSProperties} /></div>
    <small className="heroScreenNote">{t("hero.stimulus.note")}</small>
  </div>;

  if (index === 7) return <div className="heroFlowScreen heroQualityMock">
    <div className="heroMockHeading"><span>{t("hero.quality.kicker")}</span><strong>{t("hero.quality.title")}</strong><small>{t("hero.quality.note")}</small></div>
    <div className="heroQualityGrid"><MockCard><IconEye size={16} /><span><strong>{t("hero.quality.face")}</strong><small>{t("hero.quality.faceValue")}</small></span></MockCard><MockCard><IconCalibrationGrid size={16} /><span><strong>{t("hero.quality.direction")}</strong><small>{t("hero.quality.directionValue")}</small></span></MockCard><MockCard><IconJointAttention size={16} /><span><strong>{t("hero.quality.phases")}</strong><small>{t("hero.quality.phasesValue")}</small></span></MockCard></div>
    <div className="heroQualityDecision"><span><IconCheck size={14} /></span><div><strong>{t("hero.quality.decision")}</strong><small>{t("hero.quality.decisionNote")}</small></div></div>
  </div>;

  return <div className="heroFlowScreen heroReportMock">
    <div className="heroReportBadge"><IconCheck size={18} /><span>{t("hero.report.badge")}</span></div>
    <strong className="heroReportTitle">{t("hero.report.title")}</strong>
    <p>{t("hero.report.note")}</p>
    <div className="heroReportMetrics"><MockCard><small>{t("hero.report.quality")}</small><strong>{t("hero.report.qualityValue")}</strong></MockCard><MockCard><small>{t("hero.report.next")}</small><strong>{t("hero.report.nextValue")}</strong></MockCard></div>
  </div>;
}

export function HeroDevice() {
  const { t } = useT();
  // Named for what it holds. It used to be `t`, which is now the translator.
  const [elapsedMs, setElapsedMs] = useState(LOOP - 700);
  const frame = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let startedAt: number | null = null;
    const tick = (now: number) => {
      if (startedAt === null) startedAt = now;
      const elapsed = (now - startedAt) % LOOP;
      setElapsedMs(elapsed);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, []);

  const activeIndex = Math.min(FLOW.length - 1, Math.floor(elapsedMs / STEP_DURATION));
  const phase = (elapsedMs % STEP_DURATION) / STEP_DURATION;
  const current = FLOW[activeIndex];
  const next = FLOW[activeIndex + 1];

  return <div className="heroDevice">
    <div className="heroDeviceGlow" aria-hidden="true" />
    <div className="heroDeviceFrame">
      <div className="heroDeviceBar"><span className="heroDeviceDots" aria-hidden="true"><i /><i /><i /></span><span className="heroDeviceTitle"><IconEye size={12} /> {t("hero.device.title")}</span><span className="heroDeviceLive">{t("hero.device.local")}</span></div>
      <div className="heroDeviceBody">
        <div className="heroRail" aria-hidden="true">{FLOW.map((step, index) => <span key={step.key} className="heroRailIcon" data-state={index < activeIndex ? "done" : index === activeIndex ? "active" : "upcoming"}>{index < activeIndex ? <IconCheck size={14} /> : <step.icon size={15} />}</span>)}</div>
        <div className="heroDeviceStage">
          <div className="heroStageHead"><div><span className="heroStageCounter">{String(activeIndex + 1).padStart(2, "0")} / 09</span><strong className="heroStageStep">{t(current.label)}</strong></div><span className="heroStageNext">{next ? t("hero.device.next", { label: t(next.label) }) : t("hero.device.last")}</span></div>
          <FlowScreen key={current.key} index={activeIndex} phase={phase} t={t} />
          <div className="heroFlowProgress" aria-hidden="true"><i style={{ "--step": activeIndex, "--phase": phase } as CSSProperties} /></div>
        </div>
      </div>
    </div>
    <div className="heroChip"><span aria-hidden="true"><IconEye size={14} /></span><div><strong>{t("hero.device.chipTitle")}</strong><small>{t("hero.device.chipNote")}</small></div></div>
  </div>;
}
