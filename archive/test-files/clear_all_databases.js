const Database = require('./frontend/node_modules/better-sqlite3');
const path = require('path');

console.log('🧹 CLEARING ALL DATABASES (FRONTEND + MAIN)...\n');

// Clear both database locations
const frontendDbPath = path.resolve('./frontend/exodia.db');
const mainDbPath = path.resolve('./database/exodia.db');

const databases = [
  { name: 'Frontend DB', path: frontendDbPath },
  { name: 'Main DB', path: mainDbPath }
];

databases.forEach(({ name, path: dbPath }) => {
  console.log(`🔍 ${name}: ${dbPath}`);
  
  try {
    const db = new Database(dbPath);
    
    // Clear all data tables
    const clearTables = [
      'rich_historical_patterns', 'pattern_learning_outcomes', 'simulations',
      'user_bet_selections', 'user_bankroll', 'match_results', 'bookmaker_odds',
      'teams', 'leagues', 'historical_matches', 'team_home_performance', 
      'team_away_performance', 'league_market_intelligence', 'sequence_patterns',
      'match_odds_analysis'
    ];
    
    clearTables.forEach(tableName => {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
        if (count.count > 0) {
          db.exec(`DELETE FROM ${tableName}`);
          console.log(`   ✅ Cleared ${tableName} (${count.count} rows)`);
        }
      } catch (e) {
        // Table might not exist
      }
    });
    
    // Reset adaptive thresholds
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
      console.log('   ✅ Reset adaptive thresholds');
    } catch (e) {}
    
    // Reset sequences
    try {
      db.exec(`UPDATE sqlite_sequence SET seq = 0`);
      console.log('   ✅ Reset ID sequences');
    } catch (e) {}
    
    db.close();
    console.log(`   ✅ ${name} completely cleared\n`);
    
  } catch (error) {
    console.log(`   ❌ Error with ${name}:`, error.message, '\n');
  }
});

console.log('🎉 ALL DATABASES CLEARED!');
console.log('🚀 Fresh start ready - no teams, leagues, or historical data anywhere!');