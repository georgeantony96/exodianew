const Database = require('./frontend/node_modules/better-sqlite3');
const path = require('path');

const dbPath = path.resolve('./frontend/exodia.db');
const db = new Database(dbPath);

console.log('🧹 CLEANING PATTERN DATABASE FOR FRESH START...\n');

// Check current state
const currentPatterns = db.prepare('SELECT COUNT(*) as count FROM rich_historical_patterns').get();
const currentLearning = db.prepare('SELECT COUNT(*) as count FROM pattern_learning_outcomes').get();
const currentSims = db.prepare('SELECT COUNT(*) as count FROM simulations').get();

console.log('📊 CURRENT STATE:');
console.log(`   Rich Historical Patterns: ${currentPatterns.count}`);
console.log(`   Pattern Learning Outcomes: ${currentLearning.count}`);
console.log(`   Simulations: ${currentSims.count}`);

// Clear all pattern learning data for fresh start
try {
  db.exec('DELETE FROM rich_historical_patterns');
  console.log('✅ Cleared rich_historical_patterns table');
} catch (error) {
  console.log('❌ Error clearing rich_historical_patterns:', error.message);
}

try {
  db.exec('DELETE FROM pattern_learning_outcomes');
  console.log('✅ Cleared pattern_learning_outcomes table');
} catch (error) {
  console.log('❌ Error clearing pattern_learning_outcomes:', error.message);
}

try {
  db.exec('DELETE FROM simulations');
  console.log('✅ Cleared simulations table');
} catch (error) {
  console.log('❌ Error clearing simulations:', error.message);
}

// Reset adaptive thresholds to original values
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
  console.log('✅ Reset adaptive thresholds to original values');
} catch (error) {
  console.log('❌ Error resetting adaptive thresholds:', error.message);
}

// Verify clean state
const finalPatterns = db.prepare('SELECT COUNT(*) as count FROM rich_historical_patterns').get();
const finalLearning = db.prepare('SELECT COUNT(*) as count FROM pattern_learning_outcomes').get();
const finalSims = db.prepare('SELECT COUNT(*) as count FROM simulations').get();

console.log('\n✅ CLEAN STATE VERIFIED:');
console.log(`   Rich Historical Patterns: ${finalPatterns.count}`);
console.log(`   Pattern Learning Outcomes: ${finalLearning.count}`);
console.log(`   Simulations: ${finalSims.count}`);

db.close();
console.log('\n🎉 Database cleaned! Ready for fresh fingerprint testing!');