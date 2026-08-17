import assert from "node:assert/strict";
import test from "node:test";
import { consentBlockers, type ConsentInput } from "../src/domain/consent";

const child: ConsentInput = {
  purpose: "target_population_research",
  childId: "NG-0001",
  ageMonths: "24",
  consented: true,
  researchConsent: false,
  bridge: null,
};

test("a complete child form has nothing blocking it", () => {
  assert.deepEqual(consentBlockers(child), []);
});

test("each missing child field names itself", () => {
  assert.deepEqual(consentBlockers({ ...child, childId: "   " }), ["ID anak pseudonim belum diisi"]);
  assert.deepEqual(consentBlockers({ ...child, consented: false }), ["Persetujuan layanan belum dicentang"]);
});

test("age outside the studied band is reported with the band", () => {
  assert.deepEqual(consentBlockers({ ...child, ageMonths: "15" }), ["Usia harus antara 16 dan 30 bulan"]);
  assert.deepEqual(consentBlockers({ ...child, ageMonths: "31" }), ["Usia harus antara 16 dan 30 bulan"]);
  assert.deepEqual(consentBlockers({ ...child, ageMonths: "" }), ["Usia harus antara 16 dan 30 bulan"]);
  assert.deepEqual(consentBlockers({ ...child, ageMonths: "16" }), []);
  assert.deepEqual(consentBlockers({ ...child, ageMonths: "30" }), []);
});

test("several missing fields are all listed, not just the first", () => {
  const blockers = consentBlockers({ ...child, childId: "", consented: false, ageMonths: "40" });
  assert.equal(blockers.length, 3);
  assert.ok(blockers.some((item) => item.includes("ID anak")));
  assert.ok(blockers.some((item) => item.includes("Persetujuan")));
  assert.ok(blockers.some((item) => item.includes("Usia")));
});

test("an engineering session has no age band and uses participant wording", () => {
  const adult: ConsentInput = { ...child, purpose: "gate_a_adult", ageMonths: "" };
  assert.deepEqual(consentBlockers(adult), []);
  assert.deepEqual(consentBlockers({ ...adult, childId: "" }), ["ID peserta pseudonim belum diisi"]);
});

test("Gate B names every missing bridge field", () => {
  const bridge: ConsentInput = {
    ...child,
    purpose: "gate_b_bridge",
    ageMonths: "",
    researchConsent: false,
    bridge: { pairId: "", visitId: "V1", deviceId: "TAB-A", referenceDevice: "Laptop", screenWidthMm: 40, screenHeightMm: 141, viewingDistanceMm: 150 },
  };
  const blockers = consentBlockers(bridge);
  assert.ok(blockers.includes("Persetujuan riset Gate B belum dicentang"));
  assert.ok(blockers.includes("ID pasangan belum diisi"));
  assert.ok(blockers.includes("Lebar layar harus minimal 50 mm"));
  assert.ok(blockers.includes("Jarak pandang harus minimal 200 mm"));
  assert.ok(!blockers.some((item) => item.includes("ID kunjungan")));
});

test("a complete Gate B form clears", () => {
  assert.deepEqual(consentBlockers({
    ...child,
    purpose: "gate_b_bridge",
    ageMonths: "",
    researchConsent: true,
    bridge: { pairId: "GBC-1", visitId: "V1", deviceId: "TAB-A", referenceDevice: "Laptop", screenWidthMm: 226, screenHeightMm: 141, viewingDistanceMm: 500 },
  }), []);
});
