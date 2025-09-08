const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 ANALYZING OVER 3.5 GOALS DATA AVAILABILITY');
console.log('============================================');

try {
  // Try multiple possible database locations
  const possiblePaths = [
    './frontend/exodia.db',
    './exodia.db',
    './database/exodia.db'
  ];

  let db;
  let dbPath;
  
  for (const testPath of possiblePaths) {
    try {
      db = new Database(testPath, { readonly: true });
      dbPath = testPath;
      console.log(`✅ Connected to database at: ${testPath}`);
      break;
    } catch (e) {
      console.log(`❌ Could not connect to: ${testPath}`);
    }
  }
  
  if (!db) {
    console.log('❌ No database found at any location');
    process.exit(1);
  }

  // Check database tables
  console.log('\n📊 DATABASE TABLES:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach(table => console.log(`  - ${table.name}`));

  // Check pattern learning outcomes structure
  console.log('\n📋 PATTERN LEARNING OUTCOMES STRUCTURE:');
  try {
    const plo_info = db.prepare("PRAGMA table_info(pattern_learning_outcomes)").all();
    plo_info.forEach(col => console.log(`  - ${col.name} (${col.type})`));
  } catch (e) {
    console.log('  ❌ pattern_learning_outcomes table not found');
  }

  // Check match results structure  
  console.log('\n🏆 MATCH RESULTS STRUCTURE:');
  try {
    const mr_info = db.prepare("PRAGMA table_info(match_results)").all();
    mr_info.forEach(col => console.log(`  - ${col.name} (${col.type})`));
  } catch (e) {
    console.log('  ❌ match_results table not found');
  }

  // Count total patterns with results
  console.log('\n📈 DATA AVAILABILITY:');
  
  try {
    const totalPatterns = db.prepare("SELECT COUNT(*) as count FROM pattern_learning_outcomes").get();
    console.log(`  Total pattern learning outcomes: ${totalPatterns.count}`);
    
    const over35Patterns = db.prepare("SELECT COUNT(*) as count FROM pattern_learning_outcomes WHERE market_type = 'over_3_5_goals'").get();
    console.log(`  Over 3.5 goals patterns: ${over35Patterns.count}`);
    
    const matchResults = db.prepare("SELECT COUNT(*) as count FROM match_results").get();
    console.log(`  Total match results: ${matchResults.count}`);
    
    // Get sample of Over 3.5 data
    console.log('\n📝 SAMPLE OVER 3.5 DATA:');
    const sampleData = db.prepare(`
      SELECT 
        pattern_fingerprint, 
        predicted_outcome, 
        actual_outcome,
        confidence_level,
        simulation_id
      FROM pattern_learning_outcomes 
      WHERE market_type = 'over_3_5_goals' 
      LIMIT 10
    `).all();
    
    sampleData.forEach((row, i) => {
      console.log(`  ${i+1}. Pattern: ${row.pattern_fingerprint.substring(0,30)}...`);
      console.log(`     Predicted: ${row.predicted_outcome}, Actual: ${row.actual_outcome}`);
      console.log(`     Confidence: ${row.confidence_level}, Sim ID: ${row.simulation_id}`);
    });
    
    // Calculate current Over 3.5 accuracy using existing data
    if (over35Patterns.count > 0) {
      console.log('\n🎯 CURRENT OVER 3.5 PERFORMANCE:');
      const accuracyData = db.prepare(`
        SELECT 
          COUNT(*) as total_predictions,
          AVG(CASE WHEN actual_outcome = 1.0 THEN 1.0 ELSE 0.0 END) as actual_success_rate,
          AVG(predicted_outcome) as avg_predicted_probability,
          COUNT(CASE WHEN actual_outcome = 1.0 THEN 1 END) as correct_predictions,
          COUNT(CASE WHEN actual_outcome = 0.0 THEN 1 END) as incorrect_predictions
        FROM pattern_learning_outcomes 
        WHERE market_type = 'over_3_5_goals'
      `).get();
      
      console.log(`  📊 Total Over 3.5 predictions: ${accuracyData.total_predictions}`);
      console.log(`  ✅ Correct predictions: ${accuracyData.correct_predictions}`);
      console.log(`  ❌ Incorrect predictions: ${accuracyData.incorrect_predictions}`);
      console.log(`  🎯 Current accuracy: ${(accuracyData.actual_success_rate * 100).toFixed(1)}%`);
      console.log(`  📈 Average predicted probability: ${(accuracyData.avg_predicted_probability * 100).toFixed(1)}%`);
      
      // Compare with other markets
      console.log('\n📊 COMPARISON WITH OTHER MARKETS:');
      const allMarkets = db.prepare(`
        SELECT 
          market_type,
          COUNT(*) as total_predictions,
          AVG(CASE WHEN actual_outcome = 1.0 THEN 1.0 ELSE 0.0 END) as accuracy,
          AVG(predicted_outcome) as avg_predicted
        FROM pattern_learning_outcomes 
        GROUP BY market_type
        ORDER BY total_predictions DESC
      `).all();
      
      allMarkets.forEach(market => {
        console.log(`  ${market.market_type}: ${market.total_predictions} predictions, ${(market.accuracy * 100).toFixed(1)}% accuracy`);
      });
    }
    
  } catch (e) {
    console.log('  ❌ Error querying pattern data:', e.message);
  }

  db.close();
  console.log('\n✅ Analysis complete!');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}