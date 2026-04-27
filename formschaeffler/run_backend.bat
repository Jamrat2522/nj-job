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
echo  Letter Generator Backend
echo  URL: http://127.0.0.1:8000
echo  Keep this window open while using the Letter mode.
echo  Press Ctrl+C to stop.
echo ════════════════════════════════════════════════════════════════
echo.

python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
