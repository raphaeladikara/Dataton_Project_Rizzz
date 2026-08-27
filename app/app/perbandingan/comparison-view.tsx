"use client";

import Link from "next/link";
import evidenceJson from "../../public/validation/gate-b-public.json";
import { buildComparisonView } from "../../src/outcome/comparisonView";
import type { GateBPublicEvidence } from "../../src/gateb/publicEvidence";
import { IconAlert, IconArrowLeft, LogoMark } from "../../src/ui/icons";
import { LanguageToggle } from "../../src/i18n/LanguageToggle";
import { useT } from "../../src/i18n/useT";
import styles from "./perbandingan.module.css";

/**
 * One screen for the claim that needed two sessions to show.
 *
 * Sized for a projector rather than a desk: the deciding rows are the largest
 * thing on the page, and the scope banner sits above them so it cannot be read
 * after the numbers have already landed.
 *
 * Client-side because the view is rebuilt per language. The evidence JSON is
 * still imported at build time and the page still prerenders — only which of
 * the two copy tables gets read moves to the browser.
 */
export function ComparisonView() {
  const { t, locale } = useT();
  const view = buildComparisonView(evidenceJson as GateBPublicEvidence, locale);
  const [ordinary, produced] = view.columns;

  return <main className={styles.page}>
    <header className={styles.topbar}>
      <Link href="/" className={styles.brand}><LogoMark size={24} className={styles.brandMark} /> Neurogaze</Link>
      <span>{t("comparison.kicker")}</span>
      <LanguageToggle />
    </header>

    <section className={styles.scope}>
      <IconAlert size={20} />
      <p>{view.scopeBanner}</p>
    </section>

    <h1 className={styles.title}>{view.title}</h1>
    <p className={styles.lede}>
      {t("comparison.lede", {
        participants: view.participants,
        recorded: view.sessionsRecorded,
        passed: view.sessionsQualityPass,
      })}
    </p>

    <section className={styles.columns} aria-label={t("comparison.columnsAria")}>
      {[ordinary, produced].map((column) => (
        <article key={column.id} className={styles.column} data-condition={column.id}>
          <h2>{column.label}</h2>
          <p className={styles.instruction}>{column.instruction}</p>
          <strong className={styles.fired}>{column.ruleFired}<span> / {column.usable}</span></strong>
          <p className={styles.firedLabel}>{column.outcome}</p>
          <p className={styles.denominator}>
            {t("comparison.denominator", {
              recorded: column.recorded,
              usable: column.usable,
              withheld: column.recorded - column.usable,
            })}
          </p>
        </article>
      ))}
    </section>

    <section className={styles.card}>
      <h2>{t("comparison.signalsHeading")}</h2>
      <table className={styles.signals}>
        <thead>
          <tr>
            <th scope="col">{t("comparison.colSignal")}</th>
            <th scope="col">{t("comparison.colOrdinary")}</th>
            <th scope="col">{t("comparison.colProduced")}</th>
            <th scope="col">{t("comparison.colGap")}</th>
          </tr>
        </thead>
        <tbody>
          {view.signals.map((signal) => (
            <tr key={signal.id}>
              <th scope="row">{signal.label}<small>{signal.meaning}</small></th>
              <td data-strong={signal.direction === "higher_in_ordinary"}>
                {signal.ordinary.median}<small>n={signal.ordinary.n}</small>
              </td>
              <td data-strong={signal.direction === "higher_in_produced"}>
                {signal.produced.median}<small>n={signal.produced.n}</small>
              </td>
              <td className={styles.gap}>{signal.nearestGap}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.note}>{view.gapNote}</p>
    </section>

    <section className={styles.card}>
      <h2>{t("comparison.notClaimedHeading")}</h2>
      <ul className={styles.notClaimed}>
        {view.notClaimed.map((line) => <li key={line}>{line}</li>)}
      </ul>
      <p className={styles.note}>{t("comparison.sourceLabel")} <strong>{view.source}</strong></p>
    </section>

    <footer className={styles.footer}>
      <Link href="/"><IconArrowLeft size={14} /> {t("comparison.back")}</Link>
      <Link href="/validation">{t("comparison.fullEvidence")}</Link>
    </footer>
  </main>;
}
