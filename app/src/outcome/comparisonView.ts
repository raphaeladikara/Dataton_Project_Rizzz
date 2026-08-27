import type { GateBPublicEvidence } from "../gateb/publicEvidence";
import { BCP47, DEFAULT_LOCALE, type Locale } from "../i18n/locale";

/**
 * The discrimination proof, arranged for one screen.
 *
 * The evidence for "this instrument separates the two conditions" already
 * exists and is canonical. What did not exist was a way to show it in one
 * glance: seeing it meant running two sessions back to back, and under a ten
 * minute clock only one of them ever gets run.
 *
 * This module reshapes the published positive-control block into two aligned
 * columns. It computes nothing — every number is read straight from
 * gate-b-public.json, which research/export_public_evidence.py generates from
 * the canonical summary. A view that recomputed would be a second
 * implementation of the result, and then there would be two numbers to defend.
 */

export type ComparisonDirection = "higher_in_produced" | "higher_in_ordinary";

export type ComparisonSignalRow = {
  id: string;
  label: string;
  /** What the index means, for a reader who has never seen it. */
  meaning: string;
  ordinary: { median: string; n: number };
  produced: { median: string; n: number };
  nearestGap: string;
  direction: ComparisonDirection;
};

export type ComparisonColumn = {
  id: "ordinary" | "produced";
  label: string;
  instruction: string;
  recorded: number;
  usable: number;
  ruleFired: number;
  outcome: string;
};

export type ComparisonView = {
  title: string;
  /** Printed before any number on this screen, never after. */
  scopeBanner: string;
  columns: [ComparisonColumn, ComparisonColumn];
  signals: ComparisonSignalRow[];
  participants: number;
  sessionsRecorded: number;
  sessionsQualityPass: number;
  /** Why the column that matters is the gap, not the AUC. */
  gapNote: string;
  notClaimed: string[];
  source: string;
};

type SignalCopy = {
  label: string;
  meaning: string;
  direction: ComparisonDirection;
  /** A value from one condition. */
  format: (value: number) => string;
  /**
   * The distance between the two conditions' closest sessions.
   *
   * It needs its own formatter: a gap of four trials is four trials, and
   * rendering it in the same "4 dari 8" shape as a score reads as a score.
   */
  formatGap: (value: number) => string;
};

const plainIn = (locale: Locale, value: number) =>
  value.toLocaleString(BCP47[locale], { minimumFractionDigits: 3, maximumFractionDigits: 3 });

/**
 * Copy tables, one per language. The logic that assembles the view is written
 * once and reads whichever table the caller asked for — duplicating the
 * assembly per language is how two versions of a screen drift into disagreeing
 * about what they show.
 */
const SIGNAL_COPY: Record<Locale, Record<string, SignalCopy>> = {
  id: {
    geometric_preference: {
      label: "Preferensi geometrik",
      meaning: "Bagian waktu tatap yang jatuh pada panel pola geometrik, bukan panel sosial.",
      direction: "higher_in_produced",
      format: (value) => `${Math.round(value * 100)}%`,
      formatGap: (value) => `${Math.round(value * 100)} poin persen`,
    },
    cue_following: {
      label: "Mengikuti isyarat arah",
      meaning: "Berapa dari delapan percobaan yang tatapannya sampai ke sasaran sesudah isyarat.",
      direction: "higher_in_ordinary",
      format: (value) => `${value.toFixed(0)} dari 8`,
      formatGap: (value) => `${value.toFixed(0)} percobaan`,
    },
    centre_hold_spread: {
      label: "Sebaran tatapan",
      meaning: "Seberapa jauh tatapan menyebar saat tidak ada yang mengarahkannya.",
      direction: "higher_in_ordinary",
      format: (value) => plainIn("id", value),
      formatGap: (value) => plainIn("id", value),
    },
  },
  en: {
    geometric_preference: {
      label: "Geometric preference",
      meaning:
        "The share of gaze time landing on the geometric-pattern panel rather than the social one.",
      direction: "higher_in_produced",
      format: (value) => `${Math.round(value * 100)}%`,
      formatGap: (value) => `${Math.round(value * 100)} percentage points`,
    },
    cue_following: {
      label: "Following the directional cue",
      meaning: "How many of the eight trials had gaze reach the target after the cue.",
      direction: "higher_in_ordinary",
      format: (value) => `${value.toFixed(0)} of 8`,
      formatGap: (value) => `${value.toFixed(0)} trials`,
    },
    centre_hold_spread: {
      label: "Gaze dispersion",
      meaning: "How far gaze spreads when nothing is directing it.",
      direction: "higher_in_ordinary",
      format: (value) => plainIn("en", value),
      formatGap: (value) => plainIn("en", value),
    },
  },
};

type PageCopy = {
  title: string;
  scopeBanner: string;
  gapNote: string;
  ordinaryLabel: string;
  ordinaryInstruction: string;
  producedLabel: string;
  producedInstruction: string;
  outcome: (fired: number, usable: number) => string;
  notClaimed: string[];
};

const PAGE_COPY: Record<Locale, PageCopy> = {
  id: {
    title: "Alat ini membedakan — dua kondisi, satu layar",
    scopeBanner:
      "Peserta adalah 12 orang dewasa yang menyetujui untuk dirinya sendiri dan diminta memproduksi "
      + "pola tertentu. Tidak ada sensitivitas, spesifisitas, atau akurasi di layar ini, dan tidak ada "
      + "pernyataan apa pun tentang autisme. Aturan dijalankan dalam mode demonstrasi dan tidak "
      + "mengeluarkan rujukan.",
    gapNote:
      "Kolom yang menentukan adalah jarak terdekat, bukan AUC. Ketiga sinyal ber-AUC 1,00, tetapi itu "
      + "hanya berarti tidak ada pasangan yang tertukar urutannya — ia tidak mengatakan seberapa lebar "
      + "pemisahannya. Jarak terdekat mengatakannya.",
    ordinaryLabel: "Menonton biasa",
    ordinaryInstruction: "Peserta diminta menonton seperti biasa, tanpa arahan lain.",
    producedLabel: "Pola diproduksi",
    producedInstruction:
      "Peserta diminta memproduksi pola yang dicari alat: tatap panel geometrik, abaikan isyarat arah, tahan pandangan di tengah.",
    outcome: (fired, usable) =>
      `Aturan peragaan menyala pada ${fired} dari ${usable} sesi yang dapat dipakai`,
    notClaimed: [
      "Bukan sensitivitas, spesifisitas, atau akurasi — peserta dewasa mengikuti naskah, jadi tidak ada status klinis yang bisa dibandingkan.",
      "Bukan bukti apa pun tentang autisme, dan bukan bukti apa pun tentang balita.",
      "Aturan dijalankan dalam mode demonstrasi; emitsReferral tetap false di seluruh sesi.",
      "Setengah sesi pola diproduksi gugur di gerbang mutu, dan penyebutnya ditampilkan apa adanya.",
    ],
  },
  en: {
    title: "The instrument discriminates — two conditions, one screen",
    scopeBanner:
      "The participants are 12 adults consenting for themselves who were asked to produce a "
      + "particular pattern. There is no sensitivity, specificity, or accuracy on this screen, and no "
      + "statement of any kind about autism. The rule runs in demonstration mode and issues no "
      + "referral.",
    gapNote:
      "The deciding column is the closest distance, not AUC. All three signals have AUC 1.00, but that "
      + "only means no pair is out of order — it says nothing about how wide the separation is. The "
      + "closest distance does.",
    ordinaryLabel: "Ordinary viewing",
    ordinaryInstruction:
      "Participants were asked to watch as they normally would, with no other direction.",
    producedLabel: "Produced pattern",
    producedInstruction:
      "Participants were asked to produce the pattern the instrument looks for: stare at the geometric panel, ignore the directional cue, hold their gaze at the centre.",
    outcome: (fired, usable) =>
      `The demonstration rule fired on ${fired} of ${usable} usable sessions`,
    notClaimed: [
      "Not sensitivity, specificity, or accuracy — the adult participants followed a script, so there is no clinical status to compare against.",
      "Not evidence of anything about autism, and not evidence of anything about toddlers.",
      "The rule runs in demonstration mode; emitsReferral stays false across every session.",
      "Half the produced-pattern sessions fell at the quality gate, and the denominator is shown as it stands.",
    ],
  },
};

function formatFor(locale: Locale, id: string, value: number): string {
  const format = SIGNAL_COPY[locale][id]?.format;
  return format ? format(value) : plainIn(locale, value);
}

function formatGapFor(locale: Locale, id: string, value: number): string {
  const format = SIGNAL_COPY[locale][id]?.formatGap;
  return format ? format(value) : plainIn(locale, value);
}

/**
 * The locale argument defaults to Indonesian, which is what keeps every caller
 * written before this page had two languages — the contract tests included —
 * producing exactly what it produced before.
 */
export function buildComparisonView(
  evidence: GateBPublicEvidence,
  locale: Locale = DEFAULT_LOCALE,
): ComparisonView {
  const control = evidence.positiveControl;
  const { ordinary, produced } = control.conditions;
  const copy = PAGE_COPY[locale];

  return {
    title: copy.title,
    scopeBanner: copy.scopeBanner,
    columns: [
      {
        id: "ordinary",
        label: copy.ordinaryLabel,
        instruction: copy.ordinaryInstruction,
        recorded: ordinary.recorded,
        usable: ordinary.usable,
        ruleFired: ordinary.ruleFired,
        outcome: copy.outcome(ordinary.ruleFired, ordinary.usable),
      },
      {
        id: "produced",
        label: copy.producedLabel,
        instruction: copy.producedInstruction,
        recorded: produced.recorded,
        usable: produced.usable,
        ruleFired: produced.ruleFired,
        outcome: copy.outcome(produced.ruleFired, produced.usable),
      },
    ],
    signals: control.signals.map((signal) => {
      const signalCopy = SIGNAL_COPY[locale][signal.id];
      return {
        id: signal.id,
        label: signalCopy?.label ?? signal.id,
        meaning: signalCopy?.meaning ?? "",
        ordinary: { median: formatFor(locale, signal.id, signal.medianOrdinary), n: signal.nOrdinary },
        produced: { median: formatFor(locale, signal.id, signal.medianProduced), n: signal.nProduced },
        nearestGap: formatGapFor(locale, signal.id, signal.nearestGap),
        direction: signalCopy?.direction ?? "higher_in_produced",
      };
    }),
    participants: control.participants,
    sessionsRecorded: control.sessions.recorded,
    sessionsQualityPass: control.sessions.qualityPass,
    gapNote: copy.gapNote,
    notClaimed: copy.notClaimed,
    source: control.source,
  };
}
