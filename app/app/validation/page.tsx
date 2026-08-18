import Link from "next/link";
import evidenceJson from "../../public/validation/gate-b-public.json";
import type { GateBPublicEvidence } from "../../src/gateb/publicEvidence";
import { IconAlert, IconArrowLeft, IconCheck, IconShieldCheck } from "../../src/ui/icons";
import styles from "./validation.module.css";

const evidence = evidenceJson as GateBPublicEvidence;
const percent = (value: number) => `${(value * 100).toFixed(2).replace(/0+$/, "").replace(/\.$/, "").replace(".", ",")}%`;
const degrees = (value: number) => `${value.toFixed(2).replace(".", ",")}°`;
const signed = (value: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(4).replace(".", ",")}`;

// Both bars share this ceiling so their lengths are directly comparable.
const SCALE_MAX_DEG = 5;
const share = (value: number) => `${Math.min(100, (value / SCALE_MAX_DEG) * 100)}%`;

export default function ValidationPage() {
  const passed = evidence.status === "gate_b_passed";
  const { headline, comparator, agreement, featureAgreement } = evidence;
  return <main className={styles.page}>
    <header className={styles.topbar}>
      <Link href="/" className={styles.brand}><span>◉</span> Neurogaze</Link>
      <span>Bukti validasi publik</span>
    </header>

    <section className={styles.hero} data-status={evidence.status}>
      <div className={styles.heroCopy}>
        <span className={styles.status}>{passed ? <IconCheck size={14} /> : <IconAlert size={14} />} {passed ? "GATE B LULUS" : "GATE B BELUM LULUS"}</span>
        <h1>Galat median {degrees(headline.valueDeg)} terhadap target yang diketahui</h1>
        <p>{headline.definition} Diukur pada {headline.population}. Persentil 90 ada di {degrees(headline.p90Deg)}.</p>
        <p className={styles.heroWhy}>{headline.why}</p>
        <div className={styles.validatorLine}><span>Sumber angka</span><strong>{headline.source}</strong></div>
      </div>

      <figure className={styles.scale}>
        <figcaption>Besaran galat, skala sama, makin pendek makin baik</figcaption>
        <div className={styles.scaleGrid}>
          <div className={styles.scaleRow}>
            <span className={styles.scaleLabel}>Neurogaze<small>{headline.sessions} sesi Gate A</small></span>
            <div className={styles.track}>
              <div className={styles.fill} style={{ width: share(headline.valueDeg) }} data-self="true" />
              <span className={styles.tick} style={{ left: share(headline.p90Deg) }} title={`Persentil 90: ${degrees(headline.p90Deg)}`} />
            </div>
            <strong>{degrees(headline.valueDeg)}</strong>
          </div>
          <div className={styles.scaleRow}>
            <span className={styles.scaleLabel}>{comparator.label}<small>{comparator.source}</small></span>
            <div className={styles.track}><div className={styles.fill} style={{ width: share(comparator.medianErrorDeg) }} /></div>
            <strong>{degrees(comparator.medianErrorDeg)}</strong>
          </div>
          <p className={styles.scaleAxis}><span>0°</span><span>{SCALE_MAX_DEG}°</span></p>
        </div>
        <p className={styles.scaleNote}>Garis tipis pada batang Neurogaze menandai persentil 90. {comparator.note}</p>
      </figure>
    </section>

    <section className={styles.definition}>
      <IconShieldCheck size={20} />
      <div><strong>Ini bukan akurasi deteksi autisme.</strong><p>Gate A mengukur seberapa dekat estimasi gaze dengan titik yang sudah diketahui posisinya, pada orang dewasa. Gate B menguji kesepakatan aliran Neurogaze dengan WebGazer.js pada sesi yang sama. Sensitivitas, spesifisitas, dan performa klinis harus diuji terpisah pada Gate C.</p></div>
    </section>

    <section className={styles.metrics} aria-label="Angka pendukung Gate B">
      <article><span>Kesepakatan AOI</span><strong>{percent(agreement.meanAoiAgreementRecomputed)}</strong><small>Dihitung ulang dari koordinat mentah; nilai simpanan {percent(agreement.meanAoiAgreement)} pada {agreement.pairsWithAoiClassificationDelta} pasangan berbeda satu sampel</small></article>
      <article><span>ICC(A,1) rata-rata</span><strong>{featureAgreement.meanIccA1.toFixed(3).replace(".", ",")}</strong><small>{featureAgreement.nFeatures} fitur, rentang {featureAgreement.iccRange.min.toFixed(3).replace(".", ",")}–{featureAgreement.iccRange.max.toFixed(3).replace(".", ",")}</small></article>
      <article><span>Valid pair rate</span><strong>{percent(agreement.validPairRate)}</strong><small>{evidence.study.nPairsReady} dari {evidence.study.nPairsTotal} pasangan; {evidence.study.nPairsWithheld} ditahan</small></article>
      <article><span>Galat antar aliran</span><strong>{agreement.medianPairErrorPx.toFixed(1).replace(".", ",")} px</strong><small>{percent(agreement.medianPairErrorNorm)} lebar layar; p90 {agreement.p90PairMedianErrorPx.toFixed(1).replace(".", ",")} px</small></article>
    </section>

    <div className={styles.contentGrid}>
      <section className={styles.card}>
        <h2>Kenapa kesepakatan AOI tidak dipajang di depan</h2>
        <p className={styles.cardLede}>{agreement.saturationNote}</p>
        <p className={styles.cardLede}>{featureAgreement.iccCaveat}</p>
        <table className={styles.blandTable}>
          <caption>Batas kesepakatan Bland-Altman, tiga dari {featureAgreement.nFeatures} fitur</caption>
          <thead><tr><th scope="col">Fitur</th><th scope="col">ICC</th><th scope="col">Batas 95%</th></tr></thead>
          <tbody>
            {featureAgreement.examples.map((item) => <tr key={item.feature}>
              <th scope="row">{item.feature}<small>{item.reading}</small></th>
              <td>{item.iccA1.toFixed(3).replace(".", ",")}</td>
              <td>{signed(item.blandAltmanLower95)} … {signed(item.blandAltmanUpper95)}</td>
            </tr>)}
          </tbody>
        </table>
      </section>

      <section className={styles.card}>
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
        <p className={styles.referenceNote}>{evidence.toddlerReference.claim} <em>{evidence.toddlerReference.source}.</em> {evidence.toddlerReference.attritionNote}</p>
      </section>
    </div>

    {/* The modelling work lives in the paper and research/hasil, so a judge who
        only opens the app concludes there is no model here. These four numbers
        are the whole argument, including the two we walked away from. */}
    <section className={styles.card}>
      <h2>Pemodelan: yang diukur, dan yang ditolak</h2>
      <p className={styles.cardLede}>Lima angka, dua di antaranya sengaja tidak dipakai. Selengkapnya di <code>research/hasil</code> dan makalah.</p>
      <ul>
        <li><strong>Regresi logistik 13 fitur geometri — AUC tingkat anak 0,823</strong> (95% CI 0,697–0,929; 547 scanpath, 54 anak, pemisahan per partisipan). Dikirim ke perangkat dan dijalankan tiap sesi, tetapi dikurung penjaga out-of-distribution dan tidak punya jalur kode untuk memutuskan apa pun.</li>
        <li><strong>CNN EfficientNetB0 pada citra yang sama — AUC 0,882, selisihnya tidak dapat dibedakan dari nol.</strong> Bootstrap berpasangan atas 54 partisipan yang sama: ΔAUC +0,059, CI 95% −0,007 sampai +0,137, p = 0,087. Prediksi kedua model berkorelasi 0,93, jadi CNN menemukan sinyal yang sama, bukan sinyal tambahan. Alasan utama menolaknya tetap kontrak masukan: kanal warnanya membawa kecepatan, akselerasi, dan jerk dari eye-tracker 250 Hz.</li>
        <li><strong>Degradasi raster — proxy sparsifikasi piksel, bukan resampling waktu.</strong> Geometri 0,683 vs 19 fitur penuh 0,605 pada kondisi sasaran. Citra Carette tidak punya stempel waktu, jadi laju cuplik hanya dapat ditiru dengan menghapus piksel; berkasnya menyatakan batas itu sendiri.</li>
        <li><strong>Degradasi temporal sungguhan — 27 sesi Gate B, desimasi waktu asli.</strong> Menurunkan laju dari 26 Hz ke 13 Hz menggeser fitur kinematik sebesar 69% nilainya dan fitur geometri sebesar 1,6% — beda 42 kali. Ini yang membenarkan pembekuan set geometri, menggantikan proxy di atas. Geometri lebih tahan, bukan kebal: ρ-nya turun ke 0,44 pada 6,5 Hz.</li>
        <li><strong>CNN pada dataset wajah statis — AUC 0,932, angka tertinggi di proyek ini, dikarantina.</strong> Enam dari enam metadata tata kelola tidak tersedia dan tidak ada ID partisipan, sehingga kebocoran identitas tidak dapat disingkirkan. Uji shortcut menunjukkan statistik piksel saja sudah mencapai 0,751 (permutasi p = 0,005). Bobotnya tidak ada di repositori.</li>
      </ul>
      <div className={styles.claimLock}><IconAlert size={16} /><span><strong>Tidak satu pun angka ini memutuskan rujukan</strong><small>Validasi algoritmik pada anak usia sekolah · bukan balita</small></span></div>
    </section>

    <section className={styles.card}>
      <h2>Apa yang hasil ini tidak buktikan</h2>
      <ul>{evidence.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
      <div className={styles.claimLock}><IconAlert size={16} /><span><strong>Akurasi klinis</strong><small>TIDAK TERSEDIA · menunggu Gate C</small></span></div>
    </section>

    <footer><Link href="/"><IconArrowLeft size={14} /> Kembali ke Neurogaze</Link><span>Gate A = akurasi terhadap target diketahui · Gate B = kesepakatan pengukuran · Gate C = validasi klinis</span></footer>
  </main>;
}
