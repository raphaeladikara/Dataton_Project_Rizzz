import Link from "next/link";
import evidenceJson from "../../public/validation/gate-b-public.json";
import type { GateBPublicEvidence } from "../../src/gateb/publicEvidence";
import { IconAlert, IconArrowLeft, IconCheck, IconShieldCheck } from "../../src/ui/icons";
import styles from "./validation.module.css";

const evidence = evidenceJson as GateBPublicEvidence;
const percent = (value: number) => `${(value * 100).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`;

export default function ValidationPage() {
  const passed = evidence.status === "gate_b_passed";
  return <main className={styles.page}>
    <header className={styles.topbar}>
      <Link href="/" className={styles.brand}><span>◉</span> Neurogaze</Link>
      <span>Bukti validasi publik</span>
    </header>

    <section className={styles.hero} data-status={evidence.status}>
      <div className={styles.heroCopy}>
        <span className={styles.status}>{passed ? <IconCheck size={14} /> : <IconAlert size={14} />} {passed ? "GATE B LULUS" : "GATE B BELUM LULUS"}</span>
        <h1>{passed ? "Agreement terhadap WebGazer memenuhi batas" : "Batas agreement belum terpenuhi"}</h1>
        <p>{evidence.conclusion}</p>
        <div className={styles.validatorLine}><span>Referensi pembanding</span><strong>{evidence.study.reference.library} · {evidence.study.reference.version}</strong></div>
      </div>
      <div className={styles.heroMetric}>
        <strong>{percent(evidence.metrics.meanAoiAgreement)}</strong>
        <span>Rata-rata agreement AOI</span>
        <small>{evidence.metrics.primaryAoiAgreementCount}/{evidence.study.nPairsReady} pasangan siap sepakat pada AOI utama</small>
      </div>
    </section>

    <section className={styles.definition}>
      <IconShieldCheck size={20} />
      <div><strong>Ini bukan akurasi deteksi autisme.</strong><p>Gate B menguji agreement antara aliran gaze Neurogaze dan WebGazer.js pada sesi webapp yang sama. Sensitivitas, spesifisitas, dan performa klinis harus diuji terpisah pada Gate C.</p></div>
    </section>

    <section className={styles.metrics} aria-label="Ringkasan metrik Gate B">
      <article><span>Pasangan siap / total</span><strong>{evidence.study.nPairsReady} / {evidence.study.nPairsTotal}</strong><small>{evidence.study.nPairsWithheld} pasangan ditahan</small></article>
      <article><span>Galat median</span><strong>{evidence.metrics.medianPairErrorPx.toFixed(3)} px</strong><small>Galat ternormalisasi {percent(evidence.metrics.medianPairErrorNorm)}</small></article>
      <article><span>Agreement AOI utama</span><strong>{percent(evidence.metrics.primaryAoiAgreementRate)}</strong><small>{evidence.metrics.primaryAoiAgreementCount} dari {evidence.study.nPairsReady} pasangan siap</small></article>
      <article><span>Valid pair rate</span><strong>{percent(evidence.metrics.validPairRate)}</strong><small>Retry rate {percent(evidence.metrics.retryRate)}</small></article>
    </section>

    <div className={styles.contentGrid}>
      <section className={styles.card}>
        <span className={styles.eyebrow}>Identitas studi</span>
        <h2>Metode yang dapat diperiksa</h2>
        <dl>
          <div><dt>Judul</dt><dd>{evidence.study.title}</dd></div>
          <div><dt>Protokol</dt><dd>{evidence.study.protocolVersion}</dd></div>
          <div><dt>Populasi</dt><dd>{evidence.study.population}</dd></div>
          <div><dt>Referensi</dt><dd>{evidence.study.reference.library} {evidence.study.reference.version}</dd></div>
          <div><dt>Koordinat</dt><dd>{evidence.study.reference.coordinateSpace}</dd></div>
          <div><dt>Akuisisi</dt><dd>{evidence.study.acquisitionMode}</dd></div>
          <div><dt>Dipublikasikan</dt><dd>{new Date(evidence.publishedAt).toLocaleDateString("id-ID", { dateStyle: "long" })}</dd></div>
        </dl>
      </section>

      <section className={styles.card}>
        <span className={styles.eyebrow}>Batas klaim</span>
        <h2>Apa yang hasil ini tidak buktikan</h2>
        <ul>{evidence.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        <div className={styles.claimLock}><IconAlert size={16} /><span><strong>Akurasi klinis</strong><small>TIDAK TERSEDIA · menunggu Gate C</small></span></div>
      </section>
    </div>

    <footer><Link href="/"><IconArrowLeft size={14} /> Kembali ke Neurogaze</Link><span>Gate B = agreement pengukuran · Gate C = validasi klinis</span></footer>
  </main>;
}
