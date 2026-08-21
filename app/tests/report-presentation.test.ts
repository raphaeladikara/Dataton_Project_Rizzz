import assert from "node:assert/strict";
import test from "node:test";

import { buildReportNotice, buildReportPresentation } from "../src/outcome/reportPresentation";

const base = {
  qualityPassed: true,
  sourceKind: "live" as const,
  demonstrationMode: false,
  recommendsFollowUp: false,
  emitsReferral: false,
  fieldTitle: "Tidak ada tanda yang perlu ditindaklanjuti dari sesi ini",
  sessionHeadline: "Pola perhatian berhasil diukur.",
  sessionSummary: "Sesi menghasilkan pengukuran deskriptif.",
};

test("caregiver report has one stable four-part reading order", () => {
  const report = buildReportPresentation(base);

  assert.deepEqual(
    report.sections.map((section) => section.id),
    ["what_happened", "recording_status", "next_steps", "result_limits"],
  );
  assert.deepEqual(
    report.sections.map((section) => section.label),
    ["Apa yang terjadi", "Rekaman dapat digunakan", "Langkah berikutnya", "Batas hasil"],
  );
  assert.equal(report.demoBanner, null);
  assert.notEqual(report.pageTitle, report.sections[0].title);
  assert.match(report.sections[3].body, /bukan diagnosis/i);
  assert.match(report.sections[3].body, /bukan tanda aman/i);
});

test("a usable field report keeps its actionable verdict and count in the first section", () => {
  const report = buildReportPresentation({
    ...base,
    recommendsFollowUp: true,
    emitsReferral: true,
    fieldTitle: "Sebaiknya diperiksa lebih lanjut di Puskesmas atau rumah sakit",
    sessionHeadline: "Lajur komposit menyala · 2 dari 2 sinyal menyimpang",
  });

  assert.equal(
    report.sections[0].title,
    "Sebaiknya diperiksa lebih lanjut di Puskesmas atau rumah sakit",
  );
  assert.match(report.sections[0].body, /2 dari 2 sinyal menyimpang/);
});

test("a withheld session says the recording cannot be used", () => {
  const report = buildReportPresentation({
    ...base,
    qualityPassed: false,
    sessionHeadline: "Sesi belum dapat dinilai.",
    sessionSummary: "Data belum cukup.",
    validityMessage: "Wajah terlalu sering keluar dari bingkai.",
  });

  assert.equal(report.sections[1].label, "Rekaman tidak dapat digunakan");
  assert.equal(
    report.sections.filter((section) => section.body.includes("Wajah terlalu sering keluar dari bingkai.")).length,
    1,
  );
  assert.match(report.sections[2].body, /ulangi/i);
});

for (const [sourceKind, expectedLabel, expectedTitle] of [
  ["live", "Rekaman dapat digunakan", "Data sesi cukup untuk dibaca."],
  ["recorded_replay", "Rekaman dapat digunakan", "Data sesi cukup untuk dibaca."],
  ["synthetic_preview", "Pratinjau sintetis selesai", "Tidak ada rekaman peserta."],
] as const) {
  test(`a passing ${sourceKind} report names its source honestly`, () => {
    const report = buildReportPresentation({ ...base, sourceKind });

    assert.equal(report.sections[1].label, expectedLabel);
    assert.equal(report.sections[1].title, expectedTitle);
    if (sourceKind === "synthetic_preview") {
      assert.doesNotMatch(report.sections[1].label + report.sections[1].title, /Rekaman dapat digunakan/i);
    }
  });
}

for (const [label, recommendsFollowUp] of [
  ["produced-pattern response", true],
  ["ordinary-control response", false],
] as const) {
  test(`demonstration presents all four safe sections for the ${label}`, () => {
    const report = buildReportPresentation({
      ...base,
      demonstrationMode: true,
      recommendsFollowUp,
    });

    assert.deepEqual(
      report.sections.map((section) => section.id),
      ["what_happened", "recording_status", "next_steps", "result_limits"],
    );
    assert.notEqual(report.pageTitle, report.sections[0].title);
    assert.match(report.sections[0].title, /arsitektur/i);
    assert.match(report.sections[0].body, recommendsFollowUp ? /jalur pemeriksaan lanjutan/i : /jalur tanpa arahan pemeriksaan/i);
    assert.match(report.sections[1].label, /Rekaman dapat digunakan/);
    assert.match(report.sections[2].title, /peragaan|panduan/i);
    assert.match(report.sections[2].body, /kontrol biasa|panduan/i);
    assert.doesNotMatch(report.sections[2].body, /kader|Puskesmas|dokter|rujukan|kesehatan/i);
    assert.match(report.sections[3].body, /bukan diagnosis/i);
    assert.match(report.sections[3].body, /bukan tanda aman/i);
    assert.match(report.demoBanner ?? "", /peserta dewasa/i);
    assert.match(report.demoBanner ?? "", /klip pendek/i);
    assert.match(report.demoBanner ?? "", /bukan penilaian klinis/i);
    assert.match(report.demoBanner ?? "", /tidak mengeluarkan rujukan/i);
  });
}

for (const recommendsFollowUp of [true, false]) {
  test(`an unusable demonstration recording takes precedence over recommendation=${recommendsFollowUp}`, () => {
    const report = buildReportPresentation({
      ...base,
      qualityPassed: false,
      demonstrationMode: true,
      recommendsFollowUp,
      validityMessage: "Wajah terlalu sering keluar dari bingkai.",
    });

    assert.match(report.sections[0].title, /rekaman.*tidak dapat digunakan/i);
    assert.notEqual(report.pageTitle, report.sections[0].title);
    assert.equal(
      report.sections.filter((section) => section.body.includes("Wajah terlalu sering keluar dari bingkai.")).length,
      1,
    );
    assert.doesNotMatch(report.sections[0].title + report.sections[0].body, /berhasil|respons.*terlihat|jalur.*diperagakan/i);
    assert.equal(report.sections[1].label, "Rekaman tidak dapat digunakan");
    assert.match(report.sections[2].title, /ulangi/i);
    assert.match(report.sections[2].body, /posisi wajah|cahaya|jarak tablet/i);
    assert.doesNotMatch(report.sections[2].body, /kontrol biasa|pola produksi/i);
    assert.match(report.demoBanner ?? "", /peserta dewasa/i);
    assert.match(report.demoBanner ?? "", /bukan penilaian klinis/i);
  });
}

// ── Perubahan yang berasal dari wawancara praktisi, bukan dari selera desain.
//    Sumbernya di docs/wawancara_praktisi_hasil.md; keduanya dikunci di sini
//    supaya tidak hilang diam-diam saat copy laporan disunting lain kali.

test("the caregiver layer states how certain the measurement is, in plain words", () => {
  const usable = buildReportPresentation(base);
  const withheld = buildReportPresentation({
    ...base,
    qualityPassed: false,
    validityMessage: "Wajah terlalu sering keluar dari bingkai.",
  });

  // D1: "harus jelas apa yang terlihat pada anak, seberapa yakin hasil
  // pengukurannya, dan apa langkah berikutnya". Selang kepercayaan dan status
  // mutu sudah dihitung, tetapi keduanya ada di balik pengungkapan tenaga
  // kesehatan — orang tua tidak membukanya.
  assert.equal(typeof usable.confidenceStatement, "string");
  assert.ok(usable.confidenceStatement.length > 0);
  assert.equal(usable.sections[1].id, "recording_status");
  assert.match(usable.sections[1].body, /yakin|pasti|cukup/i);
  assert.match(withheld.sections[1].body, /yakin|pasti|cukup/i);
});

test("next steps name who accompanies the caregiver, not only where to take the paper", () => {
  const referring = buildReportPresentation({
    ...base,
    recommendsFollowUp: true,
    emitsReferral: true,
    fieldTitle: "Sebaiknya diperiksa lebih lanjut di Puskesmas atau rumah sakit",
  });
  const ordinary = buildReportPresentation(base);

  // E2: "setelah hasil keluar harus jelas siapa yang menjelaskan dan
  // mendampingi orang tua". Menyebut tujuan tanpa menyebut pendamping
  // meninggalkan orang tua sendirian dengan kertasnya.
  assert.match(referring.sections[2].body, /kader/i);
  assert.match(referring.sections[2].body, /dampingi|mendampingi|menjelaskan/i);
  assert.match(ordinary.sections[2].body, /dampingi|mendampingi|menjelaskan/i);
});

test("a demonstration report carries neither field instruction", () => {
  const demo = buildReportPresentation({ ...base, demonstrationMode: true, recommendsFollowUp: true });

  assert.doesNotMatch(demo.sections[2].body, /Puskesmas/i);
  assert.match(demo.sections[2].body, /peragaan|Panduan & demo/i);
});

// ── Satu spanduk, bukan tiga.
//    Kalimatnya tidak berubah; tumpukannya yang berubah. Tiga kartu peringatan
//    sebelum satu hasil pun terlihat terbaca sebagai permintaan maaf, dan itu
//    kesan visual pertama juri terhadap keluaran sistem.

test("a demonstration report carries exactly one notice that leads with the mode", () => {
  const notice = buildReportNotice({
    demonstrationMode: true,
    isEngineeringStudy: false,
    sourceKind: "recorded_replay",
    recordingLabel: "Pola diproduksi",
    recordingCapturedAt: "2026-08-19",
  });

  assert.equal(notice.tone, "demonstration");
  assert.match(notice.lead, /MODE DEMONSTRASI/);
  // Every sentence the three cards carried has to survive the merge.
  assert.match(notice.body, /bukan diagnosis|Bukan diagnosis/i);
  assert.match(notice.body, /69%/);
  assert.match(notice.body, /Pola diproduksi/);
  assert.match(notice.body, /tidak mengeluarkan rujukan/i);
});

test("a field report still says it is not a diagnosis, and says why the referral is withheld", () => {
  const notice = buildReportNotice({
    demonstrationMode: false,
    isEngineeringStudy: false,
    sourceKind: "live",
    recordingLabel: null,
    recordingCapturedAt: null,
  });

  assert.equal(notice.tone, "limit");
  assert.match(notice.lead, /Bukan diagnosis/i);
  assert.match(notice.body, /ditahan/i);
  // A live field session is not a replay and must not claim to be one.
  assert.doesNotMatch(notice.body, /REKAMAN|SIMULASI/);
});

test("a synthetic preview says the points were generated, not recorded", () => {
  const notice = buildReportNotice({
    demonstrationMode: false,
    isEngineeringStudy: false,
    sourceKind: "synthetic_preview",
    recordingLabel: null,
    recordingCapturedAt: null,
  });

  assert.match(notice.body, /dibangkitkan/i);
});

test("an engineering session says it tests the device, not the participant", () => {
  const notice = buildReportNotice({
    demonstrationMode: false,
    isEngineeringStudy: true,
    sourceKind: "live",
    recordingLabel: null,
    recordingCapturedAt: null,
  });

  assert.match(notice.body, /menguji perangkat/i);
});
