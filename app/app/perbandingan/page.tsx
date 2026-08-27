import Link from "next/link";
import evidenceJson from "../../public/validation/gate-b-public.json";
import { buildComparisonView } from "../../src/outcome/comparisonView";
import type { GateBPublicEvidence } from "../../src/gateb/publicEvidence";
import { IconAlert, IconArrowLeft, LogoMark } from "../../src/ui/icons";
import styles from "./perbandingan.module.css";

export const metadata = {
  title: "Perbandingan dua kondisi — Neurogaze",
  description: "Respons instrumen pada menonton biasa dan pola yang sengaja diproduksi, berdampingan.",
};

const view = buildComparisonView(evidenceJson as GateBPublicEvidence);

/**
 * One screen for the claim that needed two sessions to show.
 *
 * Sized for a projector rather than a desk: the deciding rows are the largest
 * thing on the page, and the scope banner sits above them so it cannot be read
 * after the numbers have already landed.
 */
export default function ComparisonPage() {
  const [ordinary, produced] = view.columns;

  return <main className={styles.page}>
    <header className={styles.topbar}>
      <Link href="/" className={styles.brand}><LogoMark size={24} className={styles.brandMark} /> Neurogaze</Link>
      <span>Respons instrumen · kontrol positif dewasa</span>
    </header>

    <section className={styles.scope}>
      <IconAlert size={20} />
      <p>{view.scopeBanner}</p>
    </section>

    <h1 className={styles.title}>{view.title}</h1>
    <p className={styles.lede}>
      {view.participants} peserta dewasa · {view.sessionsRecorded} sesi direkam · {view.sessionsQualityPass} lulus mutu
    </p>

    <section className={styles.columns} aria-label="Dua kondisi berdampingan">
      {[ordinary, produced].map((column) => (
        <article key={column.id} className={styles.column} data-condition={column.id}>
          <h2>{column.label}</h2>
          <p className={styles.instruction}>{column.instruction}</p>
          <strong className={styles.fired}>{column.ruleFired}<span> / {column.usable}</span></strong>
          <p className={styles.firedLabel}>{column.outcome}</p>
          <p className={styles.denominator}>
            {column.recorded} sesi direkam, {column.usable} dapat dipakai — {column.recorded - column.usable} ditahan gerbang mutu
          </p>
        </article>
      ))}
    </section>

    <section className={styles.card}>
      <h2>Tiga sinyal yang menentukan</h2>
      <table className={styles.signals}>
        <thead>
          <tr>
            <th scope="col">Sinyal</th>
            <th scope="col">Menonton biasa</th>
            <th scope="col">Pola diproduksi</th>
            <th scope="col">Jarak terdekat</th>
          </tr>
        </thead>
        <tbody>
          {view.signals.map((signal) => (
            <tr key={signal.id}>
              <th scope="row">{signal.label}<small>{signal.meaning}</small></th>
              <td data-strong={signal.direction === "higher_in_ordinary"}>
                {signal.ordinary.median}<small>n={signal.ordinary.n}</small>
              </td>
              <td data-strong={signal.direction === "higher_in_produced"}>
                {signal.produced.median}<small>n={signal.produced.n}</small>
              </td>
              <td className={styles.gap}>{signal.nearestGap}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.note}>{view.gapNote}</p>
    </section>

    <section className={styles.card}>
      <h2>Apa yang layar ini tidak buktikan</h2>
      <ul className={styles.notClaimed}>
        {view.notClaimed.map((line) => <li key={line}>{line}</li>)}
      </ul>
      <p className={styles.note}>Sumber angka: <strong>{view.source}</strong></p>
    </section>

    <footer className={styles.footer}>
      <Link href="/"><IconArrowLeft size={14} /> Kembali ke Neurogaze</Link>
      <Link href="/validation">Bukti validasi lengkap</Link>
    </footer>
  </main>;
}
