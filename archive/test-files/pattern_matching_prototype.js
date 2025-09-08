/**
 * PATTERN MATCHING PROTOTYPE
 * Implementation prototype for unique pattern-based prediction system
 * 
 * This demonstrates how we could move from generic thresholds to 
 * game-specific pattern matching using Monte Carlo simulation data.
 */

console.log('🧬 PATTERN MATCHING PROTOTYPE');
console.log('=============================\n');

// STEP 1: Pattern Encoding System
class HistoricalPatternEncoder {
  
  // Create unique fingerprint for historical context
  static encodePattern(h2hData, homeData, awayData) {
    const h2hFingerprint = this.encodeH2HPattern(h2hData);
    const homeFingerprint = this.encodeTeamPattern(homeData);
    const awayFingerprint = this.encodeTeamPattern(awayData);
    
    return `H2H:${h2hFingerprint}_HOME:${homeFingerprint}_AWAY:${awayFingerprint}`;
  }
  
  static encodeH2HPattern(matches) {
    if (!matches || matches.length === 0) return 'NONE';
    
    const outcomes = matches.slice(0, 8).map(match => {
      const totalGoals = (match.home_score_ft || 0) + (match.away_score_ft || 0);
      const over25 = totalGoals > 2.5 ? 'O' : 'U';
      const btts = (match.home_score_ft > 0 && match.away_score_ft > 0) ? 'G' : 'N';
      return `${over25}${btts}`;
    });
    
    return outcomes.join('-');
  }
  
  static encodeTeamPattern(matches) {
    if (!matches || matches.length === 0) return 'NONE';
    
    const results = matches.slice(0, 8).map(match => {
      const homeGoals = match.home_score_ft || 0;
      const awayGoals = match.away_score_ft || 0;
      
      if (homeGoals > awayGoals) return 'W';
      if (homeGoals < awayGoals) return 'L';
      return 'D';
    });
    
    return results.join('');
  }
}

// STEP 2: Pattern Database System
class PatternDatabase {
  constructor() {
    this.patterns = new Map(); // patternId → [outcomes]
    this.initialized = false;
  }
  
  // Store pattern outcome from Monte Carlo iteration
  addPatternOutcome(patternId, outcome) {
    if (!this.patterns.has(patternId)) {
      this.patterns.set(patternId, []);
    }
    this.patterns.get(patternId).push(outcome);
  }
  
  // Find exact pattern matches
  findExactMatch(patternId) {
    return this.patterns.get(patternId) || null;
  }
  
  // Find similar patterns (fallback)
  findSimilarPatterns(patternId, threshold = 0.8) {
    const similar = [];
    
    for (const [storedPattern, outcomes] of this.patterns.entries()) {
      const similarity = this.calculateSimilarity(patternId, storedPattern);
      if (similarity >= threshold) {
        similar.push({ pattern: storedPattern, outcomes, similarity });
      }
    }
    
    return similar.sort((a, b) => b.similarity - a.similarity);
  }
  
  calculateSimilarity(pattern1, pattern2) {
    // Simple similarity calculation - could be enhanced
    const parts1 = pattern1.split('_');
    const parts2 = pattern2.split('_');
    
    let matches = 0;
    const totalParts = Math.max(parts1.length, parts2.length);
    
    for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
      if (parts1[i] === parts2[i]) matches++;
    }
    
    return matches / totalParts;
  }
  
  getStats() {
    return {
      totalPatterns: this.patterns.size,
      totalOutcomes: Array.from(this.patterns.values()).reduce((sum, outcomes) => sum + outcomes.length, 0),
      avgOutcomesPerPattern: Array.from(this.patterns.values()).reduce((sum, outcomes) => sum + outcomes.length, 0) / this.patterns.size
    };
  }
}

// STEP 3: Pattern Matcher System
class PatternBasedPredictor {
  constructor(patternDatabase) {
    this.db = patternDatabase;
  }
  
  // Get unique prediction for specific game
  getUniqueAdjustment(h2hData, homeData, awayData) {
    // Encode the unique pattern
    const patternId = HistoricalPatternEncoder.encodePattern(h2hData, homeData, awayData);
    
    console.log(`🔍 Pattern ID: ${patternId}`);
    
    // Try exact match first
    const exactMatches = this.db.findExactMatch(patternId);
    if (exactMatches && exactMatches.length > 0) {
      return this.calculateAdjustmentFromOutcomes(exactMatches, 'EXACT');
    }
    
    // Try similar patterns
    const similarPatterns = this.db.findSimilarPatterns(patternId, 0.7);
    if (similarPatterns.length > 0) {
      const allOutcomes = similarPatterns.flatMap(p => p.outcomes);
      return this.calculateAdjustmentFromOutcomes(allOutcomes, 'SIMILAR');
    }
    
    // Fallback to generic empirical thresholds
    return this.getGenericAdjustment(h2hData, homeData, awayData);
  }
  
  calculateAdjustmentFromOutcomes(outcomes, matchType) {
    if (outcomes.length === 0) return { adjustment: 0, confidence: 0, source: matchType, sampleSize: 0 };
    
    // Calculate statistics from pattern outcomes
    const avgHomeGoals = outcomes.reduce((sum, o) => sum + o.homeGoals, 0) / outcomes.length;
    const avgAwayGoals = outcomes.reduce((sum, o) => sum + o.awayGoals, 0) / outcomes.length;
    const totalGoalsAvg = avgHomeGoals + avgAwayGoals;
    
    // Compare to baseline (e.g., 2.7 goals average)
    const baseline = 2.7;
    const adjustment = totalGoalsAvg - baseline;
    
    // Confidence based on sample size
    const confidence = Math.min(0.95, 0.5 + (outcomes.length * 0.05));
    
    return {
      adjustment: adjustment,
      confidence: confidence,
      source: matchType,
      sampleSize: outcomes.length,
      avgHomeGoals: avgHomeGoals,
      avgAwayGoals: avgAwayGoals,
      totalGoalsAvg: totalGoalsAvg
    };
  }
  
  getGenericAdjustment(h2hData, homeData, awayData) {
    // Fallback to our existing empirical thresholds
    return {
      adjustment: 0,
      confidence: 0.3,
      source: 'GENERIC_FALLBACK',
      sampleSize: 0,
      message: 'No pattern matches found - using generic thresholds'
    };
  }
}

// DEMO: Simulate the System
function demonstratePatternMatching() {
  console.log('🎯 PATTERN MATCHING DEMONSTRATION');
  console.log('=================================\n');
  
  // Create pattern database
  const db = new PatternDatabase();
  
  // Simulate storing 1M iteration results (abbreviated for demo)
  console.log('📊 Simulating 1M Monte Carlo iterations...');
  
  // Mock adding pattern outcomes from Monte Carlo iterations
  for (let i = 0; i < 1000; i++) { // Simulating 1000 for demo (would be 1M)
    // Create random pattern
    const patternId = `H2H:OG-UG-OG-UN-ON_HOME:WLDWWL_AWAY:LLLDWW`;
    const outcome = {
      homeGoals: Math.random() * 4,
      awayGoals: Math.random() * 4,
      iteration: i
    };
    db.addPatternOutcome(patternId, outcome);
  }
  
  console.log(`✅ Database populated with ${db.getStats().totalPatterns} unique patterns`);
  console.log(`   Total outcomes: ${db.getStats().totalOutcomes}`);
  console.log(`   Avg outcomes per pattern: ${db.getStats().avgOutcomesPerPattern.toFixed(1)}\n`);
  
  // Create predictor
  const predictor = new PatternBasedPredictor(db);
  
  // Test with specific game scenario
  console.log('🏈 TESTING WITH SPECIFIC GAME:');
  console.log('------------------------------');
  
  const testH2H = [
    { home_score_ft: 2, away_score_ft: 1 }, // Over + GG
    { home_score_ft: 0, away_score_ft: 1 }, // Under + NG
    { home_score_ft: 3, away_score_ft: 1 }, // Over + GG
    { home_score_ft: 1, away_score_ft: 0 }  // Under + NG
  ];
  
  const testHome = [
    { home_score_ft: 2, away_score_ft: 0 }, // W
    { home_score_ft: 1, away_score_ft: 2 }, // L
    { home_score_ft: 1, away_score_ft: 1 }  // D
  ];
  
  const testAway = [
    { home_score_ft: 0, away_score_ft: 1 }, // W (from away perspective)
    { home_score_ft: 2, away_score_ft: 0 }, // L
    { home_score_ft: 0, away_score_ft: 2 }  // W
  ];
  
  // Get unique adjustment
  const result = predictor.getUniqueAdjustment(testH2H, testHome, testAway);
  
  console.log('📊 UNIQUE PATTERN RESULT:');
  console.log(`   Adjustment: ${result.adjustment >= 0 ? '+' : ''}${result.adjustment?.toFixed(3) || 0} goals`);
  console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`   Source: ${result.source}`);
  console.log(`   Sample Size: ${result.sampleSize} pattern matches`);
  
  if (result.totalGoalsAvg) {
    console.log(`   Expected Goals: ${result.totalGoalsAvg.toFixed(2)} (Home: ${result.avgHomeGoals.toFixed(2)}, Away: ${result.avgAwayGoals.toFixed(2)})`);
  }
}

// STEP 4: Integration with Monte Carlo Engine
console.log('🔧 INTEGRATION CONCEPT:');
console.log('=======================');
console.log('1. Pre-process Monte Carlo iterations to build pattern database');
console.log('2. For each new game, encode its unique historical pattern');
console.log('3. Search database for exact or similar pattern matches');
console.log('4. Use pattern-specific outcomes for prediction');
console.log('5. Fall back to generic thresholds when no patterns found');
console.log('6. Scale up iterations for better pattern coverage\n');

// Run demonstration
demonstratePatternMatching();

console.log('\n🚀 NEXT IMPLEMENTATION STEPS:');
console.log('==============================');
console.log('1. Integrate pattern encoder with existing Monte Carlo engine');
console.log('2. Build pattern database during Monte Carlo iterations');
console.log('3. Replace generic streak boosts with pattern-based adjustments');
console.log('4. Add pattern similarity matching for better coverage');
console.log('5. Scale to 10M+ iterations for comprehensive pattern database');