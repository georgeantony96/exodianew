const Database = require('./frontend/node_modules/better-sqlite3');
const path = require('path');

const dbPath = path.resolve('./frontend/exodia.db');
const db = new Database(dbPath);

console.log('🔍 CHECKING FINGERPRINT GENERATION AND PARSING...\n');

// Check if rich_historical_patterns table exists and has data
try {
  const patternCount = db.prepare('SELECT COUNT(*) as count FROM rich_historical_patterns').get();
  console.log(`✅ Rich Historical Patterns: ${patternCount.count} records found`);
  
  if (patternCount.count > 0) {
    // Show recent patterns
    const recentPatterns = db.prepare(`
      SELECT simulation_id, team_type, game_position, 
             home_score_ft, away_score_ft, home_score_ht, away_score_ht,
             rich_fingerprint_combined,
             created_at
      FROM rich_historical_patterns 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();
    
    console.log('\n📊 RECENT FINGERPRINTS:');
    recentPatterns.forEach((pattern, index) => {
      console.log(`${index + 1}. Simulation ${pattern.simulation_id} (${pattern.team_type}):`);
      console.log(`   Score: ${pattern.home_score_ft}-${pattern.away_score_ft} (HT: ${pattern.home_score_ht}-${pattern.away_score_ht})`);
      console.log(`   Fingerprint: ${pattern.rich_fingerprint_combined}`);
      console.log(`   Created: ${pattern.created_at}\n`);
    });
  }
} catch (error) {
  console.log('❌ Rich Historical Patterns table not found or error:', error.message);
}

// Check adaptive threshold learning
try {
  const adaptiveStats = db.prepare(`
    SELECT pattern_type, current_penalty, original_penalty, 
           total_predictions, successful_predictions, 
           last_adjusted_at
    FROM adaptive_thresholds
  `).all();
  
  console.log('🧠 ADAPTIVE THRESHOLD STATUS:');
  adaptiveStats.forEach(threshold => {
    const successRate = threshold.total_predictions > 0 
      ? (threshold.successful_predictions / threshold.total_predictions * 100).toFixed(1)
      : '0.0';
    
    console.log(`   ${threshold.pattern_type}:`);
    console.log(`     Current Penalty: ${threshold.current_penalty} (Original: ${threshold.original_penalty})`);
    console.log(`     Predictions: ${threshold.total_predictions} (${successRate}% success)`);
    console.log(`     Last Adjusted: ${threshold.last_adjusted_at || 'Never'}\n`);
  });
} catch (error) {
  console.log('❌ Adaptive thresholds error:', error.message);
}

// Check pattern learning outcomes
try {
  const learningCount = db.prepare('SELECT COUNT(*) as count FROM pattern_learning_outcomes').get();
  console.log(`📚 PATTERN LEARNING OUTCOMES: ${learningCount.count} predictions recorded`);
  
  if (learningCount.count > 0) {
    const recentLearning = db.prepare(`
      SELECT pattern_fingerprint, predicted_outcome, actual_outcome,
             confidence_level, prediction_date, result_date
      FROM pattern_learning_outcomes 
      ORDER BY prediction_date DESC 
      LIMIT 3
    `).all();
    
    console.log('\n📈 RECENT LEARNING RECORDS:');
    recentLearning.forEach((record, index) => {
      console.log(`${index + 1}. Pattern: ${record.pattern_fingerprint}`);
      console.log(`   Predicted: ${record.predicted_outcome}, Actual: ${record.actual_outcome || 'Pending'}`);
      console.log(`   Confidence: ${(record.confidence_level * 100).toFixed(1)}%`);
      console.log(`   Date: ${record.prediction_date}\n`);
    });
  }
} catch (error) {
  console.log('❌ Pattern learning outcomes error:', error.message);
}

// Check simulation records
try {
  const recentSims = db.prepare(`
    SELECT id, home_team, away_team, engine_version, created_at,
           CASE 
             WHEN results_data IS NOT NULL THEN 'Has Results'
             ELSE 'No Results'
           END as results_status
    FROM simulations 
    ORDER BY created_at DESC 
    LIMIT 3
  `).all();
  
  console.log('🎯 RECENT SIMULATIONS:');
  recentSims.forEach((sim, index) => {
    console.log(`${index + 1}. ID: ${sim.id} - ${sim.home_team} vs ${sim.away_team}`);
    console.log(`   Engine: ${sim.engine_version}`);
    console.log(`   Status: ${sim.results_status}`);
    console.log(`   Created: ${sim.created_at}\n`);
  });
} catch (error) {
  console.log('❌ Simulations check error:', error.message);
}

db.close();
console.log('✅ Database check complete!');