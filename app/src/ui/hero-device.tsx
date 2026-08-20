"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CHILD_TARGETS } from "../capture/calibrationTargets";
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
const FLOW = [
  { key: "consent", label: "Persetujuan", hint: "Izin orang tua", icon: IconShieldCheck },
  { key: "preparation", label: "Persiapan", hint: "Anak nyaman", icon: IconChild },
  { key: "tutorial", label: "Tutorial", hint: "Panduan pendamping", icon: IconPlay },
  { key: "device", label: "Posisi", hint: "Kamera dan cahaya", icon: IconCamera },
  { key: "calibration", label: "Kalibrasi", hint: "5 gambar menarik", icon: IconCalibrationGrid },
  { key: "sanity", label: "Cek arah", hint: "Kiri, tengah, kanan", icon: IconEye },
  { key: "stimulus", label: "Stimulus", hint: "Anak cukup menonton", icon: IconJointAttention },
  { key: "quality", label: "Pemeriksaan", hint: "Kualitas rekaman", icon: IconGauge },
  { key: "report", label: "Laporan", hint: "Kesimpulan & tindakan", icon: IconReport },
] as const;
const LOOP = FLOW.length * STEP_DURATION;
// Derived, so the illustration cannot go on advertising a grid the app stopped
// running. It showed the four-corner square for as long as the square was the
// reason sessions were coming back unscorable.
const CALIBRATION_TARGETS = CHILD_TARGETS.map(([x, y]) => [x * 100, y * 100] as const);

function MockCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`heroMockCard ${className}`}>{children}</div>;
}

function FlowScreen({ index, phase }: { index: number; phase: number }) {
  const activeCalibration = Math.min(4, Math.floor(phase * 5));
  const sanityPosition = Math.min(2, Math.floor(phase * 3));
  const stimulusScene = Math.min(10, 1 + Math.floor(phase * 10));

  if (index === 0) return <div className="heroFlowScreen heroConsent">
    <div className="heroMockHeading"><span>Persetujuan sebelum pengukuran</span><strong>Gunakan profil pseudonim.</strong><small>Jangan masukkan nama lengkap atau identitas pribadi.</small></div>
    <div className="heroMockFields"><MockCard><small>ID anak pseudonim</small><strong>NG-024</strong></MockCard><MockCard><small>Usia</small><strong>24 bulan</strong></MockCard></div>
    <MockCard className="heroMockCheck"><span><IconCheck size={13} /></span><div><strong>Persetujuan layanan diberikan</strong><small>Pengasuh memahami Neurogaze bukan diagnosis.</small></div></MockCard>
  </div>;

  if (index === 1) return <div className="heroFlowScreen heroPreparation">
    <div className="heroMockHeading"><span>Persiapan anak</span><strong>Buat anak nyaman sebelum mulai.</strong><small>Tidak perlu meminta anak memberi jawaban tertentu.</small></div>
    <MockCard className="heroPrepMock">
      <div className="heroPrepPerson"><IconChild size={34} /><i><IconCamera size={16} /></i></div>
      <div>{[
        ["Duduk nyaman dengan pengasuh", "Boleh dipangku selama wajah terlihat."],
        ["Tablet sejajar wajah", "Gunakan penyangga agar layar stabil."],
        ["Biarkan respons alami", "Jangan arahkan pandangan anak."],
      ].map(([title, detail]) => <span key={title}><IconCheck size={12} /><b>{title}<small>{detail}</small></b></span>)}</div>
    </MockCard>
  </div>;

  if (index === 2) return <div className="heroFlowScreen heroTutorialMock">
    <div className="heroMockHeading"><span>Tutorial · sekitar 24 detik</span><strong>Cara mendampingi anak.</strong><small>Tutorial ini untuk orang tua atau kader.</small></div>
    <div className="heroTutorialFilm"><span><IconPlay size={22} /></span><div><strong>Jaga anak tetap nyaman</strong><small>Jangan arahkan pandangannya.</small></div><i><b style={{ "--p": phase } as CSSProperties} /></i></div>
  </div>;

  if (index === 3) return <div className="heroFlowScreen heroDeviceMock">
    <div className="heroMockHeading"><span>Pemeriksaan kamera dan posisi</span><strong>Posisikan wajah di dalam kotak.</strong><small>Sistem memberi petunjuk bila posisi belum pas.</small></div>
    <div className="heroDeviceMockGrid">
      <div className="heroCameraPreview"><div className="heroCameraFigure"><i className="heroCameraHead" /><i className="heroCameraNeck" /><i className="heroCameraShoulders" /></div><i className="heroFaceBox" /><i className="heroEye left" /><i className="heroEye right" /><span><IconCheck size={10} /> Wajah terbaca</span></div>
      <div className="heroReadyList"><span><IconEye size={13} /><b>Wajah terlihat</b><small>Siap</small></span><span><IconBrightness size={13} /><b>Pencahayaan cukup</b><small>Cukup</small></span><span><IconOrientation size={13} /><b>Posisi sudah pas</b><small>Siap</small></span></div>
    </div>
  </div>;

  if (index === 4) return <div className="heroFlowScreen heroCalibrationMock">
    <div className="heroCalibrationTop"><span><IconCalibrationGrid size={14} /><b>Kalibrasi pasif</b></span><small>{activeCalibration + 1} / 5 posisi</small></div>
    <div className="heroCalibrationBoard">{CALIBRATION_TARGETS.map(([x, y], targetIndex) => <span key={`${x}-${y}`} data-state={targetIndex < activeCalibration ? "done" : targetIndex === activeCalibration ? "active" : ""} style={{ left: `${x}%`, top: `${y}%` }}><IconChild size={targetIndex === activeCalibration ? 22 : 13} /></span>)}</div>
    <small className="heroScreenNote">Anak cukup melihat gambar yang berpindah.</small>
  </div>;

  if (index === 5) return <div className="heroFlowScreen heroSanityMock">
    <div className="heroMockHeading"><span>Pengecekan setelah kalibrasi</span><strong>Mari lihat satu gambar lagi.</strong><small>Karakter muncul di kiri, tengah, lalu kanan.</small></div>
    <div className="heroSanityStage">{["Kiri", "Tengah", "Kanan"].map((label, positionIndex) => <span key={label} data-active={sanityPosition === positionIndex}><IconChild size={positionIndex === sanityPosition ? 28 : 17} /><small>{label}</small></span>)}</div>
  </div>;

  if (index === 6) return <div className="heroFlowScreen heroStimulusMock">
    <div className="heroStimulusStatus"><span>Anak cukup menonton · siap</span><small>Adegan {stimulusScene} dari 10</small></div>
    <div className="heroStimulusScene"><span className="heroToy left">◆</span><div className="heroPerson"><i /><b /><span /></div><span className="heroToy right">●</span></div>
    <div className="heroSceneProgress"><i style={{ "--p": phase } as CSSProperties} /></div>
    <small className="heroScreenNote">Tidak ada jawaban benar atau salah.</small>
  </div>;

  if (index === 7) return <div className="heroFlowScreen heroQualityMock">
    <div className="heroMockHeading"><span>Pemeriksaan kualitas</span><strong>Rekaman selesai diperiksa.</strong><small>Rekaman cukup baik untuk melanjutkan.</small></div>
    <div className="heroQualityGrid"><MockCard><IconEye size={16} /><span><strong>Wajah</strong><small>Terbaca baik</small></span></MockCard><MockCard><IconCalibrationGrid size={16} /><span><strong>Arah pandangan</strong><small>Sudah diperiksa</small></span></MockCard><MockCard><IconJointAttention size={16} /><span><strong>Bagian tes</strong><small>Cukup lengkap</small></span></MockCard></div>
    <div className="heroQualityDecision"><span><IconCheck size={14} /></span><div><strong>Rekaman dapat digunakan</strong><small>Lanjutkan untuk melihat laporan.</small></div></div>
  </div>;

  return <div className="heroFlowScreen heroReportMock">
    <div className="heroReportBadge"><IconCheck size={18} /><span>Rekaman valid</span></div>
    <strong className="heroReportTitle">Observasi perhatian berhasil dihitung.</strong>
    <p>Angka sesi bukan diagnosis dan tidak menentukan rujukan otomatis.</p>
    <div className="heroReportMetrics"><MockCard><small>Kualitas sesi</small><strong>Baik</strong></MockCard><MockCard><small>Langkah berikutnya</small><strong>Gunakan SDIDTK</strong></MockCard></div>
  </div>;
}

export function HeroDevice() {
  const [t, setT] = useState(LOOP - 700);
  const frame = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let startedAt: number | null = null;
    const tick = (now: number) => {
      if (startedAt === null) startedAt = now;
      const elapsed = (now - startedAt) % LOOP;
      setT(elapsed);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, []);

  const activeIndex = Math.min(FLOW.length - 1, Math.floor(t / STEP_DURATION));
  const phase = (t % STEP_DURATION) / STEP_DURATION;
  const current = FLOW[activeIndex];
  const next = FLOW[activeIndex + 1];

  return <div className="heroDevice">
    <div className="heroDeviceGlow" aria-hidden="true" />
    <div className="heroDeviceFrame">
      <div className="heroDeviceBar"><span className="heroDeviceDots" aria-hidden="true"><i /><i /><i /></span><span className="heroDeviceTitle"><IconEye size={12} /> neurogaze · alur skrining</span><span className="heroDeviceLive">LOKAL</span></div>
      <div className="heroDeviceBody">
        <div className="heroRail" aria-hidden="true">{FLOW.map((step, index) => <span key={step.key} className="heroRailIcon" data-state={index < activeIndex ? "done" : index === activeIndex ? "active" : "upcoming"}>{index < activeIndex ? <IconCheck size={14} /> : <step.icon size={15} />}</span>)}</div>
        <div className="heroDeviceStage">
          <div className="heroStageHead"><div><span className="heroStageCounter">{String(activeIndex + 1).padStart(2, "0")} / 09</span><strong className="heroStageStep">{current.label}</strong></div><span className="heroStageNext">{next ? `Berikutnya: ${next.label}` : "Tahap terakhir"}</span></div>
          <FlowScreen key={current.key} index={activeIndex} phase={phase} />
          <div className="heroFlowProgress" aria-hidden="true"><i style={{ "--step": activeIndex, "--phase": phase } as CSSProperties} /></div>
        </div>
      </div>
    </div>
    <div className="heroChip"><span aria-hidden="true"><IconEye size={14} /></span><div><strong>Alur asli Neurogaze</strong><small>9 langkah · diproses di tablet</small></div></div>
  </div>;
}
