"use client";

import type { ReactNode } from "react";

import { useT } from "../i18n/useT";

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
  const { t } = useT();
  return (
    <section
      className="caregiverReport"
      data-surface={surface}
      aria-label={t("print.caregiverAria")}
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
  const { t } = useT();
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
          <strong>{t("print.demoLead")}</strong>{" "}
          {demonstrationBanner} {t("print.demoThreshold")}
        </p>
      )}
      {technicalEligible && <div className="printTechnical" data-print-section="technical">{technicalSummary}</div>}
    </section>
  );
}
