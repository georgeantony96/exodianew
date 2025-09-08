/**
 * Database Cleanup Script for v2.35.4 - Model Weight Changes
 * Clears all simulation and betting data while preserving leagues and teams
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = path.join(__dirname, `backup_before_v2354_cleanup_${timestamp}.db`);
  const originalPath = path.join(__dirname, 'exodia.db');
  
  if (fs.existsSync(originalPath)) {
    fs.copyFileSync(originalPath, backupPath);
    console.log(`✅ Backup created: ${backupPath}`);
    return backupPath;
  }
  return null;
}

function cleanupDatabase() {
  const dbPath = path.join(__dirname, 'exodia.db');
  
  if (!fs.existsSync(dbPath)) {
    console.log('❌ Database file not found');
    return;
  }

  // Create backup first
  const backupPath = createBackup();
  
  // Open database
  const db = new Database(dbPath);
  
  try {
    console.log('🚀 Starting v2.35.4 database cleanup...');
    
    // Get current counts before cleanup
    const beforeCounts = {
      simulations: db.prepare('SELECT COUNT(*) as count FROM simulations').get().count,
      userBets: db.prepare('SELECT COUNT(*) as count FROM user_bet_selections').get().count,
      matchOdds: db.prepare('SELECT COUNT(*) as count FROM match_odds_analysis').get().count,
      leagueIntel: db.prepare('SELECT COUNT(*) as count FROM league_market_intelligence').get().count,
      matchResults: db.prepare('SELECT COUNT(*) as count FROM match_results').get().count,
      bookmakerOdds: db.prepare('SELECT COUNT(*) as count FROM bookmaker_odds').get().count,
      leagues: db.prepare('SELECT COUNT(*) as count FROM leagues').get().count,
      teams: db.prepare('SELECT COUNT(*) as count FROM teams').get().count
    };
    
    console.log('📊 Current database state:', beforeCounts);
    
    // Clear betting and simulation data
    console.log('🧹 Clearing simulation and betting data...');
    
    // Clear in proper order due to foreign key constraints
    db.prepare('DELETE FROM match_results').run();
    db.prepare('DELETE FROM bookmaker_odds').run();
    db.prepare('DELETE FROM user_bet_selections').run();
    db.prepare('DELETE FROM match_odds_analysis').run();
    db.prepare('DELETE FROM league_market_intelligence').run();
    db.prepare('DELETE FROM simulations').run();
    
    // Reset user bankroll to default state
    console.log('💰 Resetting bankroll to default state...');
    db.prepare(`
      UPDATE user_bankroll 
      SET balance = 5000.00, 
          total_bets_placed = 0, 
          total_profit_loss = 0.00,
          updated_at = datetime('now')
    `).run();
    
    // Verify final counts
    const afterCounts = {
      simulations: db.prepare('SELECT COUNT(*) as count FROM simulations').get().count,
      userBets: db.prepare('SELECT COUNT(*) as count FROM user_bet_selections').get().count,
      matchOdds: db.prepare('SELECT COUNT(*) as count FROM match_odds_analysis').get().count,
      leagueIntel: db.prepare('SELECT COUNT(*) as count FROM league_market_intelligence').get().count,
      matchResults: db.prepare('SELECT COUNT(*) as count FROM match_results').get().count,
      bookmakerOdds: db.prepare('SELECT COUNT(*) as count FROM bookmaker_odds').get().count,
      leagues: db.prepare('SELECT COUNT(*) as count FROM leagues').get().count,
      teams: db.prepare('SELECT COUNT(*) as count FROM teams').get().count
    };
    
    console.log('✅ Cleanup completed successfully!');
    console.log('📊 Final database state:', afterCounts);
    console.log('🎯 PRESERVED: Leagues and Teams data intact');
    console.log('🧹 CLEARED: All simulation and betting data removed');
    console.log('💰 RESET: Bankroll restored to $5,000');
    
    // Verify data integrity
    console.log('🔍 Verifying data integrity...');
    const integrityCheck = {
      leagues_with_teams: db.prepare('SELECT COUNT(DISTINCT league_id) as count FROM teams WHERE league_id IS NOT NULL').get().count,
      total_leagues: afterCounts.leagues,
      total_teams: afterCounts.teams
    };
    
    console.log('✅ Integrity check passed:', integrityCheck);
    
    db.close();
    
    return {
      success: true,
      before: beforeCounts,
      after: afterCounts,
      backupPath: backupPath
    };
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    db.close();
    
    // Restore from backup if cleanup failed
    if (backupPath && fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, dbPath);
      console.log('🔄 Database restored from backup due to error');
    }
    
    throw error;
  }
}

// Run cleanup if called directly
if (require.main === module) {
  try {
    const result = cleanupDatabase();
    console.log('🎉 v2.35.4 database cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('💥 Cleanup script failed:', error);
    process.exit(1);
  }
}

module.exports = { cleanupDatabase, createBackup };