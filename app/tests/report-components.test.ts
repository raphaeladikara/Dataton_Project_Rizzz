import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { buildReportPresentation, type ReportSourceKind } from "../src/outcome/reportPresentation";
import { CaregiverReport, PrintableReport } from "../src/outcome/reportComponents";

function presentation(input: {
  sourceKind: ReportSourceKind;
  qualityPassed: boolean;
  demonstrationMode: boolean;
}) {
  const presentationInput = {
    ...input,
    recommendsFollowUp: input.demonstrationMode,
    emitsReferral: false,
    fieldTitle: "Tidak ada tanda yang perlu ditindaklanjuti dari sesi ini",
    sessionHeadline: "Pola perhatian berhasil diukur.",
    sessionSummary: "Sesi menghasilkan pengukuran deskriptif.",
    validityMessage: input.qualityPassed ? undefined : "Wajah terlalu sering keluar dari bingkai.",
  };
  return buildReportPresentation(presentationInput);
}

const metadata = [
  { label: "ID anak", value: "NG-0042" },
  { label: "Lokasi", value: "Posyandu Melati 3" },
];

test("caregiver markup renders the same four-part order for field, demo, withheld, and synthetic reports", () => {
  for (const scenario of [
    { sourceKind: "live", qualityPassed: true, demonstrationMode: false },
    { sourceKind: "recorded_replay", qualityPassed: true, demonstrationMode: true },
    { sourceKind: "recorded_replay", qualityPassed: false, demonstrationMode: true },
    { sourceKind: "synthetic_preview", qualityPassed: true, demonstrationMode: false },
  ] as const) {
    const report = presentation(scenario);
    const markup = renderToStaticMarkup(createElement(CaregiverReport, {
      sections: report.sections,
      surface: "screen",
    }));
    let cursor = -1;
    for (const label of ["Apa yang terjadi", report.sections[1].label, "Langkah berikutnya", "Batas hasil"]) {
      const next = markup.indexOf(label);
      assert.ok(next > cursor, `${scenario.sourceKind} misplaced ${label}`);
      cursor = next;
    }
    if (!scenario.qualityPassed) assert.doesNotMatch(markup, /berhasil diperagakan/i);
    if (scenario.sourceKind === "synthetic_preview") {
      assert.match(markup, /Pratinjau sintetis selesai/);
      assert.match(markup, /Tidak ada rekaman peserta/);
      assert.doesNotMatch(markup, /Rekaman dapat digunakan/);
    }
  }
});

test("screen markup carries the actionable field verdict, not only the print summary", () => {
  const report = buildReportPresentation({
    qualityPassed: true,
    sourceKind: "live",
    demonstrationMode: false,
    recommendsFollowUp: true,
    emitsReferral: true,
    fieldTitle: "Sebaiknya diperiksa lebih lanjut di Puskesmas atau rumah sakit",
    sessionHeadline: "Lajur komposit menyala · 2 dari 2 sinyal menyimpang",
    sessionSummary: "Dua sinyal memenuhi aturan.",
  });
  const markup = renderToStaticMarkup(createElement(CaregiverReport, {
    sections: report.sections,
    surface: "screen",
  }));

  assert.match(markup, /Sebaiknya diperiksa lebih lanjut di Puskesmas atau rumah sakit/);
  assert.match(markup, /2 dari 2 sinyal menyimpang/);
});

for (const scenario of [
  { sourceKind: "recorded_replay", demonstrationMode: true },
  { sourceKind: "synthetic_preview", demonstrationMode: false },
] as const) {
  test(`${scenario.sourceKind} keeps its safe specialized title`, () => {
    const report = buildReportPresentation({
      qualityPassed: true,
      ...scenario,
      recommendsFollowUp: true,
      emitsReferral: false,
      fieldTitle: "Sebaiknya diperiksa lebih lanjut di Puskesmas atau rumah sakit",
      sessionHeadline: "Lajur komposit menyala · 2 dari 2 sinyal menyimpang",
      sessionSummary: "Dua sinyal memenuhi aturan.",
    });
    const markup = renderToStaticMarkup(createElement(CaregiverReport, {
      sections: report.sections,
      surface: "screen",
    }));

    assert.doesNotMatch(markup, /Sebaiknya diperiksa lebih lanjut di Puskesmas atau rumah sakit/);
  });
}

test("print order starts with identity, then caregiver sections, disclaimer, and eligible technical summary", () => {
  const report = presentation({ sourceKind: "live", qualityPassed: true, demonstrationMode: false });
  const markup = renderToStaticMarkup(createElement(PrintableReport, {
    title: "Neurogaze — Ringkasan sesi",
    metadata,
    sections: report.sections,
    disclaimer: "Bukan alat diagnosis.",
    demonstrationBanner: report.demoBanner,
    qualityPassed: true,
    validityCanScore: true,
    technicalSummary: createElement("div", { "data-testid": "technical-summary" }, "Ringkasan teknis"),
  }));

  const ordered = [
    "Neurogaze — Ringkasan sesi",
    "ID anak",
    "Apa yang terjadi",
    "Batas hasil",
    "Bukan alat diagnosis.",
    "Ringkasan teknis",
  ];
  let cursor = -1;
  for (const text of ordered) {
    const next = markup.indexOf(text);
    assert.ok(next > cursor, `print order misplaced ${text}`);
    cursor = next;
  }
  assert.equal((markup.match(/class="printSummary"/g) ?? []).length, 1);
  assert.equal((markup.match(/data-surface="print"/g) ?? []).length, 1);
});

for (const [qualityPassed, validityCanScore] of [[false, true], [true, false]] as const) {
  test(`withheld print hides decision lanes when quality=${qualityPassed} validity=${validityCanScore}`, () => {
    const report = presentation({ sourceKind: "recorded_replay", qualityPassed: false, demonstrationMode: true });
    const markup = renderToStaticMarkup(createElement(PrintableReport, {
      title: "Neurogaze — Ringkasan sesi",
      metadata,
      sections: report.sections,
      disclaimer: "Bukan alat diagnosis.",
      demonstrationBanner: report.demoBanner,
      qualityPassed,
      validityCanScore,
      technicalSummary: createElement("div", null, "Pola berhasil diperagakan · Disarankan pemeriksaan lanjutan"),
    }));

    assert.doesNotMatch(markup, /berhasil diperagakan/i);
    assert.doesNotMatch(markup, /Disarankan pemeriksaan lanjutan/i);
    assert.match(markup, /MODE DEMONSTRASI/);
    assert.match(markup, /Rekaman tidak dapat digunakan/);
  });
}
