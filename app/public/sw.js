const CACHE = "neurogaze-shell-v18-unified-stimulus";
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
  "/mediapipe/wasm/vision_wasm_nosimd_internal.wasm"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const shellResponse = await fetch("/", { cache: "reload" });
      const shellHtml = await shellResponse.clone().text();
      const buildAssets = [
        ...shellHtml.matchAll(/(?:src|href)="((?:\/assets\/|\/_next\/static\/)[^"]+)"/g),
      ].map((match) => match[1]);
      await cache.put("/", shellResponse);
      await cache.addAll([...new Set([...CORE.filter((path) => path !== "/"), ...buildAssets])]);
    })(),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        }),
    ),
  );
});
