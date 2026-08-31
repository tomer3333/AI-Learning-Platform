@echo off
setlocal EnableDelayedExpansion

echo ===========================================
echo     Arabic AI Teacher - Starting App
echo ===========================================
echo.

:: ── STEP 1: Check Node.js ───────────────────
node --version > NUL 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Node.js is not installed on this machine.
    echo         Please install Node.js to run this application.
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js found.

:: ── STEP 2: Ensure backend .env exists ───────
if not exist "%~dp0homework-backend\.env" (
    echo [SETUP] Initializing configuration from template...
    copy "%~dp0homework-backend\.env.example" "%~dp0homework-backend\.env" > NUL
    echo [OK] Configuration created.
) else (
    echo [OK] Configuration found.
)

:: ── STEP 3: Install frontend dependencies ────
echo.
if not exist "%~dp0homework-frontend\node_modules" (
    echo [INSTALL] Installing frontend packages - please wait...
    cd /d "%~dp0homework-frontend"
    call npm install
    if !ERRORLEVEL% neq 0 (
        echo [ERROR] Frontend installation failed.
        pause
        exit /b 1
    )
    echo [OK] Frontend packages installed.
) else (
    echo [OK] Frontend packages already installed.
)

:: ── STEP 4: Install backend dependencies ─────
echo.
if not exist "%~dp0homework-backend\node_modules" (
    echo [INSTALL] Installing backend packages - please wait...
    cd /d "%~dp0homework-backend"
    call npm install
    if !ERRORLEVEL% neq 0 (
        echo [ERROR] Backend installation failed.
        pause
        exit /b 1
    )
    echo [OK] Backend packages installed.
) else (
    echo [OK] Backend packages already installed.
)

:: ── STEP 5: Build frontend ───────────────────
echo.
echo [BUILD] Building frontend UI - please wait...
cd /d "%~dp0homework-frontend"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend build failed.
    pause
    exit /b 1
)
echo [OK] Frontend built successfully.

:: ── STEP 6: Compile backend TypeScript ──────
echo.
echo [BUILD] Compiling backend server - please wait...
cd /d "%~dp0homework-backend"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend build failed.
    pause
    exit /b 1
)
echo [OK] Backend compiled successfully.

:: ── STEP 7: Open browser + start server ─────
echo.
echo [START] Launching browser at http://localhost:3000 ...
start /b cmd /c "timeout /t 3 /nobreak > NUL && start http://localhost:3000"

echo.
echo ===========================================
echo   App running at: http://localhost:3000
echo   Close this window to stop the application.
echo ===========================================
echo.

cd /d "%~dp0homework-backend"
set NODE_ENV=production
call npm start