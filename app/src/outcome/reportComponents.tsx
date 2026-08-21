import type { ReactNode } from "react";

import type { ReportPresentationSection } from "./reportPresentation";

export type ReportMetadataItem = {
  label: string;
  value: string;
};

export function CaregiverReport({
  sections,
  surface,
}: {
  sections: readonly ReportPresentationSection[];
  surface: "screen" | "print";
}) {
  return (
    <section
      className="caregiverReport"
      data-surface={surface}
      aria-label="Ringkasan untuk orang tua dan pendamping"
    >
      {sections.map((section, index) => (
        <article key={section.id} data-section={section.id}>
          <span className="caregiverStep" aria-hidden="true">{index + 1}</span>
          <div>
            <small>{section.label}</small>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

export function PrintableReport({
  title,
  metadata,
  sections,
  disclaimer,
  demonstrationBanner,
  qualityPassed,
  validityCanScore,
  technicalSummary,
}: {
  title: string;
  metadata: readonly ReportMetadataItem[];
  sections: readonly ReportPresentationSection[];
  disclaimer: string;
  demonstrationBanner: string | null;
  qualityPassed: boolean;
  validityCanScore: boolean;
  technicalSummary: ReactNode;
}) {
  const technicalEligible = qualityPassed && validityCanScore;

  return (
    <section className="printSummary" aria-hidden="true">
      <header data-print-section="identity">
        <h1>{title}</h1>
        <dl className="printMeta">
          {metadata.map((item) => (
            <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
          ))}
        </dl>
      </header>
      <CaregiverReport sections={sections} surface="print" />
      <p className="printDisclaimer" data-print-section="disclaimer">{disclaimer}</p>
      {demonstrationBanner && (
        <p className="printDemonstration">
          <strong>MODE DEMONSTRASI — bukan hasil sesi lapangan.</strong>{" "}
          {demonstrationBanner} Ambang 69% sengaja diterapkan untuk memperlihatkan respons arsitektur; angkanya tidak sah untuk keputusan apa pun.
        </p>
      )}
      {technicalEligible && <div className="printTechnical" data-print-section="technical">{technicalSummary}</div>}
    </section>
  );
}
