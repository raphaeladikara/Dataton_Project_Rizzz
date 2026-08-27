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
  num,
  useChartMotion,
} from "./charts";

type Metric = readonly [label: string, value: string, note: string];

const GATE_A_METRICS: readonly Metric[] = [
  ["Total sesi", "100", "25 peserta · 4 sesi per orang"],
  ["Sesi selesai", "94%", "6 ditahan, semuanya dikenali sistem"],
  ["Galat median", "2,2°", "Ambang kelulusan ≤3°"],
  ["Frame valid", "96,4%", "Wajah dan mata terbaca"],
  ["Dropout gaze", "3,6%", "Sanity check lulus 96 dari 100"],
  ["Mode luring", "100%", "Nol crash sepanjang pengujian"],
];

/**
 * Same four rows as the table below the chart, plotted. Two figures rather than
 * one with two scales: completion is a percentage and calibration error is an
 * angle, and putting them on one plot would invent a relationship between them.
 */
const GATE_A_CONDITIONS = [
  { label: "Cahaya normal", sessions: 50, success: 98, error: 1.9 },
  { label: "Cahaya redup", sessions: 25, success: 88, error: 2.8 },
  { label: "Tanpa kacamata", sessions: 70, success: 97, error: 2.0 },
  { label: "Dengan kacamata", sessions: 30, success: 87, error: 2.9 },
] as const;

/** The six sessions that produced no report, and why each one did not. */
const GATE_A_OUTCOMES = [
  { label: "Selesai dan melaporkan", value: 94, color: "var(--teal-500)" },
  { label: "Pantulan kacamata", value: 3, color: "var(--slate-700)" },
  { label: "Wajah terlalu miring", value: 2, color: "var(--slate-500)" },
  { label: "Orientasi layar berubah", value: 1, color: "var(--slate-200)" },
] as const;

const GATE_B_METRICS: readonly Metric[] = [
  ["Pasangan direkam", "30", "Aliran browser simultan"],
  ["Pasangan siap", "27", "Valid pair rate 90%"],
  ["Galat median", "44,159 px", "0,040997 ternormalisasi"],
  ["Agreement AOI", "99,7118%", "Dihitung ulang dari koordinat mentah"],
  ["AOI utama cocok", "27/27", "Seluruh pasangan siap"],
  ["Ditahan", "3", "Tetap ikut dihitung, tidak dibuang"],
];

/**
 * Attention shares from the same 27 ready pairs the table reports. Hue here does
 * identity work only, so the three panels take the local categorical slots; the
 * background AOI takes the de-emphasis step, because that is what it is.
 */
const AOI_DISTRIBUTION = [
  { label: "Wajah", webgazer: 17.1628, neurogaze: 17.1374, color: "var(--chart-1)" },
  { label: "Target kiri", webgazer: 32.7535, neurogaze: 32.8137, color: "var(--chart-2)" },
  { label: "Target kanan", webgazer: 33.2116, neurogaze: 33.2336, color: "var(--chart-3)" },
  { label: "Latar", webgazer: 16.872, neurogaze: 16.8152, color: "var(--chart-rest)" },
] as const;

const GATE_C_METRICS: readonly Metric[] = [
  ["Lintasan tatapan", "547", "Citra 640 × 480"],
  ["ID partisipan", "54", "Pemisahan data per anak"],
  ["AUC tingkat anak", "0,8819", "95% CI 0,774–0,968"],
  ["Target Gate C", "87,8% / 80,8%", "Perochon dkk. 2023, kamera tablet"],
];

const STIMULUS_METRICS: readonly Metric[] = [
  ["Durasi total", `${STIMULUS_TOTAL_SECONDS} detik`, "Tanpa speaker, blok panggilan nama tidak dijalankan"],
  ["Percobaan berskor", String(SCORED_TRIAL_COUNT), "4 jenis isyarat × kiri dan kanan"],
  ["Epok pra-isyarat", "1,7 detik", "Tanpa informasi arah sama sekali"],
  ["Jendela respons", "3,3 detik", "Latensi gaze following < 1,5 detik"],
];

const TRIAL_TIMELINE = [
  ["0,0–1,2 dtk", "Istirahat", "Model menunduk ke meja. Tangan di bawah tepi meja, tidak ada arah sama sekali."],
  ["1,2 dtk", "Sinyal ostensif", "Kepala terangkat, kontak mata, alis naik, senyum. Mengundang sebelum ada isyarat."],
  ["1,7 dtk", "Isyarat arah", "Wajah kembali netral. Mata bergerak lebih dulu, kepala menyusul, tangan terakhir."],
  ["1,7–5,0 dtk", "Jendela respons", "Adegan dibekukan. Seluruh pandangan pada periode ini dihitung sebagai respons."],
] as const;

/** Confound controls. Each one names what it removes, then why that matters. */
const DESIGN_CHOICES = [
  ["Dua objek identik", "Objek berbeda membuat anak bisa sekadar menyukai salah satunya. Identik menyisakan isyarat sosial sebagai satu-satunya pembeda."],
  ["Objek tidak pernah bergerak", "Gerakan menarik pandangan secara refleks. Objek diam memastikan yang terukur adalah respons terhadap ajakan."],
  ["Pra-isyarat benar-benar netral", "Model menunduk, tangan di bawah meja. Tidak ada informasi kiri–kanan sebelum onset, jadi pembanding pra-isyarat sah dipakai."],
  ["Pupil gelap di atas sklera terang", "Polaritas kontras mata yang lazim membawa efek gaze following; polaritas terbalik jauh lebih lemah. Dijaga uji kontrak, bukan pilihan gaya."],
  ["Mata benar-benar bergerak", "Bola mata bergeser 16 px pada onset, transisi 240 ms berjeda 50 ms — mata berangkat lebih dulu daripada kepala dan tangan, seperti isyarat manusia."],
  ["Ostensif dulu, arah kemudian", "Bayi mengikuti tatapan setelah sinyal komunikatif, bukan setelah animasi yang sekadar menarik perhatian."],
  ["Isyarat berupa perubahan status", "Animasi berulang menjadi sumber gerakan tersendiri. Di sini isyarat adalah satu perpindahan pose pada milidetik yang dideklarasikan protokol."],
  ["Blok isyarat tanpa suara", "Percobaan arah sengaja bisu supaya yang terukur murni tatapan. Respons nama diukur di bloknya sendiri."],
  ["Urutan diseimbangkan tiap sesi", "Urutan kiri–kanan tetap membuat anak yang sekadar memindai mencetak nilai seperti anak yang benar-benar mengikuti. Urutan diacak dari id sesi, bukan dipilih operator."],
  ["Gerak diam hanya napas dan kedip", "Wajah beku terasa mati dan kehilangan perhatian. Kedip dan napas simetris di tengah, jadi tidak menarik pandangan ke satu sisi."],
] as const;

// ── Kontrol positif · research/hasil/kontrol_positif/ringkasan.json ─────────
const POSITIVE_CONTROL_METRICS: readonly Metric[] = [
  ["Peserta", "12", "Dewasa, menyetujui untuk dirinya sendiri"],
  ["Sesi berbeda", "23", "Pada 3 perangkat, 4 peserta per perangkat"],
  ["Lolos kriteria mutu", "15", "Attrition 35%, dilaporkan apa adanya"],
  ["Aturan menyala pada menonton biasa", "0 / 9", "Angka yang paling penting di tabel ini"],
];

const POSITIVE_CONTROL_SIGNALS = [
  {
    signal: "Preferensi geometrik",
    biasa: "0,34",
    biasaRange: "0,08–0,73",
    produksi: "0,94",
    produksiRange: "0,89–1,00",
    margin: "+0,16",
    p: "5,8 × 10⁻⁴",
  },
  {
    signal: "Percobaan masuk target",
    biasa: "8 dari 8",
    biasaRange: "5–8",
    produksi: "0 dari 8",
    produksiRange: "0–1",
    margin: "4 percobaan",
    p: "6,3 × 10⁻⁴",
  },
  {
    signal: "Sebaran tatapan fase isyarat",
    biasa: "0,31",
    biasaRange: "0,07–0,40",
    produksi: "0,05",
    produksiRange: "0,03–0,06",
    margin: "+0,008",
    p: "2,0 × 10⁻⁴",
  },
] as const;

/**
 * Small multiples, one axis per signal, because the three are measured in
 * different units. A shared axis would put "8 percobaan" and "0,73 preferensi"
 * on the same ruler and make the gaps look comparable when they are not.
 */
const POSITIVE_CONTROL_RANGES = [
  {
    label: "Preferensi geometrik",
    domain: [0, 1] as const,
    ticks: ["0", "0,5", "1,0"],
    a: { from: 0.08, to: 0.73, display: "0,08–0,73" },
    b: { from: 0.89, to: 1.0, display: "0,89–1,00" },
    gap: "+0,16",
  },
  {
    label: "Percobaan masuk target",
    domain: [0, 8] as const,
    ticks: ["0", "4", "8"],
    a: { from: 5, to: 8, display: "5–8 dari 8" },
    b: { from: 0, to: 1, display: "0–1 dari 8" },
    gap: "4 percobaan",
  },
  {
    label: "Sebaran tatapan fase isyarat",
    domain: [0, 0.5] as const,
    ticks: ["0", "0,25", "0,50"],
    a: { from: 0.07, to: 0.4, display: "0,07–0,40" },
    b: { from: 0.03, to: 0.06, display: "0,03–0,06" },
    gap: "+0,008",
  },
] as const;

const POSITIVE_CONTROL_CONFOUNDS = [
  ["Panel geometrik selalu di kanan", "Pada seluruh 24 sesi, dan urutan isyarat identik pada seluruhnya, karena kedua skema counterbalancing diturunkan dari kolom identitas yang terisi sama. Preferensi geometrik karena itu tidak terpisah dari bias melirik kanan di data ini."],
  ["Identitas peserta tidak terekam", "Tidak ada analisis berpasangan. Grup validasi silang adalah perangkat, bukan orang — lebih kasar daripada yang diminta protokol, dan lebih ketat."],
  ["Urutan kondisi tidak diseimbangkan", "Disengaja: instruksi kondisi kedua tidak dapat ditarik kembali. Efek urutan karena itu tidak dapat dipisahkan dari efek kondisi."],
] as const;

// ── Validasi klip GeoPref · app/public/stimuli/…ccby.json ───────────────────
const CLIP_CONTAINER: readonly Metric[] = [
  ["Trek video", "1", "avc1, 640 × 360, 502 frame"],
  ["Trek audio", "0", "Senyap sesuai protokol, bukan audio yang hilang"],
  ["Durasi", "16,75 dtk", "Seperlima protokol terbit 90 detik"],
  ["Lisensi", "CC BY 4.0", "Moore dkk. 2018, Additional file 2"],
];

const CLIP_ASSETS = [
  {
    title: "Cuplikan Complex Social",
    duration: "16,75 dtk",
    status: "shipped" as const,
    statusLabel: "Dikirim",
    operating: "Tidak ada preseden operasional",
    note: "Satu dari lima adegan video contoh publik. Karena itu validatedProtocol bernilai false dan ambang 69% ditahan.",
  },
  {
    title: "GeoPref asli 62,22 detik",
    duration: "62,22 dtk",
    status: "requested" as const,
    statusLabel: "Diminta",
    operating: "Sensitivitas 17% · spesifisitas 98%",
    note: "Wen dkk. 2022, n=1.863, usia 12–48 bulan. Ini tes yang ambang 69% benar-benar divalidasi padanya.",
  },
  {
    title: "Complex Social 90 detik",
    duration: "90 dtk",
    status: "requested" as const,
    statusLabel: "Diminta",
    operating: "Sensitivitas 18% · spesifisitas 97%",
    note: "Moore dkk. 2018, AUC 0,74. Ambang 69% dibawa apa adanya demi konsistensi, bukan dioptimasi ulang.",
  },
] as const;

/** What the cutoff was derived on, next to what the app actually plays. */
const CLIP_DURATIONS = [
  { label: "Dikirim", sublabel: "Cuplikan Complex Social", value: 16.75, display: "16,75 dtk", tone: "warn" as const },
  { label: "GeoPref asli", sublabel: "Wen dkk. 2022", value: 62.22, display: "62,22 dtk", tone: "calm" as const },
  { label: "Complex Social", sublabel: "Moore dkk. 2018", value: 90, display: "90 dtk", tone: "calm" as const },
];

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
  { label: "Istirahat", fromMs: 0, toMs: TRIAL_OSTENSIVE_MS, tone: "rest" as const },
  { label: "Sinyal ostensif", fromMs: TRIAL_OSTENSIVE_MS, toMs: TRIAL_CUE_MS, tone: "ostensive" as const },
  { label: "Jendela respons", fromMs: TRIAL_CUE_MS, toMs: TRIAL_MS, tone: "response" as const },
];

const NAV_GROUPS = [
  {
    group: "Ringkasan",
    items: [{ id: "ringkasan", label: "Status gerbang" }],
  },
  {
    // The rail carries pass state too. A reader who lands mid-page should not
    // have to scroll back to the summary to learn which gates are still open.
    group: "Gerbang validasi",
    items: [
      { id: "gate-a", label: "A · Teknis", state: "passed" },
      { id: "gate-b", label: "B · Kesetaraan", state: "passed" },
      { id: "gate-c", label: "C · Klinis", state: "open" },
      { id: "gate-d", label: "D · Operasional", state: "open" },
    ],
  },
  {
    group: "Bukti lapangan",
    items: [{ id: "kontrol-positif", label: "Kontrol positif" }],
  },
  {
    group: "Instrumen",
    items: [
      { id: "klip-geopref", label: "Validasi klip GeoPref" },
      { id: "adegan-vektor", label: "Adegan vektor" },
    ],
  },
] as const;

const SECTION_IDS = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.id));

function Metrics({ items, columns = 4 }: { items: readonly Metric[]; columns?: 3 | 4 }) {
  return (
    <div className={styles.metrics} data-columns={columns}>
      {items.map(([label, value, note]) => (
        <article key={label}>
          <small>{label}</small>
          <strong>{value}</strong>
          <span>{note}</span>
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
  return (
    <header className={styles.sectionHead}>
      <div>
        <h2 id={`${id}-title`}>
          {gate ? (
            <span className={styles.gateMark} data-gate={gate}>
              <span aria-hidden="true">{gate}</span>
              <span className={styles.srOnly}>Gate {gate}:</span>
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

  const percent = (value: number, digits = 1) =>
    `${(value * 100).toFixed(digits).replace(".", ",")}%`;

  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#ringkasan">Lewati ke isi utama</a>

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
            {navOpen ? "Tutup" : "Menu"}
          </button>
        </div>

        <p className={styles.sidebarRole}>Panel teknis</p>

        <nav id="panel-nav" className={styles.nav} aria-label="Bagian panel">
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group} className={styles.navGroup}>
              <p className={styles.navGroupLabel}>{group}</p>
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
                  {item.label}
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <Link href="/validation">Bukti publik <IconArrowRight size={13} /></Link>
          <p>Diperbarui {GATE_EVIDENCE_STATUS.updatedAt}</p>
        </div>
      </aside>

      <main className={styles.content}>
        {/* The page had no h1 at all: the first heading a screen reader met was
            the h2 of the summary section, so the document announced itself as a
            fragment of something else. */}
        <header className={styles.pageHead}>
          <div>
            <h1>Panel teknis Neurogaze</h1>
            <p>
              Bukti pengukuran di balik produk, ditulis untuk peninjau. Setiap angka membawa
              sumbernya, dan setiap gerbang yang belum lulus disebut belum lulus.
            </p>
          </div>
          <dl className={styles.pageHeadMeta}>
            <div>
              <dt>Diperbarui</dt>
              <dd>{GATE_EVIDENCE_STATUS.updatedAt}</dd>
            </div>
            <div>
              <dt>Versi stimulus</dt>
              <dd>{STIMULUS_VERSION}</dd>
            </div>
          </dl>
        </header>

        {/* ── Ringkasan ──────────────────────────────────────────────────── */}
        <section id="ringkasan" className={styles.section} aria-labelledby="ringkasan-title">
          <SectionHead
            id="ringkasan"
            title="Status gerbang validasi"
            lead="Halaman ini memisahkan pengukuran teknis dari pengalaman peserta. Tidak ada skor ASD dan tidak ada keputusan klinis di sini."
          />

          <Figure
            title="Dua dari empat gerbang lulus"
            note="Gerbangnya berurutan: masing-masing mengandaikan yang sebelumnya sudah lulus. A dan B mengukur instrumennya. C dan D mengukur apa yang terjadi ketika instrumen itu dibawa ke anak dan ke meja Posyandu — dan keduanya belum dijalankan."
          >
            <GateLadder
              gates={GATE_EVIDENCE_STATUS.gates.map((gate) => ({
                id: gate.id,
                label: gate.title,
                passed: gate.status === "passed",
              }))}
            />
          </Figure>

          <div className={styles.gateGrid}>
            {GATE_EVIDENCE_STATUS.gates.map((gate) => {
              const passed = gate.id === "A" || gate.id === "B";
              return (
                <article key={gate.id} className={styles.gateCard} data-state={passed ? "passed" : "open"}>
                  <div className={styles.gateCardTop}>
                    <span className={styles.gateMark} data-gate={gate.id}>{gate.id}</span>
                    <span className={styles.statusPill} data-tone={passed ? "passed" : "open"}>
                      {passed ? <IconCheck size={12} /> : null}
                      {gate.statusLabel}
                    </span>
                  </div>
                  <h3>{gate.title}</h3>
                  <p>{gate.statement}</p>
                </article>
              );
            })}
          </div>

          <Note kind="limit" title="Batas kesimpulan">
            Gate A membuktikan kelayakan teknis dan Gate B membuktikan agreement terhadap
            WebGazer.js. Keduanya tidak membuktikan akurasi diagnosis ASD; klaim klinis
            tetap menunggu kohort balita dengan hasil klinis independen yang dinilai buta.
          </Note>
        </section>

        {/* ── Gate A ─────────────────────────────────────────────────────── */}
        <section id="gate-a" className={styles.section} aria-labelledby="gate-a-title">
          <SectionHead
            id="gate-a"
            gate="A"
            title="Akuisisi stabil pada 100 sesi lintas kondisi"
            lead="Menguji apakah kamera tablet dapat mendeteksi wajah dan iris, membedakan arah, menjalankan kalibrasi dan stimulus penuh, menahan hasil gagal, serta tetap bekerja luring."
            status="Lulus · 100 sesi"
            tone="passed"
          />

          <Metrics items={GATE_A_METRICS} />

          <div className={styles.figures}>
            <Figure
              title="Sesi berhasil menurut kondisi"
              note="Persentase sesi yang selesai dan menghasilkan laporan. Garis tipis adalah ambang penyelesaian 90%."
            >
              <BarRows
                rows={GATE_A_CONDITIONS.map((row) => ({
                  label: row.label,
                  sublabel: `${row.sessions} sesi`,
                  value: row.success,
                  display: `${row.success}%`,
                }))}
                max={100}
                threshold={90}
                thresholdLabel="Ambang penyelesaian 90%"
              />
            </Figure>

            <Figure
              title="Galat kalibrasi median menurut kondisi"
              note="Derajat sudut pandang, lebih kecil lebih baik. Kacamata dan cahaya redup memakan hampir seluruh anggaran 3°, dan keduanya tetap di bawahnya."
            >
              <BarRows
                rows={GATE_A_CONDITIONS.map((row) => ({
                  label: row.label,
                  value: row.error,
                  display: `${num(row.error)}°`,
                }))}
                max={4}
                threshold={3}
                thresholdSide="max"
                thresholdLabel="Ambang galat 3°"
              />
            </Figure>
          </div>

          <Figure
            title="Ke mana 100 sesi bermuara"
            note="Enam sesi tidak menghasilkan laporan, dan seluruhnya dikenali sistem. Menahan hasil adalah keluaran yang sah, bukan kegagalan."
            legend={GATE_A_OUTCOMES.map((slice) => ({
              label: slice.label,
              color: slice.color,
              value: String(slice.value),
            }))}
          >
            <SplitBar
              total={100}
              segments={GATE_A_OUTCOMES.map((slice) => ({ ...slice, display: `${slice.value} sesi` }))}
            />
          </Figure>

          <div className={styles.split}>
            <div className={styles.tableWrap}>
              <table>
                <caption>Hasil menurut kondisi pengujian</caption>
                <thead>
                  <tr><th scope="col">Kondisi</th><th scope="col">Sesi</th><th scope="col">Berhasil</th><th scope="col">Galat median</th></tr>
                </thead>
                <tbody>
                  <tr><td>Cahaya normal</td><td>50</td><td>49 · 98%</td><td>1,9°</td></tr>
                  <tr><td>Cahaya redup</td><td>25</td><td>22 · 88%</td><td>2,8°</td></tr>
                  <tr><td>Tanpa kacamata</td><td>70</td><td>68 · 97%</td><td>2,0°</td></tr>
                  <tr><td>Dengan kacamata</td><td>30</td><td>26 · 87%</td><td>2,9°</td></tr>
                </tbody>
              </table>
            </div>

            <div className={styles.criteria}>
              <h3>Kriteria kelulusan</h3>
              <ul>
                <li>Galat median ≤ 3°</li>
                <li>Bingkai wajah dan mata valid &gt; 85%</li>
                <li>Penyelesaian sesi &gt; 90%</li>
                <li>Tidak ada skor risiko dari sesi invalid</li>
                <li>Fungsi utama tetap luring</li>
              </ul>
              <p>Seluruh kriteria terpenuhi tanpa crash dan tanpa hasil risiko dari sesi invalid.</p>
            </div>
          </div>

          <Note kind="source" title="Enam sesi tidak menghasilkan laporan">
            Tiga karena pantulan kacamata, dua karena wajah terlalu miring, satu karena
            orientasi layar berubah setelah kalibrasi. Seluruhnya dikenali sistem dan
            diarahkan untuk dikoreksi atau dikalibrasi ulang — bukan diloloskan diam-diam.
          </Note>
        </section>

        {/* ── Gate B ─────────────────────────────────────────────────────── */}
        <section id="gate-b" className={styles.section} aria-labelledby="gate-b-title">
          <SectionHead
            id="gate-b"
            gate="B"
            title="Aliran gaze sejalan dengan referensi WebGazer.js"
            lead="Menguji agreement koordinat dan area perhatian antara aliran Neurogaze dan WebGazer.js 3.5.3 pada webapp yang sama, lewat kontrak setGazeListener."
            status="Lulus · 27 dari 30"
            tone="passed"
          />

          <Metrics items={GATE_B_METRICS} />

          <div className={styles.figures}>
            <Figure
              title="Komposisi area perhatian"
              note="Rata-rata 27 pasangan siap, aliran Neurogaze. Kedua target identik memang menerima porsi yang hampir sama — itu rancangannya, bukan kebetulan."
              legend={AOI_DISTRIBUTION.map((area) => ({
                label: area.label,
                color: area.color,
                value: `${num(area.neurogaze, 1)}%`,
              }))}
            >
              <Donut
                slices={AOI_DISTRIBUTION.map((area) => ({
                  label: area.label,
                  value: area.neurogaze,
                  color: area.color,
                }))}
                centre="66,0%"
                centreNote="pada dua target"
              />
            </Figure>

            <Figure
              title="Selisih Neurogaze terhadap WebGazer.js"
              note="Poin persen, per area. Sumbunya berhenti di 0,08 pp supaya batangnya kelihatan sama sekali."
              footnote="Selisih terbesar ada pada target kiri, 0,06 pp — satu bingkai dari sekitar 1.700. Kriteria kelulusan menuntut agreement AOI ≥ 95%; di sini tidak ada satu area pun yang meleset sepersepuluh poin persen."
            >
              <DeltaBars
                domain={0.08}
                domainLabel="0,08 pp"
                rows={AOI_DISTRIBUTION.map((area) => {
                  const delta = area.neurogaze - area.webgazer;
                  return {
                    label: area.label,
                    value: delta,
                    display: `${delta > 0 ? "+" : "−"}${num(Math.abs(delta), 3)}`,
                  };
                })}
              />
            </Figure>
          </div>

          <div className={styles.figures}>
            <Figure
              title="Galat median ternormalisasi"
              note="Jarak koordinat antara kedua aliran, dibagi diagonal layar."
            >
              <Meter
                value={0.040997}
                limit={0.05}
                max={0.08}
                display="0,040997"
                limitLabel="Ambang kelulusan ≤ 0,05"
              />
            </Figure>

            <Figure
              title="Hasil 30 pasangan yang direkam"
              note="Tiga pasangan ditahan karena mutu sinyal, dan tetap ikut dihitung dalam valid pair rate alih-alih dibuang dari penyebut."
              legend={[
                { label: "Siap dianalisis", color: "var(--teal-500)", value: "27" },
                { label: "Ditahan", color: "var(--slate-500)", value: "3" },
              ]}
            >
              <SplitBar
                total={30}
                segments={[
                  { label: "Siap dianalisis", value: 27, display: "27 pasangan", color: "var(--teal-500)" },
                  { label: "Ditahan", value: 3, display: "3", color: "var(--slate-500)" },
                ]}
              />
            </Figure>
          </div>

          <div className={styles.split}>
            <div className={styles.tableWrap}>
              <table>
                <caption>Distribusi area perhatian</caption>
                <thead>
                  <tr><th scope="col">Area</th><th scope="col">WebGazer</th><th scope="col">Neurogaze</th></tr>
                </thead>
                <tbody>
                  <tr><td>Wajah</td><td>17,1628%</td><td>17,1374%</td></tr>
                  <tr><td>Target kiri</td><td>32,7535%</td><td>32,8137%</td></tr>
                  <tr><td>Target kanan</td><td>33,2116%</td><td>33,2336%</td></tr>
                  <tr><td>Latar</td><td>16,8720%</td><td>16,8152%</td></tr>
                </tbody>
              </table>
            </div>

            <div className={styles.criteria}>
              <h3>Kriteria kelulusan</h3>
              <ul>
                <li>Minimal 30 pasangan</li>
                <li>Valid pair rate ≥ 90%</li>
                <li>Galat median ternormalisasi ≤ 0,05</li>
                <li>Agreement AOI rata-rata ≥ 95%</li>
                <li>Agreement AOI utama ≥ 95%</li>
              </ul>
              <p>Kesimpulan terbatas pada agreement terhadap WebGazer.js. Ia tidak menyatakan akurasi klinis ASD.</p>
            </div>
          </div>

          <Note kind="source" title="Setiap angka diturunkan ulang dari koordinat mentah">
            Agreement AOI yang dipublikasikan adalah 99,7118% hasil rekomputasi, bukan
            99,7574% yang tersimpan di berkas ringkasan. Selisihnya muncul pada 4 dari 27
            pasangan dan diterbitkan apa adanya, bukan didamaikan. ICC(A,1) 13 fitur
            sebesar 0,505 tetap dilaporkan sebagai metrik deskriptif, bukan penentu kelulusan.
          </Note>
        </section>

        {/* ── Gate C ─────────────────────────────────────────────────────── */}
        <section id="gate-c" className={styles.section} aria-labelledby="gate-c-title">
          <SectionHead
            id="gate-c"
            gate="C"
            title="Validasi prospektif belum dilakukan"
            lead="Studi prospektif harus membandingkan Neurogaze dengan asesmen perkembangan, M-CHAT, dan diagnosis ahli yang dibutakan terhadap skor Neurogaze."
            status="Terbuka"
            tone="open"
          />

          <Metrics items={GATE_C_METRICS} />

          <Figure
            title="AUC tingkat anak, dengan selang kepercayaannya"
            note="Titik penuh adalah estimasi, batang adalah selang 95%. Sumbunya mulai dari tebakan acak, dan selangnya lebar karena hanya ada 54 anak."
            legend={[
              { label: "Selang 95%", color: "var(--teal-200)" },
              { label: "Estimasi titik", color: "var(--teal-600)" },
            ]}
            footnote="Angka ini berasal dari scanpath anak usia sekolah pada eye-tracker 250 Hz. Ia menyatakan sesuatu tentang dataset itu, bukan tentang balita di depan kamera tablet."
          >
            <IntervalPlot
              domain={[0.5, 1]}
              ticks={["0,50 · acak", "0,75", "1,00"]}
              intervals={[
                {
                  label: "Evaluasi memisahkan data tiap anak",
                  from: 0.774,
                  to: 0.968,
                  point: 0.8819,
                  display: "0,8819 · CI 0,774–0,968",
                },
              ]}
            />
          </Figure>

          <div className={styles.split}>
            <div className={styles.prose}>
              <h3>Data yang tersedia</h3>
              <p>
                Model awal memakai scanpath ASD/non-ASD dari anak usia sekolah, bukan kohort
                balita Posyandu. Evaluasi yang memisahkan data tiap anak menghasilkan AUC OOF
                0,8819 pada 54 anak — tetapi model menerima citra raster dari eye-tracker
                250 Hz, dan tidak ada cara sah merekonstruksi masukan itu dari kamera 30 fps.
              </p>
              <p className={styles.linkRow}>
                <a className={styles.link} href="https://doi.org/10.5220/0007402601030112" target="_blank" rel="noreferrer">
                  Artikel Carette dkk. 2019 <IconArrowRight size={13} />
                </a>
                <a className={styles.link} href="https://figshare.com/articles/dataset/Visualization_of_Eye-Tracking_Scanpaths_in_Autism_Spectrum_Disorder_Image_Dataset/7073087/1" target="_blank" rel="noreferrer">
                  Dataset di Figshare <IconArrowRight size={13} />
                </a>
              </p>
            </div>

            <div className={styles.criteria} data-tone="open">
              <h3>Kenapa belum lulus</h3>
              <ul>
                <li>Belum ada balita prospektif usia 16–30 bulan</li>
                <li>Belum ada hasil klinis independen yang dinilai buta</li>
                <li>Rata-rata usia sumber 7,88 tahun</li>
                <li>Perangkat sumber 250 Hz, bukan kamera tablet</li>
                <li>Belum ada lokasi eksternal yang terpisah</li>
                <li>Ambang klinis belum boleh ditetapkan</li>
              </ul>
            </div>
          </div>

          <Note kind="claim" title="CNN wajah tidak dipakai">
            MediaPipe hanya dipakai untuk menemukan wajah dan iris di perangkat. CNN wajah
            mencapai AUC 0,932 — angka tertinggi di proyek ini — dan dibuang: enam dari enam
            metadata tata kelola tidak tersedia, tidak ada ID partisipan, dan uji shortcut
            menunjukkan statistik piksel saja sudah mencapai 0,751 dengan permutasi p = 0,005.
          </Note>

          <div className={styles.simulation} aria-labelledby="simulation-title">
            <div className={styles.simulationHead}>
              <div>
                <h3 id="simulation-title">Simulasi kapasitas layanan</h3>
                <p>Ubah kohort, prevalensi, dan cakupan teknis. Sensitivitas dan spesifisitas dikunci pada hasil notebook agar asumsinya selalu terlihat.</p>
              </div>
              <span className={styles.statusPill} data-tone="warn">Hanya simulasi</span>
            </div>

            <div className={styles.simulationInputs}>
              <label>
                <span>Ukuran kohort</span>
                <input type="number" min="1" max="1000000" step="1" value={gateCSimulationInput.cohortSize}
                  onChange={(event) => setGateCSimulationInput((current) => ({ ...current, cohortSize: Number(event.target.value) }))} />
              </label>
              <label>
                <span>Prevalensi sasaran</span>
                <div className={styles.inputSuffix}>
                  <input type="number" min="0" max="100" step="0.1" value={gateCSimulationInput.prevalence * 100}
                    onChange={(event) => setGateCSimulationInput((current) => ({ ...current, prevalence: Number(event.target.value) / 100 }))} />
                  <b>%</b>
                </div>
              </label>
              <label>
                <span>Cakupan teknis</span>
                <div className={styles.inputSuffix}>
                  <input type="number" min="0" max="100" step="1" value={gateCSimulationInput.technicalCoverage * 100}
                    onChange={(event) => setGateCSimulationInput((current) => ({ ...current, technicalCoverage: Number(event.target.value) / 100 }))} />
                  <b>%</b>
                </div>
              </label>
              <label>
                <span>Sensitivitas kandidat</span>
                <div className={styles.inputSuffix}><input value="84,62" disabled /><b>%</b></div>
              </label>
              <label>
                <span>Spesifisitas kandidat</span>
                <div className={styles.inputSuffix}><input value="75,00" disabled /><b>%</b></div>
              </label>
              <label>
                <span>Ambang notebook</span>
                <input value="0,476" disabled />
              </label>
            </div>

            <div className={styles.metrics} data-columns={4}>
              <article><small>Dapat dinilai</small><strong>{gateCSimulation.assessable.toFixed(0)}</strong><span>{gateCSimulation.withheld.toFixed(0)} sesi ditahan</span></article>
              <article><small>Rujukan diperkirakan</small><strong>{percent(gateCSimulation.referralRate)}</strong><span>{(gateCSimulation.truePositive + gateCSimulation.falsePositive).toFixed(1)} dari yang dinilai</span></article>
              <article><small>PPV pada prevalensi ini</small><strong>{percent(gateCSimulation.positivePredictiveValue)}</strong><span>Bukan PPV terobservasi</span></article>
              <article><small>Rujukan per true positive</small><strong>{Number.isFinite(gateCSimulation.referralsPerTruePositive) ? gateCSimulation.referralsPerTruePositive.toFixed(1).replace(".", ",") : "n/a"}</strong><span>Proyeksi beban layanan</span></article>
            </div>

            <div className={styles.figures}>
              <Figure
                title="Ke mana skenario ini menempatkan setiap anak"
                note="Baris adalah keadaan sebenarnya, kolom adalah keputusan aturan. Sel yang mahal ada di diagonal berlawanan."
              >
                <ConfusionMatrix
                  truePositive={num(gateCSimulation.truePositive)}
                  falseNegative={num(gateCSimulation.falseNegative)}
                  falsePositive={num(gateCSimulation.falsePositive)}
                  trueNegative={num(gateCSimulation.trueNegative)}
                />
              </Figure>

              <Figure
                title="Dari kohort ke rujukan yang benar"
                note="Setiap baris adalah bagian dari baris di atasnya, digambar pada skala yang sama."
              >
                <FunnelBars
                  total={gateCSimulation.cohortSize}
                  steps={[
                    {
                      label: "Kohort",
                      value: gateCSimulation.cohortSize,
                      display: gateCSimulation.cohortSize.toLocaleString("id-ID"),
                      tone: "calm",
                    },
                    {
                      label: "Dapat dinilai",
                      value: gateCSimulation.assessable,
                      display: gateCSimulation.assessable.toFixed(0),
                      tone: "calm",
                    },
                    {
                      label: "Dirujuk",
                      value: gateCSimulation.truePositive + gateCSimulation.falsePositive,
                      display: (gateCSimulation.truePositive + gateCSimulation.falsePositive).toFixed(0),
                      tone: "warn",
                    },
                    {
                      label: "Rujukan tepat",
                      value: gateCSimulation.truePositive,
                      display: num(gateCSimulation.truePositive),
                      tone: "good",
                    },
                  ]}
                />
              </Figure>
            </div>

            <div className={styles.figures}>
              <Figure
                title="Harga satu rujukan yang tepat"
                note="Satu titik satu rujukan. Titik hijau adalah anak yang memang jadi sasaran; sisanya keluarga yang diminta datang lagi tanpa perlu."
              >
                <RatioDots
                  total={
                    Number.isFinite(gateCSimulation.referralsPerTruePositive)
                      ? gateCSimulation.referralsPerTruePositive
                      : 0
                  }
                  note={
                    Number.isFinite(gateCSimulation.referralsPerTruePositive)
                      ? `${num(gateCSimulation.referralsPerTruePositive)} rujukan per satu sasaran yang terjaring. Itulah beban yang harus ditanggung Puskesmas untuk setiap anak yang benar-benar perlu diperiksa lanjut.`
                      : "Pada skenario ini tidak ada sasaran yang terjaring, jadi rasionya tidak terdefinisi."
                  }
                />
              </Figure>

              <Figure
                title="PPV runtuh saat prevalensi turun"
                note="Sensitivitas dan spesifisitas dikunci; hanya prevalensi yang bergerak. Arahkan kursor untuk membaca titik lain pada kurva."
                footnote="Inilah alasan ambang klinis tidak boleh ditetapkan dari AUC saja. Tes yang sama berpindah dari berguna ke membanjiri layanan hanya karena kohortnya berubah."
              >
                <PpvCurve
                  sensitivity={gateCSimulation.sensitivity}
                  specificity={gateCSimulation.specificity}
                  prevalence={gateCSimulation.prevalence}
                />
              </Figure>
            </div>

            <Note kind="limit" title="Interpretasi skenario saat ini">
              Dengan {gateCSimulation.cohortSize.toLocaleString("id-ID")} anak, prevalensi{" "}
              {percent(gateCSimulation.prevalence)}, dan cakupan{" "}
              {percent(gateCSimulation.technicalCoverage, 0)}, perhitungan memperkirakan{" "}
              {percent(gateCSimulation.referralRate)} peserta yang dapat dinilai akan dirujuk. PPV
              diperkirakan {percent(gateCSimulation.positivePredictiveValue)}, sehingga jumlah
              rujukan keliru perlu menjadi tolok ukur Gate C — bukan hasil studi, melainkan
              aritmetika atas asumsi yang terlihat di atas.
            </Note>

            <p className={styles.simulationFoot}>
              Angka desimal adalah nilai harapan matematis, bukan jumlah anak yang benar-benar diperiksa.
            </p>
          </div>
        </section>

        {/* ── Gate D ─────────────────────────────────────────────────────── */}
        <section id="gate-d" className={styles.section} aria-labelledby="gate-d-title">
          <SectionHead
            id="gate-d"
            gate="D"
            title="Uji lapangan belum dilakukan"
            lead="Dasar prosedurnya ada di literatur; yang belum ada adalah bukti bahwa kader Posyandu dapat menjalankannya dengan perangkat dan alur layanan yang benar-benar mereka punya."
            status="Terbuka"
            tone="open"
          />

          <div className={styles.split}>
            <div className={styles.prose}>
              <h3>Bukti kelayakan prosedur</h3>
              <p>
                Cilia dkk. menjalankan eye-tracking pada anak dengan posisi fleksibel sekitar
                60 cm dari layar — di kursi, di pangkuan orang tua, atau di kursi makan anak —
                dengan instruksi minimal dan kalibrasi lima titik. Carette dkk. melaporkan anak
                dapat menonton rangkaian stimulus sekitar lima menit dengan kalibrasi dan verifikasi.
              </p>
              <p>
                Neurogaze menambahkan pemeriksaan kualitas, kontrol jeda dan berhenti,
                pemrosesan lokal, serta penahanan hasil saat sinyal tidak valid.
              </p>
            </div>

            <div className={styles.criteria} data-tone="open">
              <h3>Yang masih dibutuhkan lapangan</h3>
              <ul>
                <li>5 Posyandu</li>
                <li>20 kader</li>
                <li>200 sesi anak</li>
                <li>3 jenis tablet Android</li>
                <li>Tingkat penyelesaian dan durasi nyata</li>
                <li>Pemahaman laporan dan penerimaan orang tua</li>
              </ul>
            </div>
          </div>

          <Note kind="limit" title="Batas klaim">
            Kedua artikel di atas tidak menguji kader, kamera tablet, mode luring, maupun alur
            rujukan Neurogaze. Kemudahan penggunaan di lapangan karena itu belum dapat diklaim.
          </Note>
        </section>

        {/* ── Kontrol positif ────────────────────────────────────────────── */}
        <section id="kontrol-positif" className={styles.section} aria-labelledby="kontrol-positif-title">
          <SectionHead
            id="kontrol-positif"
            title="Kontrol positif: instrumennya merespons"
            lead="Beri instrumen sinyal yang diketahui ada, lalu periksa apakah ia merespons. Direkam 19 Agustus 2026 lewat aplikasi yang dikirim, lalu dihitung ulang dari jejak mentah oleh skrip terpisah."
            status="Terukur"
            tone="passed"
          />

          <Metrics items={POSITIVE_CONTROL_METRICS} />

          <Figure
            title="Jarak antara dua kondisi, per sinyal"
            note="Tiap sinyal memakai sumbunya sendiri karena satuannya berbeda. Yang dibaca adalah lebar celah di antara kedua batang, bukan panjang batangnya."
            legend={[
              { label: "Menonton biasa", color: "var(--slate-500)" },
              { label: "Pola diproduksi", color: "var(--coral-500)" },
            ]}
            footnote="Ketiga celah terbuka penuh: tidak ada satu pun sesi biasa yang menyentuh rentang sesi produksi pada sinyal mana pun."
          >
            <RangeStrips
              strips={POSITIVE_CONTROL_RANGES.map((strip) => ({ ...strip, domain: strip.domain }))}
              aLabel="Menonton biasa"
              bLabel="Pola diproduksi"
            />
          </Figure>

          <div className={styles.tableWrap}>
            <table>
              <caption>Pemisahan tiap sinyal keputusan antara dua kondisi perilaku</caption>
              <thead>
                <tr>
                  <th scope="col">Sinyal</th>
                  <th scope="col">Menonton biasa</th>
                  <th scope="col">Pola diproduksi</th>
                  <th scope="col">Jarak terdekat</th>
                  <th scope="col">p</th>
                </tr>
              </thead>
              <tbody>
                {POSITIVE_CONTROL_SIGNALS.map((row) => (
                  <tr key={row.signal}>
                    <th scope="row">{row.signal}</th>
                    <td>{row.biasa}<small>{row.biasaRange}</small></td>
                    <td>{row.produksi}<small>{row.produksiRange}</small></td>
                    <td data-emphasis="true">{row.margin}</td>
                    <td>{row.p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Note kind="source" title="Kolom yang penting adalah jarak terdekat, bukan AUC">
            Ketiga sinyal ber-AUC 1,00, tetapi itu hanya berarti tidak ada pasangan yang
            tertukar urutannya. Jarak terdekat menyebut selebar apa celahnya dalam satuan
            sinyal itu sendiri: sesi biasa dengan preferensi geometrik tertinggi ada di 0,73,
            sesi produksi terendah di 0,89.
          </Note>

          <div className={styles.split}>
            <div className={styles.prose}>
              <h3>Aturan komposit</h3>
              <p>
                <strong>Sebagaimana dikirim</strong> — tidak menyala pada kondisi mana pun, dan
                tidak akan pernah bisa. Aturannya menuntut dua sinyal menyimpang; preferensi
                geometrik berstatus tidak dapat dinilai selama klip berlisensi lebih pendek
                daripada protokol asal ambangnya. Nol di kedua baris adalah keadaan aturannya,
                bukan pengukuran tentang peserta.
              </p>
              <p>
                <strong>Mode demonstrasi</strong> — ambang yang sama diterapkan pada klip pendek
                itu, semata supaya pertanyaan &ldquo;apakah aturannya merespons&rdquo; punya jawaban.
              </p>
            </div>

            <Figure
              title="Mode demonstrasi: satu titik satu sesi"
              note="Titik terisi berarti aturannya menyala pada sesi itu. Baris atas adalah pertanyaan spesifisitasnya."
              legend={[
                { label: "Menyala", color: "var(--coral-500)" },
                { label: "Tidak menyala", color: "var(--slate-200)" },
              ]}
              footnote="Sembilan sesi menonton biasa, tidak satu pun memicu aturan. Empat dari enam sesi produksi memicunya."
            >
              <OutcomeDots
                rows={[
                  { label: "Menonton biasa", fired: 0, total: 9, display: "0 / 9" },
                  { label: "Pola diproduksi", fired: 4, total: 6, display: "4 / 6" },
                ]}
              />
            </Figure>
          </div>

          <div className={styles.tableWrap}>
            <table>
              <caption>Mode demonstrasi — bukan rujukan, dan tidak boleh dikutip sebagai satu</caption>
              <thead>
                <tr><th scope="col">Kondisi</th><th scope="col">Menyala</th><th scope="col">Tidak menyala</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Menonton biasa</th><td data-emphasis="true">0</td><td>9</td></tr>
                <tr><th scope="row">Pola diproduksi</th><td>4</td><td>2</td></tr>
              </tbody>
            </table>
          </div>

          <Note kind="claim" title="Baris atas kolom kiri adalah yang penting, dan ia nol">
            Aturannya tidak menyala pada orang yang sekadar menonton. Satu sesi biasa memang
            menunjukkan preferensi geometrik 0,73 di atas ambang — dan tepat karena sinyal
            keduanya normal, aturannya tidak menyala. Dua sesi produksi yang tidak menyala gagal
            pada prasyarat perhatian, bukan pada perilakunya: keduanya tidak pernah menatap model
            saat isyarat disampaikan, jadi sinyal isyaratnya ditahan.
          </Note>

          <h3 className={styles.subhead}>Confound yang harus ikut disebut</h3>
          <div className={styles.choices}>
            {POSITIVE_CONTROL_CONFOUNDS.map(([title, body]) => (
              <article key={title}><strong>{title}</strong><p>{body}</p></article>
            ))}
          </div>

          <Note kind="limit" title="Yang data ini tidak tunjukkan">
            Apa pun tentang autisme. Pesertanya orang dewasa yang mengikuti naskah, jadi tidak
            ada sensitivitas, spesifisitas, atau akurasi di dalamnya. Regresi logistik pada kedua
            sinyal mencapai AUC luar-lipatan 1,00 pada 13 sesi dengan grup perangkat — itu
            analisis sensitivitas, bukan jalur keputusan, dan bobot yang dipasang pada orang
            dewasa yang mengikuti naskah mempelajari naskahnya.
          </Note>
        </section>

        {/* ── Validasi klip GeoPref ──────────────────────────────────────── */}
        <section id="klip-geopref" className={styles.section} aria-labelledby="klip-geopref-title">
          <SectionHead
            id="klip-geopref"
            title="Validasi klip GeoPref"
            lead="Blok preferential looking membawa satu-satunya ambang terbit di sistem ini. Karena itu asetnya diperiksa sebagai berkas, bukan diterima sebagai aset."
            status="Protokol disingkat"
            tone="warn"
          />

          <Metrics items={CLIP_CONTAINER} />

          <div className={styles.hashRow}>
            <span>SHA-256</span>
            <code>38576193099bec758837036582b7814a2728c431829e22f9d0e92ffe91fedf2f</code>
          </div>

          <Figure
            title="Yang dikirim, dibanding protokol tempat ambangnya diturunkan"
            note="Panjang klip dalam detik, pada skala yang sama. Yang berjalan di lapangan adalah batang paling atas."
            legend={[
              { label: "Yang dikirim", color: "var(--amber-600)" },
              { label: "Protokol terbit", color: "var(--slate-500)" },
            ]}
          >
            <BarRows
              rows={CLIP_DURATIONS.map((clip) => ({
                label: clip.label,
                sublabel: clip.sublabel,
                value: clip.value,
                display: clip.display,
                tone: clip.tone === "warn" ? "warn" : "calm",
              }))}
              max={90}
            />
          </Figure>

          <div className={styles.figures}>
            <Figure
              title="Berapa banyak bingkai yang sebenarnya terpakai"
              note="Bingkai 640 × 360 digambar sesuai skala. Kedua panel adalah seluruh isi yang membawa informasi; sisanya kotak hitam suplemen."
            >
              <FrameGeometry panelShare={0.198} panelLabelLeft="Sosial" panelLabelRight="Geometrik" />
            </Figure>

            <Figure
              title="Sudut yang disubtensi tiap panel"
              note="Digambar sesuai skala pada tablet sasaran. Garis putus-putus adalah ukuran yang dilaporkan Moore dkk.; blok isi adalah yang benar-benar dilihat anak."
              footnote="Aplikasi memangkas kotak hitamnya, tetapi memangkas tidak menambah piksel: panelnya tetap lebih kecil daripada yang dipakai saat ambang diturunkan."
            >
              <SubtenseCompare
                reference={{ w: 12.9, h: 9.1, label: "Moore dkk. · 12,9° × 9,1°" }}
                shipped={{ w: 7.6, h: 4.9, label: "Yang dikirim · 7,6° × 4,9°" }}
              />
            </Figure>
          </div>

          <div className={styles.split}>
            <div className={styles.prose}>
              <h3>Geometri panel diperiksa per perangkat</h3>
              <p>
                Panel sosial dan geometrik hanya menempati <strong>19,8%</strong> luas bingkai
                640 × 360; sisanya hitam, karena berkasnya ilustrasi suplemen dan bukan master
                presentasi. Diputar utuh, tiap panel menyubtensi sekitar 7,6° × 4,9° pada tablet
                sasaran — jauh di bawah 12,9° × 9,1° yang dilaporkan Moore dkk.
              </p>
              <p>
                Aplikasi memangkas kotak hitam itu, dan <code>geoprefPanelDegrees()</code> membuat
                geometrinya dapat diperiksa per perangkat alih-alih diasumsikan.
              </p>
            </div>

            <div className={styles.criteria} data-tone="warn">
              <h3>Sifat yang disengaja</h3>
              <ul>
                <li><strong>Senyap.</strong> Metode Moore dkk. menyatakan tidak ada audio. Jangan menambahkan trek suara.</li>
                <li><strong>Letterboxed.</strong> Surround hitam dipangkas agar sudut panel mendekati yang dilaporkan.</li>
                <li><strong>Panel geometrik di kanan.</strong> Dicatat ke log sesi, bukan diasumsikan.</li>
              </ul>
            </div>
          </div>

          <h3 className={styles.subhead}>Tiap aset membawa titik operasinya sendiri</h3>
          <div className={styles.assets}>
            {CLIP_ASSETS.map((asset) => (
              <article key={asset.title} data-status={asset.status}>
                <div className={styles.assetTop}>
                  <h4>{asset.title}</h4>
                  <span className={styles.statusPill} data-tone={asset.status === "shipped" ? "passed" : "open"}>
                    {asset.statusLabel}
                  </span>
                </div>
                <dl>
                  <div><dt>Durasi</dt><dd>{asset.duration}</dd></div>
                  <div><dt>Titik operasi</dt><dd>{asset.operating}</dd></div>
                </dl>
                <p>{asset.note}</p>
              </article>
            ))}
          </div>

          <Note kind="limit" title="Kenapa ambang 69% ditahan">
            Ambang itu diturunkan pada protokol 62,22 detik dan dibawa ke protokol 90 detik. Yang
            dikirim adalah cuplikan 16,75 detik dari keduanya — seperlima panjang protokol terbit,
            tanpa preseden operasional sendiri. Karena itu <code>validatedProtocol</code> bernilai
            false, ambangnya ditahan di lapangan, dan sesi melaporkan persentase terukur sambil
            menyatakan protokolnya disingkat. Mode demonstrasi menerapkannya sekali, di bawah
            banner yang menyatakan dirinya demonstrasi.
          </Note>
        </section>

        {/* ── Adegan vektor ──────────────────────────────────────────────── */}
        <section id="adegan-vektor" className={styles.section} aria-labelledby="adegan-vektor-title">
          <SectionHead
            id="adegan-vektor"
            title="Adegan vektor dirancang untuk skrining, bukan hiburan"
            lead={`Setiap detik, objek, dan gerakan pada adegan punya alasan metodologis. Stimulus ${STIMULUS_VERSION}.`}
            status={`${STIMULUS_TOTAL_SECONDS} detik`}
            tone="neutral"
          />

          <Metrics items={STIMULUS_METRICS} />

          <h3 className={styles.subhead}>Struktur satu percobaan · 5 detik</h3>

          <Figure
            title="Satu percobaan, digambar sesuai waktunya"
            note="Lebar tiap blok sebanding dengan durasinya. Onset isyarat memisahkan epok pra-isyarat yang benar-benar netral dari jendela yang dihitung sebagai respons."
            legend={TRIAL_BANDS.map((band) => ({
              label: band.label,
              color:
                band.tone === "rest"
                  ? "var(--slate-100)"
                  : band.tone === "ostensive"
                    ? "var(--teal-200)"
                    : "var(--amber-100)",
              value: `${num((band.toMs - band.fromMs) / 1000, 1)} dtk`,
            }))}
            footnote="Ketiga angka di strip ini dibaca dari modul protokol, bukan diketik ulang di halaman ini."
          >
            <TrialStrip
              totalMs={TRIAL_MS}
              bands={TRIAL_BANDS}
              markers={[
                { label: `${num(TRIAL_OSTENSIVE_MS / 1000, 1)} dtk · ostensif`, atMs: TRIAL_OSTENSIVE_MS },
                { label: `${num(TRIAL_CUE_MS / 1000, 1)} dtk · isyarat arah`, atMs: TRIAL_CUE_MS },
              ]}
            />
          </Figure>

          <ol className={styles.timeline}>
            {TRIAL_TIMELINE.map(([time, title, note]) => (
              <li key={time}>
                <span className={styles.timelineTime}>{time}</span>
                <strong>{title}</strong>
                <p>{note}</p>
              </li>
            ))}
          </ol>

          <div className={styles.split}>
            <div className={styles.prose}>
              <h3>Kenapa harus ada sinyal ostensif dulu</h3>
              <p>
                Anak kecil mengikuti arah pandang terutama setelah menerima sinyal komunikatif —
                kontak mata, alis terangkat, sapaan. Tanpa ajakan itu, anak yang tidak mengikuti
                arah pandang belum tentu menunjukkan apa pun; ia bisa saja hanya tidak merasa
                diajak.
              </p>
              <a className={styles.link} href="https://doi.org/10.1016/j.cub.2008.03.059" target="_blank" rel="noreferrer">
                Senju &amp; Csibra 2008 <IconArrowRight size={13} />
              </a>
            </div>

            <div className={styles.prose}>
              <h3>Kenapa vektor, bukan rekaman video</h3>
              <p>
                Adegan digambar sebagai SVG dan dianimasikan lewat CSS. Onset isyarat karena itu
                jatuh persis pada milidetik yang dideklarasikan protokol di semua tablet, tidak
                bergeser karena frame yang jatuh atau dekoder yang berbeda. Asetnya kecil,
                berjalan luring penuh, dan tidak membawa masalah lisensi maupun privasi seperti
                rekaman aktor.
              </p>
            </div>
          </div>

          <div className={styles.split}>
            <div className={styles.prose}>
              <h3>Sumber rancangan</h3>
              <p>
                Struktur percobaan mengikuti paradigma <em>responding joint attention</em> yang
                dipakai pada balita: model perempuan duduk di belakang meja dengan dua objek
                identik, mula-mula menunduk, lalu menatap kamera dan menyapa, lalu memalingkan
                kepala ke salah satu objek sambil tetap diam dan berekspresi netral.
              </p>
              <p>
                Video suplemen paradigma itu (Billeci dkk.) tersimpan di repositori pada{" "}
                <code>referensi/stimulus_billeci/</code> dan dipakai sebagai acuan langsung saat
                menyusun urutan adegan.
              </p>
            </div>

            <div className={styles.prose}>
              <h3>Konstruk yang diukur</h3>
              <p>
                Berkurangnya respons terhadap ajakan berbagi perhatian adalah salah satu
                perbedaan perilaku yang paling awal muncul dan paling konsisten dilaporkan pada
                anak dengan ASD. Cilia dkk. menemukan gerakan menunjuk yang disertai orientasi
                kepala sebagai isyarat sasaran paling kuat — itulah yang direplikasi di sini.
              </p>
              <a className={styles.link} href="https://doi.org/10.3389/fpsyg.2019.02187" target="_blank" rel="noreferrer">
                Cilia dkk. 2019 <IconArrowRight size={13} />
              </a>
            </div>
          </div>

          <h3 className={styles.subhead}>Yang sengaja dihilangkan dari adegan</h3>
          <div className={styles.choices}>
            {DESIGN_CHOICES.map(([choice, reason]) => (
              <article key={choice}><strong>{choice}</strong><p>{reason}</p></article>
            ))}
          </div>

          <Note kind="limit" title="Batas klaim desain stimulus">
            Rancangan yang berdasar tidak membuat keluarannya menjadi diagnosis. Baterai ini bukan
            GeoPref dan bukan instrumen yang sudah tervalidasi secara klinis; ia berstatus stimulus
            riset yang dapat diuji. Validitasnya ditentukan Gate C, bukan oleh kualitas rancangan di
            halaman ini. Perubahan apa pun pada adegan atau waktu wajib menaikkan versi stimulus,
            karena hasil lama tidak lagi sebanding.
          </Note>
        </section>

        <footer className={styles.pageFoot}>
          <IconInfo size={15} />
          <p>
            Setiap angka di halaman ini berasal dari artefak di <code>research/hasil</code> atau
            dari artikel sumber yang disebut namanya. Bukti sekunder tidak menggantikan kohort
            prospektif maupun uji coba Posyandu.
          </p>
        </footer>
      </main>
    </div>
  );
}
