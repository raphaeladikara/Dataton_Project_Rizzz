@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0app"
set "APP_PORT="

where node >nul 2>nul
if errorlevel 1 (
  echo [Neurogaze] Node.js tidak ditemukan. Pasang Node.js 22 atau lebih baru.
  pause
  exit /b 1
)

for /f %%V in ('node -p "process.versions.node.split('.')[0]"') do set "NODE_MAJOR=%%V"
if %NODE_MAJOR% LSS 22 (
  echo [Neurogaze] Node.js %NODE_MAJOR% terlalu lama. Gunakan Node.js 22 atau lebih baru.
  pause
  exit /b 1
)

rem Temukan server Neurogaze lama pada semua port yang pernah dipilih launcher.
rem Jangan menyentuh node_modules selama binary Next/SWC masih dikunci proses itu.
for /f %%P in ('powershell -NoProfile -Command "$appPath=(Get-Location).Path; foreach($candidate in 3000..3010){$connections=@(Get-NetTCPConnection -State Listen -LocalPort $candidate -ErrorAction SilentlyContinue); if(-not $connections.Count){continue}; $connection=$connections[0]; $process=Get-CimInstance Win32_Process -Filter ('ProcessId='+$connection.OwningProcess); if($process.CommandLine -notlike ('*'+$appPath+'*next*start*')){continue}; $ok=$false; try{$r=Invoke-WebRequest ('http://localhost:'+$candidate) -UseBasicParsing -TimeoutSec 5; $ok=$r.Content -match 'Neurogaze'}catch{}; if($ok){Write-Output $candidate; break}}"') do set "APP_PORT=%%P"
if defined APP_PORT goto :server_ready

set "APP_PORT=3000"
powershell -NoProfile -Command "if(Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue){exit 0}; exit 1" >nul 2>nul
if not errorlevel 1 goto :fallback_port
goto :dependencies

:server_ready
echo [Neurogaze] Server sudah berjalan di http://localhost:%APP_PORT%
start "" "http://localhost:%APP_PORT%"
exit /b 0

:fallback_port
for /f %%P in ('powershell -NoProfile -Command "foreach($candidate in 3001..3010){if(-not (Get-NetTCPConnection -State Listen -LocalPort $candidate -ErrorAction SilentlyContinue)){Write-Output $candidate; break}}"') do set "APP_PORT=%%P"
if "%APP_PORT%"=="3000" goto :port_busy
echo [Neurogaze] Port 3000 dipakai aplikasi lain. Menggunakan http://localhost:%APP_PORT%
goto :dependencies

:dependencies
set "INSTALL_REQUIRED=0"
if not exist node_modules set "INSTALL_REQUIRED=1"
if not exist node_modules\.bin\next.cmd set "INSTALL_REQUIRED=1"
if not exist node_modules\lightningcss-win32-x64-msvc\lightningcss.win32-x64-msvc.node set "INSTALL_REQUIRED=1"
if not exist node_modules\.neurogaze-package-lock.json set "INSTALL_REQUIRED=1"
if "%INSTALL_REQUIRED%"=="0" (
  fc /b package-lock.json node_modules\.neurogaze-package-lock.json >nul 2>nul
  if errorlevel 1 set "INSTALL_REQUIRED=1"
)
if "%INSTALL_REQUIRED%"=="1" (
  echo [Neurogaze] Menyiapkan atau memperbaiki dependensi...
  echo [Neurogaze] Jangan jalankan server/dev lain dari folder app selama proses ini.
  call npm install --prefer-offline --no-audit --no-fund
  if not "!ERRORLEVEL!"=="0" goto :dependency_failed
  if not exist node_modules\.bin\next.cmd goto :dependency_failed
  copy /y package-lock.json node_modules\.neurogaze-package-lock.json >nul
)

echo [Neurogaze] Menyiapkan build produksi...
call npm run build
if not "%ERRORLEVEL%"=="0" goto :failed

if /i "%~1"=="check" (
  echo [Neurogaze] Dependensi dan build produksi valid.
  exit /b 0
)

echo [Neurogaze] Membuka http://localhost:%APP_PORT%
echo [Neurogaze] Untuk membuat log: pilih Gate A, selesaikan sesi, lalu tekan Unduh log audit JSON.
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "$u='http://localhost:%APP_PORT%'; for($i=0;$i -lt 30;$i++){try{Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 1 ^| Out-Null; Start-Process $u; break}catch{Start-Sleep -Milliseconds 500}}"
call npm run start -- --hostname 127.0.0.1 --port %APP_PORT%
exit /b %errorlevel%

:port_busy
echo [Neurogaze] Port 3000-3010 sedang dipakai aplikasi lain.
echo Tutup salah satu aplikasi tersebut atau cek prosesnya dengan:
echo   Get-NetTCPConnection -State Listen ^| Where-Object LocalPort -ge 3000 ^| Where-Object LocalPort -le 3010
pause
exit /b 1

:dependency_failed
echo.
echo [Neurogaze] Dependensi gagal dipasang karena file sedang dipakai atau diblokir.
echo Tutup terminal/server Node dari repo ini, tunggu beberapa detik, lalu coba lagi.
echo Proses Node yang masih aktif:
tasklist /fi "IMAGENAME eq node.exe" 2>nul
echo Jangan hapus node_modules saat proses Node masih aktif dan tidak perlu Run as Administrator.
pause
exit /b 1

:failed
echo [Neurogaze] Gagal dijalankan. Lihat pesan di atas.
echo Jika port 3000 sedang dipakai, tutup server lama lalu jalankan kembali.
pause
exit /b 1
