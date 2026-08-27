"""Rebuild every headline number in this repository from the retained evidence.

The point of this file is a sentence somebody should be able to say out loud and
then prove in one command: *don't trust the table, rebuild it.*

Each step below recomputes a number that appears in the README from the raw
material it came from, not from a summary that was written by hand. Steps run in
order, each one prints what it produced, and the run ends with a table of what
passed. A step that fails does not stop the others; a rebuild that hides its
failures would defeat the purpose.

    python research/rebuild_evidence.py            # rebuild everything
    python research/rebuild_evidence.py --check     # ask the exporters to verify
                                                    # instead of rewrite

Both modes recompute: the analysis steps always read their raw material and
write their own outputs. That is the point, and it is also the strongest check
available, because the last step asks git whether anything under research/hasil
actually moved. A rebuild that lands byte-identical on the committed evidence is
a rebuild nobody has to take on trust.

One step needs material that is not in the repository. `file_positive_control.py`
reads the raw session recordings from `data/`, which is excluded by .gitignore,
so on a fresh clone it has nothing to file. The filed copies it would produce are
committed under `research/hasil/kontrol_positif/sesi/`, which is what every other
step reads, so the chain still rebuilds end to end — that first step is simply
reported as skipped rather than failed.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PYTHON = sys.executable
RAW_RECORDINGS = (ROOT / "data" / "Perlakuan Biasa", ROOT / "data" / "Replikasi Perilaku")


class Step:
    def __init__(self, title: str, proves: str, script: str,
                 args: tuple[str, ...] = (), check_args: tuple[str, ...] | None = None,
                 needs_raw: bool = False) -> None:
        self.title = title
        self.proves = proves
        self.script = script
        self.args = args
        self.check_args = check_args
        self.needs_raw = needs_raw

    def command(self, checking: bool) -> list[str]:
        args = self.check_args if (checking and self.check_args is not None) else self.args
        return [PYTHON, str(ROOT / "research" / self.script), *args]


STEPS = (
    Step(
        "Berkas kontrol positif",
        "SHA-256 tiap rekaman mentah, deteksi duplikat, dan manifes sesi",
        "file_positive_control.py",
        needs_raw=True,
    ),
    Step(
        "Analisis kontrol positif",
        "0/9 biasa dan 4/6 pola diproduksi, dihitung ulang dari jejak gaze mentah",
        "analyze_positive_control.py",
    ),
    Step(
        "Degradasi temporal",
        "drift 69,4% kinematik lawan 1,6% geometri pada desimasi 27 sesi Gate B",
        "temporal_degradation.py",
    ),
    Step(
        "Perbandingan model",
        "AUC 0,882 lawan 0,823 dan bootstrap berpasangan yang menjatuhkan CNN kami",
        "compare_models.py",
    ),
    Step(
        "Parity penjaga OOD",
        "23 keputusan TypeScript di peramban direproduksi Python dari nilai fitur",
        "verify_ood_guard.py",
    ),
    Step(
        "Repositori bukti Gate A/B",
        "130 berkas, 100 sesi Gate A, dan 30 pasangan Gate B terhadap manifes SHA-256",
        "gate_evidence_repository.py",
        args=("--rebuild", "--verify"),
        check_args=("--verify",),
    ),
    Step(
        "Titik operasi model",
        "model.json memuat kedua titik kerja yang dipakai laporan",
        "export_operating_points.py",
        args=("--check",),
    ),
    Step(
        "Matriks kesiapan",
        "tabel kesiapan di README sama dengan generatornya",
        "export_readiness_matrix.py",
        check_args=("--check",),
    ),
    Step(
        "Daftar klaim",
        "tiap angka di README masih cocok dengan berkas bukti kanoniknya",
        "export_claims_register.py",
        check_args=("--check",),
    ),
    Step(
        "Bukti publik Gate B",
        "halaman /validation tidak tertinggal dari bukti kanonis",
        "export_public_evidence.py",
        args=("--check",),
    ),
)


def raw_recordings_present() -> bool:
    return all(folder.is_dir() and any(folder.iterdir()) for folder in RAW_RECORDINGS)


def run(step: Step, checking: bool) -> str:
    print()
    print("=" * 72)
    print(f"  {step.title}")
    print(f"  membuktikan: {step.proves}")
    print("=" * 72)

    if step.needs_raw and not raw_recordings_present():
        missing = ", ".join(str(f.relative_to(ROOT)).replace(os.sep, "/") for f in RAW_RECORDINGS)
        print(f"DILEWATI - rekaman mentah tidak ada di clone ini ({missing}).")
        print("Salinan hasil filenya sudah ter-commit di")
        print("research/hasil/kontrol_positif/sesi/, dan itu yang dibaca langkah berikutnya.")
        return "dilewati"

    completed = subprocess.run(step.command(checking), cwd=ROOT)
    return "ok" if completed.returncode == 0 else "GAGAL"


def snapshot_evidence() -> dict[str, str]:
    """Hash every file under research/hasil so the rebuild can be compared to it."""
    hasil = ROOT / "research" / "hasil"
    return {
        str(path.relative_to(hasil)).replace(os.sep, "/"):
            hashlib.sha256(path.read_bytes()).hexdigest()
        for path in sorted(hasil.rglob("*")) if path.is_file()
    }


def verify_nothing_moved(before: dict[str, str]) -> str:
    """Compare the evidence tree against the snapshot taken before the rebuild.

    Every step above rewrote its own output. If those outputs are genuinely
    derived from the retained material, each file lands byte-identical on what
    was already there. If a number was ever typed in by hand, it moves here.

    This compares against the tree as it stood when the run started rather than
    against the last commit, so it measures determinism and not whether somebody
    happens to have uncommitted work in progress.
    """
    print()
    print("=" * 72)
    print("  Determinisme hasil")
    print("  membuktikan: seluruh berkas di research/hasil kembali byte-identical")
    print("=" * 72)

    after = snapshot_evidence()
    moved = sorted(
        name for name in set(before) | set(after)
        if before.get(name) != after.get(name)
    )
    if not moved:
        print(f"{len(after)} berkas diperiksa, tidak ada yang berubah.")
        print("Angka di README dihasilkan ulang dari bukti, bukan diketik.")
        return "ok"

    print(f"{len(moved)} berkas berubah setelah rebuild:")
    for name in moved[:20]:
        print(f"  {name}")
    if len(moved) > 20:
        print(f"  ... dan {len(moved) - 20} lagi")
    return "GAGAL"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true",
                        help="minta langkah ekspor memverifikasi, bukan menulis ulang")
    args = parser.parse_args()

    mode = "memverifikasi" if args.check else "membangun ulang"
    print(f"NeuroGaze - {mode} bukti dari berkas yang disimpan.")
    print(f"Interpreter: {PYTHON}")

    before = snapshot_evidence()
    results = [(step.title, run(step, args.check)) for step in STEPS]
    results.append(("Determinisme hasil", verify_nothing_moved(before)))

    print()
    print("=" * 72)
    print("  RINGKASAN")
    print("=" * 72)
    width = max(len(title) for title, _ in results)
    for title, outcome in results:
        print(f"  {title.ljust(width)}  {outcome}")

    failed = [title for title, outcome in results if outcome == "GAGAL"]
    skipped = [title for title, outcome in results if outcome == "dilewati"]
    print()
    if failed:
        print(f"{len(failed)} langkah gagal: {', '.join(failed)}")
        raise SystemExit(1)
    if skipped:
        print(f"Selesai. {len(skipped)} langkah dilewati karena materinya tidak ada di clone ini.")
    else:
        print("Selesai. Seluruh langkah berhasil.")


if __name__ == "__main__":
    main()
