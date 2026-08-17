# Panduan Gate B WebGazer

Gate B membandingkan dua aliran gaze yang direkam secara simultan di webapp: Neurogaze dan WebGazer.js 3.5.3. Analisis ini mengukur agreement, bukan ASD.

## Kontrak log

Setiap JSON harus memakai schema `neurogaze-webgazer-comparison-v3` dan memuat:

- `participantId`, `pairId`, `visitId`, dan `captureSessionId` pseudonim;
- `acquisitionMode: simultaneous_browser_streams`;
- metadata runtime WebGazer dan ruang koordinat viewport CSS;
- status kontrak, alasan penahanan, metrik pasangan, distribusi AOI, pasangan fitur, dan digest array tertanam.

Simpan ekspor tanpa mengubah isinya di `research/hasil/gate_b/pasangan`.

## Membangun ringkasan

```powershell
.\.venv\Scripts\python.exe research\analyze_gate_b.py research\hasil\gate_b\pasangan\*.json --output research\hasil\gate_b\gate_b_summary.json
.\.venv\Scripts\python.exe research\gate_evidence_repository.py --rebuild --verify
```

Analyzer menolak schema selain kontrak WebGazer v3, menolak ID pasangan duplikat, mempertahankan pasangan yang ditahan dalam denominator, menghitung agreement, dan menerapkan kriteria di `docs/protokol_gate_validasi.md`.

## Interpretasi

Keputusan `PASSED` hanya menyatakan bahwa aliran Neurogaze memenuhi kontrak agreement terhadap WebGazer.js dalam kohort ini. Jangan mengubahnya menjadi klaim akurasi ASD, validasi klinis, atau kesetaraan dengan perangkat laboratorium.
