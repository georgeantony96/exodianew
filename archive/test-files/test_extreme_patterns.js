const axios = require('axios');

const testData = {
  home_team_id: 100,
  away_team_id: 101,
  league_id: 1,
  match_date: '2025-08-25',
  distribution_type: 'poisson',
  iterations: 100000,
  boost_settings: {
    home_advantage: 0.10,
    custom_home_boost: 0,
    custom_away_boost: 0,
    enable_streak_analysis: true,
    chaos_config: {
      enabled: true,
      levyFlights: { enabled: true, intensity: 0.08, alpha: 1.7 },
      fractalVariance: { enabled: true, intensity: 0.12 },
      stochasticShocks: { enabled: true, redCard: 0.12, penalty: 0.25, momentum: 0.4 }
    },
    reversion_config: {
      homeForm: { enabled: true, overThreshold: 0.65, underThreshold: 0.70, minGames: 7, goalPenalty: -0.12, goalBoost: 0.10 },
      awayForm: { enabled: true, overThreshold: 0.65, underThreshold: 0.70, minGames: 7, goalPenalty: -0.12, goalBoost: 0.10 },
      h2hWins: { enabled: true, winThreshold: 0.65, minMatches: 6, winProbPenalty: -0.08 },
      h2hOvers: { enabled: true, overThreshold: 0.65, underThreshold: 0.70, minMatches: 6, goalPenalty: -0.15, goalBoost: 0.12 },
      defensiveFatigue: { enabled: true, cleanSheetThreshold: 4, cleanSheetRate: 0.80, minGames: 5, fatiguePenalty: -0.08, consecutiveMultiplier: 0.02 },
      attackingDrought: { enabled: true, goallessGames: 3, minGames: 4, reversionBoost: 0.12, intensityMultiplier: 0.04, maxBoost: 0.25 },
      emotionalMomentum: { enabled: true, winStreakThreshold: 8, pressureMultiplier: 1.15, psychologicalPenalty: -0.06, maxPenalty: -0.15, streakDecayFactor: 1.2 },
      globalEnabled: true,
      confidenceThreshold: 0.50,
      maxTotalAdjustment: 0.30
    }
  },
  historical_data: {
    // 8/8 H2H home wins - 100% win rate triggers reversion
    h2h: [
      { home_team: 'TestHome', away_team: 'TestAway', home_score_ht: 1, away_score_ht: 0, home_score_ft: 3, away_score_ft: 1 },
      { home_team: 'TestHome', away_team: 'TestAway', home_score_ht: 2, away_score_ht: 0, home_score_ft: 4, away_score_ft: 0 },
      { home_team: 'TestHome', away_team: 'TestAway', home_score_ht: 1, away_score_ht: 1, home_score_ft: 2, away_score_ft: 1 },
      { home_team: 'TestHome', away_team: 'TestAway', home_score_ht: 0, away_score_ht: 0, home_score_ft: 1, away_score_ft: 0 },
      { home_team: 'TestHome', away_team: 'TestAway', home_score_ht: 2, away_score_ht: 1, home_score_ft: 3, away_score_ft: 2 },
      { home_team: 'TestHome', away_team: 'TestAway', home_score_ht: 1, away_score_ht: 0, home_score_ft: 2, away_score_ft: 0 },
      { home_team: 'TestHome', away_team: 'TestAway', home_score_ht: 3, away_score_ht: 0, home_score_ft: 5, away_score_ft: 1 },
      { home_team: 'TestHome', away_team: 'TestAway', home_score_ht: 1, away_score_ht: 0, home_score_ft: 1, away_score_ft: 0 }
    ],
    // Home team: 5 clean sheets (defensive fatigue), high over rate
    home_home: [
      { home_team: 'TestHome', away_team: 'OpponentA', home_score_ht: 2, away_score_ht: 0, home_score_ft: 3, away_score_ft: 0 }, // Clean sheet
      { home_team: 'TestHome', away_team: 'OpponentB', home_score_ht: 1, away_score_ht: 0, home_score_ft: 2, away_score_ft: 0 }, // Clean sheet
      { home_team: 'TestHome', away_team: 'OpponentC', home_score_ht: 3, away_score_ht: 0, home_score_ft: 4, away_score_ft: 0 }, // Clean sheet + Over
      { home_team: 'TestHome', away_team: 'OpponentD', home_score_ht: 2, away_score_ht: 0, home_score_ft: 3, away_score_ft: 0 }, // Clean sheet + Over
      { home_team: 'TestHome', away_team: 'OpponentE', home_score_ht: 1, away_score_ht: 0, home_score_ft: 1, away_score_ft: 0 }, // Clean sheet
      { home_team: 'TestHome', away_team: 'OpponentF', home_score_ht: 2, away_score_ht: 0, home_score_ft: 5, away_score_ft: 1 }, // Over
      { home_team: 'TestHome', away_team: 'OpponentG', home_score_ht: 3, away_score_ht: 1, home_score_ft: 4, away_score_ft: 2 }, // Over
      { home_team: 'TestHome', away_team: 'OpponentH', home_score_ht: 2, away_score_ht: 1, home_score_ft: 3, away_score_ft: 3 }, // Over
      { home_team: 'TestHome', away_team: 'OpponentI', home_score_ht: 1, away_score_ht: 2, home_score_ft: 2, away_score_ft: 4 }  // Over
    ],
    // Away team: 4 consecutive goalless games (attacking drought)
    away_away: [
      { home_team: 'OpponentX', away_team: 'TestAway', home_score_ht: 1, away_score_ht: 0, home_score_ft: 2, away_score_ft: 0 }, // Goalless
      { home_team: 'OpponentY', away_team: 'TestAway', home_score_ht: 2, away_score_ht: 0, home_score_ft: 3, away_score_ft: 0 }, // Goalless
      { home_team: 'OpponentZ', away_team: 'TestAway', home_score_ht: 1, away_score_ht: 0, home_score_ft: 1, away_score_ft: 0 }, // Goalless
      { home_team: 'OpponentW', away_team: 'TestAway', home_score_ht: 0, away_score_ht: 0, home_score_ft: 1, away_score_ft: 0 }, // Goalless
      { home_team: 'OpponentV', away_team: 'TestAway', home_score_ht: 1, away_score_ht: 1, home_score_ft: 2, away_score_ft: 3 }, // Scored (breaks drought)
      { home_team: 'OpponentU', away_team: 'TestAway', home_score_ht: 0, away_score_ht: 2, home_score_ft: 1, away_score_ft: 4 }, // High scoring
      { home_team: 'OpponentT', away_team: 'TestAway', home_score_ht: 2, away_score_ht: 1, home_score_ft: 3, away_score_ft: 2 }  // Scored
    ]
  },
  bookmaker_odds: {
    '1x2_ft': { home: 1.45, draw: 4.20, away: 6.50 }, // Extreme home favoritism
    'over_under_25': { over: 1.65, under: 2.10 },
    'goal_ranges': { range_0_1: 4.50, range_2_3: 1.85, range_4_6: 2.75, range_7_plus: 15.00 },
    'asian_handicap_0': { home: 1.35, away: 3.20 }
  }
};

console.log('🚀 COMPREHENSIVE MEAN REVERSION SYSTEM TEST');
console.log('🎯 Testing extreme patterns:');
console.log('   • 8/8 H2H home wins (100% win rate)');
console.log('   • 5/9 home clean sheets (55.6% rate)');
console.log('   • 7/9 home over 2.5 goals (77.8% rate)');
console.log('   • 4 consecutive away goalless games');
console.log('Expected: Pattern-First mode + multiple high-confidence patterns');
console.log('='.repeat(70));

axios.post('http://localhost:3002/api/simulate', testData)
.then(response => {
  const result = response.data;
  
  console.log(result.success ? '✅ TEST SUCCESS' : '❌ TEST FAILED');
  
  if (result.success) {
    // Handle nested results structure
    const actualResults = result.results?.results || result.results;
    
    // Check if we have the results structure
    if (!actualResults || !actualResults.probabilities) {
      console.log('❌ Invalid response structure');
      console.log('Response keys:', Object.keys(result));
      if (result.results) {
        console.log('Results keys:', Object.keys(result.results));
        if (result.results.results) {
          console.log('Nested Results keys:', Object.keys(result.results.results));
        }
      }
      return;
    }
    
    const probs = actualResults.probabilities;
    console.log('📊 Match Outcome Probabilities:');
    console.log(`   Home Win: ${(probs.match_outcomes.home_win * 100).toFixed(1)}%`);
    console.log(`   Draw: ${(probs.match_outcomes.draw * 100).toFixed(1)}%`);
    console.log(`   Away Win: ${(probs.match_outcomes.away_win * 100).toFixed(1)}%`);
    if (probs.goal_markets) {
      console.log(`   Over 2.5: ${(probs.goal_markets.over_2_5 * 100).toFixed(1)}%`);
      console.log(`   Under 2.5: ${(probs.goal_markets.under_2_5 * 100).toFixed(1)}%`);
    }
    console.log(`   Average Goals: Home ${actualResults.avg_home_goals.toFixed(2)}, Away ${actualResults.avg_away_goals.toFixed(2)}`);
    
    if (actualResults.reversion_analysis) {
      const ra = actualResults.reversion_analysis;
      console.log('\n🔄 Mean Reversion Analysis Results:');
      console.log(`   Total Patterns Detected: ${ra.patternsDetected}`);
      console.log(`   High Confidence Patterns: ${ra.highConfidencePatterns}`);
      console.log(`   Home Team Lambda Adjustment: ${ra.totalHomeLambdaAdjustment.toFixed(3)}`);
      console.log(`   Away Team Lambda Adjustment: ${ra.totalAwayLambdaAdjustment.toFixed(3)}`);
      console.log(`   Home Win Probability Adjustment: ${ra.totalHomeWinProbAdjustment.toFixed(3)}`);
      console.log(`   Away Win Probability Adjustment: ${ra.totalAwayWinProbAdjustment.toFixed(3)}`);
      
      console.log('\n🎯 Individual Pattern Details:');
      const allPatterns = [...ra.homeAdjustments, ...ra.awayAdjustments];
      allPatterns.forEach((pattern, i) => {
        console.log(`   ${i+1}. ${pattern.type}: ${(pattern.confidence * 100).toFixed(1)}% confidence, ${pattern.reversionAdjustment >= 0 ? '+' : ''}${pattern.reversionAdjustment.toFixed(3)} adjustment`);
        console.log(`      Pattern strength: ${(pattern.patternStrength * 100).toFixed(1)}% | ${pattern.message}`);
      });
    }
    
    if (actualResults.value_bets && Object.keys(actualResults.value_bets).length > 0) {
      console.log(`\n💰 Value Betting Opportunities: ${Object.keys(actualResults.value_bets).length} markets`);
      Object.entries(actualResults.value_bets).forEach(([market, bets]) => {
        Object.entries(bets).forEach(([outcome, bet]) => {
          console.log(`   ${market}.${outcome}: ${(bet.edge * 100).toFixed(1)}% edge, ${bet.confidence} confidence`);
        });
      });
    }
    
    console.log('\n🔍 SYSTEM VERIFICATION CHECKLIST:');
    const ra = actualResults.reversion_analysis;
    const checks = [
      { name: 'Multiple high-confidence patterns detected', pass: ra && ra.highConfidencePatterns >= 2, value: ra?.highConfidencePatterns || 0 },
      { name: 'H2H win reversion penalty applied', pass: ra && ra.totalHomeWinProbAdjustment < 0, value: ra?.totalHomeWinProbAdjustment.toFixed(3) || 'N/A' },
      { name: 'Defensive fatigue penalty detected', pass: ra && ra.totalHomeLambdaAdjustment < 0, value: ra?.totalHomeLambdaAdjustment.toFixed(3) || 'N/A' },
      { name: 'Attacking drought boost applied', pass: ra && ra.totalAwayLambdaAdjustment > 0, value: ra?.totalAwayLambdaAdjustment.toFixed(3) || 'N/A' },
      { name: 'Value betting opportunities identified', pass: Object.keys(actualResults.value_bets || {}).length > 0, value: Object.keys(actualResults.value_bets || {}).length },
      { name: 'Smart Logic system operational', pass: !!ra, value: ra ? 'Active' : 'Inactive' }
    ];
    
    checks.forEach((check, i) => {
      console.log(`${i+1}. ${check.name}: ${check.pass ? '✅' : '❌'} ${check.value}`);
    });
    
    const allPassed = checks.every(check => check.pass);
    console.log('\n🏁 FINAL RESULT: ' + (allPassed ? '✅ ALL SYSTEMS WORKING CORRECTLY!' : '⚠️ SOME SYSTEMS NEED INVESTIGATION'));
    
    if (allPassed) {
      console.log('🎉 Mean Reversion System is fully operational and detecting patterns correctly!');
      console.log('🚀 Smart Conditional Logic is working as designed!');
    }
    
  } else {
    console.log('❌ Simulation failed with error:', result.error || 'Unknown error');
  }
})
.catch(err => {
  console.log('❌ Request failed:', err.message);
  if (err.response) {
    console.log('Response status:', err.response.status);
    console.log('Response data:', err.response.data);
  }
});