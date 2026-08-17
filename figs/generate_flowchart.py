"""Dua diagram alur Neurogaze.

1. pipeline_riset.pdf  - alur penelitian, dari citra scanpath sampai model
   produksi yang dibekukan.
2. arsitektur.pdf      - arsitektur produk di perangkat, dari sesi kamera
   sampai tiga status laporan.

Tiap tahap adalah kotak abu-abu berlabel yang memuat blok kerja, dan nama
metode ditulis di dalam bloknya sendiri supaya diagram terbaca tanpa teks
pendamping.

Dataset wajah yang ditolak lewat audit tidak muncul di diagram mana pun; audit
itu bukan bagian dari alur yang menghasilkan model.

Lebar konten dikunci pada TARGET_W inci: ukuran font diturunkan bertahap sampai
seluruh kolom muat, sehingga hasilnya tidak pernah terpotong tepi dan tidak
perlu diperkecil lagi oleh LaTeX.

Jalankan: python figs/generate_flowchart.py
"""

from __future__ import annotations

from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

OUT = Path(__file__).resolve().parent

BLUE, BLUE_FILL = "#0f6f9f", "#e8f3f9"
GREEN, GREEN_FILL = "#1d7a4c", "#e6f4ec"
ORANGE, ORANGE_FILL = "#c7460a", "#fff0e9"
GREY, GREY_FILL = "#8a959c", "#f2f4f5"
INK = "#26333c"
LINE = "#43555f"

TARGET_W = 6.4          # lebar konten maksimum, inci
PADX, PADY = 0.085, 0.07
NODE_GAP = 0.15
STAGE_PADX, STAGE_PADY = 0.13, 0.12
STAGE_LABEL_H = 0.24
STAGE_GAP = 0.26
ROW_GAP = 0.42


class Canvas:
    """Kanvas berlebih; hasil akhir dipotong oleh bbox_inches='tight'."""

    def __init__(self, fs_node, fs_stage, fs_note):
        self.fs_node, self.fs_stage, self.fs_note = fs_node, fs_stage, fs_note
        self.fig, self.ax = plt.subplots(figsize=(16, 12))
        self.ax.set_xlim(0, 16)
        self.ax.set_ylim(0, 12)
        self.ax.axis("off")
        self.fig.canvas.draw()
        self.rend = self.fig.canvas.get_renderer()

    def measure(self, text, fontsize, bold=False):
        t = self.ax.text(0, 0, text, ha="center", va="center", fontsize=fontsize,
                         fontweight="bold" if bold else "normal")
        bb = t.get_window_extent(renderer=self.rend).transformed(
            self.ax.transData.inverted())
        t.remove()
        return bb.width, bb.height

    def box(self, x0, y0, w, h, *, edge, fill, lw=1.0, z=3):
        self.ax.add_patch(FancyBboxPatch(
            (x0, y0), w, h, boxstyle="round,pad=0,rounding_size=0.06",
            linewidth=lw, edgecolor=edge, facecolor=fill, zorder=z))

    def text(self, x, y, s, fontsize, *, bold=False, color=INK, ha="center",
             va="center", z=5, style="normal"):
        self.ax.text(x, y, s, fontsize=fontsize, ha=ha, va=va, color=color,
                     fontweight="bold" if bold else "normal", zorder=z,
                     style=style, linespacing=1.25)

    def arrow(self, start, end, z=4):
        self.ax.add_patch(FancyArrowPatch(
            start, end, arrowstyle="-|>", mutation_scale=6, linewidth=0.8,
            color=LINE, zorder=z, shrinkA=0, shrinkB=0))

    def line(self, xs, ys, z=4):
        self.ax.plot(xs, ys, color=LINE, linewidth=0.8, zorder=z,
                     solid_capstyle="round", solid_joinstyle="round")

    def save(self, name, bbox, pad=0.06):
        """bbox = (x0, x1, y0, y1) dalam unit data; 1 unit data = 1 inci."""
        x0, x1, y0, y1 = bbox
        x0, x1, y0, y1 = x0 - pad, x1 + pad, y0 - pad, y1 + pad
        self.ax.set_position([0, 0, 1, 1])
        self.ax.set_xlim(x0, x1)
        self.ax.set_ylim(y0, y1)
        self.fig.set_size_inches(x1 - x0, y1 - y0)
        self.fig.savefig(OUT / name, pad_inches=0)
        plt.close(self.fig)


class Node:
    def __init__(self, canvas, text, *, edge=BLUE, fill=BLUE_FILL, bold=False):
        self.c, self.label = canvas, text
        self.edge, self.fill, self.bold = edge, fill, bold
        tw, th = canvas.measure(text, canvas.fs_node, bold)
        self.w, self.h = tw + 2 * PADX, th + 2 * PADY

    def draw(self, x0, ytop):
        self.x0, self.ytop = x0, ytop
        self.c.box(x0, ytop - self.h, self.w, self.h, edge=self.edge,
                   fill=self.fill)
        self.c.text(x0 + self.w / 2, ytop - self.h / 2, self.label,
                    self.c.fs_node, bold=self.bold)
        return self

    @property
    def cx(self):
        return self.x0 + self.w / 2

    @property
    def ybot(self):
        return self.ytop - self.h


class Stage:
    def __init__(self, canvas, label, nodes):
        self.c, self.label, self.nodes = canvas, label, nodes
        lw, _ = canvas.measure(label, canvas.fs_stage, bold=True)
        self.inner_w = max([n.w for n in nodes] + [lw])
        self.w = self.inner_w + 2 * STAGE_PADX
        self.h = (sum(n.h for n in nodes) + NODE_GAP * (len(nodes) - 1)
                  + 2 * STAGE_PADY + STAGE_LABEL_H)

    def draw(self, x0, cy):
        self.x0, self.cy = x0, cy
        y0 = cy - self.h / 2
        self.c.box(x0, y0, self.w, self.h, edge=GREY, fill=GREY_FILL, lw=0.8,
                   z=1)
        self.c.text(x0 + self.w / 2, y0 + self.h - STAGE_LABEL_H / 2 - 0.02,
                    self.label, self.c.fs_stage, bold=True, color="#4a575f")
        ytop = y0 + self.h - STAGE_LABEL_H - STAGE_PADY + 0.03
        for i, n in enumerate(self.nodes):
            n.draw(x0 + STAGE_PADX + (self.inner_w - n.w) / 2, ytop)
            if i:
                prev = self.nodes[i - 1]
                self.c.arrow((prev.cx, prev.ybot), (n.cx, n.ytop))
            ytop -= n.h + NODE_GAP
        return self

    @property
    def x1(self):
        return self.x0 + self.w

    @property
    def ybot(self):
        return self.cy - self.h / 2


def draw_row(c, stages, x0, cy, direction=1):
    """direction 1: panah kiri ke kanan. -1: panah kanan ke kiri."""
    x = x0
    for s in stages:
        s.draw(x, cy)
        x = s.x1 + STAGE_GAP
    for i in range(len(stages) - 1):
        a, b = stages[i], stages[i + 1]
        if direction == 1:
            c.arrow((a.x1, cy), (b.x0, cy))
        else:
            c.arrow((b.x0, cy), (a.x1, cy))


# ---------------------------------------------------------------- diagram 1
def build_pipeline(fs):
    c = Canvas(fs, fs + 0.5, fs - 0.3)
    n = lambda t, **kw: Node(c, t, **kw)

    s1 = Stage(c, "1. Sumber data", [
        n("Carette dkk. (2019)\n547 citra scanpath 640$\\times$480"),
        n("54 anak: 26 ASD, 28 kontrol\n1-23 rekaman per anak"),
    ])
    s2 = Stage(c, "2. Praproses dan fitur", [
        n("Masker tinta pada raster RGB\n(ambang intensitas 0,02)"),
        n("13 fitur geometri: cakupan,\ndispersi, pusat, radial, entropi"),
        n("6 fitur kinematik dari kanal\nwarna: kecepatan, akselerasi,\njerk, rasio fiksasi/sakade"),
    ])
    s3 = Stage(c, "3. Pemisahan berkelompok", [
        n("GroupKFold bersarang,\ngrup = participant id"),
        n("5 lipatan luar: uji tertahan\n4 lipatan dalam: kalibrasi,\npemilihan ambang"),
        n("Assertion irisan anak = 0;\npipeline berhenti bila gagal",
          edge=ORANGE, fill=ORANGE_FILL),
    ])
    s4 = Stage(c, "4. Pelatihan dan kalibrasi", [
        n("Standardisasi, lalu 5 keluarga\nmodel: LR, SVM-RBF, NB,\nRandom Forest, Gradient Boosting"),
        n("CNN EfficientNetB0 pada citra,\npembanding representasi"),
        n("Platt scaling di lipatan validasi\n+ ambang target sensitivitas 0,9"),
    ])
    s5 = Stage(c, "5. Evaluasi tertahan", [
        n("Agregasi ke tingkat anak"),
        n("AUC anak + CI bootstrap\nyang meresampel anak"),
        n("Titik kerja, matriks kebingungan,\nanalisis kesalahan"),
    ])
    s6 = Stage(c, "6. Ketahanan dan keputusan", [
        n("Degradasi: proxy 30 Hz, derau,\ndropout, jitter pose"),
        n("Kontrol negatif: unit grup diganti,\npenyeberangan split dihitung"),
        n("Model produksi dibekukan:\nLR 13 fitur $\\rightarrow$ model.json",
          edge=GREEN, fill=GREEN_FILL, bold=True),
    ])

    top = [s1, s2, s3]
    bot = [s6, s5, s4]
    w_top = sum(s.w for s in top) + STAGE_GAP * 2
    w_bot = sum(s.w for s in bot) + STAGE_GAP * 2
    width = max(w_top, w_bot)
    return c, (s1, s2, s3, s4, s5, s6), top, bot, w_top, w_bot, width


def pipeline_riset():
    fs = 6.2
    while True:
        c, S, top, bot, w_top, w_bot, width = build_pipeline(fs)
        if width <= TARGET_W or fs <= 4.2:
            break
        plt.close(c.fig)
        fs -= 0.15

    s1, s2, s3, s4, s5, s6 = S
    h_top = max(s.h for s in top)
    h_bot = max(s.h for s in bot)
    cy_top = 10.0
    cy_bot = cy_top - h_top / 2 - ROW_GAP - h_bot / 2

    draw_row(c, top, (width - w_top) / 2, cy_top, direction=1)
    draw_row(c, bot, (width - w_bot) / 2, cy_bot, direction=-1)

    # sambungan tahap 3 (kanan atas) ke tahap 4 (kanan bawah)
    x_link = max(s3.x1, s4.x1) + 0.18
    c.line([s3.x1, x_link, x_link], [cy_top, cy_top, cy_bot])
    c.arrow((x_link, cy_bot), (s4.x1, cy_bot))

    y_note = min(s.ybot for s in bot) - 0.14
    c.text(width / 2, y_note,
           "Lipatan uji tertahan tidak pernah dipakai untuk memilih model, fitur, "
           "maupun ambang.",
           c.fs_note, color="#5d6a72", style="italic", va="top")
    c.save("pipeline_riset.pdf",
           (0, max(width, x_link + 0.05), y_note - 0.16, cy_top + h_top / 2))


# ---------------------------------------------------------------- diagram 2
def build_arsitektur(fs):
    c = Canvas(fs, fs + 0.5, fs - 0.3)
    n = lambda t, **kw: Node(c, t, **kw)

    s1 = Stage(c, "A. Akuisisi di titik layanan", [
        n("Kader dan anak 16-30 bulan;\ntablet Android, kamera depan 30 fps"),
        n("Kalibrasi grid $\\geq$ 7 posisi + koreksi\npusat; galat dilaporkan dalam derajat"),
        n("Stimulus 66 detik, 10 fase\n(8 fase berskor, isyarat kiri/kanan)"),
    ])
    s2 = Stage(c, "B. Estimasi pandangan dan scanpath", [
        n("MediaPipe Face Landmarker (WASM lokal):\n478 landmark, pusat iris kiri dan kanan"),
        n("Koordinat lokal mata + pose kepala,\nproyeksi affine iris ke layar $(x,y)$"),
        n("Penapisan sampel: di luar margin 0,12,\nlompatan antar-sampel $>$ 0,65"),
        n("Segmentasi per fase, jeda $>$ 180 ms;\nEMA $\\alpha = 0{,}42$, resample 50 ms"),
        n("Pemetaan AOI, lalu raster 640$\\times$480"),
    ])
    s3 = Stage(c, "C. Inferensi terkalibrasi", [
        n("13 fitur geometri (features.ts),\nparitas $10^{-12}$ terhadap Python"),
        n("model.json: skaler, koefisien\nregresi logistik, kalibrator Platt"),
        n("Probabilitas terkalibrasi; ambang\ndisetel per kapasitas rujukan"),
    ])
    return c, (s1, s2, s3)


GATE_TEXT = ("Quality gate (evaluateSessionValidity): cakupan fase, deteksi wajah dan "
             "iris, sinkronisasi fase, kontrak sesi,\nserta deteksi gaze beku, terbalik, "
             "terkunci di pusat, atau melompat acak")


def arsitektur():
    fs = 6.2
    while True:
        c, S = build_arsitektur(fs)
        s1, s2, s3 = S
        w_row = s1.w + s2.w + s3.w + STAGE_GAP * 2
        gate_probe = Node(c, GATE_TEXT, edge=ORANGE, fill=ORANGE_FILL, bold=True)
        width = max(w_row, gate_probe.w)
        if width <= TARGET_W or fs <= 4.2:
            break
        plt.close(c.fig)
        fs -= 0.15

    h1 = max(s.h for s in S)
    cy1 = 10.0
    draw_row(c, [s1, s2, s3], (width - w_row) / 2, cy1, direction=1)

    gate = Node(c, GATE_TEXT, edge=ORANGE, fill=ORANGE_FILL, bold=True)
    gy = min(s.ybot for s in S) - 0.30
    gate.draw((width - gate.w) / 2, gy)
    c.arrow((s3.x0 + s3.w / 2, s3.ybot), (s3.x0 + s3.w / 2, gy))

    outs = [
        Node(c, "Disarankan dirujuk", edge=GREEN, fill=GREEN_FILL),
        Node(c, "Pantau sesuai SDIDTK", edge=BLUE, fill=BLUE_FILL),
        Node(c, "Keputusan ditahan\n+ alasan tindak lanjut", edge=ORANGE,
             fill=ORANGE_FILL),
    ]
    ogap = 0.26
    ow = sum(o.w for o in outs) + ogap * (len(outs) - 1)
    oy = gate.ybot - 0.32
    ox = (width - ow) / 2
    for o in outs:
        o.draw(ox, oy)
        c.arrow((o.cx, gate.ybot), (o.cx, oy))
        ox = o.x0 + o.w + ogap

    y_note = min(o.ybot for o in outs) - 0.13
    c.text(width / 2, y_note,
           "Tahap A sampai C berjalan di dalam browser tanpa jaringan. Rekaman mentah tidak "
           "diunggah maupun disimpan; yang bertahan\nhanya fitur dan skor pseudonim, beserta "
           "versi aplikasi, model, dan stimulus yang menghasilkannya.",
           c.fs_note, color="#5d6a72", style="italic", va="top")
    c.save("arsitektur.pdf", (0, width, y_note - 0.26, cy1 + h1 / 2))


if __name__ == "__main__":
    pipeline_riset()
    arsitektur()
    print("ok")
