# EXODIA FINAL - Enhanced PowerShell Session Starter
# Version 2.0.0 - September 8, 2025

Clear-Host

# Set console colors and title
$Host.UI.RawUI.WindowTitle = "EXODIA FINAL - Professional Development Session"
Write-Host "================================================================" -ForegroundColor Green
Write-Host "🚀 EXODIA FINAL PROJECT SESSION INITIATED" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

# Current Project Status
Write-Host "📊 CURRENT PROJECT STATUS:" -ForegroundColor Cyan
Write-Host "✅ Version: v4.2.0 - Mathematical Engine with Validated Accuracy" -ForegroundColor Green
Write-Host "✅ Match Results: 277+ matches with real outcomes" -ForegroundColor Green  
Write-Host "✅ Pattern Database: 6,813+ rich historical patterns" -ForegroundColor Green
Write-Host "✅ Accuracy: 67.9% Over 3.5, 83.9% Over 4.5 goals (professional-grade)" -ForegroundColor Green
Write-Host "✅ Technology: Next.js 15.4.5, React 19.1.0, better-sqlite3" -ForegroundColor Green
Write-Host ""

# Documentation Requirements
Write-Host "================================================================" -ForegroundColor Green
Write-Host "📋 CLAUDE MUST READ THESE DOCUMENTATION FILES FIRST:" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Green
Write-Host "⭐ PROJECT_ANALYSIS_PROTOCOL.md" -ForegroundColor White
Write-Host "⭐ HOLISTIC_PROBLEM_SOLVING_PRINCIPLES.md" -ForegroundColor White  
Write-Host "⭐ Recent CHANGELOG.md entries" -ForegroundColor White
Write-Host "⭐ DESIGN_SYSTEM_REFERENCE.md (for UI work)" -ForegroundColor White
Write-Host "⭐ CLAUDE_TECHNICAL_REFERENCE_2025.md (for technical work)" -ForegroundColor White
Write-Host ""

# Quality Control Checklist
Write-Host "================================================================" -ForegroundColor Green
Write-Host "🔧 QUALITY CONTROL CHECKLIST:" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Green
Write-Host "□ Apply root cause analysis (not quick fixes)" -ForegroundColor White
Write-Host "□ Consider holistic system impact" -ForegroundColor White
Write-Host "□ Check database schema alignment" -ForegroundColor White
Write-Host "□ Use established solution patterns" -ForegroundColor White
Write-Host "□ Follow UI/UX design system guidelines" -ForegroundColor White
Write-Host "□ Maintain mathematical engine validation standards" -ForegroundColor White
Write-Host "□ Test across entire system architecture" -ForegroundColor White
Write-Host ""

# Critical Reminders
Write-Host "⚠️  CRITICAL REMINDER: NO QUICK FIXES - ARCHITECTURAL SOLUTIONS ONLY" -ForegroundColor Red
Write-Host "💡 User Feedback: 'Look at it holistically please see all page structure'" -ForegroundColor Magenta
Write-Host ""

# Session Starter Template
Write-Host "================================================================" -ForegroundColor Green
Write-Host "🎯 COPY-PASTE THIS TO START YOUR CLAUDE SESSION:" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

# Highlight the session starter text
Write-Host "🎯 EXODIA FINAL PROJECT SESSION - DOCUMENTATION-FIRST APPROACH" -ForegroundColor Yellow
Write-Host ""
Write-Host "REMINDER: Read PROJECT_ANALYSIS_PROTOCOL.md, HOLISTIC_PROBLEM_SOLVING_PRINCIPLES.md," -ForegroundColor White
Write-Host "and recent CHANGELOG.md entries before proceeding with any technical work on EXODIA FINAL." -ForegroundColor White
Write-Host ""
Write-Host "Apply documentation-first analysis approach. No quick fixes - research-informed solutions only." -ForegroundColor White
Write-Host "Then help me with: [YOUR REQUEST HERE]" -ForegroundColor Cyan
Write-Host ""

# Quick Access Commands
Write-Host "================================================================" -ForegroundColor Green
Write-Host "📱 QUICK ACCESS COMMANDS:" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Green
Write-Host "Frontend Dev Server: cd frontend && npm run dev" -ForegroundColor White
Write-Host "Application URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Build Project: cd frontend && npm run build" -ForegroundColor White
Write-Host "Lint Code: cd frontend && npm run lint" -ForegroundColor White
Write-Host ""

# System Health Check
Write-Host "================================================================" -ForegroundColor Green
Write-Host "🔍 SYSTEM HEALTH CHECK:" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Green

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js: Not found" -ForegroundColor Red
}

# Check if frontend directory exists
if (Test-Path ".\frontend") {
    Write-Host "✅ Frontend Directory: Found" -ForegroundColor Green
    
    # Check if package.json exists
    if (Test-Path ".\frontend\package.json") {
        Write-Host "✅ Package.json: Found" -ForegroundColor Green
    } else {
        Write-Host "❌ Package.json: Missing" -ForegroundColor Red
    }
    
    # Check if node_modules exists
    if (Test-Path ".\frontend\node_modules") {
        Write-Host "✅ Node Modules: Installed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Node Modules: Not found (run npm install)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Frontend Directory: Not found" -ForegroundColor Red
}

# Check database
if (Test-Path ".\database\exodia.db") {
    $dbSize = (Get-Item ".\database\exodia.db").Length / 1MB
    Write-Host "✅ Database: Found (${dbSize:F1} MB)" -ForegroundColor Green
} else {
    Write-Host "❌ Database: Not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "Ready to begin professional development session!" -ForegroundColor Green
Write-Host "Remember: Documentation first, holistic solutions always!" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

# Auto-copy session starter to clipboard if possible
try {
    $sessionStarter = @"
🎯 EXODIA FINAL PROJECT SESSION - DOCUMENTATION-FIRST APPROACH

REMINDER: Read PROJECT_ANALYSIS_PROTOCOL.md, HOLISTIC_PROBLEM_SOLVING_PRINCIPLES.md, and recent CHANGELOG.md entries before proceeding with any technical work on EXODIA FINAL.

Apply documentation-first analysis approach. No quick fixes - research-informed solutions only.
Then help me with: [YOUR REQUEST HERE]
"@
    
    $sessionStarter | Set-Clipboard
    Write-Host "📋 Session starter template copied to clipboard!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "📋 Clipboard copy not available - manually copy the text above" -ForegroundColor Yellow
    Write-Host ""
}

Read-Host "Press Enter to continue"