@echo off
cd /d "%~dp0"
TITLE Cài đặt thư viện - Stock AI
echo ========================================================
echo   Dang cai dat cac thu vien Python can thiet...
echo ========================================================
echo.

if exist "%LOCALAPPDATA%\Programs\Python\Python311" set "PATH=%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;%PATH%"

python -m pip install flask flask-cors pandas yfinance sqlalchemy requests scikit-learn torch transformers || py -m pip install flask flask-cors pandas yfinance sqlalchemy requests scikit-learn torch transformers || "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" -m pip install flask flask-cors pandas yfinance sqlalchemy requests scikit-learn torch transformers

echo.
echo ========================================================
echo   Cai dat hoan tat!
echo   Bay gio ban hay chay file 'START_APP.bat' de mo ung dung.
echo ========================================================
pause
