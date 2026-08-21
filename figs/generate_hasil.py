"""Menghasilkan figur hasil untuk paper final Neurogaze.

Seluruh angka dibaca dari artefak di research/hasil/ dan dari ringkasan notebook
final, sehingga figur tidak pernah memuat nilai yang diketik manual di sini
kecuali yang dicantumkan pada blok NOTEBOOK_* di bawah beserta sumbernya.

Keluaran:
  figs/hasil_utama.pdf   tiga panel: ukuran efek, degradasi, kebocoran identitas
  figs/produk.pdf        tiga status laporan dari tangkapan layar PWA v3
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
HASIL = ROOT / "research" / "hasil"
FIGS = ROOT / "figs"
SHOTS = ROOT / "docs" / "screenshots" / "neurogaze-v3"

SPLIT_KEYS = ("train/validation", "train/test", "validation/test")


def load_crossing():
    """Baca audit kebocoran split dari artefak, bukan dari angka yang diketik manual.

    Sumber: research/hasil/cnn_scanpath/audit_kebocoran_split.csv, dihasilkan oleh
    notebook/eyetracking_scanpath.ipynb.
    """
    path = HASIL / "cnn_scanpath" / "audit_kebocoran_split.csv"
    with path.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    first = rows[0].keys()
    label_col = next(iter(first))
    wrong_col = "grouping duplikat visual"
    right_col = "grouping partisipan"
    by_split = {row[label_col]: row for row in rows}
    missing = [k for k in SPLIT_KEYS if k not in by_split]
    if missing:
        raise ValueError(f"{path}: baris split tidak lengkap, hilang {missing}")
    return {
        "Grup duplikat visual": {k: int(by_split[k][wrong_col]) for k in SPLIT_KEYS},
        "Grup participant_id": {k: int(by_split[k][right_col]) for k in SPLIT_KEYS},
    }

TEXT = "#1a1a1a"
GEOM = "#0d665d"
FULL = "#b0563a"
MUTED = "#8a8a8a"

plt.rcParams.update({
    "font.family": "serif",
    "font.serif": ["Nimbus Roman", "Times New Roman", "DejaVu Serif"],
    "font.size": 7,
    "axes.labelsize": 7,
    "axes.titlesize": 7.5,
    "xtick.labelsize": 6.5,
    "ytick.labelsize": 6.5,
    "axes.edgecolor": TEXT,
    "axes.linewidth": 0.6,
    "xtick.major.width": 0.6,
    "ytick.major.width": 0.6,
    "legend.fontsize": 6.5,
    "legend.frameon": False,
})


def panel_effect_size(ax, ablasi):
    geometri = set(ablasi["fitur_geometri"])
    items = sorted(ablasi["cohens_d"].items(), key=lambda kv: abs(kv[1]))[-11:]
    names = [k for k, _ in items]
    values = [v for _, v in items]
    colors = [GEOM if n in geometri else FULL for n in names]
    ax.barh(range(len(items)), values, color=colors, height=0.68)
    ax.axvline(0, color=TEXT, linewidth=0.6)
    for edge in (-0.8, 0.8):
        ax.axvline(edge, color=MUTED, linewidth=0.6, linestyle=(0, (1, 2)))
    ax.set_yticks(range(len(items)))
    ax.set_yticklabels(names)
    ax.set_xlabel("Cohen's $d$ tingkat partisipan")
    ax.set_title("(a) Ukuran efek per fitur", loc="left")
    ax.spines[["top", "right"]].set_visible(False)


def panel_degradation(ax, degradasi):
    order = [
        ("noise_0deg", "bersih\n250 Hz"),
        ("sampling_120hz_proxy", "proxy\n120 Hz"),
        ("sampling_60hz_proxy", "proxy\n60 Hz"),
        ("sampling_30hz_proxy", "proxy\n30 Hz"),
        ("tablet_proxy", "proxy\ntablet"),
    ]
    lookup = {c["condition"]: c for c in degradasi["conditions"]}
    geom = [lookup[k]["sets"]["geometri"]["auc"] for k, _ in order]
    full = [lookup[k]["sets"]["penuh"]["auc"] for k, _ in order]
    x = range(len(order))
    ax.plot(x, geom, "-o", color=GEOM, markersize=3.2, linewidth=1.1, label="13 fitur geometri")
    ax.plot(x, full, "-s", color=FULL, markersize=3.2, linewidth=1.1, label="19 fitur penuh")
    lo = [lookup[k]["sets"]["geometri"]["auc_ci95"][0] for k, _ in order]
    hi = [lookup[k]["sets"]["geometri"]["auc_ci95"][1] for k, _ in order]
    ax.fill_between(x, lo, hi, color=GEOM, alpha=0.12, linewidth=0)
    ax.axhline(0.5, color=MUTED, linewidth=0.6, linestyle=(0, (1, 2)))
    ax.set_xticks(list(x))
    ax.set_xticklabels([label for _, label in order])
    ax.set_ylim(0.45, 0.95)
    ax.set_ylabel("ROC-AUC tingkat anak")
    ax.set_title("(b) Proxy degradasi perangkat", loc="left")
    ax.legend(loc="lower left")
    ax.spines[["top", "right"]].set_visible(False)


def panel_leakage(ax, crossing):
    labels = ["train/\nvalidation", "train/\ntest", "validation/\ntest"]
    wrong = [crossing["Grup duplikat visual"][k] for k in SPLIT_KEYS]
    right = [crossing["Grup participant_id"][k] for k in SPLIT_KEYS]
    x = range(len(labels))
    ax.bar([i - 0.19 for i in x], wrong, width=0.36, color=FULL, label="grup duplikat visual")
    ax.bar([i + 0.19 for i in x], right, width=0.36, color=GEOM, label="grup participant id")
    for i, value in enumerate(wrong):
        ax.text(i - 0.19, value + 1.2, str(value), ha="center", fontsize=6.5, color=TEXT)
    for i, value in enumerate(right):
        ax.text(i + 0.19, value + 1.2, str(value), ha="center", fontsize=6.5, color=TEXT)
    ax.set_xticks(list(x))
    ax.set_xticklabels(labels)
    ax.set_ylim(0, 72)
    ax.set_ylabel("anak yang menyeberang split")
    ax.set_title("(c) Kebocoran identitas, 54 anak", loc="left")
    ax.legend(loc="upper center", ncol=2, columnspacing=1.0, handlelength=1.2)
    ax.spines[["top", "right"]].set_visible(False)


def build_hasil_utama():
    ablasi = json.loads((HASIL / "ablasi.json").read_text(encoding="utf-8"))
    degradasi = json.loads((HASIL / "degradasi.json").read_text(encoding="utf-8"))
    fig, axes = plt.subplots(1, 3, figsize=(5.5, 2.15))
    panel_effect_size(axes[0], ablasi)
    panel_degradation(axes[1], degradasi)
    panel_leakage(axes[2], load_crossing())
    fig.tight_layout(pad=0.35, w_pad=1.4)
    fig.savefig(FIGS / "hasil_utama.pdf", bbox_inches="tight", pad_inches=0.01)
    plt.close(fig)


def build_produk():
    panels = [
        ("08-refer-report.png", "(a) Disarankan dirujuk"),
        ("09-monitor-report.png", "(b) Pantau sesuai SDIDTK"),
        ("10-held-report.png", "(c) Skor tidak dikeluarkan"),
    ]
    hilang = [name for name, _ in panels if not (SHOTS / name).exists()]
    if hilang:
        print(
            "figs/produk.pdf dilewati: tangkapan layar " + ", ".join(hilang) + " tidak ada. "
            "Set neurogaze-v3 dibuang karena menampilkan baterai dan laporan rujukan yang "
            "kode sekarang tidak dapat produksi; ambil ulang dari rekaman sesi terdaftar."
        )
        return
    fig, axes = plt.subplots(1, 3, figsize=(5.5, 2.6))
    for ax, (filename, caption) in zip(axes, panels):
        # Berkas berekstensi .png namun berisi JPEG; PIL menangani keduanya.
        ax.imshow(Image.open(SHOTS / filename).convert("RGB"))
        ax.set_title(caption, loc="left", fontsize=7)
        ax.set_xticks([])
        ax.set_yticks([])
        for spine in ax.spines.values():
            spine.set_color(MUTED)
            spine.set_linewidth(0.5)
    fig.tight_layout(pad=0.3, w_pad=0.8)
    fig.savefig(FIGS / "produk.pdf", bbox_inches="tight", pad_inches=0.01, dpi=220)
    plt.close(fig)


if __name__ == "__main__":
    build_hasil_utama()
    print("figs/hasil_utama.pdf diperbarui")
    build_produk()
