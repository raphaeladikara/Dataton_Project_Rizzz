@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if /i "%~1"=="app" goto app
if /i "%~1"=="test" goto test
if /i "%~1"=="audit" goto audit
if /i "%~1"=="verify" goto verify
if /i "%~1"=="exit" exit /b 0

:menu
cls
echo ============================================================
echo  NEUROGAZE v3.0 - APP, LOG, DAN ROADMAP TOOLKIT
echo ============================================================
echo  [1] Jalankan webapp produksi lokal
echo  [2] Jalankan seluruh test software
echo  [3] Analisis folder audit log JSON
echo  [4] Verifikasi roadmap software dan buat laporan
echo  [0] Keluar
echo.
set /p "choice=Pilih menu: "
if "%choice%"=="1" goto app
if "%choice%"=="2" goto test
if "%choice%"=="3" goto audit
if "%choice%"=="4" goto verify
if "%choice%"=="0" exit /b 0
echo Pilihan tidak dikenal.
pause
goto menu

:app
call "%~dp0start_web.bat"
exit /b %errorlevel%

:python
set "PYTHON=%~dp0.venv\Scripts\python.exe"
if exist "%PYTHON%" exit /b 0
echo [Neurogaze] Menyiapkan environment Python...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup_env.ps1"
if errorlevel 1 exit /b 1
exit /b 0

:node
where node >nul 2>nul
if errorlevel 1 (
  echo [Neurogaze] Node.js tidak ditemukan. Pasang Node.js 22 atau lebih baru.
  exit /b 1
)
for /f %%V in ('node -p "process.versions.node.split('.')[0]"') do set "NODE_MAJOR=%%V"
if %NODE_MAJOR% LSS 22 (
  echo [Neurogaze] Node.js %NODE_MAJOR% terlalu lama. Gunakan Node.js 22 atau lebih baru.
  exit /b 1
)
exit /b 0

:test
call :python
if errorlevel 1 goto failed
call :node
if errorlevel 1 goto failed
echo [Neurogaze] Menjalankan test Python...
"%PYTHON%" -m pytest -q
if errorlevel 1 goto failed
pushd "%~dp0app"
call npm test
if errorlevel 1 (popd & goto failed)
call npm run lint
if errorlevel 1 (popd & goto failed)
call npm run build:sites
if errorlevel 1 (popd & goto failed)
popd
echo.
echo [Neurogaze] Semua test dan build lulus.
pause
exit /b 0

:audit
call :python
if errorlevel 1 goto failed
set "LOG_DIR=%~2"
if not defined LOG_DIR set /p "LOG_DIR=Masukkan folder berisi audit JSON: "
if not exist "%LOG_DIR%" (
  echo [Neurogaze] Folder tidak ditemukan: %LOG_DIR%
  goto failed
)
if not exist "%~dp0research\hasil\device_validation" mkdir "%~dp0research\hasil\device_validation"
for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%T"
set "REPORT=%~dp0research\hasil\device_validation\session_error_analysis_%STAMP%.json"
"%PYTHON%" "%~dp0research\analyze_session_logs.py" "%LOG_DIR%" --out "%REPORT%"
if errorlevel 1 goto failed
echo.
echo [Neurogaze] Laporan selesai:
echo   %REPORT%
echo   %REPORT:.json=.md%
start "" "%REPORT:.json=.md%"
pause
exit /b 0

:verify
call :python
if errorlevel 1 goto failed
call :node
if errorlevel 1 goto failed
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\verify_roadmap.ps1"
if errorlevel 1 goto failed
pause
exit /b 0

:failed
echo.
echo [Neurogaze] Proses gagal. Baca pesan error di atas.
pause
exit /b 1
