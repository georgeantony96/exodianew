const Database = require('better-sqlite3');
const path = require('path');

function checkSimulationPredictions() {
  const frontendDbPath = path.resolve('exodia.db');
  console.log(`🔍 Checking Predictions for Simulation 107...\n`);
  
  try {
    const db = new Database(frontendDbPath, { readonly: true });
    
    // Check for predictions with simulation_id = 107
    const predictions = db.prepare(`
      SELECT 
        id,
        pattern_fingerprint,
        market_type,
        predicted_outcome,
        confidence_level,
        prediction_date
      FROM pattern_learning_outcomes 
      WHERE simulation_id = 107
      ORDER BY market_type, id
    `).all();
    
    if (predictions.length > 0) {
      console.log(`📊 Found ${predictions.length} predictions for Simulation 107:`);
      console.log(`Prediction Date: ${predictions[0].prediction_date}\n`);
      
      // Group by market type for cleaner display
      const markets = {};
      predictions.forEach(pred => {
        if (!markets[pred.market_type]) {
          markets[pred.market_type] = [];
        }
        markets[pred.market_type].push(pred);
      });
      
      Object.keys(markets).forEach(marketType => {
        console.log(`🎯 ${marketType.toUpperCase()}:`);
        markets[marketType].forEach(pred => {
          const predictionText = pred.predicted_outcome >= 0.5 ? 
            `✅ YES (${(pred.predicted_outcome * 100).toFixed(1)}%)` : 
            `❌ NO (${(pred.predicted_outcome * 100).toFixed(1)}%)`;
          const confidence = `${(pred.confidence_level * 100).toFixed(0)}%`;
          
          console.log(`   Prediction: ${predictionText}`);
          console.log(`   Confidence: ${confidence}`);
          console.log(`   Pattern: ${pred.pattern_fingerprint}`);
          console.log('');
        });
      });
      
      // Summary
      const bttsYes = predictions.find(p => p.market_type === 'both_teams_score' && p.predicted_outcome >= 0.5);
      const overYes = predictions.find(p => p.market_type === 'over_2_5_goals' && p.predicted_outcome >= 0.5);
      const matchResult = predictions.find(p => p.market_type === 'match_result');
      
      console.log(`📋 SUMMARY FOR SIMULATION 107:`);
      console.log(`   BTTS: ${bttsYes ? '✅ YES' : '❌ NO'}`);
      console.log(`   Over 2.5: ${overYes ? '✅ YES' : '❌ NO'}`);
      if (matchResult) {
        const result = matchResult.predicted_outcome >= 0.5 ? '✅ YES' : '❌ NO';
        console.log(`   Match Result: ${result} (${(matchResult.predicted_outcome * 100).toFixed(1)}%)`);
      }
      
    } else {
      console.log(`❌ No predictions found for Simulation 107`);
      
      // Check if simulation exists
      const simExists = db.prepare(`
        SELECT COUNT(*) as count 
        FROM rich_historical_patterns 
        WHERE simulation_id = 107
      `).get();
      
      if (simExists.count > 0) {
        console.log(`ℹ️  Simulation 107 exists with ${simExists.count} patterns, but no predictions made yet.`);
      } else {
        console.log(`ℹ️  Simulation 107 not found in patterns table.`);
      }
      
      // Show recent simulation IDs for reference
      const recentSims = db.prepare(`
        SELECT DISTINCT simulation_id 
        FROM rich_historical_patterns 
        ORDER BY simulation_id DESC 
        LIMIT 10
      `).all();
      
      console.log(`\n📋 Recent Simulation IDs:`);
      recentSims.forEach((sim, i) => {
        console.log(`   ${i+1}. Simulation ${sim.simulation_id}`);
      });
    }
    
    db.close();
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

checkSimulationPredictions();