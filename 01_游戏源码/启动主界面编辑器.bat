@echo off
setlocal enabledelayedexpansion
title Cat and Fish - Home UI Studio
cd /d "%~dp0"

set STUDIO_PORT=8765
set STUDIO_PY=
where python.exe >nul 2>&1 && set STUDIO_PY=python
if "%STUDIO_PY%"=="" where py.exe >nul 2>&1 && set STUDIO_PY=py -3
if "%STUDIO_PY%"=="" (
  echo Python 3 was not found. Please use the running local server instead.
  pause
  exit /b 1
)

set STUDIO_TRIES=0
:probe
netstat -ano -p TCP | findstr /R /C:":%STUDIO_PORT% .*LISTENING" >nul
if not errorlevel 1 (
  set /a STUDIO_PORT+=1
  set /a STUDIO_TRIES+=1
  if !STUDIO_TRIES! lss 10 goto probe
)

echo Global UI Layout Studio: http://127.0.0.1:%STUDIO_PORT%/
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start """" http://127.0.0.1:%STUDIO_PORT%/%%E4%%B8%%BB%%E7%%95%%8C%%E9%%9D%%A2%%E9%%83%%A8%%E4%%BB%%B6%%E7%%BC%%96%%E8%%BE%%91%%E5%%99%%A8.html"
%STUDIO_PY% -m http.server %STUDIO_PORT% --bind 127.0.0.1
pause
endlocal
