const PptxGenJS = require("pptxgenjs");

// ── Palette, taken from app/app/tokens.css so the deck and the product read
//    as one thing rather than two. Ink and paper dominate; teal is the only
//    sharp colour; coral and amber appear only where they mean something.
const INK = "0B1E1B";
const INK_2 = "14302B";
const PAPER = "F7F9F8";
const WHITE = "FFFFFF";
const TEAL = "0D8271";
const TEAL_LT = "5CB9A3";
const TEAL_WASH = "E4F2EE";
const CORAL = "B1442C";
const CORAL_WASH = "FBEAE5";
const AMBER = "A67413";
const MUTED = "4A635D";
const MUTED_DK = "8CAEA5";
const LINE = "DBE4E1";

const H = "Cambria";
const B = "Calibri";

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "Neurogaze";
pres.title = "Neurogaze — Datathon RISTEK Fasilkom UI 2026";

const W = 13.333;
const M = 0.75; // page margin
const CW = W - M * 2; // content width

/** The product's own brand mark: a ring with a filled centre. Repeated on
 *  every slide as the deck's motif. */
function mark(slide, x, y, color, size = 0.26) {
  slide.addShape(pres.ShapeType.ellipse, {
    x, y, w: size, h: size,
    fill: { type: "solid", color: "FFFFFF", transparency: 100 },
    line: { color, width: 2 },
  });
  slide.addShape(pres.ShapeType.ellipse, {
    x: x + size * 0.3, y: y + size * 0.3, w: size * 0.4, h: size * 0.4,
    fill: { color },
    line: { width: 0 },
  });
}

function darkSlide() {
  const s = pres.addSlide();
  s.background = { color: INK };
  return s;
}

function lightSlide(title, kicker) {
  const s = pres.addSlide();
  s.background = { color: PAPER };
  mark(s, W - M - 0.26, M + 0.06, TEAL_LT);
  if (kicker) {
    s.addText(kicker, {
      x: M, y: M, w: CW - 0.6, h: 0.28, margin: 0,
      fontFace: B, fontSize: 12, bold: true, color: TEAL, charSpacing: 1.2,
    });
  }
  if (title) {
    s.addText(title, {
      x: M, y: kicker ? M + 0.34 : M, w: CW - 0.6, h: 0.9, margin: 0,
      fontFace: H, fontSize: 32, bold: true, color: INK, lineSpacing: 36,
    });
  }
  return s;
}

/** Big number + label, the deck's one repeated data device. */
function stat(slide, { x, y, w, value, label, note, color = INK, size = 60 }) {
  slide.addText(value, {
    x, y, w, h: size / 62, margin: 0,
    fontFace: H, fontSize: size, bold: true, color, lineSpacing: size,
  });
  slide.addText(label, {
    x, y: y + size / 62 + 0.06, w, h: 0.3, margin: 0,
    fontFace: B, fontSize: 14, bold: true, color: INK_2,
  });
  if (note) {
    slide.addText(note, {
      x, y: y + size / 62 + 0.4, w, h: 0.7, margin: 0,
      fontFace: B, fontSize: 12, color: MUTED, lineSpacing: 15,
    });
  }
}

/** Card with a tinted ground. No edge stripes. */
function card(slide, { x, y, w, h, fill = WHITE, line = LINE }) {
  slide.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.06,
    fill: { color: fill },
    line: { color: line, width: 1 },
  });
}

// ═══════════════════════════════════════════════════════ 1 · Judul
{
  const s = darkSlide();
  mark(s, M, 1.5, TEAL_LT, 0.4);
  s.addText("Neurogaze", {
    x: M, y: 2.05, w: CW, h: 1.0, margin: 0,
    fontFace: H, fontSize: 60, bold: true, color: WHITE,
  });
  s.addText("Pengukuran atensi objektif di Posyandu, di tablet yang sudah ada, tanpa jaringan.", {
    x: M, y: 3.1, w: 9.4, h: 0.5, margin: 0,
    fontFace: B, fontSize: 20, color: TEAL_LT,
  });
  s.addText(
    "Yang baru di sini bukan cara mengukur tatapan — itu sudah dipecahkan Nature Medicine.\nYang baru adalah arsitektur yang membuat alat ukur itu boleh dipegang relawan Posyandu\ntanpa mengarang satu angka pun.",
    {
      x: M, y: 4.0, w: 9.8, h: 1.2, margin: 0,
      fontFace: H, fontSize: 16, italic: true, color: "9EBDB4", lineSpacing: 26,
    },
  );
  s.addText("Datathon RISTEK Fasilkom UI 2026  ·  University Track  ·  Semifinal", {
    x: M, y: 6.5, w: CW, h: 0.3, margin: 0,
    fontFace: B, fontSize: 12, color: MUTED_DK, charSpacing: 0.6,
  });
  s.addNotes("Tesis dibacakan apa adanya. Jangan menambah kalimat pembuka.");
}

// ═══════════════════════════════════════════════════════ 2 · Masalah
{
  const s = lightSlide("32 bulan antara “saya khawatir” dan “ini namanya apa”", "Masalah");
  stat(s, {
    x: M, y: 2.5, w: 3.4, value: "56", size: 90,
    label: "bulan", note: "Usia rata-rata diagnosis ASD di Indonesia.",
  });
  stat(s, {
    x: M + 3.9, y: 2.5, w: 3.4, value: "32", size: 90, color: CORAL,
    label: "bulan jeda", note: "Sejak orang tua pertama kali merasa ada yang berbeda.",
  });
  card(s, { x: M + 7.8, y: 2.45, w: 4.0, h: 2.5, fill: TEAL_WASH, line: TEAL_WASH });
  s.addText("Masalahnya bukan orang tua yang tidak sadar.", {
    x: M + 8.1, y: 2.75, w: 3.4, h: 0.7, margin: 0,
    fontFace: H, fontSize: 17, bold: true, color: INK, lineSpacing: 22,
  });
  s.addText(
    "Di jarak 32 bulan itu tidak ada satu pun titik yang menghasilkan pengukuran objektif. Yang ada hanya laporan manusia — dan laporan manusia tidak bisa diserahkan.",
    {
      x: M + 8.1, y: 3.5, w: 3.4, h: 1.3, margin: 0,
      fontFace: B, fontSize: 13, color: INK_2, lineSpacing: 18,
    },
  );
  s.addText("Autisme paling responsif terhadap intervensi sebelum usia tiga tahun.", {
    x: M, y: 5.6, w: 7.3, h: 0.4, margin: 0,
    fontFace: B, fontSize: 14, bold: true, color: INK_2,
  });
  s.addNotes("0:40. Dua angka saja. Jangan menambahkan statistik prevalensi.");
}

// ═══════════════════════════════════════════════════════ 3 · Celah
{
  const s = lightSlide("Yang tidak ada di antara keduanya", "Kenapa alat yang ada gagal di Posyandu");
  const cols = [
    {
      t: "Ceklis",
      sub: "M-CHAT · KPSP · SDIDTK",
      pts: ["Murah dan bisa disebar", "Bergantung laporan manusia", "Spesifisitas rendah"],
      fill: WHITE, accent: MUTED,
    },
    {
      t: "EarliPoint",
      sub: "Izin FDA 510(k), 2022",
      pts: ["Objektif dan tervalidasi", "USD 599 per pemeriksaan", "Eye-tracker khusus, di klinik"],
      fill: WHITE, accent: MUTED,
    },
    {
      t: "Celah",
      sub: "Belum ada yang mengisinya",
      pts: ["Objektif", "Dijalankan kader, bukan klinisi", "Tablet Android biasa, luring"],
      fill: TEAL_WASH, accent: TEAL,
    },
  ];
  cols.forEach((c, i) => {
    const x = M + i * 4.08;
    card(s, { x, y: 2.35, w: 3.78, h: 3.3, fill: c.fill, line: c.fill === WHITE ? LINE : TEAL_WASH });
    s.addText(c.t, {
      x: x + 0.32, y: 2.62, w: 3.14, h: 0.45, margin: 0,
      fontFace: H, fontSize: 24, bold: true, color: c.fill === WHITE ? INK : TEAL,
    });
    s.addText(c.sub, {
      x: x + 0.32, y: 3.08, w: 3.14, h: 0.3, margin: 0,
      fontFace: B, fontSize: 11.5, color: c.accent, bold: true,
    });
    s.addText(
      c.pts.map((p, j) => ({ text: p, options: { bullet: true, breakLine: j !== c.pts.length - 1 } })),
      {
        x: x + 0.32, y: 3.55, w: 3.14, h: 1.7, margin: 0,
        fontFace: B, fontSize: 13, color: INK_2, lineSpacing: 18, paraSpaceAfter: 8,
      },
    );
  });
  s.addNotes("0:25. Kategori barumu didefinisikan di sini, bukan di bagian arsitektur.");
}

// ═══════════════════════════════════════════════════════ 4 · Demo
{
  const s = darkSlide();
  mark(s, M, 1.35, TEAL_LT, 0.34);
  s.addText("Demonstrasi", {
    x: M, y: 1.9, w: CW, h: 0.6, margin: 0,
    fontFace: B, fontSize: 14, bold: true, color: TEAL_LT, charSpacing: 1.6,
  });
  s.addText("Bagaimana kalau alat ini cuma merujuk semua orang?", {
    x: M, y: 2.45, w: 10.6, h: 1.4, margin: 0,
    fontFace: H, fontSize: 40, bold: true, color: WHITE, lineSpacing: 46,
  });
  s.addText(
    "Alat yang selalu bilang “periksa lebih lanjut” akan lolos demo mana pun tanpa mengukur apa pun.\nJadi saya butuh satu orang dari ruangan ini. Tidak ada briefing, tidak ada instruksi.",
    {
      x: M, y: 4.1, w: 10.2, h: 1.0, margin: 0,
      fontFace: B, fontSize: 17, color: "B7D2CA", lineSpacing: 27,
    },
  );
  s.addText("Sesi kamera langsung  ·  67 detik  ·  pipeline yang sama persis", {
    x: M, y: 6.4, w: CW, h: 0.34, margin: 0,
    fontFace: B, fontSize: 13, bold: true, color: TEAL_LT,
  });
  s.addNotes(
    "1:45 total untuk dua demo. Ucapkan keberatannya sendiri SEBELUM juri memikirkannya — itu gerakan berbiaya nol dengan imbalan terbesar di seluruh pitch. Jangan pilih rekan satu tim sebagai relawan. Selama 67 detik berjalan: diam.",
  );
}

// ═══════════════════════════════════════════════════════ 5 · Kontrol positif
{
  const s = lightSlide("Instrumennya merespons — dan menahan diri", "Kontrol positif · 19 Agustus 2026");

  card(s, { x: M, y: 2.3, w: 3.5, h: 3.4, fill: TEAL_WASH, line: TEAL_WASH });
  stat(s, {
    x: M + 0.32, y: 2.6, w: 2.9, value: "0 / 9", size: 46, color: TEAL,
    label: "sesi menonton biasa",
    note: "Aturan komposit tidak menyala pada satu pun orang yang sekadar menonton.",
  });
  s.addText("Menyala 4 dari 6 sesi pola diproduksi yang dapat dipakai.", {
    x: M + 0.32, y: 4.62, w: 2.9, h: 0.5, margin: 0,
    fontFace: B, fontSize: 12, color: MUTED, lineSpacing: 16,
  });
  // Denominator lengkap, bukan hanya yang lulus mutu: separuh sesi pola
  // diproduksi gugur di gerbang mutu, dan angka itu bagian dari hasilnya.
  s.addText("12 peserta · 23 sesi direkam · 15 lulus mutu · 3 perangkat\nDapat dipakai: 9 dari 11 biasa, 6 dari 12 pola diproduksi", {
    x: M + 0.32, y: 5.15, w: 2.9, h: 0.75, margin: 0,
    fontFace: B, fontSize: 10.5, bold: true, color: INK_2, lineSpacing: 14,
  });

  const rows = [
    [{ text: "Sinyal", options: { bold: true } }, { text: "Menonton biasa", options: { bold: true } }, { text: "Pola diproduksi", options: { bold: true } }, { text: "Jarak terdekat", options: { bold: true } }],
    ["Preferensi geometrik", "0,34", "0,94", "+0,16"],
    ["Percobaan masuk target", "8 dari 8", "0 dari 8", "4 percobaan"],
    ["Sebaran tatapan isyarat", "0,31", "0,05", "+0,008"],
  ];
  s.addTable(rows, {
    x: M + 3.9, y: 2.5, w: 7.9,
    colW: [2.8, 1.75, 1.75, 1.6],
    fontFace: B, fontSize: 13, color: INK_2,
    border: { type: "solid", color: LINE, pt: 1 },
    fill: { color: WHITE },
    rowH: 0.44, valign: "middle",
    margin: 0.09,
  });
  s.addText(
    "Kolom yang penting adalah jarak terdekat, bukan AUC. Ketiganya ber-AUC 1,00 — tetapi itu hanya berarti tidak ada pasangan yang tertukar urutannya. Sesi biasa tertinggi ada di 0,73; sesi produksi terendah di 0,89.",
    {
      x: M + 3.9, y: 4.55, w: 7.9, h: 0.8, margin: 0,
      fontFace: B, fontSize: 12.5, color: MUTED, lineSpacing: 17,
    },
  );
  card(s, { x: M + 3.9, y: 5.45, w: 7.9, h: 0.72, fill: CORAL_WASH, line: CORAL_WASH });
  s.addText(
    "Yang ini tidak membuktikan apa pun tentang autisme. Pesertanya orang dewasa yang mengikuti naskah — tidak ada sensitivitas, spesifisitas, atau akurasi di dalamnya.",
    {
      x: M + 4.15, y: 5.6, w: 7.4, h: 0.45, margin: 0,
      fontFace: B, fontSize: 12.5, bold: true, color: CORAL, lineSpacing: 16,
    },
  );
  s.addNotes("0:35. Jual angka 0 dari 9 dan kolom jarak terdekat. Jangan menjual AUC 1,00.");
}

// ═══════════════════════════════════════════════════════ 6 · Arsitektur
{
  const s = darkSlide();
  mark(s, W - M - 0.26, M + 0.06, TEAL_LT);
  s.addText("Arsitektur inferensi bergerbang", {
    x: M, y: M, w: CW - 0.6, h: 0.3, margin: 0,
    fontFace: B, fontSize: 12, bold: true, color: TEAL_LT, charSpacing: 1.2,
  });
  s.addText("Kami tidak membangun satu model yang menebak autisme.", {
    x: M, y: M + 0.38, w: 11.2, h: 0.55, margin: 0,
    fontFace: H, fontSize: 30, bold: true, color: WHITE,
  });
  s.addText(
    "Kami membangun sistem yang menjalankan modelnya di perangkat, lalu memutuskan sendiri apakah keluaran model itu layak dibaca untuk anak yang sedang duduk di depannya.",
    {
      x: M, y: 1.6, w: 11.0, h: 0.7, margin: 0,
      fontFace: B, fontSize: 16, color: "A8C6BD", lineSpacing: 23,
    },
  );

  // Labelled by when each one acts, not numbered 01–04: these are four
  // components that fire at different times, not four steps in a sequence.
  const boxes = [
    { n: "Saat merancang fitur", t: "Dipilih dengan pengukuran", d: "27 sesi didesimasi ke separuh laju kamera. Kinematik bergeser 69%, geometri 1,6%." },
    { n: "Saat memilih model", t: "Menjatuhkan model sendiri", d: "CNN 0,882 vs regresi 0,823. Bootstrap berpasangan: p = 0,087, korelasi 0,93." },
    { n: "Saat sesi berjalan", t: "Penjaga menolak di perangkat", d: "Model dijalankan tiap sesi. Penjaga menahan keluarannya dan menyebut fiturnya." },
    { n: "Saat dikompilasi", t: "Tata kelola dijaga type checker", d: "combinedScore bernilai null. Penggabungan lajur tidak dapat dikompilasi." },
  ];
  boxes.forEach((b, i) => {
    const x = M + i * 3.06;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 2.75, w: 2.82, h: 2.85, rectRadius: 0.06,
      fill: { color: INK_2 }, line: { color: "1E463D", width: 1 },
    });
    s.addText(b.n, {
      x: x + 0.26, y: 3.0, w: 2.3, h: 0.34, margin: 0,
      fontFace: B, fontSize: 11.5, bold: true, color: TEAL_LT,
    });
    s.addText(b.t, {
      x: x + 0.26, y: 3.42, w: 2.3, h: 1.0, margin: 0,
      fontFace: H, fontSize: 15.5, bold: true, color: WHITE, lineSpacing: 20,
    });
    s.addText(b.d, {
      x: x + 0.26, y: 4.5, w: 2.3, h: 0.95, margin: 0,
      fontFace: B, fontSize: 11.5, color: "9EBDB4", lineSpacing: 16,
    });
  });

  s.addText(
    "Hampir semua ML yang dikerahkan ke lapangan mengandaikan data masuk mirip data latihnya. Ketika andaian itu salah, modelnya tetap mengeluarkan angka — dan tidak memberi tahu siapa pun.",
    {
      x: M, y: 5.95, w: 11.4, h: 0.6, margin: 0,
      fontFace: H, fontSize: 14, italic: true, color: MUTED_DK, lineSpacing: 20,
    },
  );
  s.addNotes("0:45. Ini bagian yang menutup lubang terbesar di rubrik (AI Implementation, 10%).");
}

// ═══════════════════════════════════════════════════════ 7 · Degradasi
{
  const s = lightSlide("Kami tidak menebak fitur mana yang bertahan — kami mengukurnya", "Temuan orisinal · degradasi temporal");

  s.addChart(
    pres.ChartType.bar,
    [{ name: "Pergeseran median", labels: ["Fitur kinematik", "Fitur geometri"], values: [69.4, 1.6] }],
    {
      x: M, y: 2.4, w: 7.5, h: 3.2,
      barDir: "bar",
      chartColors: [CORAL, TEAL],
      varyColors: true,
      showValue: true,
      dataLabelPosition: "outEnd",
      dataLabelFormatCode: '0.0"%"',
      dataLabelFontFace: B,
      dataLabelFontSize: 14,
      dataLabelColor: INK,
      showLegend: false,
      showTitle: true,
      title: "Pergeseran fitur ketika laju kamera turun 26 Hz → 13 Hz",
      titleFontFace: B,
      titleFontSize: 13,
      titleColor: MUTED,
      catAxisLabelFontFace: B,
      catAxisLabelFontSize: 13,
      catAxisLabelColor: INK_2,
      valAxisLabelFontFace: B,
      valAxisLabelFontSize: 11,
      valAxisLabelColor: MUTED,
      valAxisMaxVal: 80,
      valGridLine: { color: LINE, size: 1 },
      catGridLine: { style: "none" },
    },
  );

  card(s, { x: M + 7.9, y: 2.4, w: 3.9, h: 3.2, fill: TEAL_WASH, line: TEAL_WASH });
  stat(s, {
    x: M + 8.2, y: 2.7, w: 3.3, value: "42×", size: 54, color: TEAL,
    // Rasio drift fitur (69,4% : 1,6%), bukan rasio akurasi klasifier.
    // Labelnya harus menyebut itu, karena angka sebesar ini di slide
    // gampang terbaca sebagai "42× lebih akurat".
    label: "selisih drift fitur, bukan akurasi",
    note: "Median drift relatif di bawah desimasi waktu: 69,4% untuk fitur kinematik, 1,6% untuk fitur yang dipakai. Kamera Posyandu berjalan 26 fps dan sering lebih lambat.",
  });
  s.addText("27 sesi berpasangan Gate B, aliran (x, y, t) nyata", {
    x: M + 8.2, y: 5.0, w: 3.3, h: 0.4, margin: 0,
    fontFace: B, fontSize: 11, bold: true, color: INK_2, lineSpacing: 15,
  });
  s.addText("Sumber: research/hasil/degradasi_temporal.json", {
    x: M, y: 5.78, w: 7.5, h: 0.3, margin: 0,
    fontFace: B, fontSize: 11, color: MUTED,
  });
  s.addNotes("Lambatkan di sini. Ini satu-satunya temuan terukur milik sendiri di seluruh proyek — semua angka lain milik studi orang lain.");
}

// ═══════════════════════════════════════════════════════ 8 · Penjaga
{
  const s = lightSlide("Modelnya jalan. Penjaganya menolak. Di depan kalian.", "Penjaga out-of-distribution");

  card(s, { x: M, y: 2.4, w: 6.3, h: 2.5, fill: INK, line: INK });
  s.addText("PUTUSAN PENJAGA", {
    x: M + 0.4, y: 2.72, w: 5.5, h: 0.3, margin: 0,
    fontFace: B, fontSize: 11.5, bold: true, color: MUTED_DK, charSpacing: 1.2,
  });
  s.addText("Ditolak", {
    x: M + 0.4, y: 3.05, w: 3.0, h: 0.6, margin: 0,
    fontFace: H, fontSize: 34, bold: true, color: "F0A189",
  });
  s.addText("3 fitur ditandai  ·  cakupan 100%", {
    x: M + 0.4, y: 3.7, w: 5.5, h: 0.3, margin: 0,
    fontFace: B, fontSize: 13, color: "B7D2CA",
  });
  s.addText("Jarak terjauh 9,1 z  ·  Mahalanobis 87,9  ·  keluaran model ditahan", {
    x: M + 0.4, y: 4.12, w: 5.5, h: 0.5, margin: 0,
    fontFace: B, fontSize: 12.5, color: TEAL_LT, lineSpacing: 17,
  });

  s.addText(
    "Ini bukan tangkapan layar yang kami siapkan. Ini yang aplikasi cetak setiap sesi.",
    {
      x: M + 6.9, y: 2.5, w: 4.9, h: 0.7, margin: 0,
      fontFace: H, fontSize: 19, bold: true, color: INK, lineSpacing: 25,
    },
  );
  s.addText(
    [
      { text: "Regresi logistik 13 fitur dikirim ke tablet dan dijalankan setiap sesi.", options: { bullet: true, breakLine: true } },
      { text: "Penjaga memutuskan apakah keluarannya boleh dibaca — dan di sini ia menolak.", options: { bullet: true, breakLine: true } },
      { text: "Ia menyebut fitur mana yang di luar distribusi, beserta jaraknya.", options: { bullet: true, breakLine: false } },
    ],
    {
      x: M + 6.9, y: 3.35, w: 4.9, h: 1.6, margin: 0,
      fontFace: B, fontSize: 13.5, color: INK_2, lineSpacing: 19, paraSpaceAfter: 9,
    },
  );
  s.addText(
    "Kami tidak menyembunyikan model yang tidak layak. Kami menjalankannya di depan kalian dan menunjukkan sistem menangkapnya.",
    {
      x: M, y: 5.25, w: 11.4, h: 0.6, margin: 0,
      fontFace: H, fontSize: 16, italic: true, color: TEAL, lineSpacing: 22,
    },
  );
  s.addNotes("Tunjuk panel riset di laporan yang masih terbuka dari bagian demo.");
}

// ═══════════════════════════════════════════════════════ 9 · Batas
{
  const s = lightSlide("Kami memilih titik kerja yang menemukan paling sedikit", "Kenapa punya batas");

  const rows = [
    [
      { text: "Titik kerja", options: { bold: true } },
      { text: "Sens", options: { bold: true } },
      { text: "Spec", options: { bold: true } },
      { text: "Laju rujukan", options: { bold: true } },
      { text: "Rujukan per 1 kasus", options: { bold: true } },
    ],
    ["Regresi logistik, sensitivitas 0,9", "0,923", "0,179", "82,2%", "89,1"],
    ["Regresi logistik, Youden", "0,731", "0,821", "18,4%", "25,2"],
    [
      { text: "GeoPref 69% — yang dipakai", options: { bold: true, color: TEAL } },
      { text: "0,170", options: { bold: true, color: TEAL } },
      { text: "0,980", options: { bold: true, color: TEAL } },
      { text: "2,2%", options: { bold: true, color: TEAL } },
      { text: "12,6", options: { bold: true, color: TEAL } },
    ],
    ["Target Gate C (preseden tablet)", "0,878", "0,808", "19,9%", "22,6"],
  ];
  s.addTable(rows, {
    x: M, y: 2.4, w: 11.4,
    colW: [4.0, 1.5, 1.5, 2.1, 2.3],
    fontFace: B, fontSize: 13, color: INK_2,
    border: { type: "solid", color: LINE, pt: 1 },
    fill: { color: WHITE },
    rowH: 0.44, valign: "middle", margin: 0.09,
  });
  s.addText(
    "Kohort 1.000 anak, prevalensi 1%. Baris teratas paling menggoda dipamerkan — sensitivitas 92 persen — dan ia merujuk 740 dari 1.000 anak. Puskesmas mana pun berhenti memakainya di minggu kedua.",
    {
      x: M, y: 5.05, w: 7.4, h: 0.9, margin: 0,
      fontFace: B, fontSize: 13.5, color: INK_2, lineSpacing: 19,
    },
  );
  card(s, { x: M + 7.7, y: 5.0, w: 3.7, h: 1.05, fill: TEAL_WASH, line: TEAL_WASH });
  s.addText(
    "Kami memilihnya bukan karena angkanya paling bagus, tapi karena itu satu-satunya yang muat di kapasitas rujukan yang benar-benar ada.",
    {
      x: M + 7.95, y: 5.16, w: 3.2, h: 0.8, margin: 0,
      fontFace: B, fontSize: 12, bold: true, color: TEAL, lineSpacing: 16,
    },
  );
  s.addNotes("0:45 bersama momen integritas. Sensitivitas 17% bukan bug — itu bentuk alatnya. Rule-in.");
}

// ═══════════════════════════════════════════════════════ 10 · Integritas
{
  const s = lightSlide("Angka tertinggi di proyek ini, dan kami buang", "Momen integritas");
  stat(s, {
    x: M, y: 2.55, w: 4.2, value: "0,932", size: 76, color: CORAL,
    label: "AUC · CNN dataset wajah",
    note: "Bobotnya tidak ada di repositori.",
  });
  s.addText(
    [
      { text: "Enam dari enam metadata tata kelola tidak tersedia.", options: { bullet: true, breakLine: true } },
      { text: "Tidak ada ID partisipan, jadi kebocoran identitas tidak bisa disingkirkan.", options: { bullet: true, breakLine: true } },
      { text: "Uji shortcut kami: statistik piksel saja sudah mencapai AUC 0,751, permutasi p = 0,005.", options: { bullet: true, breakLine: false } },
    ],
    {
      x: M + 4.8, y: 2.7, w: 7.0, h: 1.7, margin: 0,
      fontFace: B, fontSize: 14.5, color: INK_2, lineSpacing: 21, paraSpaceAfter: 10,
    },
  );
  card(s, { x: M, y: 4.85, w: 11.4, h: 1.15, fill: INK, line: INK });
  s.addText(
    "Tim yang mengoreksi angkanya sendiri lebih layak dipercaya daripada tim yang angkanya selalu bagus.",
    {
      x: M + 0.45, y: 5.16, w: 10.5, h: 0.6, margin: 0,
      fontFace: H, fontSize: 21, italic: true, bold: true, color: WHITE, lineSpacing: 27,
    },
  );
  s.addNotes("SATU cerita integritas, bukan dua. Cerita kedua memindahkan waktu dari kolom rubrik yang bobotnya lebih besar.");
}

// ═══════════════════════════════════════════════════════ 11 · Biaya
{
  const s = lightSlide("Ambil metrik yang paling keras terhadap kami", "Dampak dan biaya");
  // Angka per-kasus dibagi 1,53 kasus, dan 1,53 berasal dari titik operasi
  // 69% yang justru sedang ditahan. Jadi ini skenario perencanaan, bukan
  // performa yang sudah terukur, dan slide-nya harus mengatakan begitu.
  s.addText(
    "Skenario, bukan hasil terukur: angka per kasus ini berlaku hanya bila titik operasi protokol penuh berhasil direplikasi pada balita Indonesia. Hari ini titik itu ditahan.",
    {
      x: M, y: 2.3, w: 11.4, h: 0.55, margin: 0,
      fontFace: B, fontSize: 15, bold: true, color: CORAL, lineSpacing: 21,
    },
  );

  const items = [
    { v: "Rp 9,08 jt", l: "Neurogaze · 1 Posyandu", n: "1.000 sesi × Rp 13.900 ÷ 1,53 kasus", c: INK },
    { v: "Rp 2,29 jt", l: "Neurogaze · dirotasi 4 Posyandu", n: "1.000 sesi × Rp 3.500 ÷ 1,53 kasus", c: TEAL },
    { v: "Rp 9,70 jt", l: "EarliPoint · satu pemeriksaan", n: "Satu anak, sekali periksa, di klinik", c: CORAL },
  ];
  items.forEach((it, i) => {
    const x = M + i * 3.85;
    card(s, { x, y: 3.05, w: 3.55, h: 2.15, fill: i === 1 ? TEAL_WASH : WHITE, line: i === 1 ? TEAL_WASH : LINE });
    s.addText(it.v, {
      x: x + 0.3, y: 3.32, w: 2.95, h: 0.6, margin: 0,
      fontFace: H, fontSize: 32, bold: true, color: it.c,
    });
    s.addText(it.l, {
      x: x + 0.3, y: 3.98, w: 2.95, h: 0.5, margin: 0,
      fontFace: B, fontSize: 13, bold: true, color: INK_2, lineSpacing: 17,
    });
    s.addText(it.n, {
      x: x + 0.3, y: 4.5, w: 2.95, h: 0.55, margin: 0,
      fontFace: B, fontSize: 11, color: MUTED, lineSpacing: 15,
    });
  });

  s.addText(
    "Bila titik operasinya terreplikasi, menemukan satu kasus harganya kira-kira sekali pemeriksaan EarliPoint — seperempatnya bila satu tablet dirotasi ke empat Posyandu.",
    {
      x: M, y: 5.45, w: 11.4, h: 0.7, margin: 0,
      fontFace: H, fontSize: 17, bold: true, color: INK, lineSpacing: 24,
    },
  );
  s.addText("Yang belum terukur: waktu kader, pelatihan, dukungan, cetak, dudukan, pengulangan sesi, pemeliharaan, penggantian perangkat, dan tindak lanjut klinis.", {
    x: M, y: 6.18, w: 11.4, h: 0.3, margin: 0,
    fontFace: B, fontSize: 10.5, bold: true, color: INK_2,
  });
  s.addText("Asumsi dinyatakan di docs/dampak_dan_adopsi.md · kohort 1.000, prevalensi 1%, cakupan teknis 90%", {
    x: M, y: 6.5, w: 11.4, h: 0.3, margin: 0,
    fontFace: B, fontSize: 10.5, color: MUTED,
  });
  s.addNotes("1:10. Bobot terbesar di rubrik. Sebut sendiri bahwa ini skenario bersyarat, lalu sebut biaya operasi yang belum terukur — sebelum juri menghitungnya.");
}

// ═══════════════════════════════════════════════════════ 12 · Adopsi
{
  const s = lightSlide("Penyebarannya adalah mesin pengumpul datanya sendiri", "Jalur adopsi");
  s.addText(
    "Alat ini tidak menggantikan apa pun. Ia menempel: sesi 67 detik sesudah penimbangan bulanan, laporan satu halaman diserahkan ke Puskesmas, dibaca berdampingan dengan SDIDTK.",
    {
      x: M, y: 2.3, w: 11.4, h: 0.6, margin: 0,
      fontFace: B, fontSize: 15, color: INK_2, lineSpacing: 21,
    },
  );
  stat(s, {
    x: M, y: 3.2, w: 3.6, value: "700", size: 68, color: TEAL,
    label: "sesi balita per tahun", note: "30 Posyandu, satu tahun penyebaran biasa.",
  });
  stat(s, {
    x: M + 4.1, y: 3.2, w: 3.6, value: "475", size: 68, color: MUTED,
    label: "kohort Nature Medicine", note: "Studi SenseToKnow yang jadi acuan kami.",
  });
  card(s, { x: M + 7.9, y: 3.15, w: 3.5, h: 2.4, fill: TEAL_WASH, line: TEAL_WASH });
  s.addText("Tanpa biaya marginal perangkat lunak", {
    x: M + 8.15, y: 3.42, w: 3.0, h: 0.6, margin: 0,
    fontFace: H, fontSize: 16, bold: true, color: TEAL, lineSpacing: 21,
  });
  s.addText(
    "PWA statis. Tidak ada server, basis data, maupun lisensi. Posyandu ke-1 dan ke-1.000 memuat berkas yang sama.",
    {
      x: M + 8.15, y: 4.1, w: 3.0, h: 1.2, margin: 0,
      fontFace: B, fontSize: 12.5, color: INK_2, lineSpacing: 18,
    },
  );
  s.addText(
    "Dalam setahun penyebaran biasa, alat ini mengumpulkan data lebih banyak daripada studi yang jadi acuannya — di populasi yang belum pernah punya instrumennya.",
    {
      x: M, y: 5.85, w: 7.4, h: 0.7, margin: 0,
      fontFace: H, fontSize: 15, italic: true, color: INK_2, lineSpacing: 21,
    },
  );
  s.addNotes("Ini yang mengubah 'belum ada data' dari kelemahan menjadi rencana.");
}

// ═══════════════════════════════════════════════════════ 13 · Penutup
{
  const s = darkSlide();
  mark(s, M, 1.5, TEAL_LT, 0.34);
  s.addText("Yang belum kami punya itu label, bukan sistemnya.", {
    x: M, y: 2.05, w: 11.2, h: 1.3, margin: 0,
    fontFace: H, fontSize: 38, bold: true, color: WHITE, lineSpacing: 46,
  });
  s.addText(
    "Rantainya sudah berdiri dan sudah terinstrumentasi — kamera ke landmark, landmark ke pandangan\nterkalibrasi, pandangan ke fitur, fitur ke model, model ke penjaga, penjaga ke laporan.\nAda di tangan kalian sekarang: jalan, luring, di tablet.",
    {
      x: M, y: 3.5, w: 11.0, h: 1.1, margin: 0,
      fontFace: B, fontSize: 15.5, color: "A8C6BD", lineSpacing: 24,
    },
  );
  // Bukan "satu tanda tangan". Menyebut kaji etik sebagai formalitas
  // administratif justru merusak premis proyek ini, karena seluruh alasan
  // Gate C ditahan adalah bahwa kajinya sungguh-sungguh diperlukan.
  s.addText(
    "Sebagian besar tim punya model tanpa jalur ke lapangan. Kami punya jalur ke lapangan yang sudah jalan, menunggu labelnya — dan label itu menuntut mitra berizin etik, persetujuan orang tua, acuan klinis buta, dan validasi prospektif.",
    {
      x: M, y: 4.9, w: 11.0, h: 0.95, margin: 0,
      fontFace: H, fontSize: 18, italic: true, color: TEAL_LT, lineSpacing: 25,
    },
  );
  s.addText("Yang kami minta: satu mitra klinis yang mampu menjalankan kaji itu.", {
    x: M, y: 6.05, w: 11.4, h: 0.3, margin: 0,
    fontFace: B, fontSize: 13, bold: true, color: WHITE,
  });
  s.addText("Target Gate C: sensitivitas 88%  ·  spesifisitas 81%  —  ditetapkan dari literatur, bukan dari harapan", {
    x: M, y: 6.45, w: 11.4, h: 0.3, margin: 0,
    fontFace: B, fontSize: 12, color: MUTED_DK,
  });
  s.addNotes("0:30. Berhenti di sini. Jangan sebut kaji etik sebagai tanda tangan; permintaannya mitra, bukan izin. Jangan tutup dengan 'lima lembaga menolak kami'.");
}

pres.writeFile({ fileName: "Neurogaze-Pitch-Deck.pptx" }).then((f) => console.log("Wrote", f));
