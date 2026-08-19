/**
 * Checks one exported positive-control log before it is filed as evidence.
 *
 * Run it on the first session of the day: it is the only thing that tells you
 * the speaker behind the participant is actually doing its job, before eight
 * people have been recorded against a setup that cannot measure the third
 * signal. Prints the lembar_sesi.csv row so nothing is transcribed by hand.
 */
import { readFileSync } from "node:fs";
import { checkPositiveControlLog, SHEET_HEADER } from "../src/positive/checkLog";
import type { SessionAuditLog } from "../src/audit/sessionLog";

const paths = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
if (!paths.length) {
  console.error("Pakai: npm run kp:check -- <berkas.json> [berkas lain...]");
  process.exit(2);
}

let anyFailed = false;
const rows: string[] = [];

for (const path of paths) {
  let log: SessionAuditLog;
  try {
    log = JSON.parse(readFileSync(path, "utf8")) as SessionAuditLog;
  } catch (error) {
    console.error(`\n${path}\n  TIDAK TERBACA: ${error instanceof Error ? error.message : String(error)}`);
    anyFailed = true;
    continue;
  }

  const result = checkPositiveControlLog(log);
  console.log(`\n${path}`);
  console.log(`  ${result.ok ? "LULUS" : "DITOLAK"}`);
  for (const line of result.failures) console.log(`  ✗ ${line}`);
  for (const line of result.warnings) console.log(`  ! ${line}`);
  if (result.ok) rows.push(result.sheetRow);
  if (!result.ok) anyFailed = true;
}

if (rows.length) {
  console.log(`\nBaris untuk lembar_sesi.csv:\n${SHEET_HEADER}`);
  for (const row of rows) console.log(row);
}

console.log("");
process.exit(anyFailed ? 1 : 0);
