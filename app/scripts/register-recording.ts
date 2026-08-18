/**
 * Register an exported session audit log as a replayable recording.
 *
 * The manual version of this is six steps (export, rename, copy, open the
 * manifest, add the filename, re-run the demo) and its failure mode is silent:
 * a log exported from a replay session copies over just fine and then produces
 * the same empty layer-B indices the recording was supposed to replace. This
 * refuses the file at registration time and says which field is missing.
 *
 *   npx tsx scripts/register-recording.ts <audit-log.json> [--as session-a.json]
 *   npx tsx scripts/register-recording.ts --check
 */
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectAuditLog, type RecordedSession } from "../src/replay/recording";

const REPLAY_DIR = fileURLToPath(new URL("../public/replay/", import.meta.url));
const MANIFEST = `${REPLAY_DIR}index.json`;

type Manifest = { schema?: string; note?: string; recordings: string[] };

async function readManifest(): Promise<Manifest> {
  const parsed: unknown = JSON.parse(await readFile(MANIFEST, "utf8"));
  if (typeof parsed !== "object" || parsed === null) throw new Error("index.json bukan objek JSON.");
  const manifest = parsed as Partial<Manifest>;
  const listed = Array.isArray(manifest.recordings) ? manifest.recordings : [];
  return { ...manifest, recordings: listed.filter((item): item is string => typeof item === "string") };
}

function summarise(name: string, recording: RecordedSession) {
  const { points, frames, faceRate, gazeDropout, calibrationErrorDeg } = recording;
  const phases = new Set(frames.map((frame) => frame.phase));
  console.log(`  ${name}`);
  console.log(`    ${points.length} titik, ${frames.length} frame, ${phases.size} fase`);
  console.log(
    `    wajah ${(faceRate * 100).toFixed(1)}%, dropout ${(gazeDropout * 100).toFixed(1)}%, ` +
      `kalibrasi ${calibrationErrorDeg.toFixed(2)}°`,
  );
}

/** Re-read every file the manifest lists, so a broken entry fails here and not in the demo. */
async function check(): Promise<number> {
  const manifest = await readManifest();
  if (manifest.recordings.length === 0) {
    console.log("Manifest kosong. Demo cepat akan memakai simulasi dan mengatakannya di laporan.");
    return 0;
  }
  let broken = 0;
  for (const name of manifest.recordings) {
    let inspection;
    try {
      inspection = inspectAuditLog(JSON.parse(await readFile(`${REPLAY_DIR}${name}`, "utf8")), name);
    } catch (error) {
      console.error(`  ${name}\n    tidak terbaca: ${(error as Error).message}`);
      broken += 1;
      continue;
    }
    if (!inspection.ok) {
      console.error(`  ${name}\n    ditolak: ${inspection.reason}`);
      broken += 1;
      continue;
    }
    summarise(name, inspection.recording);
  }
  console.log(
    broken === 0
      ? `${manifest.recordings.length} rekaman terdaftar, semuanya terbaca.`
      : `${broken} dari ${manifest.recordings.length} rekaman rusak.`,
  );
  return broken === 0 ? 0 : 1;
}

async function register(source: string, as: string | null): Promise<number> {
  const name = as ?? basename(source);
  if (!name.endsWith(".json")) {
    console.error(`Nama berkas harus berakhiran .json, bukan "${name}".`);
    return 1;
  }

  let log: unknown;
  try {
    log = JSON.parse(await readFile(resolve(source), "utf8"));
  } catch (error) {
    console.error(`Tidak bisa membaca ${source}: ${(error as Error).message}`);
    return 1;
  }

  const inspection = inspectAuditLog(log, name);
  if (!inspection.ok) {
    console.error(`Ditolak: ${inspection.reason}`);
    console.error("Ekspor ulang dari sesi kamera langsung lewat tombol “Unduh log audit JSON”.");
    return 1;
  }

  await copyFile(resolve(source), `${REPLAY_DIR}${name}`);
  const manifest = await readManifest();
  if (!manifest.recordings.includes(name)) manifest.recordings.push(name);
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log("Terdaftar:");
  summarise(name, inspection.recording);
  console.log(`Manifest kini memuat ${manifest.recordings.length} rekaman.`);
  return 0;
}

function usage(): void {
  console.log("Pemakaian:");
  console.log("  npx tsx scripts/register-recording.ts <audit-log.json> [--as session-a.json]");
  console.log("  npx tsx scripts/register-recording.ts --check");
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    usage();
    return 1;
  }
  if (args[0] === "--help") {
    usage();
    return 0;
  }
  if (args[0] === "--check") return check();

  const asIndex = args.indexOf("--as");
  const as = asIndex === -1 ? null : (args[asIndex + 1] ?? null);
  if (asIndex !== -1 && as === null) {
    console.error("--as butuh nama berkas.");
    return 1;
  }
  // asIndex === -1 would otherwise skip argument 0, which is the usual call.
  const valueIndex = asIndex === -1 ? -1 : asIndex + 1;
  const source = args.find((arg, index) => !arg.startsWith("--") && index !== valueIndex);
  if (source === undefined) {
    usage();
    return 1;
  }
  return register(source, as);
}

process.exit(await main());
