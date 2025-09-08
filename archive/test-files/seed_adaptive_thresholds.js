/**
 * SEED ADAPTIVE THRESHOLDS
 * 
 * Populate the adaptive_thresholds table with initial pattern types
 * that match the Mean Reversion system penalties
 */

const Database = require('./frontend/node_modules/better-sqlite3');
const path = require('path');

const dbPath = path.resolve('./database/exodia.db');
const db = new Database(dbPath);

console.log('🌱 Seeding Adaptive Thresholds with Mean Reversion Patterns...');

// Initial threshold configurations based on DEFAULT_REVERSION_CONFIG
const initialThresholds = [
  {
    pattern_type: 'home_over_dominance',
    original_penalty: -0.25,  // From DEFAULT_REVERSION_CONFIG.homeForm.goalPenalty
    learning_rate: 0.02,
    confidence_threshold: 0.70,
    min_penalty: -0.50,
    max_penalty: 0.0
  },
  {
    pattern_type: 'away_over_dominance', 
    original_penalty: -0.25,  // From DEFAULT_REVERSION_CONFIG.awayForm.goalPenalty
    learning_rate: 0.02,
    confidence_threshold: 0.70,
    min_penalty: -0.50,
    max_penalty: 0.0
  },
  {
    pattern_type: 'home_unbeaten_streak',
    original_penalty: -0.18,  // Placeholder for future streak learning
    learning_rate: 0.015,
    confidence_threshold: 0.75,
    min_penalty: -0.35,
    max_penalty: 0.0
  },
  {
    pattern_type: 'away_unbeaten_streak',
    original_penalty: -0.18,  // Placeholder for future streak learning
    learning_rate: 0.015,
    confidence_threshold: 0.75,
    min_penalty: -0.35,
    max_penalty: 0.0
  },
  {
    pattern_type: 'h2h_over_pattern',
    original_penalty: -0.30,  // From DEFAULT_REVERSION_CONFIG.h2hOvers.goalPenalty
    learning_rate: 0.025,
    confidence_threshold: 0.75,
    min_penalty: -0.60,
    max_penalty: 0.0
  },
  {
    pattern_type: 'h2h_under_pattern',
    original_penalty: 0.20,   // From DEFAULT_REVERSION_CONFIG.h2hOvers.goalBoost (positive for boost)
    learning_rate: 0.02,
    confidence_threshold: 0.75,
    min_penalty: -0.10,
    max_penalty: 0.50
  }
];

try {
  // Clear existing thresholds
  const deleteResult = db.prepare('DELETE FROM adaptive_thresholds').run();
  console.log(`🗑️ Cleared ${deleteResult.changes} existing threshold records`);

  // Insert initial thresholds
  const insertStmt = db.prepare(`
    INSERT INTO adaptive_thresholds (
      pattern_type, current_penalty, original_penalty, 
      total_predictions, successful_predictions, total_error, avg_error, recent_avg_error,
      last_adjustment, last_adjusted_at, adjustment_count, learning_rate, 
      confidence_threshold, min_penalty, max_penalty, created_at, updated_at
    ) VALUES (?, ?, ?, 0, 0, 0.0, 0.0, 0.0, 0.0, NULL, 0, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  let insertedCount = 0;
  initialThresholds.forEach(threshold => {
    const result = insertStmt.run(
      threshold.pattern_type,
      threshold.original_penalty,  // Start with original penalty as current
      threshold.original_penalty,
      threshold.learning_rate,
      threshold.confidence_threshold,
      threshold.min_penalty,
      threshold.max_penalty
    );
    
    if (result.changes > 0) {
      insertedCount++;
      console.log(`✅ Seeded: ${threshold.pattern_type} (penalty: ${threshold.original_penalty})`);
    }
  });

  console.log(`🌱 Successfully seeded ${insertedCount}/${initialThresholds.length} adaptive threshold patterns`);
  
  // Verify the seeded data
  const verifyResult = db.prepare('SELECT pattern_type, current_penalty, original_penalty FROM adaptive_thresholds ORDER BY pattern_type').all();
  console.log('\n📊 Verification - Seeded Patterns:');
  verifyResult.forEach(row => {
    console.log(`   ${row.pattern_type}: current=${row.current_penalty}, original=${row.original_penalty}`);
  });

} catch (error) {
  console.error('❌ Error seeding adaptive thresholds:', error);
} finally {
  db.close();
  console.log('\n✅ Database connection closed');
}