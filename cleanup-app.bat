@echo off
echo EXODIA FINAL - Cleanup Script
echo =============================
echo.

echo Cleaning up caches and closing ports...
echo.

REM Kill processes on common Next.js ports
echo Closing ports 3000, 3001, 3002...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Killing process on port 3000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
    echo Killing process on port 3001 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002" ^| find "LISTENING"') do (
    echo Killing process on port 3002 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill Node.js processes that might be hanging
echo Closing any hanging Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM "Next.js*" >nul 2>&1

REM Navigate to frontend and clean caches
cd /d "%~dp0frontend"
if exist "node_modules" (
    echo Cleaning npm cache...
    npm cache clean --force >nul 2>&1
)

if exist ".next" (
    echo Removing .next build cache...
    rmdir /s /q ".next" >nul 2>&1
)

if exist "node_modules\.cache" (
    echo Removing node modules cache...
    rmdir /s /q "node_modules\.cache" >nul 2>&1
)

REM Clean Python cache files
cd /d "%~dp0backend"
echo Cleaning Python cache files...
for /r %%i in (__pycache__) do (
    if exist "%%i" (
        echo Removing %%i
        rmdir /s /q "%%i" >nul 2>&1
    )
)

for /r %%i in (*.pyc) do (
    if exist "%%i" (
        del /q "%%i" >nul 2>&1
    )
)

REM Clean pip cache
pip cache purge >nul 2>&1

echo.
echo ✓ Cleanup completed!
echo.
echo What was cleaned:
echo - Closed ports 3000, 3001, 3002
echo - Killed hanging Node.js processes
echo - Cleared npm cache
echo - Removed .next build directory
echo - Cleaned Python __pycache__ files
echo - Purged pip cache
echo.
echo You can now run start-app.bat safely.
echo.
pause