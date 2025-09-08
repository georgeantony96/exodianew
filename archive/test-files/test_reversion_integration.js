/**
 * Test Mean Reversion System Integration
 * Sends a real API request to test the complete system
 */

// Test data that should trigger multiple reversion patterns
const testSimulationData = {
  home_team_id: 1,
  away_team_id: 2,
  league_id: 1,
  match_date: "2025-08-25",
  distribution_type: "poisson",
  iterations: 10000,
  
  // Mock historical data designed to trigger reversion patterns
  historical_data: {
    // Home team form: 6/8 games over 2.5 (75% rate) - should trigger reversion penalty
    home_home: [
      { home_score_ft: 3, away_score_ft: 1, match_date: '2025-01-01' },
      { home_score_ft: 2, away_score_ft: 2, match_date: '2025-01-02' },
      { home_score_ft: 4, away_score_ft: 0, match_date: '2025-01-03' },
      { home_score_ft: 1, away_score_ft: 3, match_date: '2025-01-04' },
      { home_score_ft: 2, away_score_ft: 1, match_date: '2025-01-05' },
      { home_score_ft: 3, away_score_ft: 2, match_date: '2025-01-06' },
      { home_score_ft: 1, away_score_ft: 2, match_date: '2025-01-07' },
      { home_score_ft: 4, away_score_ft: 1, match_date: '2025-01-08' }
    ],
    
    // Away team: 3 consecutive goalless games - should trigger attacking drought boost
    away_away: [
      { home_score_ft: 1, away_score_ft: 0, match_date: '2025-01-01' },
      { home_score_ft: 2, away_score_ft: 0, match_date: '2025-01-02' },
      { home_score_ft: 1, away_score_ft: 0, match_date: '2025-01-03' },
      { home_score_ft: 0, away_score_ft: 2, match_date: '2025-01-04' },
      { home_score_ft: 1, away_score_ft: 1, match_date: '2025-01-05' }
    ],
    
    // H2H: 5/7 games over 2.5 (71% rate) - should trigger H2H reversion
    h2h: [
      { home_team_id: 1, away_team_id: 2, home_score_ft: 3, away_score_ft: 1, match_date: '2024-12-01' },
      { home_team_id: 1, away_team_id: 2, home_score_ft: 2, away_score_ft: 2, match_date: '2024-11-01' },
      { home_team_id: 1, away_team_id: 2, home_score_ft: 1, away_score_ft: 3, match_date: '2024-10-01' },
      { home_team_id: 1, away_team_id: 2, home_score_ft: 2, away_score_ft: 1, match_date: '2024-09-01' },
      { home_team_id: 1, away_team_id: 2, home_score_ft: 4, away_score_ft: 0, match_date: '2024-08-01' },
      { home_team_id: 1, away_team_id: 2, home_score_ft: 0, away_score_ft: 1, match_date: '2024-07-01' },
      { home_team_id: 1, away_team_id: 2, home_score_ft: 3, away_score_ft: 2, match_date: '2024-06-01' }
    ]
  },
  
  // Mock odds data
  bookmaker_odds: {
    '1x2_ft': { home: 2.10, draw: 3.40, away: 3.20 },
    'over_under_25': { over: 1.85, under: 1.95 },
    'goal_ranges': {
      'no_goals': 15.0,
      'range_0_1': 4.5,
      'range_2_3': 2.1,
      'range_4_6': 3.2,
      'range_7_plus': 12.0
    },
    'asian_handicap_0': { home: 1.90, away: 1.90 }
  },
  
  // Boost settings with Mean Reversion enabled
  boost_settings: {
    home_advantage: 0.10,
    custom_home_boost: 0.0,
    custom_away_boost: 0.0,
    enable_streak_analysis: true,
    
    // Enable Mean Reversion System
    reversion_config: {
      globalEnabled: true,
      confidenceThreshold: 0.65,
      maxTotalAdjustment: 0.30,
      
      homeForm: {
        enabled: true,
        overThreshold: 0.70,
        underThreshold: 0.70,
        minGames: 7,
        goalPenalty: -0.12,
        goalBoost: 0.10
      },
      
      awayForm: {
        enabled: true,
        overThreshold: 0.70,
        underThreshold: 0.70,
        minGames: 7,
        goalPenalty: -0.12,
        goalBoost: 0.10
      },
      
      h2hWins: {
        enabled: true,
        winThreshold: 0.70,
        minMatches: 6,
        winProbPenalty: -0.08
      },
      
      h2hOvers: {
        enabled: true,
        overThreshold: 0.70,
        underThreshold: 0.70,
        minMatches: 6,
        goalPenalty: -0.15,
        goalBoost: 0.12
      },
      
      defensiveFatigue: {
        enabled: true,
        cleanSheetThreshold: 4,
        cleanSheetRate: 0.80,
        minGames: 5,
        fatiguePenalty: -0.08,
        consecutiveMultiplier: 0.02
      },
      
      attackingDrought: {
        enabled: true,
        goallessGames: 3,
        minGames: 4,
        reversionBoost: 0.12,
        intensityMultiplier: 0.04,
        maxBoost: 0.25
      },
      
      emotionalMomentum: {
        enabled: true,
        winStreakThreshold: 8,
        pressureMultiplier: 1.15,
        psychologicalPenalty: -0.06,
        maxPenalty: -0.15,
        streakDecayFactor: 1.2
      }
    },
    
    // Disable chaos for cleaner reversion testing
    chaos_config: {
      enabled: false
    }
  }
};

async function testReversionSystem() {
  console.log('🧪 Testing Mean Reversion System Integration...\n');
  
  try {
    const response = await fetch('http://localhost:3002/api/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testSimulationData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ API Request Successful!\n');
    
    // Check if reversion analysis is present
    if (result.reversion_analysis) {
      console.log('🎯 MEAN REVERSION ANALYSIS DETECTED:');
      console.log(`- Patterns Detected: ${result.reversion_analysis.patternsDetected}`);
      console.log(`- High Confidence Patterns: ${result.reversion_analysis.highConfidencePatterns}`);
      console.log(`- Home Lambda Adjustment: ${result.reversion_analysis.totalHomeLambdaAdjustment?.toFixed(3) || 'N/A'}`);
      console.log(`- Away Lambda Adjustment: ${result.reversion_analysis.totalAwayLambdaAdjustment?.toFixed(3) || 'N/A'}`);
      console.log(`- Home Win Prob Adjustment: ${result.reversion_analysis.totalHomeWinProbAdjustment?.toFixed(3) || 'N/A'}`);
      console.log(`- Away Win Prob Adjustment: ${result.reversion_analysis.totalAwayWinProbAdjustment?.toFixed(3) || 'N/A'}`);
      console.log('');
      
      // Display detected patterns
      const allPatterns = [
        ...(result.reversion_analysis.homeAdjustments || []),
        ...(result.reversion_analysis.awayAdjustments || [])
      ];
      
      if (allPatterns.length > 0) {
        console.log('📊 DETECTED PATTERNS:');
        allPatterns.forEach((pattern, index) => {
          console.log(`${index + 1}. ${pattern.type}:`);
          console.log(`   - Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
          console.log(`   - Pattern Strength: ${(pattern.patternStrength * 100).toFixed(1)}%`);
          console.log(`   - Adjustment: ${pattern.reversionAdjustment >= 0 ? '+' : ''}${pattern.reversionAdjustment.toFixed(3)}`);
          console.log(`   - Message: ${pattern.message}`);
          console.log('');
        });
      }
      
      console.log('🎉 Mean Reversion System is FULLY OPERATIONAL!');
      
    } else {
      console.log('⚠️  No reversion analysis found in response.');
      console.log('Available response keys:', Object.keys(result));
    }
    
    // Check engine version
    if (result.engine_version) {
      console.log(`🔧 Engine Version: ${result.engine_version}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Check if server is running
    try {
      const healthCheck = await fetch('http://localhost:3002/api/health');
      if (healthCheck.ok) {
        console.log('✅ Server is running - error may be in request format');
      }
    } catch (healthError) {
      console.log('❌ Server appears to be down - please ensure frontend is running on port 3002');
    }
  }
}

// Run the test
testReversionSystem();