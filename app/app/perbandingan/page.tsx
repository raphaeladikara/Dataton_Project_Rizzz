import { ComparisonView } from "./comparison-view";

/**
 * Metadata is generated at build time and cannot follow a client-side language
 * toggle, so it stays Indonesian — the same reason the root layout's title
 * does. Everything the reader actually sees on the page follows the toggle.
 */
export const metadata = {
  title: "Perbandingan dua kondisi — Neurogaze",
  description: "Respons instrumen pada menonton biasa dan pola yang sengaja diproduksi, berdampingan.",
};

export default function ComparisonPage() {
  return <ComparisonView />;
}
