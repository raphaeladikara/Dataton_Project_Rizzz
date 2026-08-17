#!/usr/bin/env bash
# Daftarkan .venv milik repo sebagai kernel Jupyter tanpa path mesin tertentu.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -x "$ROOT/.venv/bin/python" ]]; then
  PY="$ROOT/.venv/bin/python"
elif [[ -x "$ROOT/.venv/Scripts/python.exe" ]]; then
  PY="$ROOT/.venv/Scripts/python.exe"
else
  echo "Tidak menemukan .venv. Jalankan scripts/setup_env.sh lebih dulu." >&2
  exit 1
fi

"$PY" -m ipykernel install --user --name neurogaze --display-name "Neurogaze (.venv)"
echo "Selesai. Pilih kernel: Neurogaze (.venv)"
