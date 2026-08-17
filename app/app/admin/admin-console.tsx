"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconAlert, IconArrowRight, IconCheck, IconResearch, IconShieldCheck } from "../../src/ui/icons";
import styles from "./admin.module.css";
import { GATE_EVIDENCE_STATUS } from "../../src/validation/evidenceStatus";
import { DEFAULT_GATE_C_SIMULATION, simulateGateC } from "../../src/validation/gateCSimulation";

const GATE_A_METRICS = [
  ["Total sesi", "100", "25 peserta · 4 sesi per peserta"],
  ["Completion rate", "94%", "94 sesi selesai · 6 ditahan"],
  ["Galat median", "2,2°", "Lulus ambang ≤3°"],
  ["Frame valid", "96,4%", "Wajah dan mata terbaca"],
  ["Dropout gaze", "3,6%", "Sanity check lulus 96/100"],
  ["Mode luring", "100%", "Crash selama pengujian: 0"],
] as const;

const GATE_B_METRICS = [
  ["Total pasangan", "30", "Aliran browser simultan"],
  ["Pasangan siap", "27", "Valid pair rate 90%"],
  ["Galat median", "44,159 px", "0,040997 ternormalisasi"],
  ["Agreement AOI", "99,7574%", "Rata-rata pasangan siap"],
  ["AOI utama", "100%", "27 dari 27 pasangan siap"],
  ["Retry rate", "10%", "3 pasangan ditahan"],
] as const;

const STIMULUS_METRICS = [
  ["Durasi total", "66 detik", "5 + (8 × 7) + 5 detik"],
  ["Percobaan berskor", "8", "4 jenis isyarat × kiri/kanan"],
  ["Epok pra-isyarat", "2,0 detik", "Tanpa informasi kiri/kanan"],
  ["Jendela respons", "5,0 detik", "Latensi mengikuti pandangan < 1,5 detik"],
  ["Objek sasaran", "2 identik", "Diam sepanjang seluruh sesi"],
  ["Versi stimulus", "v3", "ID-joint-cues-vector-v3"],
] as const;

const TRIAL_TIMELINE = [
  ["0,0–1,4 dtk", "Istirahat", "Model menunduk ke meja. Wajah netral, tangan di bawah tepi meja, tidak ada arah sama sekali."],
  ["1,4 dtk", "Sinyal ostensif", "Kepala terangkat, kontak mata, alis naik, senyum. Ini mengundang anak sebelum ada isyarat arah."],
  ["2,0 dtk", "Isyarat arah", "Wajah kembali netral dan diam. Mata bergerak lebih dulu, kepala menyusul, tangan menunjuk paling akhir."],
  ["2,0–7,0 dtk", "Jendela respons", "Adegan dibekukan pada pose isyarat. Seluruh pandangan pada periode ini dihitung sebagai respons."],
] as const;

const DESIGN_CHOICES = [
  ["Dua objek identik, bukan mobil dan bola", "Kalau kedua objek berbeda, anak yang melihat ke satu sisi bisa saja hanya menyukai objeknya. Objek identik membuat satu-satunya pembeda adalah isyarat sosial."],
  ["Objek tidak pernah bergerak", "Gerakan menarik pandangan secara otomatis. Jika objek bergerak, yang terukur adalah refleks terhadap gerakan, bukan respons terhadap ajakan."],
  ["Pra-isyarat benar-benar netral", "Model menunduk dengan tangan di bawah tepi meja, jadi tidak ada informasi kiri atau kanan sebelum onset. Ini membuat pembanding pra-isyarat sah dipakai."],
  ["Isyarat berupa perubahan status, bukan animasi berulang", "Animasi yang terus berjalan menjadi sumber gerakan tersendiri. Isyarat di sini adalah satu perpindahan pose pada milidetik yang sudah dideklarasikan protokol."],
  ["Tanpa suara dan tanpa teks", "Baterai ini khusus mengukur tatapan. Uji respons terhadap panggilan nama membutuhkan pemanggil di luar layar dan pengukuran putaran kepala, sehingga sengaja tidak dimasukkan."],
  ["Kiri dan kanan selalu berpasangan, tiap pasangan diulang", "Anak yang cenderung selalu melihat ke satu sisi tidak akan tampak seolah merespons. Pengulangan juga memberi keterandalan pada tingkat anak, bukan satu tebakan."],
  ["Gerak diam-diam hanya bernapas dan berkedip", "Wajah yang benar-benar beku terasa mati dan cepat kehilangan perhatian anak. Kedip dan napas dibuat simetris di tengah, sehingga tidak bisa menarik pandangan ke satu sisi."],
] as const;

const GATE_C_METRICS = [
  ["Lintasan tatapan", "547", "Citra 640 × 480"],
  ["ID partisipan", "54", "OOF dan pemisahan data per anak"],
  ["Model notebook", "EfficientNetB0", "Belum ada bobot ekspor untuk web"],
  ["AUC tingkat anak", "0,8819", "95% CI 0,7738-0,9681"],
  ["Sensitivitas kandidat", "84,62%", "Ambang validasi 0,476"],
  ["Spesifisitas kandidat", "75,00%", "Bukan titik kerja klinis"],
] as const;

function EvidenceMetrics({ items }: { items: ReadonlyArray<readonly [string, string, string]> }) {
  return <div className={styles.evidenceMetricGrid}>{items.map(([label, value, note]) => <article key={label}><small>{label}</small><strong>{value}</strong><span>{note}</span></article>)}</div>;
}

export function AdminConsole() {
  const [gateCSimulationInput, setGateCSimulationInput] = useState(DEFAULT_GATE_C_SIMULATION);
  const gateCSimulation = useMemo(() => simulateGateC(gateCSimulationInput), [gateCSimulationInput]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return <main className={styles.consolePage}>
    <header className={styles.topbar}>
      <Link href="/" className={styles.brand}><span>◉</span> Neurogaze</Link>
      <div><Link className={styles.publicLink} href="/validation">Bukti publik</Link><span className={styles.adminBadge}>Admin · validasi</span><button onClick={logout}>Keluar</button></div>
    </header>

    <section className={styles.hero}>
      <div><span className={styles.kicker}>Operasional riset</span><h1>Konsol gerbang validasi</h1><p>Halaman ini memisahkan pengukuran teknis dari pengalaman peserta. Tidak ada skor ASD atau keputusan klinis di sini.</p></div>
    </section>

    <section className={styles.gates} aria-label="Status gerbang">
      {GATE_EVIDENCE_STATUS.gates.map((gate) => <article key={gate.id}><span className={styles.passed}><IconCheck size={17} /></span><div><small>Gate {gate.id}</small><strong>{gate.statusLabel}</strong><p>{gate.title}</p></div></article>)}
    </section>

    <section className={styles.manualEvidence} aria-labelledby="manual-evidence-title">
      <div className={styles.sectionHeading}><div><span className={styles.kicker}>Ringkasan bukti · {GATE_EVIDENCE_STATUS.updatedAt}</span><h2 id="manual-evidence-title">Status Gate A–D</h2><p className={styles.sectionLead}>Gate A dan B telah lulus berdasarkan log webapp. Gate C dan D tetap terbuka; status ini bukan validasi klinis final.</p></div><span className={styles.localBadge}>Batas bukti jelas</span></div>
      <div className={styles.evidenceCards}>
        {GATE_EVIDENCE_STATUS.gates.map((gate) => <article key={gate.id}>
          <div className={styles.cardTopline}><span>Gate {gate.id}</span><b data-status={gate.id === "A" || gate.id === "B" ? "passed" : "open"}>{gate.statusLabel}</b></div>
          <h3>{gate.title}</h3><p>{gate.statement}</p>
          <dl><div><dt>Ringkasan bukti</dt><dd>{gate.knownEvidence}</dd></div></dl>
        </article>)}
      </div>
    </section>

    <section className={styles.evidenceDossier} aria-labelledby="stimulus-design-title">
      <div className={styles.sectionHeading}>
        <div><span className={styles.kicker}>Instrumen · stimulus ID-joint-cues-vector-v3</span><h2 id="stimulus-design-title">Stimulus ini dirancang khusus untuk skrining, bukan animasi hiburan</h2><p className={styles.sectionLead}>Setiap detik, setiap objek, dan setiap gerakan pada adegan punya alasan metodologis. Bagian ini menjelaskan alasannya supaya penguji dapat menilai apakah instrumennya layak, bukan sekadar melihat hasilnya.</p></div>
        <span className={styles.principleStatus}>Setiap pilihan punya alasan</span>
      </div>
      <EvidenceMetrics items={STIMULUS_METRICS} />

      <article className={styles.gateDossier} data-gate="A">
        <header className={styles.dossierHeader}><div><span className={styles.kicker}>Konstruk yang diukur</span><h3>Respons terhadap perhatian bersama, bukan preferensi gambar</h3></div></header>
        <div className={styles.dossierColumns}>
          <section><h4>Kenapa perhatian bersama</h4><p>Berkurangnya respons terhadap ajakan berbagi perhatian—anak tidak mengikuti arah mata, kepala, atau telunjuk orang lain—adalah salah satu perbedaan perilaku yang paling awal muncul dan paling konsisten dilaporkan pada anak dengan ASD. Karena itu seluruh baterai hanya berisi satu keluarga isyarat: arah mata dan kepala, serta menunjuk yang disertai orientasi kepala.</p><div className={styles.truthNote}><IconResearch size={16} /><span>Cilia dkk. menemukan bahwa pada video perhatian bersama, gerakan menunjuk yang disertai orientasi kepala adalah isyarat sasaran paling kuat—itulah yang direplikasi di sini.</span></div></section>
          <section><h4>Sumber rancangan</h4><p>Struktur percobaan mengikuti paradigma <em>responding joint attention</em> yang dipakai pada balita: model perempuan duduk di belakang meja dengan dua objek identik, mula-mula menunduk, lalu menatap kamera dan menyapa, lalu memalingkan kepala ke salah satu objek sambil tetap diam dan berekspresi netral.</p><p>Video suplemen paradigma tersebut—<em>Disentangling the initiation from the response in joint attention: an eye-tracking study in toddlers with autism spectrum disorders</em> (Billeci dkk.)—tersimpan di repositori pada <code>referensi/stimulus_billeci/</code> dan dipakai sebagai acuan langsung saat menyusun urutan adegan.</p><a className={styles.datasetLink} href="https://doi.org/10.3389/fpsyg.2019.02187" target="_blank" rel="noreferrer">Artikel Cilia dkk. <IconArrowRight size={14} /></a></section>
        </div>
      </article>

      <article className={styles.gateDossier} data-gate="B">
        <header className={styles.dossierHeader}><div><span className={styles.kicker}>Struktur satu percobaan · 7 detik</span><h3>Ajakan dulu, baru arah — bukan langsung menoleh</h3></div><span className={styles.principleStatus}>Onset bertimestamp</span></header>
        <div className={styles.trialTimeline}>
          {TRIAL_TIMELINE.map(([time, title, note]) => <article key={time}><small>{time}</small><strong>{title}</strong><p>{note}</p></article>)}
        </div>
        <div className={styles.dossierColumns}>
          <section><h4>Kenapa harus ada sinyal ostensif dulu</h4><p>Anak kecil mengikuti arah pandang orang lain terutama setelah menerima sinyal komunikatif—kontak mata, alis terangkat, sapaan. Tanpa ajakan itu, anak yang tidak mengikuti arah pandang belum tentu menunjukkan apa pun; ia bisa saja hanya tidak merasa diajak. Karena itu setiap percobaan selalu dimulai dengan kontak mata sebelum ada informasi arah.</p><a className={styles.datasetLink} href="https://doi.org/10.1016/j.cub.2008.03.059" target="_blank" rel="noreferrer">Senju &amp; Csibra 2008 · sinyal komunikatif dan gaze following <IconArrowRight size={14} /></a></section>
          <section><h4>Urutan gerak mengikuti tubuh manusia</h4><p>Pada isyarat nyata, mata bergerak lebih dulu, kepala menyusul, lalu tangan. Adegan meniru urutan itu: mata bergerak 50 ms setelah onset, kepala 160 ms, lengan 330 ms. Leher ikut condong, telinga sisi jauh menyempit, dan lengan berputar pada sendi bahu serta siku, bukan muncul begitu saja.</p><div className={styles.safeClaim}><strong>Semua onset tercatat</strong><p>Waktu munculnya sinyal ostensif dan isyarat arah disimpan di log audit tiap sesi, sehingga analisis dapat memisahkan pandangan spontan dari respons setelah isyarat.</p></div></section>
        </div>
      </article>

      <article className={styles.gateDossier} data-gate="C">
        <header className={styles.dossierHeader}><div><span className={styles.kicker}>Kontrol variabel pengganggu</span><h3>Yang sengaja dihilangkan dari adegan</h3></div></header>
        <div className={styles.designChoices}>{DESIGN_CHOICES.map(([choice, reason]) => <article key={choice}><strong>{choice}</strong><p>{reason}</p></article>)}</div>
      </article>

      <article className={styles.gateDossier} data-gate="D">
        <header className={styles.dossierHeader}><div><span className={styles.kicker}>Durasi dan bentuk aset</span><h3>66 detik, dan digambar sebagai vektor</h3></div><span className={styles.principleStatus}>Turun dari 120 detik</span></header>
        <div className={styles.dossierColumns}>
          <section><h4>Kenapa dipendekkan</h4><p>Versi sebelumnya berdurasi 120 detik dengan tiap percobaan 13 detik. Balita usia 16–30 bulan sulit bertahan selama itu di depan layar, dan sesi yang gagal di tengah jalan menghasilkan rekaman yang tidak dapat dinilai. Durasi tiap percobaan dipangkas menjadi 7 detik—2 detik pra-isyarat dan 5 detik jendela respons—tanpa mengurangi jumlah percobaan berskor, karena respons mengikuti pandangan biasanya muncul jauh di bawah 1,5 detik setelah isyarat.</p><div className={styles.truthNote}><IconShieldCheck size={16} /><span><strong>Yang tidak dikorbankan.</strong> Delapan percobaan berskor dan penyeimbangan kiri–kanan tetap utuh; yang dipotong hanya waktu tunggu.</span></div></section>
          <section><h4>Kenapa vektor, bukan rekaman video</h4><p>Adegan digambar sebagai SVG dan dianimasikan lewat CSS, bukan diputar sebagai berkas video. Onset isyarat karena itu jatuh persis pada milidetik yang dideklarasikan protokol di semua tablet, tidak bergeser karena frame yang jatuh atau dekoder yang berbeda. Asetnya juga kecil, berjalan luring penuh, dan tidak membawa masalah lisensi atau privasi seperti rekaman aktor.</p></section>
        </div>
        <div className={styles.predictionNote}><IconAlert size={17} /><div><strong>Batas klaim desain stimulus</strong><p>Rancangan yang berdasar tidak membuat keluarannya menjadi diagnosis. Baterai ini bukan GeoPref dan bukan instrumen yang sudah tervalidasi secara klinis; ia baru berstatus stimulus riset yang dapat diuji. Nilai validitasnya tetap ditentukan Gate C, bukan oleh kualitas rancangan di halaman ini.</p><small>Perubahan apa pun pada adegan atau waktu wajib menaikkan versi stimulus, karena hasil lama tidak lagi sebanding.</small></div></div>
      </article>
    </section>

    <section className={styles.evidenceDossier} aria-labelledby="evidence-dossier-title">
      <div className={styles.sectionHeading}>
        <div><span className={styles.kicker}>Ringkasan bukti A–D</span><h2 id="evidence-dossier-title">Hasil, batas klaim, dan langkah yang tersisa</h2><p className={styles.sectionLead}>Setiap angka berasal dari artefak repositori atau artikel sumber. Bukti sekunder dan dasar prosedur tidak menggantikan kohort prospektif maupun uji coba Posyandu.</p></div>
        <span className={styles.warningBadge}>Setiap angka punya artefak</span>
      </div>
      <nav className={styles.evidenceNav} aria-label="Navigasi ringkasan gate">
        <a href="#gate-a-evidence">A · Teknis</a><a href="#gate-b-evidence">B · Kesetaraan</a><a href="#gate-c-evidence">C · Klinis</a><a href="#gate-d-evidence">D · Operasional</a>
      </nav>

      <article className={styles.gateDossier} id="gate-a-evidence" data-gate="A">
        <header className={styles.dossierHeader}><div><span className={styles.kicker}>Gate A · validasi teknis kamera dan pelacak tatapan</span><h3>Lulus: akuisisi stabil pada 100 sesi lintas kondisi</h3></div><span className={styles.principleStatus}>Lulus · 100 sesi</span></header>
        <div className={styles.dossierColumns}><section><h4>Tujuan</h4><p>Menguji apakah kamera tablet dapat mendeteksi wajah dan iris, membedakan arah kiri–tengah–kanan, menjalankan kalibrasi dan seluruh stimulus, menahan hasil gagal, serta tetap bekerja luring.</p><div className={styles.truthNote}><IconShieldCheck size={16} /><span><strong>Bukan uji autisme.</strong> Gate A hanya menilai fungsi alat ukur tatapan.</span></div></section><section><h4>Desain pengujian</h4><p>25 peserta dewasa menjalani empat sesi per orang pada tiga jenis perangkat Android. Pengujian mencakup cahaya normal dan redup, serta peserta dengan dan tanpa kacamata. Totalnya 100 sesi lengkap.</p></section></div>
        <EvidenceMetrics items={GATE_A_METRICS} />
        <div className={styles.tableWrap}><table><caption>Hasil menurut kondisi pengujian</caption><thead><tr><th>Kondisi</th><th>Jumlah sesi</th><th>Sesi berhasil</th><th>Galat median</th></tr></thead><tbody><tr><td>Cahaya normal</td><td>50</td><td>49 · 98%</td><td>1,9°</td></tr><tr><td>Cahaya redup</td><td>25</td><td>22 · 88%</td><td>2,8°</td></tr><tr><td>Tanpa kacamata</td><td>70</td><td>68 · 97%</td><td>2,0°</td></tr><tr><td>Dengan kacamata</td><td>30</td><td>26 · 87%</td><td>2,9°</td></tr></tbody></table></div>
        <div className={styles.dossierColumns}><section><h4>Temuan kegagalan</h4><p>Enam sesi tidak menghasilkan laporan: tiga karena pantulan kacamata, dua karena wajah terlalu miring, dan satu karena orientasi layar berubah setelah kalibrasi. Seluruh masalah dikenali sistem dan diarahkan untuk dikoreksi atau dikalibrasi ulang.</p></section><section className={styles.criteriaBox}><h4>Kriteria kelulusan</h4><ul><li>Galat median ≤3°</li><li>Bingkai wajah dan mata valid &gt;85%</li><li>Penyelesaian sesi &gt;90%</li><li>Tidak ada skor risiko dari sesi invalid</li><li>Fungsi utama tetap luring</li></ul><p><strong>Status: Lulus.</strong> Seluruh kriteria teknis terpenuhi tanpa crash dan tanpa hasil risiko dari sesi invalid.</p></section></div>
      </article>

      <article className={styles.gateDossier} id="gate-b-evidence" data-gate="B">
        <header className={styles.dossierHeader}><div><span className={styles.kicker}>Gate B · Neurogaze vs WebGazer.js</span><h3>Lulus: aliran gaze Neurogaze sejalan dengan referensi WebGazer</h3></div><span className={styles.principleStatus}>Lulus · 27 dari 30 pasangan</span></header>
        <div className={styles.dossierColumns}><section><h4>Tujuan</h4><p>Menguji agreement koordinat dan area perhatian antara aliran gaze Neurogaze dan WebGazer.js pada webapp yang sama. Gate ini tidak menguji diagnosis ASD.</p><div className={styles.truthNote}><IconResearch size={16} /><span>WebGazer.js 3.5.3 berjalan sebagai aliran referensi browser melalui kontrak setGazeListener.</span></div></section><section><h4>Desain pengujian</h4><p>Tiga puluh sesi direkam sebagai pasangan aliran browser simultan. Dua puluh tujuh pasangan memenuhi kontrak dan tiga ditahan. Semua pasangan, termasuk yang ditahan, tetap dihitung.</p></section></div>
        <EvidenceMetrics items={GATE_B_METRICS} />
        <div className={styles.tableWrap}><table><caption>Distribusi area perhatian</caption><thead><tr><th>Area</th><th>WebGazer</th><th>Neurogaze</th></tr></thead><tbody><tr><td>Wajah</td><td>17,1628%</td><td>17,1374%</td></tr><tr><td>Target kiri</td><td>32,7535%</td><td>32,8137%</td></tr><tr><td>Target kanan</td><td>33,2116%</td><td>33,2336%</td></tr><tr><td>Latar</td><td>16,8720%</td><td>16,8152%</td></tr></tbody></table></div>
        <div className={styles.dossierColumns}><section><h4>Interpretasi</h4><p>Galat median antarliran adalah 44,159 px atau 0,040997 pada skala ternormalisasi. Agreement AOI rata-rata mencapai 99,7574%, sedangkan AOI utama cocok pada seluruh 27 pasangan siap.</p><p><strong>Status Gate B: Lulus.</strong> Semua kriteria yang tercatat terpenuhi. Rata-rata ICC(A,1) 13 fitur sebesar 0,505043 tetap dilaporkan sebagai metrik deskriptif, bukan penentu kelulusan.</p></section><section className={styles.criteriaBox}><h4>Kriteria kelulusan</h4><ul><li>Minimal 30 pasangan</li><li>Valid pair rate minimal 90%</li><li>Galat median ternormalisasi maksimal 0,05</li><li>Agreement AOI rata-rata minimal 95%</li><li>Agreement AOI utama minimal 95%</li></ul><p>Kesimpulan terbatas pada agreement terhadap WebGazer.js dan tidak menyatakan akurasi klinis ASD.</p></section></div>
      </article>

      <article className={styles.gateDossier} id="gate-c-evidence" data-gate="C">
        <header className={styles.dossierHeader}><div><span className={styles.kicker}>Gate C · kemampuan skrining ASD</span><h3>Validasi prospektif belum dilakukan</h3></div><span className={styles.principleStatus}>Terbuka</span></header>
        <div className={styles.dossierColumns}><section><h4>Tujuan klinis</h4><p>Studi prospektif harus membandingkan Neurogaze dengan asesmen perkembangan, M-CHAT, pemeriksaan klinis, serta diagnosis atau konsensus ahli yang dibutakan terhadap skor Neurogaze.</p></section><section><h4>Data yang tersedia</h4><p>Model awal memakai scanpath ASD/non-ASD dari anak usia sekolah, bukan kohort balita Posyandu. Dataset publik berasal dari Carette dkk.; 547 citra tersedia, sedangkan evaluasi lokal memakai 54 ID partisipan yang benar-benar hadir pada nama file.</p><a className={styles.datasetLink} href="https://figshare.com/articles/dataset/Visualization_of_Eye-Tracking_Scanpaths_in_Autism_Spectrum_Disorder_Image_Dataset/7073087/1" target="_blank" rel="noreferrer">Buka dataset Eye-Tracking Scanpaths di Figshare <IconArrowRight size={14} /></a></section></div>
        <EvidenceMetrics items={GATE_C_METRICS} />
        <div className={styles.paperEvidence}>
          <article><span>C-S1 · label dan data</span><h4>Carette dkk. mendukung validitas retrospektif</h4><p>Artikel ini melaporkan 59 anak usia sekolah: 29 anak dengan ASD yang diperiksa di klinik multidisiplin dan dinilai menggunakan CARS, serta 30 anak non-ASD. Rekaman SMI Red-m 250 Hz menghasilkan 547 citra lintasan tatapan (219 ASD; 328 non-ASD). Analisis ulang Neurogaze memakai 54 ID yang tersedia dan memisahkan data berdasarkan anak.</p><a href="https://doi.org/10.5220/0007402601030112" target="_blank" rel="noreferrer">Artikel Carette <IconArrowRight size={13} /></a></article>
          <article><span>C-S2 · validitas konstruk</span><h4>Cilia dkk. mendukung isyarat perhatian bersama</h4><p>Studi ini mencakup 28 anak dengan ASD yang didiagnosis psikiater menggunakan ADI-R dan/atau ADOS-G, serta kelompok pembanding berdasarkan usia perkembangan dan usia kronologis. Video perhatian bersama menunjukkan pola eksplorasi yang berbeda antarkelompok. Gerakan menunjuk yang disertai orientasi kepala menjadi isyarat sasaran paling kuat.</p><a href="https://doi.org/10.3389/fpsyg.2019.02187" target="_blank" rel="noreferrer">Artikel Cilia <IconArrowRight size={13} /></a></article>
        </div>
        <div className={styles.dossierColumns}><section><h4>Interpretasi notebook final</h4><p>Evaluasi yang memisahkan data tiap anak menghasilkan AUC OOF 0,8819 pada 54 anak. Namun model menerima citra raster lintasan tatapan dari eye-tracker 250 Hz dan repositori tidak memuat bobot ekspornya. Karena itu, model tersebut tidak dipakai untuk inferensi kamera secara langsung.</p><div className={styles.safeClaim}><strong>Implementasi web yang dapat dipertanggungjawabkan</strong><p>MediaPipe hanya dipakai untuk menemukan wajah dan iris di perangkat. CNN wajah tidak digunakan karena dataset wajah gagal memenuhi seluruh 6 syarat tata kelola dan tidak memiliki ID partisipan.</p></div></section><section className={styles.criteriaBox}><h4>Mengapa belum lulus?</h4><ul><li>Belum ada balita prospektif usia 16–30 bulan</li><li>Belum ada hasil klinis independen yang dinilai secara buta</li><li>Rata-rata usia sumber 7,88 tahun</li><li>Perangkat sumber 250 Hz, bukan kamera tablet 20–30 Hz</li><li>Belum ada lokasi eksternal yang benar-benar terpisah dan kelompok pembanding sulit</li><li>Ambang klinis belum boleh ditetapkan</li></ul></section></div>

        <section className={styles.simulationPanel} aria-labelledby="gate-c-simulation-title">
          <div className={styles.simulationHead}><div><span className={styles.kicker}>Perencanaan kapasitas</span><h4 id="gate-c-simulation-title">Simulasi Gate C — bukan hasil studi</h4><p>Ubah ukuran kohort, prevalensi sasaran, dan cakupan teknis. Sensitivitas dan spesifisitas dikunci pada hasil notebook agar asumsi selalu terlihat.</p></div><span>HANYA SIMULASI</span></div>
          <div className={styles.simulationInputs}>
            <label><span>Ukuran kohort</span><input type="number" min="1" max="1000000" step="1" value={gateCSimulationInput.cohortSize} onChange={(event) => setGateCSimulationInput((current) => ({ ...current, cohortSize: Number(event.target.value) }))} /></label>
            <label><span>Prevalensi sasaran</span><div><input type="number" min="0" max="100" step="0.1" value={gateCSimulationInput.prevalence * 100} onChange={(event) => setGateCSimulationInput((current) => ({ ...current, prevalence: Number(event.target.value) / 100 }))} /><b>%</b></div></label>
            <label><span>Cakupan teknis</span><div><input type="number" min="0" max="100" step="1" value={gateCSimulationInput.technicalCoverage * 100} onChange={(event) => setGateCSimulationInput((current) => ({ ...current, technicalCoverage: Number(event.target.value) / 100 }))} /><b>%</b></div></label>
            <label><span>Sensitivitas kandidat</span><div><input value="84,62" disabled /><b>%</b></div></label>
            <label><span>Spesifisitas kandidat</span><div><input value="75,00" disabled /><b>%</b></div></label>
            <label><span>Ambang notebook</span><input value="0,476" disabled /></label>
          </div>
          <div className={styles.simulationMetrics}>
            <article><small>Dapat dinilai</small><strong>{gateCSimulation.assessable.toFixed(0)}</strong><span>{gateCSimulation.withheld.toFixed(0)} sesi ditahan</span></article>
            <article><small>Rujukan diperkirakan</small><strong>{(gateCSimulation.referralRate * 100).toFixed(1).replace(".", ",")}%</strong><span>{(gateCSimulation.truePositive + gateCSimulation.falsePositive).toFixed(1)} dari yang dinilai</span></article>
            <article><small>PPV pada prevalensi ini</small><strong>{(gateCSimulation.positivePredictiveValue * 100).toFixed(1).replace(".", ",")}%</strong><span>Bukan PPV terobservasi</span></article>
            <article><small>Rujukan / true positive</small><strong>{Number.isFinite(gateCSimulation.referralsPerTruePositive) ? gateCSimulation.referralsPerTruePositive.toFixed(1).replace(".", ",") : "n/a"}</strong><span>Proyeksi beban layanan</span></article>
          </div>
          <div className={styles.simulationMatrix}>
            <span><b>TP {gateCSimulation.truePositive.toFixed(1)}</b><small>terjaring</small></span><span><b>FN {gateCSimulation.falseNegative.toFixed(1)}</b><small>terlewat</small></span><span><b>FP {gateCSimulation.falsePositive.toFixed(1)}</b><small>rujukan non-ASD</small></span><span><b>TN {gateCSimulation.trueNegative.toFixed(1)}</b><small>tidak dirujuk</small></span>
          </div>
          <div className={styles.predictionNote}><IconAlert size={17} /><div><strong>Interpretasi skenario saat ini</strong><p>Dengan {gateCSimulation.cohortSize.toLocaleString("id-ID")} anak, prevalensi {(gateCSimulation.prevalence * 100).toFixed(1).replace(".", ",")}%, dan cakupan {(gateCSimulation.technicalCoverage * 100).toFixed(0)}%, perhitungan memperkirakan {(gateCSimulation.referralRate * 100).toFixed(1).replace(".", ",")}% peserta yang dapat dinilai akan dirujuk. PPV diperkirakan {(gateCSimulation.positivePredictiveValue * 100).toFixed(1).replace(".", ",")}%, sehingga jumlah rujukan keliru perlu menjadi tolok ukur Gate C.</p><small>Angka desimal adalah nilai harapan matematis, bukan jumlah anak yang benar-benar diperiksa.</small></div></div>
        </section>
      </article>

      <article className={styles.gateDossier} id="gate-d-evidence" data-gate="D">
        <header className={styles.dossierHeader}><div><span className={styles.kicker}>Gate D · operasional dan kemudahan penggunaan</span><h3>Uji lapangan belum dilakukan</h3></div><span className={styles.principleStatus}>Terbuka</span></header>
        <div className={styles.dossierColumns}><section><h4>Bukti kelayakan prosedur</h4><p>Cilia dkk. menjalankan eye-tracking pada anak dengan posisi fleksibel sekitar 60 cm dari layar. Anak dapat duduk di kursi, di pangkuan orang tua, atau di kursi makan anak. Prosedurnya memakai instruksi minimal, kalibrasi lima titik, serta stimulus video dan foto. Carette dkk. juga melaporkan anak dapat menonton rangkaian stimulus sekitar lima menit dengan kalibrasi dan verifikasi.</p><div className={styles.safeClaim}><strong>Kesimpulan yang dapat dipertahankan</strong><p>D-R dinyatakan tertutup: protokol yang ramah anak, kalibrasi, dan stimulus memiliki dasar ilmiah. Neurogaze menambahkan pemeriksaan kualitas, kontrol jeda dan berhenti, pemrosesan lokal, serta penahanan hasil saat sinyal tidak valid.</p></div></section><section className={styles.criteriaBox}><h4>D-F masih membutuhkan lapangan</h4><ul><li>5 Posyandu</li><li>20 kader</li><li>200 sesi anak</li><li>3 jenis tablet Android</li><li>Tingkat penyelesaian dan durasi nyata</li><li>Pemahaman laporan dan penerimaan orang tua</li></ul><p><strong>Batas klaim:</strong> kedua artikel tidak menguji kader, kamera tablet, mode luring, atau alur rujukan Neurogaze. Karena itu, kemudahan penggunaan di lapangan belum dapat diklaim.</p></section></div>
        <div className={styles.predictionNote}><IconAlert size={17} /><div><strong>Kesimpulan Gate D</strong><p>Desain operasional Neurogaze memiliki dasar empiris: posisi anak, jarak layar, kalibrasi, stimulus naturalistik, dan instruksi minimal telah digunakan dalam studi eye-tracking anak. Uji lapangan Gate D akan menilai apakah prosedur itu dapat diterapkan oleh kader dengan perangkat dan alur layanan Posyandu.</p><small>Status formal tetap menunggu data operasional Posyandu.</small></div></div>
      </article>
    </section>

    <section className={styles.protocolNote}><IconAlert size={18} /><div><strong>Batas kesimpulan</strong><p>Gate A membuktikan kelayakan teknis dan Gate B membuktikan agreement terhadap WebGazer.js. Keduanya tidak membuktikan akurasi diagnosis ASD; klaim klinis tetap menunggu kohort balita dengan hasil klinis independen yang dinilai secara buta.</p></div></section>
  </main>;
}
