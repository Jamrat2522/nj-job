@echo off
setlocal
title TRANSPORT NJ - OPEN LOCAL
cd /d "%~dp0"
where powershell >nul 2>nul
if errorlevel 1 (
  echo.
  echo [X] Cannot start TRANSPORT NJ: Windows PowerShell not found.
  echo.
  pause
  exit /b 1
)
if not exist "%~dp0_local\tnj-local-server.ps1" (
  echo.
  echo [X] Cannot start TRANSPORT NJ: missing _local\tnj-local-server.ps1
  echo     Please extract the whole "Open check" ZIP, then run OPEN LOCAL.bat again.
  echo.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0_local\tnj-local-server.ps1" -Root "%~dp0."
set RC=%ERRORLEVEL%
if not "%RC%"=="0" (
  echo.
  pause
)
exit /b %RC%
