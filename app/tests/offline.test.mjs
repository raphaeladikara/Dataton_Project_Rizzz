import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const root = new URL("../", import.meta.url);
const workerSource = await readFile(new URL("public/sw.js", root), "utf8");
const required = [
  "public/favicon.svg",
  "public/manifest.webmanifest",
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
];

const origin = "https://neurogaze.test";
const cacheName = workerSource.match(/const CACHE = "([^"]+)"/)?.[1];
assert.ok(cacheName, "service worker cache name must be declared");

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function requestKey(request) {
  if (typeof request === "string") return new URL(request, origin).href;
  return request.url;
}

function createWorkerHarness() {
  const listeners = new Map();
  const stores = new Map();
  const putGates = new Map();
  let fetchImpl = async (request) => {
    const url = typeof request === "string" ? new URL(request, origin) : new URL(request.url);
    if (url.pathname === "/") {
      return new Response('<script src="/_next/static/app.js"></script>', {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    }
    return new Response(`network:${url.pathname}`, { status: 200 });
  };
  let skipWaitingPromise = Promise.resolve();
  let claimPromise = Promise.resolve();

  class FakeCache {
    constructor() { this.entries = new Map(); }
    async match(request) {
      return this.entries.get(requestKey(request))?.clone();
    }
    async put(request, response) {
      const key = requestKey(request);
      const gate = putGates.get(key);
      if (gate) await gate.promise;
      this.entries.set(key, response.clone());
    }
    async addAll(paths) {
      for (const path of paths) {
        this.entries.set(requestKey(path), new Response(`precache:${path}`, { status: 200 }));
      }
    }
  }

  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new FakeCache());
      return stores.get(name);
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async match(request) {
      for (const cache of stores.values()) {
        const response = await cache.match(request);
        if (response) return response;
      }
      return undefined;
    },
  };

  const self = {
    clients: { claim: () => claimPromise },
    addEventListener: (name, listener) => listeners.set(name, listener),
    skipWaiting: () => skipWaitingPromise,
  };
  runInNewContext(workerSource, {
    self,
    caches,
    fetch: (...args) => fetchImpl(...args),
    Response,
    URL,
    Promise,
    Set,
    Error,
  });

  const lifecycleEvent = () => {
    const waits = [];
    return {
      waits,
      waitUntil(promise) { waits.push(Promise.resolve(promise)); },
    };
  };
  const request = (path, mode = "same-origin") => ({
    method: "GET",
    mode,
    url: new URL(path, origin).href,
  });

  return {
    cache: () => stores.get(cacheName),
    caches,
    delayPut(path) {
      const gate = deferred();
      putGates.set(requestKey(path), gate);
      return gate;
    },
    dispatchActivate() {
      const event = lifecycleEvent();
      listeners.get("activate")(event);
      return event;
    },
    dispatchFetch(path, mode = "same-origin") {
      const event = lifecycleEvent();
      event.request = request(path, mode);
      event.respondWith = (response) => { event.response = Promise.resolve(response); };
      listeners.get("fetch")(event);
      return event;
    },
    dispatchInstall() {
      const event = lifecycleEvent();
      listeners.get("install")(event);
      return event;
    },
    dispatchMessage(data) {
      const event = lifecycleEvent();
      event.data = data;
      event.replies = [];
      event.ports = [{ postMessage: (message) => event.replies.push(message) }];
      listeners.get("message")(event);
      return event;
    },
    request,
    setClaimPromise: (promise) => { claimPromise = promise; },
    setFetch: (implementation) => { fetchImpl = implementation; },
    setSkipWaitingPromise: (promise) => { skipWaitingPromise = promise; },
    stores,
  };
}

async function pendingAfter(milliseconds, promise) {
  return Promise.race([
    promise.then(() => false),
    new Promise((resolve) => setTimeout(() => resolve(true), milliseconds)),
  ]);
}

test("offline core assets are local and precached", async () => {
  await Promise.all(required.map((path) => access(new URL(path, root))));
  for (const path of required) {
    assert.match(workerSource, new RegExp(path.replace("public", "").replaceAll(".", "\\.")));
  }
  assert.doesNotMatch(workerSource, /https?:\/\//);
  assert.match(workerSource, /\/_next\\\/static/);
});

test("offline cache has a bumped version and verifies its canonical critical list", async () => {
  assert.match(workerSource, /neurogaze-shell-v20/);
  assert.match(workerSource, /NEUROGAZE_VERIFY_OFFLINE/);
  assert.match(workerSource, /NEUROGAZE_OFFLINE_STATUS/);
  assert.match(workerSource, /caches\.open\(CACHE\)/);
  assert.match(workerSource, /criticalOfflinePaths/);
});

test("install lifetime retains precache and skipWaiting", async () => {
  const harness = createWorkerHarness();
  const skipWaiting = deferred();
  harness.setSkipWaitingPromise(skipWaiting.promise);
  const event = harness.dispatchInstall();

  assert.equal(event.waits.length, 1);
  assert.equal(await pendingAfter(10, event.waits[0]), true);
  skipWaiting.resolve();
  await event.waits[0];

  const cache = harness.cache();
  for (const path of ["/manifest.webmanifest", "/favicon.svg", "/stimuli/geopref-social-geometric-ccby.mp4", "/_next/static/app.js"]) {
    assert.ok(await cache.match(path), `missing installed asset: ${path}`);
  }
});

test("activate lifetime retains old-cache cleanup and clients.claim", async () => {
  const harness = createWorkerHarness();
  await harness.caches.open("neurogaze-old-cache");
  const claim = deferred();
  harness.setClaimPromise(claim.promise);
  const event = harness.dispatchActivate();

  assert.equal(event.waits.length, 1);
  assert.equal(await pendingAfter(10, event.waits[0]), true);
  claim.resolve();
  await event.waits[0];
  assert.deepEqual(await harness.caches.keys(), []);
});

for (const [name, path] of [
  ["critical freshness", "/models/model.json"],
  ["generic", "/assets/app.js"],
]) {
  test(`${name} cache writes remain in the fetch lifetime without delaying the response`, async () => {
    const harness = createWorkerHarness();
    const cache = await harness.caches.open(cacheName);
    const gate = harness.delayPut(path);
    const event = harness.dispatchFetch(path);

    assert.equal(event.waits.length, 1);
    const response = await event.response;
    assert.equal(await response.text(), `network:${path}`);
    assert.equal(await pendingAfter(10, event.waits[0]), true);
    assert.equal(await cache.match(path), undefined);

    gate.resolve();
    await event.waits[0];
    assert.equal(await (await cache.match(path)).text(), `network:${path}`);
  });
}

test("navigation caches the exact route and falls back to route before root", async () => {
  const harness = createWorkerHarness();
  const cache = await harness.caches.open(cacheName);
  await cache.put("/", new Response("root-shell", { status: 200 }));

  const online = harness.dispatchFetch("/panduan?step=2", "navigate");
  assert.equal(await (await online.response).text(), "network:/panduan");
  await Promise.all(online.waits);
  assert.equal(await (await cache.match(harness.request("/panduan?step=2"))).text(), "network:/panduan");
  assert.equal(await (await cache.match("/")).text(), "root-shell");

  harness.setFetch(async () => Promise.reject(new Error("offline")));
  const exact = harness.dispatchFetch("/panduan?step=2", "navigate");
  assert.equal(await (await exact.response).text(), "network:/panduan");
  const rootFallback = harness.dispatchFetch("/belum-dibuka", "navigate");
  assert.equal(await (await rootFallback.response).text(), "root-shell");
});

test("verification replies from the active cache and names missing critical assets", async () => {
  const harness = createWorkerHarness();
  await Promise.all(harness.dispatchInstall().waits);

  const complete = harness.dispatchMessage({ type: "NEUROGAZE_VERIFY_OFFLINE", requestId: "complete" });
  await Promise.all(complete.waits);
  assert.equal(complete.replies[0].complete, true);
  assert.deepEqual([...complete.replies[0].missing], []);

  harness.cache().entries.delete(requestKey("/stimuli/geopref-social-geometric-ccby.mp4"));
  const incomplete = harness.dispatchMessage({ type: "NEUROGAZE_VERIFY_OFFLINE", requestId: "incomplete" });
  await Promise.all(incomplete.waits);
  assert.equal(incomplete.replies[0].complete, false);
  assert.deepEqual([...incomplete.replies[0].missing], ["/stimuli/geopref-social-geometric-ccby.mp4"]);
});

test("a non-ok network response never replaces a usable critical asset", async () => {
  const harness = createWorkerHarness();
  const cache = await harness.caches.open(cacheName);
  await cache.put("/models/model.json", new Response("usable-model", { status: 200 }));
  harness.setFetch(async () => new Response("server-error", { status: 500 }));

  const event = harness.dispatchFetch("/models/model.json");
  assert.equal((await event.response).status, 500);
  await Promise.all(event.waits);
  assert.equal(await (await cache.match("/models/model.json")).text(), "usable-model");
});
