/**
 * Checks one exported positive-control log before it is filed as evidence.
 *
 * Run it on the first session of the day: it is the only thing that tells you
 * the speaker behind the participant is actually doing its job, before eight
 * people have been recorded against a setup that cannot measure the third
 * signal. Prints the lembar_sesi.csv row so nothing is transcribed by hand.
 */
import { readFileSync } from "node:fs";
import { checkPositiveControlLog, findDuplicateSessions, SHEET_HEADER } from "../src/positive/checkLog";
import type { SessionAuditLog } from "../src/audit/sessionLog";

const paths = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
if (!paths.length) {
  console.error("Pakai: npm run kp:check -- <berkas.json> [berkas lain...]");
  process.exit(2);
}

let anyFailed = false;
const rows: string[] = [];
const loaded: { path: string; log: SessionAuditLog }[] = [];

for (const path of paths) {
  let log: SessionAuditLog;
  try {
    log = JSON.parse(readFileSync(path, "utf8")) as SessionAuditLog;
  } catch (error) {
    console.error(`\n${path}\n  TIDAK TERBACA: ${error instanceof Error ? error.message : String(error)}`);
    anyFailed = true;
    continue;
  }

  loaded.push({ path, log });
  const result = checkPositiveControlLog(log);
  console.log(`\n${path}`);
  console.log(`  ${result.ok ? "LULUS" : "DITOLAK"}`);
  for (const line of result.failures) console.log(`  ✗ ${line}`);
  for (const line of result.warnings) console.log(`  ! ${line}`);
  if (result.ok) rows.push(result.sheetRow);
  if (!result.ok) anyFailed = true;
}

const duplicates = findDuplicateSessions(loaded);
if (duplicates.length) {
  anyFailed = true;
  console.log("\nBerkas yang tidak dapat dibedakan satu sama lain:");
  for (const duplicate of duplicates) {
    console.log(`  ✗ ${duplicate.reason}`);
    for (const path of duplicate.paths) console.log(`      ${path}`);
  }
  console.log("  Satu rekaman harus menghasilkan satu berkas. Hapus salinannya, atau rekam ulang kalau tidak jelas mana yang mana.");
}

if (rows.length) {
  console.log(`\nBaris untuk lembar_sesi.csv:\n${SHEET_HEADER}`);
  for (const row of rows) console.log(row);
}

console.log("");
process.exit(anyFailed ? 1 : 0);
