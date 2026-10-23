@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "PROJECT_PY=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if exist "%PROJECT_PY%" goto bundled
py -3 -c "import sys; assert sys.version_info.major == 3" >nul 2>&1
if not errorlevel 1 goto launcher
python -c "import sys; assert sys.version_info.major == 3" >nul 2>&1
if not errorlevel 1 goto systempy
echo Python 3 is required. Please install Python 3, then open this file again.
pause
exit /b 1
:bundled
"%PROJECT_PY%" "07_项目工具\project_tools.py" %*
goto finish
:launcher
py -3 "07_项目工具\project_tools.py" %*
goto finish
:systempy
python "07_项目工具\project_tools.py" %*
:finish
set "PROJECT_RESULT=%errorlevel%"
pause
exit /b %PROJECT_RESULT%
