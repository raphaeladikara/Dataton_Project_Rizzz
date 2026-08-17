$ErrorActionPreference = "Stop"
$Repo = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $Repo ".venv\Scripts\python.exe"
$App = Join-Path $Repo "app"
$ResultDir = Join-Path $Repo "research\hasil"

function Invoke-Checked {
    param([string]$Label, [scriptblock]$Command)
    Write-Host "[Neurogaze] $Label..." -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$Label gagal dengan exit code $LASTEXITCODE" }
}

if (-not (Test-Path -LiteralPath $Python)) {
    throw "Environment Python belum ada. Jalankan start.bat lalu pilih menu test."
}

Invoke-Checked "Membekukan kontrak riset aktif" { & $Python (Join-Path $Repo "research\prepare_contracts.py") }
Invoke-Checked "Memverifikasi hash bukti Gate A/B" { & $Python (Join-Path $Repo "research\gate_evidence_repository.py") --verify }
Invoke-Checked "Menjalankan test Python" { & $Python -m pytest -q }
Push-Location $App
try {
    Invoke-Checked "Menjalankan build dan test web" { npm test }
    Invoke-Checked "Menjalankan lint web" { npm run lint }
    Invoke-Checked "Membuat build Sites" { npm run build:sites }
    Invoke-Checked "Memeriksa server-render build Sites" { node --test tests/rendered-html.test.mjs }
} finally {
    Pop-Location
}

$Required = @(
    "research\configs\session_schema.json",
    "research\configs\dataset_manifest_carette.json",
    "research\configs\feature_schema.json",
    "research\configs\split_registry_carette.json",
    "research\hasil\evidence_manifest.json",
    "research\hasil\gate_a\gate_a_summary.json",
    "research\hasil\gate_b\gate_b_summary.json",
    "app\public\models\ood_reference.json",
    "docs\protokol_gate_validasi.md"
    "docs\panduan_uji_roadmap_webapp.md"
)
$Missing = @($Required | Where-Object { -not (Test-Path -LiteralPath (Join-Path $Repo $_)) })
if ($Missing.Count -gt 0) { throw "Artefak roadmap hilang: $($Missing -join ', ')" }

$Report = [ordered]@{
    schemaVersion = 1
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    software = [ordered]@{
        status = "passed"
        pythonTests = "passed"
        nextAndTypescriptTests = "passed"
        sitesRenderTests = 1
        nextBuild = "passed"
        lint = "passed"
        sitesBuild = "passed"
        requiredArtifacts = $Required
    }
    # Status gerbang empiris tidak dapat disimpulkan script ini; nilainya dicatat
    # dari studi instrumen yang sudah dijalankan dan dilaporkan di
    # docs/bukti_gate_a_b.md serta paper final Bagian 4.8-4.9.
    empiricalGates = [ordered]@{
        gateA = "passed_100_adult_sessions_3_android_devices"
        gateB = "passed_30_simultaneous_pairs_vs_reference_eye_tracker"
        gateC = "closed_limited_conditional_secondary_evidence_only_prospective_cohort_zero"
        gateD = "closed_limited_conditional_procedural_basis_only_field_study_zero"
    }
    clinicalStatus = "instrument_validated_not_for_diagnosis_or_live_child_scoring"
}
if (-not (Test-Path -LiteralPath $ResultDir)) { New-Item -ItemType Directory -Path $ResultDir | Out-Null }
$Output = Join-Path $ResultDir "roadmap_verification.json"
$Report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $Output -Encoding utf8
Write-Host "[Neurogaze] Roadmap software lulus. Gate A dan B lulus; Gate C dan D masih bersyarat." -ForegroundColor Green
Write-Host "[Neurogaze] Laporan: $Output"
