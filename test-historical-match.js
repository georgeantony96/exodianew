/**
 * Test script for historical match analysis
 * Tests with the URL you provided: Baigken Kanazaba vs Osaka
 */

const UniversalPatternCollector = require('./simplified-data-collector');

async function testHistoricalMatch() {
  const collector = new UniversalPatternCollector();
  
  try {
    console.log('🚀 Testing Historical Match Analysis...');
    console.log('=====================================');
    
    await collector.initialize();
    
    // Your example URL
    const historicalMatchUrl = 'https://agones.gr/livescore/2079-5075/zbaigken_kanazaba-osaka#stats';
    
    console.log('📍 Analyzing:', historicalMatchUrl);
    console.log('🎯 This should exclude the FIRST ROW (actual result) from all 3 tables');
    console.log('✅ And collect historical patterns from rows 2+ only\n');
    
    const patterns = await collector.collectUniversalPatterns(historicalMatchUrl);
    
    if (patterns) {
      console.log('\n🎉 SUCCESS! Data collected correctly:');
      console.log('=====================================');
      
      // Export in your preferred format
      const exported = collector.exportForManualInput(patterns);
      
      console.log('\n📊 Summary:');
      console.log(`- Actual Result: ${patterns.actualMatchResult.primary ? 
        patterns.actualMatchResult.primary.homeScoreFT + '-' + patterns.actualMatchResult.primary.awayScoreFT : 
        'Not captured'}`);
      console.log(`- H2H Patterns: ${patterns.patterns.h2h.length}`);
      console.log(`- Home Patterns: ${patterns.patterns.home_home.length}`);
      console.log(`- Away Patterns: ${patterns.patterns.away_away.length}`);
      console.log(`- Total Historical Patterns: ${patterns.patternSummary.totalPatterns}`);
      
    } else {
      console.error('❌ Failed to collect patterns');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await collector.cleanup();
  }
}

// Run the test
testHistoricalMatch();