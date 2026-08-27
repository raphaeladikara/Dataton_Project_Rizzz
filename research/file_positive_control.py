"""File the raw positive-control recordings under research/hasil/kontrol_positif/sesi.

The recordings arrive in two folders named after the condition the operator ran,
and the files inside are numbered per folder. Neither the numbering nor the
folder name survives into the analysis: the condition is read from the log's own
`positiveControl` block wherever it exists, and the file is renamed after the
device it ran on so that nothing downstream has to trust a folder name.

What this script cannot do is recover who each recording belongs to. The
identity field carries the same string in 22 of 24 files, so the participant is
gone and with it any pairing between a person's first and second condition. The
manifest says so in the file rather than leaving a reader to infer it from the
codes looking oddly regular.
"""

from __future__ import annotations

import hashlib
import json
import shutil
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = {"biasa": ROOT / "data" / "Perlakuan Biasa", "produksi": ROOT / "data" / "Replikasi Perilaku"}
DESTINATION = ROOT / "research" / "hasil" / "kontrol_positif" / "sesi"

# The three machines the sessions ran on, keyed by what the log can prove about
# them. Four participants sat at each, so the device is also the coarsest
# grouping that is certainly not split across people — which makes it the only
# grouping cross-validation may use here.
DEVICES = {
    ("1920x912", "Windows", 16): "a",
    ("1528x732", "Windows", 32): "b",
    ("1694x901", "Macintosh", None): "c",
}


def device_key(log: dict) -> str:
    environment = log["environment"]
    viewport = f"{environment['viewport']['width']}x{environment['viewport']['height']}"
    platform = "Macintosh" if "Macintosh" in environment["userAgent"] else "Windows"
    memory = log.get("device", {}).get("deviceMemoryGB")
    key = DEVICES.get((viewport, platform, memory))
    if key is None:
        raise SystemExit(f"perangkat tidak dikenal: {viewport} {platform} {memory}GB")
    return key


def gaze_fingerprint(log: dict) -> str:
    """Identifies the recording rather than the file, so a re-download matches."""
    points = log.get("gaze", {}).get("processedPoints") or []
    head = ",".join(f"{point['t']}:{point['x']:.6f}:{point['y']:.6f}" for point in points[:24])
    return hashlib.sha256(f"{len(points)}|{head}".encode()).hexdigest()[:16]


def main() -> None:
    DESTINATION.mkdir(parents=True, exist_ok=True)
    for stale in DESTINATION.glob("*.json"):
        stale.unlink()

    records = []
    for folder_condition, folder in SOURCE.items():
        for path in sorted(folder.glob("*.json")):
            log = json.loads(path.read_text(encoding="utf-8"))
            declared = (log.get("positiveControl") or {}).get("condition")
            records.append({
                "source": str(path.relative_to(ROOT)).replace("\\", "/"),
                "folder_condition": folder_condition,
                "declared_condition": declared,
                "condition": declared or folder_condition,
                "condition_source": "log" if declared else "folder",
                "device": device_key(log),
                "session_id": log["sessionId"],
                "created_at": log["createdAt"],
                "child_id": log["profile"]["childId"],
                "fingerprint": gaze_fingerprint(log),
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                "_path": path,
            })

    # Byte-level or trace-level repeats are one recording, not two. Keeping the
    # first occurrence and naming the copy keeps the count honest in both
    # directions: the duplicate does not inflate n, and it does not disappear.
    seen: dict[str, dict] = {}
    for record in records:
        twin = seen.get(record["fingerprint"])
        if twin is None:
            seen[record["fingerprint"]] = record
            record["duplicate_of"] = None
        else:
            record["duplicate_of"] = twin["source"]

    counters: dict[tuple[str, str], int] = defaultdict(int)
    for record in sorted(records, key=lambda item: (item["device"], item["condition"], item["created_at"])):
        if record["duplicate_of"]:
            record["filed_as"] = None
            continue
        counters[(record["device"], record["condition"])] += 1
        name = f"kp-{record['device']}-{record['condition']}-{counters[(record['device'], record['condition'])]}.json"
        record["filed_as"] = name
        shutil.copy2(record["_path"], DESTINATION / name)

    manifest = {
        "schemaVersion": 1,
        "recordedOn": "2026-08-19",
        "participants": 12,
        "participantsPerDevice": 4,
        "filesReceived": len(records),
        "recordingsFiled": sum(1 for record in records if record["filed_as"]),
        "duplicatesFound": sum(1 for record in records if record["duplicate_of"]),
        "limits": {
            "participantIdentity": (
                "Kolom identitas berisi GA-20260819-01 pada 22 dari 24 berkas, jadi peserta tidak "
                "terekam. Nama berkas di sini menandai perangkat dan kondisi, bukan orang."
            ),
            "pairing": (
                "Pasangan kondisi 1 dan kondisi 2 milik orang yang sama tidak dapat dipulihkan. "
                "Analisis berpasangan karena itu tidak dijalankan; yang dijalankan adalah "
                "perbandingan antar-kondisi dengan perangkat sebagai grup."
            ),
            "counterbalancing": (
                "Kedua skema counterbalancing diturunkan dari kolom identitas yang seragam itu, "
                "sehingga panel geometrik berada di kanan dan urutan isyarat identik pada seluruh "
                "24 sesi. Preferensi geometrik dan bias melirik ke kanan tidak terpisah di data ini."
            ),
            "condition_from_folder": (
                "Empat berkas tidak membawa blok positiveControl karena direkam sebelum jenis sesi "
                "dipilih di layar persetujuan; kondisinya diambil dari nama folder operator."
            ),
        },
        "sessions": [
            {key: value for key, value in record.items() if not key.startswith("_")}
            for record in sorted(records, key=lambda item: (item["device"], item["condition"], item["created_at"]))
        ],
    }
    (DESTINATION.parent / "manifes_sesi.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8", newline="\n"
    )

    print(f"{manifest['filesReceived']} berkas diterima")
    print(f"{manifest['recordingsFiled']} rekaman difilekan ke {DESTINATION.relative_to(ROOT)}")
    print(f"{manifest['duplicatesFound']} duplikat dicatat dan tidak disalin")
    for record in manifest["sessions"]:
        if record["duplicate_of"]:
            print(f"  duplikat: {record['source']} = {record['duplicate_of']}")
        if record["condition_source"] == "folder":
            print(f"  kondisi dari folder: {record['source']} -> {record['condition']}")


if __name__ == "__main__":
    main()
