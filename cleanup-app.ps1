#!/usr/bin/env pwsh
Write-Host "EXODIA FINAL - Cleanup Script" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Cleaning up caches and closing ports..." -ForegroundColor Yellow
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Kill processes on common Next.js ports
Write-Host "Closing ports 3000, 3001, 3002..." -ForegroundColor Green
$ports = @(3000, 3001, 3002)

foreach ($port in $ports) {
    $processes = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($process in $processes) {
        $pid = $process.OwningProcess
        Write-Host "  Killing process on port $port (PID: $pid)" -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

# Kill Node.js processes that might be hanging
Write-Host "Closing any hanging Node.js processes..." -ForegroundColor Green
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Navigate to frontend and clean caches
Set-Location "$scriptDir\frontend"
if (Test-Path "node_modules") {
    Write-Host "Cleaning npm cache..." -ForegroundColor Green
    npm cache clean --force 2>$null
}

if (Test-Path ".next") {
    Write-Host "Removing .next build cache..." -ForegroundColor Green
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path "node_modules\.cache") {
    Write-Host "Removing node modules cache..." -ForegroundColor Green
    Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
}

# Clean Python cache files
Set-Location "$scriptDir\backend"
Write-Host "Cleaning Python cache files..." -ForegroundColor Green

# Remove __pycache__ directories
Get-ChildItem -Path . -Name "__pycache__" -Recurse -Directory | ForEach-Object {
    $fullPath = Join-Path -Path (Get-Location) -ChildPath $_
    Write-Host "  Removing $fullPath" -ForegroundColor Yellow
    Remove-Item -Path $fullPath -Recurse -Force -ErrorAction SilentlyContinue
}

# Remove .pyc files
Get-ChildItem -Path . -Filter "*.pyc" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue

# Clean pip cache
Write-Host "Cleaning pip cache..." -ForegroundColor Green
pip cache purge 2>$null

Write-Host ""
Write-Host "✓ Cleanup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "What was cleaned:" -ForegroundColor Cyan
Write-Host "- Closed ports 3000, 3001, 3002" -ForegroundColor White
Write-Host "- Killed hanging Node.js processes" -ForegroundColor White
Write-Host "- Cleared npm cache" -ForegroundColor White
Write-Host "- Removed .next build directory" -ForegroundColor White
Write-Host "- Cleaned Python __pycache__ files" -ForegroundColor White
Write-Host "- Purged pip cache" -ForegroundColor White
Write-Host ""
Write-Host "You can now run start-app.bat safely." -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")