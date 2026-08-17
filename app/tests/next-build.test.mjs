import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("Next production build contains the Neurogaze route and static assets", async () => {
  await Promise.all([
    access(new URL(".next/BUILD_ID", root)),
    access(new URL(".next/server/app/page.js", root)),
    access(new URL("public/models/model.json", root)),
  ]);
  const manifest = await readFile(new URL(".next/server/app-paths-manifest.json", root), "utf8");
  assert.match(manifest, /"\/page"/);
});
