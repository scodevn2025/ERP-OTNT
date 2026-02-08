@echo off
REM Start full dev stack (backend + frontend) inside WSL.
REM Requires WSL and bash available.

set "PROJECT_PATH=/mnt/c/Users/SCODEVN/Downloads/ERP OTNT"

echo Launching dev.sh inside WSL...
wsl -e bash -lc "cd '%PROJECT_PATH%' && ./dev.sh"
