"""Upload the reviewed Neurogaze artifact bundle after local HF authentication."""

from __future__ import annotations

import argparse
from pathlib import Path

from huggingface_hub import HfApi

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    ROOT / "huggingface" / "README.md": "README.md",
    ROOT / "research" / "hasil" / "model.json": "model.json",
    ROOT / "research" / "hasil" / "training.json": "training.json",
    ROOT / "research" / "hasil" / "degradasi.json": "degradasi.json",
    ROOT / "research" / "hasil" / "audit_wajah.json": "audit_wajah.json",
    ROOT / "research" / "hasil" / "fitur.csv": "fitur.csv",
    # Metrik audit terkarantina. Hanya JSON metrik; bobot model wajah TIDAK
    # pernah diunggah (ALLOW_MODEL_EXPORT = False).
    ROOT / "research" / "hasil" / "audit_wajah" / "hasil_audit_wajah.json": "hasil_audit_wajah.json",
    ROOT / "research" / "hasil" / "cnn_scanpath" / "hasil_tingkat_anak.json": "hasil_tingkat_anak.json",
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("repo_id", help="Hugging Face repo, e.g. username/neurogaze-gaze")
    parser.add_argument("--private", action="store_true", help="Create a private repository")
    args = parser.parse_args()
    api = HfApi()
    api.whoami()
    api.create_repo(args.repo_id, repo_type="model", private=args.private, exist_ok=True)
    for source, destination in FILES.items():
        api.upload_file(
            path_or_fileobj=source,
            path_in_repo=destination,
            repo_id=args.repo_id,
            repo_type="model",
            commit_message=f"Upload {destination}",
        )
    print(f"https://huggingface.co/{args.repo_id}")


if __name__ == "__main__":
    main()
