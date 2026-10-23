@echo off
:: Fix for "Run as Administrator" path issue
cd /d "%~dp0"

TITLE BDT AI Predictor - Full System
COLOR 0B

echo ========================================================
echo          BDT AI STOCK PREDICTOR SYSTEM
echo ========================================================
echo.

:: Ensure Python and Node.js paths are in PATH even if current session has not refreshed
if exist "%LOCALAPPDATA%\Programs\Python\Python311" set "PATH=%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;%PATH%"
if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64" set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64;%PATH%"

:: 1. Start Backend with fallback logic
echo [1/2] Dang khoi chay Backend (Port 5001)...
start "Backend Server" cmd /k "cd backend && (python app.py || py app.py || \"%LOCALAPPDATA%\Programs\Python\Python311\python.exe\" app.py || echo [ERROR] Khong tim thay Python! Vui long kiem tra lai cai dat Python.)"

:: 2. Start Frontend
echo [2/2] Dang khoi chay Frontend (Port 3000)...
start "Frontend UI" cmd /k "cd frontend && npm start"

echo.
echo Dang cho Frontend khoi dong hoan tat (khoang 10-20 giay)...
powershell -Command "$cnt=0; while (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -InformationLevel Quiet) -and ($cnt -lt 35)) { Start-Sleep -Seconds 1; $cnt++ }"

echo.
echo ========================================================
echo   HE THONG DA SAN SANG!
echo   ----------------------------------------------------
echo   Dia chi truy cap: http://localhost:3000
echo   (Vui long khong dong cac cua so Terminal dang mo)
echo ========================================================
echo.
echo Dang mo trinh duyet...
start http://localhost:3000
exit
