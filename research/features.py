"""Ekstraksi fitur scanpath Neurogaze — satu sumber kebenaran.

Modul ini sengaja berupa `.py`, bukan sel notebook, karena tiga hal memakainya
bersama-sama dan angkanya harus identik di ketiganya:

1. notebook riset (`01_ablasi_fitur`, `02_training`, `03_degradasi`);
2. `tests/test_feature_parity.py`, yang membandingkan keluaran fungsi di sini
   terhadap port JavaScript di dalam app;
3. ekspor `model.json` yang di-load produk saat inferensi.

Implementasi `features_from_rgb` sengaja dipertahankan identik dengan
`recompute_metrics.py` di root supaya angka preliminary tetap bisa direproduksi.
Jangan ubah konstanta atau urutan kunci tanpa menjalankan ulang seluruh notebook.

--------------------------------------------------------------------------
Dua kelompok fitur
--------------------------------------------------------------------------
Citra Carette meng-encode kinematika pandangan ke dalam kanal warna: kanal R
dibaca sebagai kecepatan, G sebagai percepatan, B sebagai jerk, dan rasio
fiksasi/sakade diturunkan dari perbandingan antar kanal. Skema Carette sudah
terdokumentasi (R = velocity, G = acceleration, B = jerk), tetapi enam fitur ini
tetap terikat pada perekaman 250 Hz dan normalisasi dataset tersebut.

Kamera tablet menghasilkan deret (x, y, t) pada sekitar 30 fps, bukan PNG 250 Hz
ber-encoding Carette. Karena turunan tinggi—terutama jerk—menguatkan noise pada
sampling rendah, kelayakan enam fitur ini harus ditentukan oleh studi degradasi.

Tiga belas fitur sisanya murni geometri sebaran tinta: tidak membaca warna sama
sekali, hanya posisi piksel bertinta. Fitur-fitur ini dapat dihitung dari
scanpath apa pun, dari perangkat apa pun.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image

RANDOM_STATE = 42
GRID = 8
INK_THRESHOLD = 0.02

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "autism eye tracking dataset"

# Fitur yang hanya membaca posisi piksel bertinta. Dapat dihitung dari scanpath
# perangkat apa pun, termasuk hasil render deret (x, y, t) dari kamera tablet.
GEOMETRY_FEATURES = [
    "ink_frac",
    "centroid_x",
    "centroid_y",
    "std_x",
    "std_y",
    "span_x",
    "span_y",
    "radial_mean",
    "radial_std",
    "grid_entropy",
    "n_active_cells",
    "bbox_fill",
    "aspect_ratio",
]

# Fitur yang membaca kanal warna, jadi terikat pada skema encoding Carette.
KINEMATIC_FEATURES = [
    "vel_mean",
    "vel_std",
    "acc_mean",
    "jerk_mean",
    "fixation_ratio",
    "saccade_ratio",
]

# Urutan gabungan mengikuti urutan penyisipan kunci di features_from_rgb, supaya
# matriks fitur identik dengan yang dipakai recompute_metrics.py.
ALL_FEATURES = [
    "ink_frac",
    "centroid_x",
    "centroid_y",
    "std_x",
    "std_y",
    "span_x",
    "span_y",
    "radial_mean",
    "radial_std",
    "vel_mean",
    "vel_std",
    "acc_mean",
    "jerk_mean",
    "fixation_ratio",
    "saccade_ratio",
    "grid_entropy",
    "n_active_cells",
    "bbox_fill",
    "aspect_ratio",
]

FEATURE_SETS = {
    "penuh": ALL_FEATURES,
    "geometri": GEOMETRY_FEATURES,
}

# Nilai default ketika citra praktis kosong; sama persis dengan ZERO_KEYS di
# recompute_metrics.py (semua fitur selain ink_frac).
ZERO_KEYS = [f for f in ALL_FEATURES if f != "ink_frac"]


def features_from_rgb(a: np.ndarray) -> dict[str, float]:
    """Hitung 19 fitur dari citra RGB float dalam rentang [0, 1].

    Identik dengan implementasi di `recompute_metrics.py`. Perubahan apa pun di
    sini mengubah angka preliminary, jadi jangan disentuh tanpa alasan kuat.
    """
    H, W = a.shape[:2]
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    ink = a.sum(axis=2) > INK_THRESHOLD

    f: dict[str, float] = {}
    n_ink = int(ink.sum())
    f["ink_frac"] = n_ink / (H * W)
    if n_ink < 5:
        for k in ZERO_KEYS:
            f[k] = 0.0
        return f

    ys, xs = np.nonzero(ink)
    xn, yn = xs / W, ys / H
    f["centroid_x"], f["centroid_y"] = xn.mean(), yn.mean()
    f["std_x"], f["std_y"] = xn.std(), yn.std()
    f["span_x"] = xn.max() - xn.min()
    f["span_y"] = yn.max() - yn.min()
    rad = np.hypot(xn - xn.mean(), yn - yn.mean())
    f["radial_mean"], f["radial_std"] = rad.mean(), rad.std()

    r_i, g_i, b_i = R[ink], G[ink], B[ink]
    f["vel_mean"], f["vel_std"] = r_i.mean(), r_i.std()
    f["acc_mean"], f["jerk_mean"] = g_i.mean(), b_i.mean()

    denom = max(n_ink, 1)
    f["fixation_ratio"] = ((r_i < g_i * 0.6) & (r_i < b_i * 0.6)).sum() / denom
    f["saccade_ratio"] = ((r_i > g_i * 0.9) & (r_i > 0.05)).sum() / denom

    cell = np.zeros((GRID, GRID))
    gi = np.clip((yn * GRID).astype(int), 0, GRID - 1)
    gj = np.clip((xn * GRID).astype(int), 0, GRID - 1)
    np.add.at(cell, (gi, gj), 1)
    p = cell.ravel() / cell.sum()
    p = p[p > 0]
    f["grid_entropy"] = float(-(p * np.log(p)).sum() / np.log(GRID * GRID))
    f["n_active_cells"] = float((cell > 0).sum() / (GRID * GRID))
    f["bbox_fill"] = f["ink_frac"] / max(f["span_x"] * f["span_y"], 1e-9)
    f["aspect_ratio"] = f["span_x"] / max(f["span_y"], 1e-9)
    return f


def extract_features(path: Path) -> dict[str, float]:
    """Baca PNG scanpath lalu hitung fiturnya."""
    arr = np.asarray(Image.open(path).convert("RGB")).astype(np.float64) / 255.0
    return features_from_rgb(arr)


def load_metadata() -> pd.DataFrame:
    """Indeks 547 citra scanpath beserta label dan ID partisipan.

    Pola nama `T{C,S}###_PP.png`: `PP` adalah ID partisipan, dan satu partisipan
    menyumbang banyak citra. Kolom `participant` wajib dipakai sebagai grup pada
    setiap pemisahan data — split acak menyebabkan kebocoran antar-lipatan.
    """
    if not DATA_DIR.is_dir():
        raise FileNotFoundError(f"Folder dataset tidak ditemukan: {DATA_DIR}")

    records = []
    for label, sub, prefix in [(0, "TCImages", "TC"), (1, "TSImages", "TS")]:
        for f in sorted((DATA_DIR / sub).glob("*.png")):
            pid = f.stem.split("_")[1]
            records.append(
                {
                    "path": f,
                    "file": f.name,
                    "label": label,
                    "group": "TD" if label == 0 else "ASD",
                    "participant": f"{prefix}{pid}",
                }
            )
    if not records:
        raise FileNotFoundError(f"Tidak ada PNG di {DATA_DIR}")
    return pd.DataFrame(records)


def feature_frame(meta: pd.DataFrame) -> pd.DataFrame:
    """Ekstrak fitur seluruh citra pada `meta`, kolom mengikuti ALL_FEATURES."""
    frame = pd.DataFrame([extract_features(p) for p in meta.path])
    return frame[ALL_FEATURES]


def select(frame: pd.DataFrame, feature_set: str) -> np.ndarray:
    """Ambil submatriks untuk salah satu kunci di FEATURE_SETS."""
    if feature_set not in FEATURE_SETS:
        raise KeyError(
            f"Set fitur '{feature_set}' tidak dikenal; pilihan: {list(FEATURE_SETS)}"
        )
    return frame[FEATURE_SETS[feature_set]].values
