import type { GateBPublicEvidence } from "../gateb/publicEvidence";

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

const SIGNAL_COPY: Record<string, SignalCopy> = {
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
    format: (value) => value.toFixed(3).replace(".", ","),
    formatGap: (value) => value.toFixed(3).replace(".", ","),
  },
};

const SCOPE_BANNER =
  "Peserta adalah 12 orang dewasa yang menyetujui untuk dirinya sendiri dan diminta memproduksi "
  + "pola tertentu. Tidak ada sensitivitas, spesifisitas, atau akurasi di layar ini, dan tidak ada "
  + "pernyataan apa pun tentang autisme. Aturan dijalankan dalam mode demonstrasi dan tidak "
  + "mengeluarkan rujukan.";

const GAP_NOTE =
  "Kolom yang menentukan adalah jarak terdekat, bukan AUC. Ketiga sinyal ber-AUC 1,00, tetapi itu "
  + "hanya berarti tidak ada pasangan yang tertukar urutannya — ia tidak mengatakan seberapa lebar "
  + "pemisahannya. Jarak terdekat mengatakannya.";

const plain = (value: number) => value.toFixed(3).replace(".", ",");

function formatFor(id: string, value: number): string {
  return (SIGNAL_COPY[id]?.format ?? plain)(value);
}

function formatGapFor(id: string, value: number): string {
  return (SIGNAL_COPY[id]?.formatGap ?? plain)(value);
}

export function buildComparisonView(evidence: GateBPublicEvidence): ComparisonView {
  const control = evidence.positiveControl;
  const { ordinary, produced } = control.conditions;

  return {
    title: "Alat ini membedakan — dua kondisi, satu layar",
    scopeBanner: SCOPE_BANNER,
    columns: [
      {
        id: "ordinary",
        label: "Menonton biasa",
        instruction: "Peserta diminta menonton seperti biasa, tanpa arahan lain.",
        recorded: ordinary.recorded,
        usable: ordinary.usable,
        ruleFired: ordinary.ruleFired,
        outcome: `Aturan peragaan menyala pada ${ordinary.ruleFired} dari ${ordinary.usable} sesi yang dapat dipakai`,
      },
      {
        id: "produced",
        label: "Pola diproduksi",
        instruction: "Peserta diminta memproduksi pola yang dicari alat: tatap panel geometrik, abaikan isyarat arah, tahan pandangan di tengah.",
        recorded: produced.recorded,
        usable: produced.usable,
        ruleFired: produced.ruleFired,
        outcome: `Aturan peragaan menyala pada ${produced.ruleFired} dari ${produced.usable} sesi yang dapat dipakai`,
      },
    ],
    signals: control.signals.map((signal) => {
      const copy = SIGNAL_COPY[signal.id];
      return {
        id: signal.id,
        label: copy?.label ?? signal.id,
        meaning: copy?.meaning ?? "",
        ordinary: { median: formatFor(signal.id, signal.medianOrdinary), n: signal.nOrdinary },
        produced: { median: formatFor(signal.id, signal.medianProduced), n: signal.nProduced },
        nearestGap: formatGapFor(signal.id, signal.nearestGap),
        direction: copy?.direction ?? "higher_in_produced",
      };
    }),
    participants: control.participants,
    sessionsRecorded: control.sessions.recorded,
    sessionsQualityPass: control.sessions.qualityPass,
    gapNote: GAP_NOTE,
    notClaimed: [
      "Bukan sensitivitas, spesifisitas, atau akurasi — peserta dewasa mengikuti naskah, jadi tidak ada status klinis yang bisa dibandingkan.",
      "Bukan bukti apa pun tentang autisme, dan bukan bukti apa pun tentang balita.",
      "Aturan dijalankan dalam mode demonstrasi; emitsReferral tetap false di seluruh sesi.",
      "Setengah sesi pola diproduksi gugur di gerbang mutu, dan penyebutnya ditampilkan apa adanya.",
    ],
    source: control.source,
  };
}
