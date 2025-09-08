#!/usr/bin/env pwsh
Write-Host "Starting EXODIA FINAL App..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $null = Get-Command node -ErrorAction Stop
    Write-Host "✓ Node.js found" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Python is installed
try {
    $null = Get-Command python -ErrorAction Stop
    Write-Host "✓ Python found" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python from https://python.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Navigate to frontend directory and install dependencies if needed
Set-Location "$scriptDir\frontend"
if (!(Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ ERROR: Failed to install frontend dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Navigate to backend directory and install Python dependencies
Set-Location "$scriptDir\backend"
Write-Host "Installing/checking Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ERROR: Failed to install Python dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Start the Next.js development server
Write-Host ""
Write-Host "Starting frontend (Next.js)..." -ForegroundColor Green
Set-Location "$scriptDir\frontend"

$frontendJob = Start-Process -FilePath "cmd" -ArgumentList "/k", "npm run dev" -WindowStyle Normal -PassThru

# Give frontend a moment to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✓ Frontend started! Opening in browser..." -ForegroundColor Green
Write-Host "Frontend URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "The app is now running!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Close the terminal window to stop the app" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")