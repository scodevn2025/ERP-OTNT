@echo off
REM Quick launcher: kill existing dev processes in WSL then start backend + frontend.

set "PROJECT_PATH=/mnt/c/Users/SCODEVN/Downloads/ERP OTNT"

echo [fast_dev] Killing old uvicorn/craco in WSL...
wsl -e bash -lc "pkill -f 'uvicorn main:app' 2>/dev/null || true; pkill -f 'craco start' 2>/dev/null || true"

echo [fast_dev] Starting dev stack...
wsl -e bash -lc "cd '%PROJECT_PATH%' && ./dev.sh"
