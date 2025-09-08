const Database = require('./frontend/node_modules/better-sqlite3');
const path = require('path');

console.log('🧹 COMPLETE DATABASE RESET - STARTING FRESH...\n');

const dbPath = path.resolve('./frontend/exodia.db');
const db = new Database(dbPath);

// Clear all simulation and pattern data
console.log('📊 Clearing simulation and pattern data...');
try {
  db.exec('DELETE FROM rich_historical_patterns');
  console.log('✅ Cleared rich_historical_patterns');
} catch (e) { console.log('ℹ️ rich_historical_patterns already empty or not found'); }

try {
  db.exec('DELETE FROM pattern_learning_outcomes');
  console.log('✅ Cleared pattern_learning_outcomes');
} catch (e) { console.log('ℹ️ pattern_learning_outcomes already empty or not found'); }

try {
  db.exec('DELETE FROM simulations');
  console.log('✅ Cleared simulations');
} catch (e) { console.log('ℹ️ simulations already empty or not found'); }

// Clear bet and bankroll data
console.log('\n💰 Clearing betting and bankroll data...');
try {
  db.exec('DELETE FROM user_bet_selections');
  console.log('✅ Cleared user_bet_selections');
} catch (e) { console.log('ℹ️ user_bet_selections already empty or not found'); }

try {
  db.exec('DELETE FROM user_bankroll');
  console.log('✅ Cleared user_bankroll');
} catch (e) { console.log('ℹ️ user_bankroll already empty or not found'); }

try {
  db.exec('DELETE FROM match_results');
  console.log('✅ Cleared match_results');
} catch (e) { console.log('ℹ️ match_results already empty or not found'); }

try {
  db.exec('DELETE FROM bookmaker_odds');
  console.log('✅ Cleared bookmaker_odds');
} catch (e) { console.log('ℹ️ bookmaker_odds already empty or not found'); }

try {
  db.exec('DELETE FROM match_odds_analysis');
  console.log('✅ Cleared match_odds_analysis');
} catch (e) { console.log('ℹ️ match_odds_analysis already empty or not found'); }

// Clear teams and leagues (keep structure but clear data)
console.log('\n🏟️ Clearing teams and leagues data...');
try {
  db.exec('DELETE FROM teams');
  console.log('✅ Cleared teams');
} catch (e) { console.log('ℹ️ teams already empty or not found'); }

try {
  db.exec('DELETE FROM leagues');
  console.log('✅ Cleared leagues');
} catch (e) { console.log('ℹ️ leagues already empty or not found'); }

try {
  db.exec('DELETE FROM historical_matches');
  console.log('✅ Cleared historical_matches');
} catch (e) { console.log('ℹ️ historical_matches already empty or not found'); }

// Clear performance and intelligence data
console.log('\n📈 Clearing performance and intelligence data...');
try {
  db.exec('DELETE FROM team_home_performance');
  console.log('✅ Cleared team_home_performance');
} catch (e) { console.log('ℹ️ team_home_performance already empty or not found'); }

try {
  db.exec('DELETE FROM team_away_performance');
  console.log('✅ Cleared team_away_performance');
} catch (e) { console.log('ℹ️ team_away_performance already empty or not found'); }

try {
  db.exec('DELETE FROM league_market_intelligence');
  console.log('✅ Cleared league_market_intelligence');
} catch (e) { console.log('ℹ️ league_market_intelligence already empty or not found'); }

try {
  db.exec('DELETE FROM sequence_patterns');
  console.log('✅ Cleared sequence_patterns');
} catch (e) { console.log('ℹ️ sequence_patterns already empty or not found'); }

// Reset adaptive thresholds to original values
console.log('\n🧠 Resetting adaptive thresholds to original values...');
try {
  db.exec(`
    UPDATE adaptive_thresholds SET 
      current_penalty = original_penalty,
      total_predictions = 0,
      successful_predictions = 0,
      total_error = 0.0,
      avg_error = 0.0,
      recent_avg_error = 0.0,
      last_adjustment = 0.0,
      last_adjusted_at = NULL,
      adjustment_count = 0
  `);
  console.log('✅ Reset adaptive thresholds');
} catch (e) { console.log('ℹ️ adaptive_thresholds reset error:', e.message); }

// Reset auto-increment sequences
console.log('\n🔄 Resetting ID sequences...');
try {
  db.exec(`UPDATE sqlite_sequence SET seq = 0 WHERE name IN (
    'simulations', 'teams', 'leagues', 'rich_historical_patterns', 
    'pattern_learning_outcomes', 'user_bet_selections', 'match_results'
  )`);
  console.log('✅ Reset ID sequences');
} catch (e) { console.log('ℹ️ ID sequences reset info:', e.message); }

// Verify complete reset
console.log('\n🔍 VERIFYING COMPLETE RESET...');
const tables = [
  'simulations', 'rich_historical_patterns', 'pattern_learning_outcomes',
  'teams', 'leagues', 'historical_matches', 'user_bet_selections',
  'match_results', 'bookmaker_odds', 'user_bankroll'
];

tables.forEach(tableName => {
  try {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    console.log(`   ${tableName}: ${count.count} rows`);
  } catch (e) {
    console.log(`   ${tableName}: table not found or error`);
  }
});

// Check adaptive thresholds status
try {
  const thresholds = db.prepare(`
    SELECT COUNT(*) as total, 
           SUM(CASE WHEN current_penalty = original_penalty THEN 1 ELSE 0 END) as reset_count
    FROM adaptive_thresholds
  `).get();
  console.log(`   adaptive_thresholds: ${thresholds.total} rows (${thresholds.reset_count} properly reset)`);
} catch (e) {
  console.log('   adaptive_thresholds: error checking');
}

db.close();

console.log('\n🎉 COMPLETE DATABASE RESET SUCCESSFUL!');
console.log('✅ All simulation, pattern, betting, and team data cleared');
console.log('✅ Adaptive thresholds reset to original values');
console.log('✅ ID sequences reset to start from 1');
console.log('\n🚀 Ready for fresh start with your real match data!');