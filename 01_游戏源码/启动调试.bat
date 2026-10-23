@echo off
setlocal enabledelayedexpansion
title Seaking Local Server
cd /d "%~dp0"

set PORT=8765

rem ---- locate python ----
set PYEXE=
where python.exe >nul 2>&1 && set PYEXE=python
if "%PYEXE%"=="" where py.exe >nul 2>&1 && set PYEXE=py -3
if "%PYEXE%"=="" (
  echo [ERROR] Python not found in PATH.
  echo Please install Python 3 or add it to PATH.
  pause
  exit /b 1
)

rem ---- quick port probe, bump up to 10 times if busy ----
set TRIES=0
:probe
netstat -ano -p TCP | findstr /R /C:":%PORT% .*LISTENING" >nul
if not errorlevel 1 (
  set /a PORT+=1
  set /a TRIES+=1
  if !TRIES! lss 10 goto probe
)

echo.
echo  ============================================================
echo   Seaking - Local HTTP Server (for Export H5)
echo  ============================================================
echo   URL : http://127.0.0.1:%PORT%/index.html
echo   DIR : %cd%
echo   PY  : %PYEXE%
echo.
echo   Browser will open in 2 seconds.
echo   Close this window to stop the server.
echo  ============================================================
echo.

start "" /b cmd /c "timeout /t 2 /nobreak >nul & start """" http://127.0.0.1:%PORT%/index.html"

%PYEXE% -m http.server %PORT% --bind 127.0.0.1
set EXITCODE=%errorlevel%

echo.
echo Server stopped (exit code: %EXITCODE%).
pause
endlocal
