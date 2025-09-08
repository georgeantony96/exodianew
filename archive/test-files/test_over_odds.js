/**
 * Test script to verify Over 3.0 vs Over 3.5 odds calculation
 */

const fs = require('fs');

// Import the Monte Carlo engine
const { MonteCarloEngine } = require('./frontend/src/utils/montecarlo-engine.ts');

// Simple test data 
const testData = {
  home_team: 'Test Home',
  away_team: 'Test Away',
  historical_matches: {
    h2h_matches: [
      { home_score_ft: 2, away_score_ft: 1 },
      { home_score_ft: 3, away_score_ft: 2 },
      { home_score_ft: 1, away_score_ft: 4 },
      { home_score_ft: 2, away_score_ft: 2 },
      { home_score_ft: 4, away_score_ft: 1 },
      { home_score_ft: 1, away_score_ft: 3 }
    ],
    home_home_matches: [
      { home_score_ft: 3, away_score_ft: 1 },
      { home_score_ft: 2, away_score_ft: 0 },
      { home_score_ft: 4, away_score_ft: 2 }
    ],
    away_away_matches: [
      { home_score_ft: 1, away_score_ft: 2 },
      { home_score_ft: 0, away_score_ft: 3 },
      { home_score_ft: 2, away_score_ft: 1 }
    ]
  },
  boosts: {
    home_boost: 0,
    away_boost: 0,
    home_advantage: 0.2
  }
};

// Test the Monte Carlo engine
async function testOverOdds() {
  try {
    console.log('🧪 Testing Over 3.0 vs Over 3.5 odds calculation...\n');
    
    const engine = new MonteCarloEngine();
    const results = await engine.runSimulation(testData, 10000);
    
    console.log('📊 Results:');
    console.log(`Over 3.0 Probability: ${results.probabilities.over_under_3.over.toFixed(4)} (${(results.probabilities.over_under_3.over * 100).toFixed(1)}%)`);
    console.log(`Over 3.5 Probability: ${results.probabilities.over_under_35.over.toFixed(4)} (${(results.probabilities.over_under_35.over * 100).toFixed(1)}%)`);
    
    console.log(`Over 3.0 True Odds: ${results.true_odds.over_under_3.over.toFixed(2)}`);
    console.log(`Over 3.5 True Odds: ${results.true_odds.over_under_35.over.toFixed(2)}`);
    
    // Verify they are different
    const prob30 = results.probabilities.over_under_3.over;
    const prob35 = results.probabilities.over_under_35.over;
    
    if (Math.abs(prob30 - prob35) > 0.001) {
      console.log('\n✅ SUCCESS: Over 3.0 and Over 3.5 have different values!');
      console.log(`Difference: ${(Math.abs(prob30 - prob35) * 100).toFixed(2)}%`);
    } else {
      console.log('\n❌ ERROR: Over 3.0 and Over 3.5 have the same values!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testOverOdds();