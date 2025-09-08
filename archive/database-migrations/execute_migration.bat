@echo off
echo ========================================
echo EXODIA FINAL Database Migration to V2
echo League Intelligence System Implementation
echo ========================================

echo.
echo STEP 1: Creating backup of current database...
copy exodia.db exodia_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.db
if errorlevel 1 (
    echo ERROR: Failed to create backup!
    pause
    exit /b 1
)
echo ✅ Backup created successfully

echo.
echo STEP 2: Executing schema V2 (New tables and indexes)...
sqlite3 exodia.db < schema_v2_league_intelligence.sql
if errorlevel 1 (
    echo ERROR: Failed to create new schema!
    echo Restoring backup...
    copy exodia_backup_*.db exodia.db
    pause
    exit /b 1
)
echo ✅ New schema created successfully

echo.
echo STEP 3: Executing migration (Data preservation and enhancement)...
sqlite3 exodia.db < migrate_to_v2.sql
if errorlevel 1 (
    echo ERROR: Failed to migrate data!
    echo Restoring backup...
    copy exodia_backup_*.db exodia.db
    pause
    exit /b 1
)
echo ✅ Data migration completed successfully

echo.
echo STEP 4: Verifying migration...
sqlite3 exodia.db "SELECT 'Total leagues:', COUNT(*) FROM leagues; SELECT 'Teams with league context:', COUNT(*) FROM teams WHERE league_id IS NOT NULL; SELECT 'Argentina O2.5 setup:', odds_avg, opportunity_frequency FROM league_market_intelligence lmi JOIN leagues l ON lmi.league_id = l.id WHERE l.name = 'Argentina Primera' AND lmi.market_type = 'ou25' AND lmi.market_option = 'over';"

echo.
echo ========================================
echo ✅ MIGRATION COMPLETE! 
echo Your database now includes:
echo - 16 major leagues with efficiency ratings
echo - Home/away performance separation (Chelsea fix)
echo - League market intelligence (Argentina O2.5 insights)
echo - Pattern recognition for all future odds inputs
echo ========================================
echo.
pause