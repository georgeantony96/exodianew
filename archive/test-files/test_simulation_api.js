/**
 * Test Over 3.0 vs Over 3.5 odds via simulation API
 */

const testData = {
  "homeTeam": { "id": 1, "name": "Test Home" },
  "awayTeam": { "id": 2, "name": "Test Away" },
  "selectedLeague": { "id": 1, "name": "Test League", "country": "Test", "intelligence_enabled": true },
  "historicalMatches": {
    "h2h": [
      { "home_score_ft": 2, "away_score_ft": 1, "home_score_ht": 1, "away_score_ht": 0 },
      { "home_score_ft": 3, "away_score_ft": 2, "home_score_ht": 2, "away_score_ht": 1 },
      { "home_score_ft": 1, "away_score_ft": 4, "home_score_ht": 0, "away_score_ht": 2 },
      { "home_score_ft": 2, "away_score_ft": 2, "home_score_ht": 1, "away_score_ht": 1 },
      { "home_score_ft": 4, "away_score_ft": 1, "home_score_ht": 2, "away_score_ht": 0 },
      { "home_score_ft": 1, "away_score_ft": 3, "home_score_ht": 1, "away_score_ht": 1 }
    ],
    "home_home": [
      { "home_score_ft": 3, "away_score_ft": 1, "home_score_ht": 1, "away_score_ht": 0 },
      { "home_score_ft": 2, "away_score_ft": 0, "home_score_ht": 1, "away_score_ht": 0 },
      { "home_score_ft": 4, "away_score_ft": 2, "home_score_ht": 2, "away_score_ht": 1 }
    ],
    "away_away": [
      { "home_score_ft": 1, "away_score_ft": 2, "home_score_ht": 0, "away_score_ht": 1 },
      { "home_score_ft": 0, "away_score_ft": 3, "home_score_ht": 0, "away_score_ht": 1 },
      { "home_score_ft": 2, "away_score_ft": 1, "home_score_ht": 1, "away_score_ht": 0 }
    ]
  },
  "bookmakerOdds": {
    "over_under_3": { "over": 2.10, "under": 1.80 },
    "over_under_35": { "over": 2.50, "under": 1.60 }
  },
  "boosts": {
    "home_boost": 0,
    "away_boost": 0,
    "home_advantage": 0.2,
    "chaos_config": { "enabled": false },
    "reversion_config": { "globalEnabled": false }
  },
  "distribution": "poisson",
  "iterations": 10000
};

async function testSimulationAPI() {
  try {
    console.log('🧪 Testing simulation API for Over 3.0 vs Over 3.5 odds...\n');
    
    const response = await fetch('http://localhost:3001/api/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const results = await response.json();
    
    console.log('📊 API Response Structure:', Object.keys(results));
    
    if (results.results) {
      const simResults = results.results;
      
      // Check probabilities
      if (simResults.probabilities?.over_under_3 && simResults.probabilities?.over_under_35) {
        const prob30 = simResults.probabilities.over_under_3.over;
        const prob35 = simResults.probabilities.over_under_35.over;
        
        console.log(`Over 3.0 Probability: ${prob30.toFixed(4)} (${(prob30 * 100).toFixed(1)}%)`);
        console.log(`Over 3.5 Probability: ${prob35.toFixed(4)} (${(prob35 * 100).toFixed(1)}%)`);
        
        // Check true odds
        if (simResults.true_odds?.over_under_3 && simResults.true_odds?.over_under_35) {
          console.log(`Over 3.0 True Odds: ${simResults.true_odds.over_under_3.over.toFixed(2)}`);
          console.log(`Over 3.5 True Odds: ${simResults.true_odds.over_under_35.over.toFixed(2)}`);
        }
        
        // Verify they are different
        if (Math.abs(prob30 - prob35) > 0.001) {
          console.log('\n✅ SUCCESS: Over 3.0 and Over 3.5 have different values!');
          console.log(`Probability Difference: ${(Math.abs(prob30 - prob35) * 100).toFixed(2)}%`);
        } else {
          console.log('\n❌ ERROR: Over 3.0 and Over 3.5 have the same values!');
        }
      } else {
        console.log('\n⚠️  Missing over_under_3 or over_under_35 in probabilities');
        console.log('Available probability keys:', Object.keys(simResults.probabilities || {}));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Use node-fetch for Node.js environment
const fetch = require('node-fetch');

testSimulationAPI();