import assert from "node:assert/strict";
import test from "node:test";

import { compositeLaneHeadline } from "../src/outcome/referralPresentation";

const producedPattern = {
  headline: "Disarankan pemeriksaan lanjutan · 2 dari 2 sinyal menyimpang",
  recommendsFollowUp: true,
  assessableCount: 2,
  deviantCount: 2,
};

test("a produced-pattern demonstration frames the composite headline as a rule simulation", () => {
  const headline = compositeLaneHeadline({
    ...producedPattern,
    demonstrationMode: true,
  });

  assert.equal(
    headline,
    "Pola “disarankan pemeriksaan lanjutan” berhasil diperagakan · 2 dari 2 sinyal menyimpang",
  );
  assert.doesNotMatch(headline, /^Disarankan pemeriksaan lanjutan/);
});

test("an ordinary-control demonstration says the no-signal pattern was demonstrated", () => {
  const headline = compositeLaneHeadline({
    headline: "Tidak ada sinyal yang menyimpang · 2 dari 2 sinyal dinilai",
    recommendsFollowUp: false,
    assessableCount: 2,
    deviantCount: 0,
    demonstrationMode: true,
  });

  assert.equal(
    headline,
    "Pola “tidak ada sinyal yang menyimpang” berhasil diperagakan · 2 dari 2 sinyal dinilai",
  );
});

test("a field report preserves the clinical composite headline unchanged", () => {
  assert.equal(
    compositeLaneHeadline({ ...producedPattern, demonstrationMode: false }),
    producedPattern.headline,
  );
});
