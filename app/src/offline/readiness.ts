export const OFFLINE_CACHE_VERSION = "neurogaze-shell-v20-offline-readiness";

export type OfflineReadinessStatus = "online" | "preparing" | "ready" | "incomplete";

export type OfflineReadinessSnapshot = {
  online: boolean;
  serviceWorkerSupported: boolean;
  registration: "idle" | "registering" | "registered" | "failed";
  controlled: boolean;
  verification: "idle" | "pending" | "verified" | "incomplete" | "timeout";
};

export type OfflineReadiness = {
  status: OfflineReadinessStatus;
  label: string;
  detail: string;
};

export function deriveOfflineReadiness(snapshot: OfflineReadinessSnapshot): OfflineReadiness {
  if (snapshot.controlled && snapshot.verification === "verified") {
    return {
      status: "ready",
      label: "Siap luring",
      detail: "Semua aset penting sudah tersimpan di perangkat.",
    };
  }

  if (!snapshot.serviceWorkerSupported) {
    return snapshot.online
      ? {
          status: "online",
          label: "Online",
          detail: "Peramban ini tidak mendukung penyimpanan luring.",
        }
      : {
          status: "incomplete",
          label: "Aset luring belum lengkap",
          detail: "Peramban ini tidak mendukung penyimpanan luring.",
        };
  }

  if (snapshot.registration === "failed") {
    return {
      status: "incomplete",
      label: "Aset luring belum lengkap",
      detail: "Pendaftaran penyimpanan luring gagal. Coba muat ulang saat terhubung.",
    };
  }

  if (snapshot.verification === "timeout") {
    return {
      status: "incomplete",
      label: "Aset luring belum lengkap",
      detail: "Pemeriksaan aset luring tidak merespons. Coba muat ulang.",
    };
  }

  if (snapshot.verification === "incomplete") {
    return {
      status: "incomplete",
      label: "Aset luring belum lengkap",
      detail: "Satu atau lebih aset penting belum tersimpan.",
    };
  }

  if (!snapshot.online) {
    return {
      status: "incomplete",
      label: "Aset luring belum lengkap",
      detail: "Hubungkan perangkat untuk menyelesaikan unduhan aset luring.",
    };
  }

  if (
    snapshot.registration === "registering" ||
    snapshot.registration === "registered" ||
    snapshot.controlled
  ) {
    return {
      status: "preparing",
      label: "Menyiapkan luring",
      detail: "Mengunduh dan memeriksa aset penting di latar belakang.",
    };
  }

  return {
    status: "online",
    label: "Online",
    detail: "Kesiapan luring belum diperiksa.",
  };
}

export async function verifyCriticalOfflineAssets(
  worker: { postMessage(message: unknown, transfer: Transferable[]): void },
  timeoutMs: number,
): Promise<{ complete: boolean; missing: string[]; cacheVersion: string | null }> {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const channel = new MessageChannel();

  return new Promise((resolve, reject) => {
    const finish = () => {
      clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
    };
    const timer = setTimeout(() => {
      finish();
      reject(new Error("OFFLINE_VERIFICATION_TIMEOUT"));
    }, timeoutMs);

    channel.port1.onmessage = (event: MessageEvent<unknown>) => {
      const response = event.data as {
        type?: unknown;
        requestId?: unknown;
        complete?: unknown;
        missing?: unknown;
        cacheVersion?: unknown;
      };
      if (
        response.type !== "NEUROGAZE_OFFLINE_STATUS" ||
        response.requestId !== requestId
      ) return;

      finish();
      if (
        typeof response.complete !== "boolean" ||
        !Array.isArray(response.missing) ||
        !response.missing.every((path) => typeof path === "string")
      ) {
        reject(new Error("OFFLINE_VERIFICATION_INVALID_RESPONSE"));
        return;
      }
      const cacheVersion =
        typeof response.cacheVersion === "string" ? response.cacheVersion : null;
      resolve({
        complete: response.complete && cacheVersion === OFFLINE_CACHE_VERSION,
        missing: response.missing,
        cacheVersion,
      });
    };
    try {
      worker.postMessage(
        {
          type: "NEUROGAZE_VERIFY_OFFLINE",
          requestId,
          expectedCacheVersion: OFFLINE_CACHE_VERSION,
        },
        [channel.port2],
      );
    } catch (error) {
      finish();
      reject(error);
    }
  });
}

type OfflineWorker = {
  postMessage(message: unknown, transfer: Transferable[]): void;
};

type OfflineInstallingWorker = {
  state: string;
  addEventListener(name: "statechange" | "error", listener: () => void): void;
  removeEventListener(name: "statechange" | "error", listener: () => void): void;
};

type OfflineRegistration = {
  installing?: OfflineInstallingWorker | null;
  waiting?: OfflineInstallingWorker | null;
};

type OfflineServiceWorkerContainer = {
  controller: OfflineWorker | null;
  register(scriptURL: string): Promise<OfflineRegistration>;
  addEventListener(name: "controllerchange", listener: () => void): void;
  removeEventListener(name: "controllerchange", listener: () => void): void;
};

type OfflineNetwork = {
  readonly online: boolean;
  addEventListener(name: "online" | "offline", listener: () => void): void;
  removeEventListener(name: "online" | "offline", listener: () => void): void;
};

export function monitorOfflineReadiness(options: {
  serviceWorker: OfflineServiceWorkerContainer | null;
  network: OfflineNetwork;
  onChange(readiness: OfflineReadiness): void;
  timeoutMs?: number;
  installationTimeoutMs?: number;
}): () => void {
  const {
    serviceWorker,
    network,
    onChange,
    timeoutMs = 15_000,
    installationTimeoutMs = 120_000,
  } = options;
  let stopped = false;
  let verificationAttempt = 0;
  let registrationAttempt = 0;
  let installationTimer: ReturnType<typeof setTimeout> | undefined;
  let installingWorker: OfflineInstallingWorker | null | undefined;
  let installationListener: (() => void) | undefined;
  let installationErrorListener: (() => void) | undefined;
  let snapshot: OfflineReadinessSnapshot = {
    online: network.online,
    serviceWorkerSupported: serviceWorker !== null,
    registration: "idle",
    controlled: Boolean(serviceWorker?.controller),
    verification: "idle",
  };

  const update = (change: Partial<OfflineReadinessSnapshot>) => {
    if (stopped) return;
    snapshot = { ...snapshot, ...change };
    onChange(deriveOfflineReadiness(snapshot));
  };

  const clearInstallationWatch = () => {
    if (installationTimer) clearTimeout(installationTimer);
    installationTimer = undefined;
    if (installingWorker && installationListener) {
      installingWorker.removeEventListener("statechange", installationListener);
    }
    if (installingWorker && installationErrorListener) {
      installingWorker.removeEventListener("error", installationErrorListener);
    }
    installingWorker = undefined;
    installationListener = undefined;
    installationErrorListener = undefined;
  };

  const failInstallation = () => {
    clearInstallationWatch();
    update({ registration: "failed", controlled: false, verification: "incomplete" });
  };

  const watchInstallation = (registration: OfflineRegistration) => {
    clearInstallationWatch();
    installingWorker = registration.installing ?? registration.waiting;
    installationListener = () => {
      if (installingWorker?.state === "redundant") failInstallation();
    };
    installationErrorListener = failInstallation;
    if (installingWorker) {
      installingWorker.addEventListener("statechange", installationListener);
      installingWorker.addEventListener("error", installationErrorListener);
      installationListener();
      return;
    }
    installationTimer = setTimeout(() => {
      clearInstallationWatch();
      if (!serviceWorker?.controller) update({ controlled: false, verification: "timeout" });
    }, installationTimeoutMs);
  };

  const verifyController = async () => {
    const worker = serviceWorker?.controller;
    const attempt = ++verificationAttempt;
    if (!worker) {
      update({ controlled: false, verification: "idle" });
      return;
    }

    update({ controlled: true, verification: "pending" });
    try {
      const result = await verifyCriticalOfflineAssets(worker, timeoutMs);
      if (stopped || attempt !== verificationAttempt) return;
      update({ verification: result.complete ? "verified" : "incomplete" });
    } catch (error) {
      if (stopped || attempt !== verificationAttempt) return;
      update({
        verification:
          error instanceof Error && error.message === "OFFLINE_VERIFICATION_TIMEOUT"
            ? "timeout"
            : "incomplete",
      });
    }
  };

  const register = async () => {
    if (!serviceWorker) return;
    const attempt = ++registrationAttempt;
    if (!network.online && !serviceWorker.controller) {
      update({ online: false, controlled: false, verification: "incomplete" });
      return;
    }

    if (serviceWorker.controller) {
      if (!network.online) {
        update({ registration: "registered" });
        await verifyController();
        return;
      }

      update({ registration: "registering", verification: "idle" });
      try {
        const registration = await serviceWorker.register("/sw.js");
        if (stopped || attempt !== registrationAttempt) return;
        update({ registration: "registered" });
        if (registration.installing || registration.waiting) {
          watchInstallation(registration);
          return;
        }
        await verifyController();
      } catch {
        if (stopped || attempt !== registrationAttempt) return;
        update({ registration: "failed", verification: "incomplete" });
        await verifyController();
      }
      return;
    }

    update({ registration: "registering", verification: "idle" });
    try {
      const registration = await serviceWorker.register("/sw.js");
      if (stopped || attempt !== registrationAttempt) return;
      update({ registration: "registered" });
      if (!serviceWorker.controller) watchInstallation(registration);
      await verifyController();
    } catch {
      if (stopped || attempt !== registrationAttempt) return;
      update({ registration: "failed", controlled: false, verification: "incomplete" });
    }
  };

  const handleControllerChange = () => {
    clearInstallationWatch();
    update({ registration: "registered" });
    void verifyController();
  };
  const handleNetworkChange = () => {
    update({ online: network.online });
    if (serviceWorker?.controller) void verifyController();
    else if (network.online) void register();
    else update({ controlled: false, verification: "incomplete" });
  };

  onChange(deriveOfflineReadiness(snapshot));
  network.addEventListener("online", handleNetworkChange);
  network.addEventListener("offline", handleNetworkChange);
  if (serviceWorker) {
    serviceWorker.addEventListener("controllerchange", handleControllerChange);
    void register();
  }

  return () => {
    stopped = true;
    verificationAttempt += 1;
    registrationAttempt += 1;
    clearInstallationWatch();
    serviceWorker?.removeEventListener("controllerchange", handleControllerChange);
    network.removeEventListener("online", handleNetworkChange);
    network.removeEventListener("offline", handleNetworkChange);
  };
}
