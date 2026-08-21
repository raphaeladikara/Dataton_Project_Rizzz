import assert from "node:assert/strict";
import test from "node:test";

import { buildReportPresentation } from "../src/outcome/reportPresentation";

const base = {
  qualityPassed: true,
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
  assert.match(report.sections[1].body, /Wajah terlalu sering keluar dari bingkai/);
  assert.match(report.sections[2].body, /ulangi/i);
});

test("demonstration leads with the architecture response and a persistent safety banner", () => {
  const report = buildReportPresentation({
    ...base,
    demonstrationMode: true,
    recommendsFollowUp: true,
  });

  assert.match(report.sections[0].title, /arsitektur/i);
  assert.match(report.sections[0].body, /jalur pemeriksaan lanjutan/i);
  assert.match(report.demoBanner ?? "", /peserta dewasa/i);
  assert.match(report.demoBanner ?? "", /klip pendek/i);
  assert.match(report.demoBanner ?? "", /bukan penilaian klinis/i);
  assert.match(report.demoBanner ?? "", /tidak mengeluarkan rujukan/i);
});
