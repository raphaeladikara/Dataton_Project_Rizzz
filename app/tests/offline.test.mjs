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
