/**
 * The public evidence page at /validation.
 *
 * Prose that comes from the generated evidence artifact is translated in
 * `src/validation/publicEvidenceCopy.ts` instead — the artifact is regenerated
 * by a research script and must not be edited by hand. What lives here is the
 * page's own writing.
 */
export const id = {
  "validation.kicker": "Bukti validasi publik",
  "validation.status": "BUKTI HARI INI · KONTROL POSITIF DEWASA",
  "validation.heroLead":
    "{participants} dewasa memberi persetujuan; {recorded} sesi direkam dan {passed} lulus mutu.",
  "validation.heroWhy":
    "Aturan peragaan menyala pada {ordinaryFired}/{ordinaryUsable} sesi menonton biasa dan {producedFired}/{producedUsable} sesi pola diproduksi. Ini respons alat ukur, bukan hasil kesehatan peserta, dan tidak mengeluarkan rujukan.",
  "validation.sourceLabel": "Sumber angka",
  "validation.scaleCaption": "Denominator lengkap kontrol positif",
  "validation.ordinary": "Menonton biasa",
  "validation.produced": "Pola diproduksi",
  "validation.usableOf": "{usable}/{recorded} sesi dapat dipakai",

  "validation.definitionLead": "Rujukan otomatis balita masih ditahan.",
  "validation.definitionBody":
    "Klip lapangan 16,75 detik tidak mereplikasi protokol penuh tempat ambang 69% diterbitkan. Gate A/B menguji pengukuran teknis; validitas klinis Indonesia, keterpakaian kader, sensitivitas, dan spesifisitas belum diuji.",

  "validation.metricsAria": "Angka pendukung Gate B",
  "validation.mGateA": "Gate A",
  "validation.mGateANote":
    "sesi dewasa lulus mutu; {deg}° adalah konversi sudut lama tanpa jarak pandang",
  "validation.mPairRate": "Valid pair rate",
  "validation.mPairRateNote": "{ready} dari {total} pasangan; {withheld} ditahan",
  "validation.mError": "Galat antar aliran",
  "validation.mErrorNote": "{norm} lebar layar; p90 {p90} px",
  "validation.mAoi": "Kesepakatan AOI",
  "validation.mAoiNote": "Angka sekunder yang jenuh secara geometri, bukan ground truth",

  "validation.readinessHeading": "Matriks kesiapan",
  "validation.colCapability": "Kapabilitas",
  "validation.colStatus": "Status",
  "validation.colBoundary": "Batas",

  "validation.gapHeading": "Jarak terdekat antar kondisi",
  "validation.gapLede":
    "Ketiga ukuran terpisah tanpa tumpang tindih pada sesi yang dapat dihitung. Jarak terdekat ditampilkan karena AUC 1,00 hanya berarti tidak ada pasangan yang terurut salah.",
  "validation.colSignal": "Sinyal",
  "validation.colMedianOrdinary": "Median biasa",
  "validation.colMedianProduced": "Median diproduksi",
  "validation.colGap": "Jarak terdekat",

  "validation.aoiHeading": "Kenapa kesepakatan AOI tidak dipajang di depan",
  "validation.blandCaption": "Batas kesepakatan Bland-Altman, tiga dari {count} fitur",
  "validation.colFeature": "Fitur",
  "validation.colIcc": "ICC",
  "validation.colLimits": "Batas 95%",

  "validation.methodHeading": "Metode yang dapat diperiksa",
  "validation.mTitle": "Judul",
  "validation.mProtocol": "Protokol",
  "validation.mPopulation": "Populasi",
  "validation.mReference": "Referensi",
  "validation.mCoordinates": "Koordinat",
  "validation.mAcquisition": "Akuisisi",
  "validation.mPublished": "Dipublikasikan",

  "validation.modelHeading": "Pemodelan: yang diukur, dan yang ditolak",
  "validation.modelLede":
    "Lima angka, dua di antaranya sengaja tidak dipakai. Selengkapnya di research/hasil dan makalah.",
  "validation.model1Lead": "Regresi logistik Carette adalah bukti konsep domain sumber.",
  "validation.model1Body":
    "Data berasal dari 54 anak usia sekolah di Prancis pada eye-tracker 250 Hz, dipisah per partisipan tetapi tanpa uji eksternal. Model sengaja ditolak penjaga OOD pada sesi sekarang dan tidak punya jalur kode untuk memutuskan apa pun.",
  "validation.model2Lead":
    "CNN EfficientNetB0 pada citra yang sama — AUC 0,882, selisihnya tidak dapat dibedakan dari nol.",
  "validation.model2Body":
    "Bootstrap berpasangan atas 54 partisipan yang sama: ΔAUC +0,059, CI 95% −0,007 sampai +0,137, p = 0,087. Prediksi kedua model berkorelasi 0,93, jadi CNN menemukan sinyal yang sama, bukan sinyal tambahan. Alasan utama menolaknya tetap kontrak masukan: kanal warnanya membawa kecepatan, akselerasi, dan jerk dari eye-tracker 250 Hz.",
  "validation.model3Lead": "Degradasi raster — proxy sparsifikasi piksel, bukan resampling waktu.",
  "validation.model3Body":
    "Geometri 0,683 vs 19 fitur penuh 0,605 pada kondisi sasaran. Citra Carette tidak punya stempel waktu, jadi laju cuplik hanya dapat ditiru dengan menghapus piksel; berkasnya menyatakan batas itu sendiri.",
  "validation.model4Lead": "Degradasi temporal sungguhan — 27 sesi Gate B, desimasi waktu asli.",
  "validation.model4Body":
    "Median drift relatif saat laju turun dari 26 Hz ke 13 Hz adalah 69,4% untuk fitur kinematik dan 1,6% untuk fitur geometri. Ini bukan perbandingan akurasi klasifikasi. Beberapa fitur geometri tetap menunjukkan pelestarian peringkat yang lemah atau drift besar pada laju lebih rendah.",
  "validation.model5Lead":
    "CNN pada dataset wajah statis — AUC 0,932, angka tertinggi di proyek ini, dikarantina.",
  "validation.model5Body":
    "Enam dari enam metadata tata kelola tidak tersedia dan tidak ada ID partisipan, sehingga kebocoran identitas tidak dapat disingkirkan. Uji shortcut menunjukkan statistik piksel saja sudah mencapai 0,751 (permutasi p = 0,005). Bobotnya tidak ada di repositori.",
  "validation.modelLockTitle": "Tidak satu pun angka ini memutuskan rujukan",
  "validation.modelLockNote": "Validasi algoritmik pada anak usia sekolah · bukan balita",

  "validation.limitsHeading": "Apa yang hasil ini tidak buktikan",
  "validation.limitsLockTitle": "Akurasi klinis",
  "validation.limitsLockNote": "TIDAK TERSEDIA · menunggu Gate C",

  "validation.back": "Kembali ke Neurogaze",
  "validation.footerGates":
    "Gate A = akurasi terhadap target diketahui · Gate B = kesepakatan pengukuran · Gate C = validasi klinis",
} as const;

export const en: Record<keyof typeof id, string> = {
  "validation.kicker": "Public validation evidence",
  "validation.status": "TODAY'S EVIDENCE · ADULT POSITIVE CONTROL",
  "validation.heroLead":
    "{participants} adults gave consent; {recorded} sessions were recorded and {passed} passed quality.",
  "validation.heroWhy":
    "The demonstration rule fired on {ordinaryFired}/{ordinaryUsable} ordinary-viewing sessions and {producedFired}/{producedUsable} produced-pattern sessions. This is the measuring instrument's response, not a health outcome for the participants, and it issues no referral.",
  "validation.sourceLabel": "Source of these numbers",
  "validation.scaleCaption": "The full positive-control denominator",
  "validation.ordinary": "Ordinary viewing",
  "validation.produced": "Produced pattern",
  "validation.usableOf": "{usable}/{recorded} sessions usable",

  "validation.definitionLead": "Automatic toddler referral is still withheld.",
  "validation.definitionBody":
    "The 16.75-second field clip does not replicate the full protocol under which the 69% threshold was published. Gate A/B test technical measurement; Indonesian clinical validity, usability by kader, sensitivity, and specificity have not been tested.",

  "validation.metricsAria": "Supporting Gate B figures",
  "validation.mGateA": "Gate A",
  "validation.mGateANote":
    "adult sessions passed quality; {deg}° is a legacy angular conversion without a viewing distance",
  "validation.mPairRate": "Valid pair rate",
  "validation.mPairRateNote": "{ready} of {total} pairs; {withheld} withheld",
  "validation.mError": "Between-stream error",
  "validation.mErrorNote": "{norm} of screen width; p90 {p90} px",
  "validation.mAoi": "AOI agreement",
  "validation.mAoiNote": "A secondary, geometrically saturated figure — not ground truth",

  "validation.readinessHeading": "Readiness matrix",
  "validation.colCapability": "Capability",
  "validation.colStatus": "Status",
  "validation.colBoundary": "Limit",

  "validation.gapHeading": "Closest distance between the conditions",
  "validation.gapLede":
    "All three measures separate without overlap on the countable sessions. The closest distance is shown because an AUC of 1.00 only means no pair is out of order.",
  "validation.colSignal": "Signal",
  "validation.colMedianOrdinary": "Ordinary median",
  "validation.colMedianProduced": "Produced median",
  "validation.colGap": "Closest distance",

  "validation.aoiHeading": "Why AOI agreement is not the headline",
  "validation.blandCaption": "Bland-Altman limits of agreement, three of {count} features",
  "validation.colFeature": "Feature",
  "validation.colIcc": "ICC",
  "validation.colLimits": "95% limits",

  "validation.methodHeading": "Method, open to inspection",
  "validation.mTitle": "Title",
  "validation.mProtocol": "Protocol",
  "validation.mPopulation": "Population",
  "validation.mReference": "Reference",
  "validation.mCoordinates": "Coordinates",
  "validation.mAcquisition": "Acquisition",
  "validation.mPublished": "Published",

  "validation.modelHeading": "Modelling: what was measured, and what was rejected",
  "validation.modelLede":
    "Five numbers, two of them deliberately unused. The full account is in research/hasil and the paper.",
  "validation.model1Lead": "The Carette logistic regression is a source-domain proof of concept.",
  "validation.model1Body":
    "The data comes from 54 school-age children in France on a 250 Hz eye-tracker, split per participant but with no external test. The model is deliberately rejected by the OOD guard on current sessions and has no code path to decide anything.",
  "validation.model2Lead":
    "An EfficientNetB0 CNN on the same images — AUC 0.882, and the difference is indistinguishable from zero.",
  "validation.model2Body":
    "A paired bootstrap over the same 54 participants: ΔAUC +0.059, 95% CI −0.007 to +0.137, p = 0.087. The two models' predictions correlate at 0.93, so the CNN finds the same signal, not an additional one. The main reason for rejecting it remains the input contract: its colour channels carry velocity, acceleration, and jerk from a 250 Hz eye-tracker.",
  "validation.model3Lead":
    "Raster degradation — a pixel-sparsification proxy, not temporal resampling.",
  "validation.model3Body":
    "Geometry 0.683 against the full 19 features at 0.605 in the target condition. The Carette images carry no timestamps, so a sample rate can only be imitated by removing pixels; the file states that limit itself.",
  "validation.model4Lead":
    "Genuine temporal degradation — 27 Gate B sessions, decimated in real time.",
  "validation.model4Body":
    "Median relative drift as the rate falls from 26 Hz to 13 Hz is 69.4% for kinematic features and 1.6% for geometry features. This is not a classification-accuracy comparison. Some geometry features still show weak rank preservation or large drift at lower rates.",
  "validation.model5Lead":
    "A CNN on a static face dataset — AUC 0.932, the highest number in this project, quarantined.",
  "validation.model5Body":
    "Six of six governance metadata items were unavailable and there were no participant IDs, so identity leakage cannot be ruled out. A shortcut test showed pixel statistics alone already reached 0.751 (permutation p = 0.005). Its weights are not in the repository.",
  "validation.modelLockTitle": "Not one of these numbers decides a referral",
  "validation.modelLockNote": "Algorithmic validation on school-age children · not toddlers",

  "validation.limitsHeading": "What these results do not establish",
  "validation.limitsLockTitle": "Clinical accuracy",
  "validation.limitsLockNote": "NOT AVAILABLE · awaiting Gate C",

  "validation.back": "Back to Neurogaze",
  "validation.footerGates":
    "Gate A = accuracy against a known target · Gate B = measurement agreement · Gate C = clinical validation",
};
