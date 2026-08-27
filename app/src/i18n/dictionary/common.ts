/**
 * Chrome that appears on more than one surface: navigation, the status
 * cluster, and the handful of verbs that repeat across every screen.
 */
export const id = {
  "nav.aria": "Navigasi utama",
  "nav.menu": "Menu",
  "nav.home": "Beranda",
  "nav.guide": "Panduan & demo",
  "nav.evidence": "Bukti",
  "nav.privacy": "Privasi",
  "nav.technicalPanel": "Panel teknis",

  "chrome.version": "app {version}",
  "chrome.demoStrip": "Peragaan demo",
  "chrome.sessionProgress": "Kemajuan sesi",
  "chrome.skipToContent": "Lewati ke isi utama",

  "action.back": "Kembali",
  "action.backHome": "Beranda",
  "action.close": "Tutup",
  "action.cancel": "Batal",
  "action.continue": "Lanjutkan",
  "action.retry": "Ulangi",
  "action.download": "Unduh",
  "action.print": "Cetak",
  "action.copy": "Salin",
  "action.copied": "Tersalin",

  "language.aria": "Pilih bahasa",
  "language.switchTo": "Ganti ke {language}",
} as const;

export const en: Record<keyof typeof id, string> = {
  "nav.aria": "Main navigation",
  "nav.menu": "Menu",
  "nav.home": "Home",
  "nav.guide": "Guide & demo",
  "nav.evidence": "Evidence",
  "nav.privacy": "Privacy",
  "nav.technicalPanel": "Technical panel",

  "chrome.version": "app {version}",
  "chrome.demoStrip": "Demonstration",
  "chrome.sessionProgress": "Session progress",
  "chrome.skipToContent": "Skip to main content",

  "action.back": "Back",
  "action.backHome": "Home",
  "action.close": "Close",
  "action.cancel": "Cancel",
  "action.continue": "Continue",
  "action.retry": "Retry",
  "action.download": "Download",
  "action.print": "Print",
  "action.copy": "Copy",
  "action.copied": "Copied",

  "language.aria": "Choose language",
  "language.switchTo": "Switch to {language}",
};
