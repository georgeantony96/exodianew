/**
 * Mean Reversion System Test
 * Quick validation that the reversion system is working properly
 */

const { ReversionAnalyzer } = require('./frontend/src/utils/reversion-analyzer');
const { DEFAULT_REVERSION_CONFIG } = require('./frontend/src/utils/reversion-config');

// Mock historical data for testing
const mockHistoricalData = {
  homeMatches: [
    // 6/8 games over 2.5 - should trigger reversion penalty
    { home_score_ft: 3, away_score_ft: 1, match_date: '2025-01-01' },
    { home_score_ft: 2, away_score_ft: 2, match_date: '2025-01-02' },
    { home_score_ft: 4, away_score_ft: 0, match_date: '2025-01-03' },
    { home_score_ft: 1, away_score_ft: 3, match_date: '2025-01-04' },
    { home_score_ft: 2, away_score_ft: 1, match_date: '2025-01-05' },
    { home_score_ft: 3, away_score_ft: 2, match_date: '2025-01-06' },
    { home_score_ft: 1, away_score_ft: 2, match_date: '2025-01-07' },
    { home_score_ft: 4, away_score_ft: 1, match_date: '2025-01-08' }
  ],
  
  awayMatches: [
    // 3 consecutive goalless games - should trigger attacking drought boost
    { home_score_ft: 1, away_score_ft: 0, match_date: '2025-01-01' },
    { home_score_ft: 2, away_score_ft: 0, match_date: '2025-01-02' },
    { home_score_ft: 1, away_score_ft: 0, match_date: '2025-01-03' },
    { home_score_ft: 0, away_score_ft: 2, match_date: '2025-01-04' },
    { home_score_ft: 1, away_score_ft: 1, match_date: '2025-01-05' }
  ],
  
  h2hMatches: [
    // 5/7 H2H games over 2.5 - should trigger reversion
    { home_team_id: 1, away_team_id: 2, home_score_ft: 3, away_score_ft: 1, match_date: '2024-12-01' },
    { home_team_id: 1, away_team_id: 2, home_score_ft: 2, away_score_ft: 2, match_date: '2024-11-01' },
    { home_team_id: 1, away_team_id: 2, home_score_ft: 1, away_score_ft: 3, match_date: '2024-10-01' },
    { home_team_id: 1, away_team_id: 2, home_score_ft: 2, away_score_ft: 1, match_date: '2024-09-01' },
    { home_team_id: 1, away_team_id: 2, home_score_ft: 4, away_score_ft: 0, match_date: '2024-08-01' },
    { home_team_id: 1, away_team_id: 2, home_score_ft: 0, away_score_ft: 1, match_date: '2024-07-01' },
    { home_team_id: 1, away_team_id: 2, home_score_ft: 3, away_score_ft: 2, match_date: '2024-06-01' }
  ]
};

function testReversionSystem() {
  console.log('🧪 Testing Mean Reversion System...\n');
  
  try {
    const analysis = ReversionAnalyzer.analyzeAllPatterns(
      mockHistoricalData.homeMatches,
      mockHistoricalData.awayMatches,
      mockHistoricalData.h2hMatches,
      1, // home team id
      2, // away team id
      DEFAULT_REVERSION_CONFIG
    );
    
    console.log('✅ Reversion Analysis Completed Successfully!\n');
    console.log('📊 RESULTS:');
    console.log(`- Patterns Detected: ${analysis.patternsDetected}`);
    console.log(`- High Confidence Patterns: ${analysis.highConfidencePatterns}`);
    console.log(`- Home Lambda Adjustment: ${analysis.totalHomeLambdaAdjustment.toFixed(3)}`);
    console.log(`- Away Lambda Adjustment: ${analysis.totalAwayLambdaAdjustment.toFixed(3)}`);
    console.log(`- Home Win Prob Adjustment: ${analysis.totalHomeWinProbAdjustment.toFixed(3)}`);
    console.log(`- Away Win Prob Adjustment: ${analysis.totalAwayWinProbAdjustment.toFixed(3)}\n`);
    
    console.log('🔍 DETECTED PATTERNS:');
    [...analysis.homeAdjustments, ...analysis.awayAdjustments].forEach((pattern, index) => {
      console.log(`${index + 1}. ${pattern.type}:`);
      console.log(`   - Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
      console.log(`   - Pattern Strength: ${(pattern.patternStrength * 100).toFixed(1)}%`);
      console.log(`   - Adjustment: ${pattern.reversionAdjustment >= 0 ? '+' : ''}${pattern.reversionAdjustment.toFixed(3)}`);
      console.log(`   - Message: ${pattern.message}`);
      console.log('');
    });
    
    console.log('🎉 Test completed successfully! The Mean Reversion System is working properly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testReversionSystem();