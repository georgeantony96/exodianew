@echo off
echo Starting EXODIA FINAL App...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://python.org/
    pause
    exit /b 1
)

REM Navigate to frontend directory and install dependencies if needed
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

REM Navigate to backend directory and install Python dependencies if needed
cd /d "%~dp0backend"
echo Installing/checking Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

REM Start the Next.js development server
echo.
echo Starting frontend (Next.js)...
cd /d "%~dp0frontend"
start "EXODIA Frontend" cmd /k "npm run dev"

REM Give frontend a moment to start
timeout /t 3 /nobreak >nul

echo.
echo Frontend started! Opening in browser...
echo Frontend URL: http://localhost:3000
echo.
echo The app is now running!
echo - Frontend: http://localhost:3000
echo - Close both terminal windows to stop the app
echo.
echo Press any key to exit this launcher...
pause >nul