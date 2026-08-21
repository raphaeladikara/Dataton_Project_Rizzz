import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveOfflineReadiness,
  monitorOfflineReadiness,
  verifyCriticalOfflineAssets,
  type OfflineReadinessSnapshot,
} from "../src/offline/readiness";

const base: OfflineReadinessSnapshot = {
  online: true,
  serviceWorkerSupported: true,
  registration: "registered",
  controlled: false,
  verification: "idle",
};

test("offline readiness never treats network connectivity as cached readiness", () => {
  assert.equal(deriveOfflineReadiness(base).status, "preparing");
  assert.equal(
    deriveOfflineReadiness({ ...base, controlled: true, verification: "pending" }).status,
    "preparing",
  );
  assert.equal(
    deriveOfflineReadiness({ ...base, controlled: true, verification: "verified" }).status,
    "ready",
  );
});

test("verified critical assets remain ready after the network goes offline", () => {
  const readiness = deriveOfflineReadiness({
    ...base,
    online: false,
    controlled: true,
    verification: "verified",
  });
  assert.deepEqual(
    { status: readiness.status, label: readiness.label },
    { status: "ready", label: "Siap luring" },
  );
});

test("first install prepares while failures and incomplete caches are explicit", () => {
  const cases: Array<[string, OfflineReadinessSnapshot]> = [
    ["first install", { ...base, registration: "registering" }],
    ["offline before control", { ...base, online: false }],
    ["registration failure", { ...base, registration: "failed" }],
    ["verification timeout", { ...base, controlled: true, verification: "timeout" }],
    ["incomplete cache", { ...base, controlled: true, verification: "incomplete" }],
    [
      "unsupported offline browser",
      { ...base, online: false, serviceWorkerSupported: false, registration: "idle" },
    ],
  ];

  assert.equal(deriveOfflineReadiness(cases[0][1]).label, "Menyiapkan luring");
  for (const [name, snapshot] of cases.slice(1)) {
    assert.equal(
      deriveOfflineReadiness(snapshot).label,
      "Aset luring belum lengkap",
      name,
    );
  }
  assert.equal(
    deriveOfflineReadiness({
      ...base,
      serviceWorkerSupported: false,
      registration: "idle",
    }).label,
    "Online",
  );
});

test("critical verification uses a request-response channel and reports missing assets", async () => {
  const worker = {
    postMessage(message: unknown, transfer: Transferable[]) {
      const request = message as { type: string; requestId: string };
      assert.equal(request.type, "NEUROGAZE_VERIFY_OFFLINE");
      const port = transfer[0] as MessagePort;
      port.postMessage({
        type: "NEUROGAZE_OFFLINE_STATUS",
        requestId: request.requestId,
        complete: false,
        missing: ["/stimuli/geopref-social-geometric-ccby.mp4"],
      });
    },
  };

  const result = await verifyCriticalOfflineAssets(worker, 100);
  assert.deepEqual(result, {
    complete: false,
    missing: ["/stimuli/geopref-social-geometric-ccby.mp4"],
  });
});

test("critical verification times out instead of claiming readiness", async () => {
  const worker = { postMessage() {} };
  await assert.rejects(
    verifyCriticalOfflineAssets(worker, 5),
    (error: unknown) => error instanceof Error && error.message === "OFFLINE_VERIFICATION_TIMEOUT",
  );
});

test("monitor waits for first-install control, then verifies on controllerchange", async () => {
  const listeners = new Set<() => void>();
  const states: string[] = [];
  const container = {
    controller: null as null | { postMessage(message: unknown, transfer: Transferable[]): void },
    register: async () => ({}),
    addEventListener: (_name: "controllerchange", listener: () => void) => listeners.add(listener),
    removeEventListener: (_name: "controllerchange", listener: () => void) => listeners.delete(listener),
  };
  const network = {
    online: true,
    addEventListener() {},
    removeEventListener() {},
  };
  const stop = monitorOfflineReadiness({
    serviceWorker: container,
    network,
    onChange: (state) => states.push(state.status),
    timeoutMs: 100,
  });

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(states.at(-1), "preparing");

  container.controller = {
    postMessage(message, transfer) {
      const request = message as { requestId: string };
      (transfer[0] as MessagePort).postMessage({
        type: "NEUROGAZE_OFFLINE_STATUS",
        requestId: request.requestId,
        complete: true,
        missing: [],
      });
    },
  };
  listeners.forEach((listener) => listener());
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(states.at(-1), "ready");
  stop();
});

test("monitor exposes registration failure without an existing controller", async () => {
  const states: string[] = [];
  const stop = monitorOfflineReadiness({
    serviceWorker: {
      controller: null,
      register: async () => Promise.reject(new Error("registration failed")),
      addEventListener() {},
      removeEventListener() {},
    },
    network: {
      online: true,
      addEventListener() {},
      removeEventListener() {},
    },
    onChange: (state) => states.push(state.status),
    timeoutMs: 100,
  });

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(states.at(-1), "incomplete");
  stop();
});

test("unsupported browsers update from online to incomplete when connectivity is lost", () => {
  const listeners = new Map<string, () => void>();
  const states: string[] = [];
  const network = {
    online: true,
    addEventListener: (name: "online" | "offline", listener: () => void) => {
      listeners.set(name, listener);
    },
    removeEventListener: (name: "online" | "offline") => listeners.delete(name),
  };
  const stop = monitorOfflineReadiness({
    serviceWorker: null,
    network,
    onChange: (state) => states.push(state.status),
  });

  assert.equal(states.at(-1), "online");
  network.online = false;
  listeners.get("offline")?.();
  assert.equal(states.at(-1), "incomplete");
  stop();
});

test("an existing controller does not delay checking for a fresh worker", async () => {
  let registrations = 0;
  const stop = monitorOfflineReadiness({
    serviceWorker: {
      controller: { postMessage() {} },
      register: async () => {
        registrations += 1;
        return {};
      },
      addEventListener() {},
      removeEventListener() {},
    },
    network: {
      online: true,
      addEventListener() {},
      removeEventListener() {},
    },
    onChange() {},
    timeoutMs: 100,
  });

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(registrations, 1);
  stop();
});

test("a failed first install becomes incomplete when the installing worker is redundant", async () => {
  const workerListeners = new Set<() => void>();
  const installing = {
    state: "installing",
    addEventListener: (_name: "statechange", listener: () => void) => workerListeners.add(listener),
    removeEventListener: (_name: "statechange", listener: () => void) => workerListeners.delete(listener),
  };
  const states: string[] = [];
  const stop = monitorOfflineReadiness({
    serviceWorker: {
      controller: null,
      register: async () => ({ installing }),
      addEventListener() {},
      removeEventListener() {},
    },
    network: {
      online: true,
      addEventListener() {},
      removeEventListener() {},
    },
    onChange: (state) => states.push(state.status),
    timeoutMs: 100,
    installationTimeoutMs: 100,
  });

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(states.at(-1), "preparing");
  installing.state = "redundant";
  workerListeners.forEach((listener) => listener());
  assert.equal(states.at(-1), "incomplete");
  stop();
});

test("a first install without control eventually becomes incomplete", async () => {
  const states: string[] = [];
  const stop = monitorOfflineReadiness({
    serviceWorker: {
      controller: null,
      register: async () => ({}),
      addEventListener() {},
      removeEventListener() {},
    },
    network: {
      online: true,
      addEventListener() {},
      removeEventListener() {},
    },
    onChange: (state) => states.push(state.status),
    installationTimeoutMs: 5,
  });

  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(states.at(-1), "incomplete");
  stop();
});
