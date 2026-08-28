@echo off
echo =========================================
echo      Starting Arabic AI Teacher...
echo =========================================

echo.
echo Starting Backend Server (SQLite)...
cd /d "%~dp0homework-backend"
start "Backend Server" cmd /k "npm run dev"

echo.
echo Starting Frontend Application...
cd /d "%~dp0homework-frontend"
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Waiting for servers to initialize...
timeout /t 5 /nobreak > NUL

echo.
echo Opening Application in Browser...
start http://localhost:5173

echo.
echo System is running! Keep the black windows open in the background.