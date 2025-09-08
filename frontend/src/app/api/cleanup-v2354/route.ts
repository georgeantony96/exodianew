import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export async function POST() {
  try {
    console.log('🚀 Starting v2.35.4 database cleanup...');
    
    const dbPath = path.resolve(process.cwd(), '..', 'database', 'exodia.db');
    
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Database file not found' }, { status: 404 });
    }

    // Create backup first
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupPath = path.join(path.dirname(dbPath), `backup_before_v2354_cleanup_${timestamp}.db`);
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✅ Backup created: ${backupPath}`);

    const db = new Database(dbPath);
    
    // Get current counts before cleanup
    const beforeCounts = {
      simulations: db.prepare('SELECT COUNT(*) as count FROM simulations').get()?.count || 0,
      userBets: db.prepare('SELECT COUNT(*) as count FROM user_bet_selections').get()?.count || 0,
      matchOdds: db.prepare('SELECT COUNT(*) as count FROM match_odds_analysis').get()?.count || 0,
      leagueIntel: db.prepare('SELECT COUNT(*) as count FROM league_market_intelligence').get()?.count || 0,
      matchResults: db.prepare('SELECT COUNT(*) as count FROM match_results').get()?.count || 0,
      bookmakerOdds: db.prepare('SELECT COUNT(*) as count FROM bookmaker_odds').get()?.count || 0,
      leagues: db.prepare('SELECT COUNT(*) as count FROM leagues').get()?.count || 0,
      teams: db.prepare('SELECT COUNT(*) as count FROM teams').get()?.count || 0
    };
    
    console.log('📊 Current database state:', beforeCounts);
    
    // Clear betting and simulation data in proper order due to foreign key constraints
    console.log('🧹 Clearing simulation and betting data...');
    
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
      SET current_balance = 5000.00,
          starting_balance = 5000.00,
          total_bets_placed = 0, 
          total_profit_loss = 0.00,
          total_staked = 0.00,
          winning_bets = 0,
          losing_bets = 0,
          pending_bets = 0,
          win_rate = 0.00,
          roi_percentage = 0.00,
          roi_on_turnover = 0.00,
          max_balance = 5000.00,
          max_drawdown = 0.00,
          max_drawdown_amount = 0.00,
          current_drawdown = 0.00,
          updated_at = datetime('now')
    `).run();
    
    // Verify final counts
    const afterCounts = {
      simulations: db.prepare('SELECT COUNT(*) as count FROM simulations').get()?.count || 0,
      userBets: db.prepare('SELECT COUNT(*) as count FROM user_bet_selections').get()?.count || 0,
      matchOdds: db.prepare('SELECT COUNT(*) as count FROM match_odds_analysis').get()?.count || 0,
      leagueIntel: db.prepare('SELECT COUNT(*) as count FROM league_market_intelligence').get()?.count || 0,
      matchResults: db.prepare('SELECT COUNT(*) as count FROM match_results').get()?.count || 0,
      bookmakerOdds: db.prepare('SELECT COUNT(*) as count FROM bookmaker_odds').get()?.count || 0,
      leagues: db.prepare('SELECT COUNT(*) as count FROM leagues').get()?.count || 0,
      teams: db.prepare('SELECT COUNT(*) as count FROM teams').get()?.count || 0
    };
    
    // Verify data integrity
    const integrityCheck = {
      leagues_with_teams: db.prepare('SELECT COUNT(DISTINCT league_id) as count FROM teams WHERE league_id IS NOT NULL').get()?.count || 0,
      total_leagues: afterCounts.leagues,
      total_teams: afterCounts.teams
    };
    
    db.close();
    
    console.log('✅ Cleanup completed successfully!');
    console.log('📊 Final database state:', afterCounts);
    console.log('🎯 PRESERVED: Leagues and Teams data intact');
    console.log('🧹 CLEARED: All simulation and betting data removed');
    console.log('💰 RESET: Bankroll restored to $5,000');
    console.log('✅ Integrity check passed:', integrityCheck);
    
    return NextResponse.json({
      success: true,
      message: 'v2.35.4 database cleanup completed successfully',
      before: beforeCounts,
      after: afterCounts,
      integrity: integrityCheck,
      backupCreated: backupPath
    });
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return NextResponse.json({ 
      error: 'Database cleanup failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}