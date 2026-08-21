import assert from "node:assert/strict";
import test from "node:test";

import { buildReportPresentation } from "../src/outcome/reportPresentation";

const base = {
  qualityPassed: true,
  sourceKind: "live" as const,
  demonstrationMode: false,
  recommendsFollowUp: false,
  emitsReferral: false,
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
