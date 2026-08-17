$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $venvPython)) {
    $launcher = Get-Command py -ErrorAction SilentlyContinue
    if ($launcher) {
        & $launcher.Source -3 -m venv (Join-Path $repoRoot ".venv")
    } else {
        python -m venv (Join-Path $repoRoot ".venv")
    }
}

& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $repoRoot "requirements.txt")
& $venvPython -m pytest -q

Write-Host "Siap: $venvPython"
Write-Host "Aktifkan dengan: .\.venv\Scripts\Activate.ps1"
