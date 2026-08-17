$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $venvPython)) {
    throw "Tidak menemukan .venv. Jalankan scripts\setup_env.ps1 lebih dulu."
}

& $venvPython -m ipykernel install --user --name neurogaze --display-name "Neurogaze (.venv)"
Write-Host "Selesai. Pilih kernel: Neurogaze (.venv)"
