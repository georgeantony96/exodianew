@echo off
echo EXODIA FINAL - Restart App (Clean + Start)
echo ==========================================
echo.

echo Step 1: Cleaning up...
call "%~dp0cleanup-app.bat"

echo.
echo Step 2: Starting fresh...
call "%~dp0start-app.bat"