@echo off
cd /d "%~dp0"

REM ── Check if packages are installed; install only if not ─────────────
python -c "import fastapi, uvicorn, pandas, openpyxl, docx" 2>nul
if errorlevel 1 (
    echo [Setup] Installing packages for the first time...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo [ERROR] Installation failed. Please check your Python setup.
        pause
        exit /b 1
    )
) else (
    echo [OK] Packages already installed, skipping setup.
)

echo.
echo ════════════════════════════════════════════════════════════════
echo  Letter Generator Backend  [NETWORK MODE]
echo ════════════════════════════════════════════════════════════════
echo.
echo  Your IP address on this network:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do echo    %%a
echo.
echo  Other computers can access this backend at:
echo    http://YOUR-IP:8000
echo.
echo  Keep this window open while others are using it.
echo  Press Ctrl+C to stop.
echo ════════════════════════════════════════════════════════════════
echo.

REM --host 0.0.0.0 = accept connections from any network interface
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
