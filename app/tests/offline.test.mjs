import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const required = [
  "public/models/model.json",
  "public/models/ood_reference.json",
  "public/models/participant_reference.json",
  "public/models/vision_model_card.json",
  "public/visuals/neurogaze-state-icons-v1.png",
  "public/mediapipe/face_landmarker.task",
  "public/mediapipe/wasm/vision_wasm_internal.js",
  "public/mediapipe/wasm/vision_wasm_internal.wasm",
  "public/mediapipe/wasm/vision_wasm_module_internal.js",
  "public/mediapipe/wasm/vision_wasm_module_internal.wasm",
  "public/mediapipe/wasm/vision_wasm_nosimd_internal.js",
  "public/mediapipe/wasm/vision_wasm_nosimd_internal.wasm",
  "public/stimuli/geopref-social-geometric-ccby.mp4",
  "public/manifest.webmanifest",
];

test("offline core assets are local and precached", async () => {
  await Promise.all(required.map((path) => access(new URL(path, root))));
  const worker = await readFile(new URL("public/sw.js", root), "utf8");
  for (const path of required.filter((path) => path !== "public/manifest.webmanifest")) {
    assert.match(worker, new RegExp(path.replace("public", "").replaceAll(".", "\\.")));
  }
  assert.doesNotMatch(worker, /https?:\/\//);
  assert.match(worker, /\/_next\\\/static/);
});

test("offline cache has a bumped version and verifies its canonical critical list", async () => {
  const worker = await readFile(new URL("public/sw.js", root), "utf8");
  assert.match(worker, /neurogaze-shell-v20/);
  assert.match(worker, /NEUROGAZE_VERIFY_OFFLINE/);
  assert.match(worker, /NEUROGAZE_OFFLINE_STATUS/);
  assert.match(worker, /caches\.open\(CACHE\)/);
  assert.match(worker, /criticalOfflinePaths/);
  assert.match(worker, /cache\.match\(path\)/);
  assert.match(worker, /if \(!shellResponse\.ok\) throw/);
  assert.match(worker, /matches\[index\]\?\.ok/);
});

test("navigation caching preserves each route and falls back to that route before root", async () => {
  const worker = await readFile(new URL("public/sw.js", root), "utf8");
  const navigation = worker.match(/if \(event\.request\.mode === "navigate"\) \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(navigation, /cache\.put\(event\.request, copy\)/);
  assert.doesNotMatch(navigation, /cache\.put\("\/", copy\)/);
  assert.match(navigation, /cache\.match\(event\.request\)/);
  assert.match(navigation, /cache\.match\("\/"\)/);
  assert.ok(
    navigation.indexOf("cache.match(event.request)") < navigation.indexOf('cache.match("/")'),
    "the requested route must be checked before the root shell",
  );
  assert.match(navigation, /cache\.put\(event\.request, copy\)\.catch/);
});

test("failed network responses never replace usable cached critical assets", async () => {
  const worker = await readFile(new URL("public/sw.js", root), "utf8");
  assert.ok(
    (worker.match(/if \(!response\.ok\) return response/g) ?? []).length >= 2,
    "network-first and cache-first writes must both reject unsuccessful responses",
  );
});
