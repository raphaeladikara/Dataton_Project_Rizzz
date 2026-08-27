import { DEFAULT_LOCALE, type Locale } from "../i18n/locale";
export const OFFLINE_CACHE_VERSION = "neurogaze-shell-v21-brand-mark";

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
  /**
   * Why the badge says what it says, as a code rather than a sentence.
   *
   * The monitor that produces these runs inside an effect that is set up once,
   * so a readiness computed at mount would keep its original language for the
   * life of the page. `label` and `detail` stay on the object — the contract
   * tests read them, and callers with no locale of their own still get a usable
   * sentence — but the chrome renders from this code instead.
   */
  reason: OfflineReadinessReason;
};

export type OfflineReadinessReason =
  | "ready"
  | "unsupported_online"
  | "unsupported_offline"
  | "registration_failed"
  | "verification_timeout"
  | "assets_missing"
  | "needs_connection"
  | "preparing"
  | "not_checked";

/** Renders a reason code in the reader's language. */
export function offlineReadinessCopy(
  reason: OfflineReadinessReason,
  locale: Locale,
): { label: string; detail: string } {
  const copy = COPY[locale];
  switch (reason) {
    case "ready": return { label: copy.ready, detail: copy.readyDetail };
    case "unsupported_online": return { label: copy.online, detail: copy.unsupported };
    case "unsupported_offline": return { label: copy.incomplete, detail: copy.unsupported };
    case "registration_failed": return { label: copy.incomplete, detail: copy.registrationFailed };
    case "verification_timeout": return { label: copy.incomplete, detail: copy.timeout };
    case "assets_missing": return { label: copy.incomplete, detail: copy.assetsMissing };
    case "needs_connection": return { label: copy.incomplete, detail: copy.needsConnection };
    case "preparing": return { label: copy.preparing, detail: copy.preparingDetail };
    case "not_checked": return { label: copy.online, detail: copy.notChecked };
  }
}


const COPY: Record<Locale, {
  ready: string;
  readyDetail: string;
  online: string;
  incomplete: string;
  unsupported: string;
  registrationFailed: string;
  timeout: string;
  assetsMissing: string;
  needsConnection: string;
  preparing: string;
  preparingDetail: string;
  notChecked: string;
}> = {
  id: {
    ready: "Siap luring",
    readyDetail: "Semua aset penting sudah tersimpan di perangkat.",
    online: "Online",
    incomplete: "Aset luring belum lengkap",
    unsupported: "Peramban ini tidak mendukung penyimpanan luring.",
    registrationFailed: "Pendaftaran penyimpanan luring gagal. Coba muat ulang saat terhubung.",
    timeout: "Pemeriksaan aset luring tidak merespons. Coba muat ulang.",
    assetsMissing: "Satu atau lebih aset penting belum tersimpan.",
    needsConnection: "Hubungkan perangkat untuk menyelesaikan unduhan aset luring.",
    preparing: "Menyiapkan luring",
    preparingDetail: "Mengunduh dan memeriksa aset penting di latar belakang.",
    notChecked: "Kesiapan luring belum diperiksa.",
  },
  en: {
    ready: "Offline-ready",
    readyDetail: "Every critical asset is stored on the device.",
    online: "Online",
    incomplete: "Offline assets incomplete",
    unsupported: "This browser does not support offline storage.",
    registrationFailed: "Offline storage registration failed. Reload while connected.",
    timeout: "The offline asset check did not respond. Try reloading.",
    assetsMissing: "One or more critical assets are not stored yet.",
    needsConnection: "Connect the device to finish downloading the offline assets.",
    preparing: "Preparing offline",
    preparingDetail: "Downloading and verifying critical assets in the background.",
    notChecked: "Offline readiness has not been checked.",
  },
};

export function deriveOfflineReadiness(
  snapshot: OfflineReadinessSnapshot,
  locale: Locale = DEFAULT_LOCALE,
): OfflineReadiness {
  const copy = COPY[locale];
  if (snapshot.controlled && snapshot.verification === "verified") {
    return {
      status: "ready",
      label: copy.ready,
      detail: copy.readyDetail,
      reason: "ready",
    };
  }

  if (!snapshot.serviceWorkerSupported) {
    return snapshot.online
      ? {
          status: "online",
          label: copy.online,
          detail: copy.unsupported,
          reason: "unsupported_online",
        }
      : {
          status: "incomplete",
          label: copy.incomplete,
          detail: copy.unsupported,
          reason: "unsupported_offline",
        };
  }

  if (snapshot.registration === "failed") {
    return {
      status: "incomplete",
      label: copy.incomplete,
      detail: copy.registrationFailed,
      reason: "registration_failed",
    };
  }

  if (snapshot.verification === "timeout") {
    return {
      status: "incomplete",
      label: copy.incomplete,
      detail: copy.timeout,
      reason: "verification_timeout",
    };
  }

  if (snapshot.verification === "incomplete") {
    return {
      status: "incomplete",
      label: copy.incomplete,
      detail: copy.assetsMissing,
      reason: "assets_missing",
    };
  }

  if (!snapshot.online) {
    return {
      status: "incomplete",
      label: copy.incomplete,
      detail: copy.needsConnection,
      reason: "needs_connection",
    };
  }

  if (
    snapshot.registration === "registering" ||
    snapshot.registration === "registered" ||
    snapshot.controlled
  ) {
    return {
      status: "preparing",
      label: copy.preparing,
      detail: copy.preparingDetail,
      reason: "preparing",
    };
  }

  return {
    status: "online",
    label: copy.online,
    detail: copy.notChecked,
    reason: "not_checked",
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
  let activeControllerVerification: Promise<void> | undefined;
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

  const publishInstallationFailure = () => {
    if (serviceWorker?.controller && snapshot.verification === "verified") {
      update({ registration: "registered", controlled: true });
      return;
    }
    update({
      registration: "failed",
      controlled: Boolean(serviceWorker?.controller),
      verification: "incomplete",
    });
  };

  const failInstallation = () => {
    clearInstallationWatch();
    const verification = activeControllerVerification;
    if (verification) {
      void verification.then(publishInstallationFailure);
      return;
    }
    publishInstallationFailure();
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
        const verification = verifyController();
        activeControllerVerification = verification;
        if (registration.installing || registration.waiting) {
          watchInstallation(registration);
        }
        await verification;
        if (activeControllerVerification === verification) {
          activeControllerVerification = undefined;
        }
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
