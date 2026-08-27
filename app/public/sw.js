// Bump this whenever a precached file's CONTENT changes, not only when the file
// list does. Skipping that bump on d3f3aad left browsers pinned to a model.json
// with no operating points, and the only trace was an error nobody logged.
const CACHE = "neurogaze-shell-v21-brand-mark";

/**
 * Paths whose correctness outweighs their size, served network-first with the
 * cache as an offline fallback.
 *
 * Models and stimuli decide what a session measures and what version it claims
 * to be. A stale copy of either produces recordings that are not comparable and
 * says nothing about it, which is worse than a slower first paint. Everything
 * else — the wasm runtime above all — stays cache-first.
 */
const ALWAYS_FRESH = ["/models/", "/stimuli/"];
const CORE = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/visuals/neurogaze-state-icons-v1.png",
  "/models/model.json",
  "/models/ood_reference.json",
  "/models/participant_reference.json",
  "/models/vision_model_card.json",
  "/mediapipe/face_landmarker.task",
  "/mediapipe/wasm/vision_wasm_internal.js",
  "/mediapipe/wasm/vision_wasm_internal.wasm",
  "/mediapipe/wasm/vision_wasm_module_internal.js",
  "/mediapipe/wasm/vision_wasm_module_internal.wasm",
  "/mediapipe/wasm/vision_wasm_nosimd_internal.js",
  "/mediapipe/wasm/vision_wasm_nosimd_internal.wasm",
  "/stimuli/geopref-social-geometric-ccby.mp4"
];

function buildAssetsFromShell(shellHtml) {
  return [
    ...shellHtml.matchAll(/(?:src|href)="((?:\/assets\/|\/_next\/static\/)[^"]+)"/g),
  ].map((match) => match[1]);
}

async function criticalOfflinePaths(cache) {
  const shellResponse = await cache.match("/");
  if (!shellResponse?.ok) return CORE;
  const shellHtml = await shellResponse.text();
  return [...new Set([...CORE, ...buildAssetsFromShell(shellHtml)])];
}

function cacheSuccessfulResponse(request, response) {
  if (!response.ok) return Promise.resolve();
  const copy = response.clone();
  return caches.open(CACHE).then((cache) => cache.put(request, copy));
}

async function cachedOk(request) {
  const cache = await caches.open(CACHE);
  const response = await cache.match(request);
  return response?.ok ? response : undefined;
}

async function navigationFallback(request, networkFailure) {
  return (await cachedOk(request)) || (await cachedOk("/")) || networkFailure;
}

self.addEventListener("install", (event) => {
  const precache = (async () => {
    const cache = await caches.open(CACHE);
    const shellResponse = await fetch("/", { cache: "reload" });
    if (!shellResponse.ok) throw new Error("OFFLINE_SHELL_FETCH_FAILED");
    const shellHtml = await shellResponse.clone().text();
    const buildAssets = buildAssetsFromShell(shellHtml);
    await cache.put("/", shellResponse);
    await cache.addAll([...new Set([...CORE.filter((path) => path !== "/"), ...buildAssets])]);
  })();
  event.waitUntil(Promise.all([precache, self.skipWaiting()]));
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "NEUROGAZE_VERIFY_OFFLINE") return;
  const replyPort = event.ports[0];
  if (!replyPort) return;

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const paths = await criticalOfflinePaths(cache);
      const matches = await Promise.all(paths.map((path) => cache.match(path)));
      const missing = paths.filter((_path, index) => !matches[index]?.ok);
      replyPort.postMessage({
        type: "NEUROGAZE_OFFLINE_STATUS",
        requestId: event.data.requestId,
        cacheVersion: CACHE,
        complete: missing.length === 0,
        missing,
      });
    })().catch(() => {
      replyPort.postMessage({
        type: "NEUROGAZE_OFFLINE_STATUS",
        requestId: event.data.requestId,
        cacheVersion: CACHE,
        complete: false,
        missing: [...CORE],
      });
    }),
  );
});

self.addEventListener("activate", (event) => {
  const cleanup = caches
    .keys()
    .then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    );
  event.waitUntil(Promise.all([cleanup, self.clients.claim()]));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    const networkResponse = fetch(event.request);
    const cacheWrite = networkResponse
      .then((response) => cacheSuccessfulResponse(event.request, response))
      .catch(() => undefined);
    event.respondWith(
      networkResponse
        .then((response) =>
          response.ok ? response : navigationFallback(event.request, response),
        )
        .catch(() => navigationFallback(event.request)),
    );
    event.waitUntil(cacheWrite);
    return;
  }
  const path = requestUrl.pathname;
  if (ALWAYS_FRESH.some((prefix) => path.startsWith(prefix))) {
    const networkResponse = fetch(event.request);
    const cacheWrite = networkResponse
      .then((response) => cacheSuccessfulResponse(event.request, response))
      .catch(() => undefined);
    event.respondWith(
      networkResponse
        .then(async (response) =>
          response.ok ? response : (await cachedOk(event.request)) || response,
        )
        .catch(() => cachedOk(event.request)),
    );
    event.waitUntil(cacheWrite);
    return;
  }
  const responseAndCache = caches.match(event.request).then(async (cached) => {
    if (cached) return { response: cached, cacheWrite: Promise.resolve() };
    const response = await fetch(event.request);
    return {
      response,
      cacheWrite: cacheSuccessfulResponse(event.request, response),
    };
  });
  event.respondWith(responseAndCache.then(({ response }) => response));
  event.waitUntil(
    responseAndCache
      .then(({ cacheWrite }) => cacheWrite)
      .catch(() => undefined),
  );
});
