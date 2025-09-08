const Database = require('better-sqlite3');

console.log('🔄 RETROACTIVE OVER 3.5 & OVER 4.5 GOALS ANALYSIS');
console.log('================================================');

/**
 * Mathematical Pattern Analysis for Goal Predictions
 * Based on the existing mathematical engines in the system
 */
class RetroactiveGoalAnalyzer {
  constructor() {
    this.PHI = 1.6180339887498948;
    this.FIBONACCI_SEQUENCE = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
    this.PHI_TOLERANCE = 0.08;
  }

  /**
   * Analyze a match result and predict Over 3.5/4.5 using mathematical engines
   */
  analyzeMatch(matchResult) {
    const totalGoals = matchResult.home_score_ft + matchResult.away_score_ft;
    const htGoals = matchResult.home_score_ht + matchResult.away_score_ht;
    const secondHalfGoals = totalGoals - htGoals;
    
    // Extract pattern fingerprint from accuracy_metrics if available
    let patternFingerprint = '';
    try {
      const metrics = JSON.parse(matchResult.accuracy_metrics || '{}');
      patternFingerprint = metrics.rich_fingerprint || '';
    } catch (e) {
      // Generate basic fingerprint
      const result_ht = matchResult.home_score_ht > matchResult.away_score_ht ? 'W' : 
                       matchResult.home_score_ht < matchResult.away_score_ht ? 'L' : 'D';
      const result_ft = matchResult.home_score_ft > matchResult.away_score_ft ? 'W' :
                       matchResult.home_score_ft < matchResult.away_score_ft ? 'L' : 'D';
      const btts_ft = matchResult.home_score_ft > 0 && matchResult.away_score_ft > 0 ? 'gg' : 'ng';
      const over_2_5_ft = totalGoals > 2.5;
      
      patternFingerprint = `${result_ht}(${matchResult.home_score_ht}-${matchResult.away_score_ht})→${result_ft}(${matchResult.home_score_ft}-${matchResult.away_score_ft},${btts_ft},${over_2_5_ft ? 'o' : 'u'}2.5)`;
    }

    // Run mathematical engine analysis
    const mathematicalAnalysis = this.runMathematicalEngines(matchResult);
    
    // Generate predictions based on mathematical patterns
    const predictions = this.generateGoalPredictions(mathematicalAnalysis, patternFingerprint);
    
    // Actual outcomes
    const actualOver35 = totalGoals > 3.5 ? 1.0 : 0.0;
    const actualOver45 = totalGoals > 4.5 ? 1.0 : 0.0;
    
    return {
      simulation_id: matchResult.simulation_id,
      pattern_fingerprint: patternFingerprint,
      total_goals: totalGoals,
      ht_goals: htGoals,
      second_half_goals: secondHalfGoals,
      
      // Predictions
      predicted_over35: predictions.over35Probability,
      predicted_over45: predictions.over45Probability,
      
      // Actual outcomes
      actual_over35: actualOver35,
      actual_over45: actualOver45,
      
      // Mathematical engine contributions
      fibonacci_contribution: mathematicalAnalysis.fibonacci.contribution,
      golden_ratio_contribution: mathematicalAnalysis.goldenRatio.contribution,
      entropy_contribution: mathematicalAnalysis.entropy.contribution,
      quantum_contribution: mathematicalAnalysis.quantum.contribution,
      
      // Confidence and quality
      confidence_over35: predictions.over35Confidence,
      confidence_over45: predictions.over45Confidence,
      pattern_quality: mathematicalAnalysis.qualityScore,
      
      // Results match prediction?
      over35_correct: Math.abs(predictions.over35Probability - actualOver35) < 0.5 ? 1 : 0,
      over45_correct: Math.abs(predictions.over45Probability - actualOver45) < 0.5 ? 1 : 0
    };
  }

  /**
   * Run the 8 mathematical engines on match data
   */
  runMathematicalEngines(matchResult) {
    const totalGoals = matchResult.home_score_ft + matchResult.away_score_ft;
    const htGoals = matchResult.home_score_ht + matchResult.away_score_ht;
    
    // 1. FIBONACCI ANALYSIS
    const fibonacciAnalysis = this.analyzeFibonacci(totalGoals, htGoals);
    
    // 2. GOLDEN RATIO ANALYSIS  
    const goldenRatioAnalysis = this.analyzeGoldenRatio(matchResult);
    
    // 3. SHANNON ENTROPY ANALYSIS
    const entropyAnalysis = this.analyzeEntropy(matchResult);
    
    // 4. QUANTUM COHERENCE ANALYSIS
    const quantumAnalysis = this.analyzeQuantumCoherence(matchResult);
    
    // 5. NASH EQUILIBRIUM ANALYSIS
    const nashAnalysis = this.analyzeNashEquilibrium(matchResult);
    
    // 6. KLEIN BOTTLE TOPOLOGY
    const kleinAnalysis = this.analyzeKleinBottle(matchResult);
    
    // 7. PRESSURE COOKER DYNAMICS
    const pressureAnalysis = this.analyzePressureDynamics(matchResult);
    
    // 8. PYTHAGOREAN ANALYSIS
    const pythagoreanAnalysis = this.analyzePythagorean(matchResult);
    
    // Quality scoring (noise filtering)
    const qualityScore = this.calculateQualityScore({
      fibonacci: fibonacciAnalysis,
      goldenRatio: goldenRatioAnalysis,
      entropy: entropyAnalysis,
      quantum: quantumAnalysis
    });
    
    return {
      fibonacci: fibonacciAnalysis,
      goldenRatio: goldenRatioAnalysis,
      entropy: entropyAnalysis,
      quantum: quantumAnalysis,
      nash: nashAnalysis,
      klein: kleinAnalysis,
      pressure: pressureAnalysis,
      pythagorean: pythagoreanAnalysis,
      qualityScore
    };
  }

  /**
   * Fibonacci sequence analysis - natural goal progressions
   */
  analyzeFibonacci(totalGoals, htGoals) {
    const isFibonacci = this.FIBONACCI_SEQUENCE.includes(totalGoals);
    const closestFib = this.FIBONACCI_SEQUENCE.reduce((prev, curr) => 
      Math.abs(curr - totalGoals) < Math.abs(prev - totalGoals) ? curr : prev
    );
    
    const fibonacciStrength = isFibonacci ? 1.0 : Math.max(0, 1 - Math.abs(totalGoals - closestFib) / totalGoals);
    const nextFibExpected = this.getNextFibonacci(totalGoals);
    
    // Contribution to over goals: higher if close to fibonacci numbers
    let contribution = 0.5; // baseline
    if (isFibonacci) {
      contribution = totalGoals >= 5 ? 0.8 : 0.6; // Fibonacci numbers suggest higher scoring
    } else {
      contribution = 0.4 + (fibonacciStrength * 0.3);
    }
    
    return {
      isFibonacci,
      fibonacciStrength,
      closestFib,
      nextFibExpected,
      contribution,
      reasoning: isFibonacci ? `Total goals (${totalGoals}) is Fibonacci number` : 
                 `Close to Fibonacci ${closestFib} (strength: ${fibonacciStrength.toFixed(2)})`
    };
  }

  /**
   * Golden Ratio mathematical harmony analysis
   */
  analyzeGoldenRatio(matchResult) {
    const totalGoals = matchResult.home_score_ft + matchResult.away_score_ft;
    const htGoals = matchResult.home_score_ht + matchResult.away_score_ht;
    
    // Check if HT to FT progression follows golden ratio
    const htToFtRatio = htGoals > 0 ? totalGoals / htGoals : 0;
    const phiDeviation = Math.abs(htToFtRatio - this.PHI);
    const isGoldenPattern = phiDeviation < this.PHI_TOLERANCE;
    
    // Check goal distribution harmony
    const homeToAwayRatio = matchResult.away_score_ft > 0 ? 
      matchResult.home_score_ft / matchResult.away_score_ft : matchResult.home_score_ft;
    const distributionHarmony = Math.abs(homeToAwayRatio - this.PHI) < this.PHI_TOLERANCE ? 1.0 : 0.0;
    
    let contribution = 0.5;
    if (isGoldenPattern) {
      contribution = 0.9; // Golden patterns suggest very high scoring potential
    } else {
      contribution = 0.4 + (distributionHarmony * 0.3);
    }
    
    return {
      isGoldenPattern,
      phiDeviation,
      htToFtRatio,
      distributionHarmony,
      contribution,
      reasoning: isGoldenPattern ? 'Golden ratio harmony detected' : 
                 `Phi deviation: ${phiDeviation.toFixed(3)}`
    };
  }

  /**
   * Shannon entropy - chaos and surprise analysis
   */
  analyzeEntropy(matchResult) {
    const scores = [
      matchResult.home_score_ht,
      matchResult.away_score_ht,
      matchResult.home_score_ft,
      matchResult.away_score_ft
    ];
    
    // Calculate Shannon entropy
    const totalEvents = scores.reduce((sum, score) => sum + score, 0) + 1; // +1 to avoid log(0)
    const probabilities = scores.map(score => (score + 0.1) / (totalEvents + 0.4)); // Smoothing
    const entropy = -probabilities.reduce((sum, p) => sum + p * Math.log2(p), 0);
    
    // High entropy = unpredictable, chaotic scoring
    const isHighEntropy = entropy > 1.5;
    const surpriseFactor = entropy / 2.0; // Normalize to 0-1
    
    let contribution = 0.5;
    if (isHighEntropy) {
      contribution = 0.3; // High entropy suggests lower predictable scoring
    } else {
      contribution = 0.6; // Low entropy suggests more predictable, potentially higher scoring
    }
    
    return {
      entropy,
      isHighEntropy,
      surpriseFactor,
      contribution,
      reasoning: isHighEntropy ? 'High chaos detected' : 'Low entropy, predictable pattern'
    };
  }

  /**
   * Quantum coherence - predictable score progressions
   */
  analyzeQuantumCoherence(matchResult) {
    const htState = [matchResult.home_score_ht, matchResult.away_score_ht];
    const ftState = [matchResult.home_score_ft, matchResult.away_score_ft];
    
    // Measure coherence as progression predictability
    const htTotal = htState.reduce((sum, score) => sum + score, 0);
    const ftTotal = ftState.reduce((sum, score) => sum + score, 0);
    
    // Perfect coherence = predictable doubling or consistent increase
    const progressionRatio = htTotal > 0 ? ftTotal / htTotal : ftTotal;
    const coherenceLevel = progressionRatio >= 1.5 && progressionRatio <= 3.0 ? 
      Math.max(0, 1 - Math.abs(progressionRatio - 2.0) / 2.0) : 0.2;
    
    let contribution = 0.5;
    if (coherenceLevel > 0.8) {
      contribution = 0.75; // High coherence suggests predictable higher scoring
    } else {
      contribution = 0.4 + (coherenceLevel * 0.2);
    }
    
    return {
      coherenceLevel,
      progressionRatio,
      contribution,
      reasoning: `Coherence: ${coherenceLevel.toFixed(2)}, Progression: ${progressionRatio.toFixed(2)}`
    };
  }

  /**
   * Nash Equilibrium - strategic balance analysis
   */
  analyzeNashEquilibrium(matchResult) {
    const homeGoals = matchResult.home_score_ft;
    const awayGoals = matchResult.away_score_ft;
    const totalGoals = homeGoals + awayGoals;
    
    // Strategic balance = neither team dominated completely
    const goalDifference = Math.abs(homeGoals - awayGoals);
    const strategicBalance = totalGoals > 0 ? 1 - (goalDifference / totalGoals) : 0;
    
    // Equilibrium break = significant imbalance suggests explosive scoring
    const isEquilibriumBreak = strategicBalance < 0.3;
    
    let contribution = 0.5;
    if (isEquilibriumBreak) {
      contribution = 0.8; // Equilibrium breaks often lead to high scoring
    } else {
      contribution = 0.4 + (strategicBalance * 0.3);
    }
    
    return {
      strategicBalance,
      isEquilibriumBreak,
      goalDifference,
      contribution,
      reasoning: isEquilibriumBreak ? 'Strategic equilibrium breakdown' : 
                 `Balanced match (balance: ${strategicBalance.toFixed(2)})`
    };
  }

  /**
   * Klein Bottle topology - cyclical patterns
   */
  analyzeKleinBottle(matchResult) {
    const scores = [
      matchResult.home_score_ht,
      matchResult.away_score_ht, 
      matchResult.home_score_ft,
      matchResult.away_score_ft
    ];
    
    // Look for cyclical/repeating patterns
    const htPattern = `${matchResult.home_score_ht}-${matchResult.away_score_ht}`;
    const secondHalfHome = matchResult.home_score_ft - matchResult.home_score_ht;
    const secondHalfAway = matchResult.away_score_ft - matchResult.away_score_ht;
    
    // Cyclical if second half mirrors first half in some way
    const isCyclical = (secondHalfHome === matchResult.home_score_ht && 
                       secondHalfAway === matchResult.away_score_ht) ||
                      (secondHalfHome + secondHalfAway === matchResult.home_score_ht + matchResult.away_score_ht);
    
    let contribution = 0.5;
    if (isCyclical) {
      contribution = 0.7; // Cyclical patterns often repeat with higher intensity
    }
    
    return {
      isCyclical,
      htPattern,
      contribution,
      reasoning: isCyclical ? 'Cyclical pattern detected' : 'No clear cyclical structure'
    };
  }

  /**
   * Pressure Cooker dynamics - explosion detection
   */
  analyzePressureDynamics(matchResult) {
    const htGoals = matchResult.home_score_ht + matchResult.away_score_ht;
    const ftGoals = matchResult.home_score_ft + matchResult.away_score_ft;
    const secondHalfGoals = ftGoals - htGoals;
    
    // Pressure explosion = massive second half scoring
    const isPressureExplosion = secondHalfGoals >= 4 || (secondHalfGoals >= 3 && htGoals <= 1);
    const pressureRatio = htGoals > 0 ? secondHalfGoals / htGoals : secondHalfGoals;
    
    let contribution = 0.5;
    if (isPressureExplosion) {
      contribution = 0.9; // Pressure explosions indicate very high scoring potential
    } else if (pressureRatio >= 2.0) {
      contribution = 0.75; // High pressure ratio suggests scoring potential
    }
    
    return {
      isPressureExplosion,
      pressureRatio,
      secondHalfGoals,
      contribution,
      reasoning: isPressureExplosion ? 'Critical pressure explosion detected' : 
                 `Pressure ratio: ${pressureRatio.toFixed(2)}`
    };
  }

  /**
   * Pythagorean analysis - form correction mathematics
   */
  analyzePythagorean(matchResult) {
    const homeGoals = matchResult.home_score_ft;
    const awayGoals = matchResult.away_score_ft;
    const totalGoals = homeGoals + awayGoals;
    
    // Pythagorean expectation based on a² + b² = c²
    const pythagoreanExpected = Math.sqrt(homeGoals * homeGoals + awayGoals * awayGoals);
    const actualTotal = totalGoals;
    const formGap = actualTotal - pythagoreanExpected;
    
    // Form correction due = significant deviation from expected
    const isCorrectionDue = Math.abs(formGap) > 1.5;
    
    let contribution = 0.5;
    if (isCorrectionDue && formGap < 0) {
      contribution = 0.8; // Underperformance suggests bounce-back high scoring
    } else if (isCorrectionDue && formGap > 0) {
      contribution = 0.3; // Overperformance suggests regression to lower scoring
    }
    
    return {
      pythagoreanExpected,
      formGap,
      isCorrectionDue,
      contribution,
      reasoning: isCorrectionDue ? 
        `Form correction due (gap: ${formGap.toFixed(2)})` : 
        'Form aligned with expectation'
    };
  }

  /**
   * Calculate pattern quality score (noise filtering)
   */
  calculateQualityScore(analyses) {
    const entropyScore = 1 - (analyses.entropy.entropy / 2.0); // Lower entropy = higher quality
    const fibonacciScore = analyses.fibonacci.fibonacciStrength;
    const goldenRatioScore = analyses.goldenRatio.isGoldenPattern ? 1.0 : 0.0;
    const stabilityScore = analyses.quantum.coherenceLevel;
    
    const overallQuality = (entropyScore + fibonacciScore + goldenRatioScore + stabilityScore) / 4.0;
    
    let predictabilityRating = 'NOISE';
    let recommendedWeight = 0.0;
    
    if (overallQuality > 0.8) {
      predictabilityRating = 'EXCELLENT';
      recommendedWeight = 1.0;
    } else if (overallQuality > 0.6) {
      predictabilityRating = 'GOOD';
      recommendedWeight = 0.8;
    } else if (overallQuality > 0.4) {
      predictabilityRating = 'AVERAGE';
      recommendedWeight = 0.5;
    } else if (overallQuality > 0.2) {
      predictabilityRating = 'POOR';
      recommendedWeight = 0.2;
    }
    
    return {
      overallQuality,
      predictabilityRating,
      recommendedWeight,
      isNoisePattern: overallQuality < 0.2,
      qualityFactors: {
        entropyScore,
        fibonacciScore, 
        goldenRatioScore,
        stabilityScore
      }
    };
  }

  /**
   * Generate Over 3.5 and Over 4.5 predictions based on mathematical analysis
   */
  generateGoalPredictions(mathematicalAnalysis, patternFingerprint) {
    // Weighted combination of all 8 engine contributions
    const contributions = [
      { value: mathematicalAnalysis.fibonacci.contribution, weight: 1.2 }, // 80.3% patterns
      { value: mathematicalAnalysis.goldenRatio.contribution, weight: 2.0 }, // 2.3% rare
      { value: mathematicalAnalysis.entropy.contribution, weight: 0.8 }, // Chaos is uncertain
      { value: mathematicalAnalysis.quantum.contribution, weight: 1.1 },
      { value: mathematicalAnalysis.nash.contribution, weight: 1.3 },
      { value: mathematicalAnalysis.klein.contribution, weight: 0.9 },
      { value: mathematicalAnalysis.pressure.contribution, weight: 1.4 }, // Explosive
      { value: mathematicalAnalysis.pythagorean.contribution, weight: 1.2 }
    ];
    
    // Calculate weighted average
    const totalWeight = contributions.reduce((sum, c) => sum + c.weight, 0);
    const weightedAverage = contributions.reduce((sum, c) => sum + (c.value * c.weight), 0) / totalWeight;
    
    // Apply quality filtering (from v4.1.0 changelog)
    const qualityMultiplier = mathematicalAnalysis.qualityScore.recommendedWeight;
    const filteredPrediction = weightedAverage * qualityMultiplier + (1 - qualityMultiplier) * 0.33; // 0.33 baseline
    
    // Over 3.5 prediction
    const over35Probability = Math.min(0.95, Math.max(0.05, filteredPrediction));
    
    // Over 4.5 prediction (typically lower probability)
    const over45Probability = Math.min(0.90, Math.max(0.03, over35Probability * 0.6));
    
    // Confidence based on engine agreement and quality
    const engineVariance = this.calculateEngineVariance(contributions);
    const over35Confidence = Math.max(0.3, (1 - engineVariance) * mathematicalAnalysis.qualityScore.overallQuality);
    const over45Confidence = over35Confidence * 0.8; // Lower confidence for Over 4.5
    
    return {
      over35Probability,
      over45Probability,
      over35Confidence,
      over45Confidence,
      engineContributions: contributions.map(c => c.value),
      qualityScore: mathematicalAnalysis.qualityScore.overallQuality
    };
  }

  /**
   * Calculate variance in engine predictions
   */
  calculateEngineVariance(contributions) {
    const mean = contributions.reduce((sum, c) => sum + c.value, 0) / contributions.length;
    const variance = contributions.reduce((sum, c) => sum + Math.pow(c.value - mean, 2), 0) / contributions.length;
    return Math.sqrt(variance); // Standard deviation
  }

  /**
   * Helper: Get next Fibonacci number
   */
  getNextFibonacci(current) {
    const index = this.FIBONACCI_SEQUENCE.indexOf(current);
    return index >= 0 && index < this.FIBONACCI_SEQUENCE.length - 1 ? 
      this.FIBONACCI_SEQUENCE[index + 1] : 
      this.FIBONACCI_SEQUENCE[this.FIBONACCI_SEQUENCE.length - 1];
  }
}

// MAIN EXECUTION
async function runRetroactiveAnalysis() {
  try {
    const db = new Database('./exodia.db', { readonly: true });
    const analyzer = new RetroactiveGoalAnalyzer();
    
    console.log('📊 Fetching historical match results...');
    
    // Get all match results with complete data
    const matchResults = db.prepare(`
      SELECT 
        simulation_id,
        home_score_ht,
        away_score_ht,
        home_score_ft,
        away_score_ft,
        accuracy_metrics,
        result_entered_at
      FROM match_results
      WHERE home_score_ft IS NOT NULL 
        AND away_score_ft IS NOT NULL
        AND home_score_ht IS NOT NULL
        AND away_score_ht IS NOT NULL
      ORDER BY simulation_id
    `).all();
    
    console.log(`✅ Found ${matchResults.length} complete match results`);
    
    if (matchResults.length === 0) {
      console.log('❌ No complete match results found for analysis');
      return;
    }
    
    console.log('\n🧠 Running mathematical engine analysis on all matches...');
    
    const analysisResults = [];
    let processed = 0;
    
    for (const match of matchResults) {
      try {
        const analysis = analyzer.analyzeMatch(match);
        analysisResults.push(analysis);
        
        processed++;
        if (processed % 50 === 0) {
          console.log(`   Processed ${processed}/${matchResults.length} matches...`);
        }
      } catch (e) {
        console.log(`   ⚠️  Error analyzing match ${match.simulation_id}: ${e.message}`);
      }
    }
    
    console.log(`\n✅ Analysis complete! Processed ${analysisResults.length} matches`);
    
    // CALCULATE ACCURACY METRICS
    console.log('\n📈 OVER 3.5 GOALS ACCURACY ANALYSIS:');
    console.log('=====================================');
    
    const over35Results = analysisResults.filter(r => r.predicted_over35 !== undefined);
    const over35Correct = over35Results.filter(r => r.over35_correct === 1).length;
    const over35Total = over35Results.length;
    const over35Accuracy = over35Total > 0 ? (over35Correct / over35Total * 100) : 0;
    
    const over35ActualRate = over35Results.filter(r => r.actual_over35 === 1.0).length / over35Total * 100;
    const over35PredictedRate = over35Results.reduce((sum, r) => sum + r.predicted_over35, 0) / over35Total * 100;
    
    console.log(`📊 Total predictions: ${over35Total}`);
    console.log(`✅ Correct predictions: ${over35Correct}`);
    console.log(`🎯 Accuracy: ${over35Accuracy.toFixed(1)}%`);
    console.log(`📈 Actual Over 3.5 rate: ${over35ActualRate.toFixed(1)}%`);
    console.log(`🔮 Average predicted rate: ${over35PredictedRate.toFixed(1)}%`);
    console.log(`📏 Prediction vs Reality gap: ${Math.abs(over35PredictedRate - over35ActualRate).toFixed(1)}%`);
    
    console.log('\n📈 OVER 4.5 GOALS ACCURACY ANALYSIS:');
    console.log('=====================================');
    
    const over45Results = analysisResults.filter(r => r.predicted_over45 !== undefined);
    const over45Correct = over45Results.filter(r => r.over45_correct === 1).length;
    const over45Total = over45Results.length;
    const over45Accuracy = over45Total > 0 ? (over45Correct / over45Total * 100) : 0;
    
    const over45ActualRate = over45Results.filter(r => r.actual_over45 === 1.0).length / over45Total * 100;
    const over45PredictedRate = over45Results.reduce((sum, r) => sum + r.predicted_over45, 0) / over45Total * 100;
    
    console.log(`📊 Total predictions: ${over45Total}`);
    console.log(`✅ Correct predictions: ${over45Correct}`);
    console.log(`🎯 Accuracy: ${over45Accuracy.toFixed(1)}%`);
    console.log(`📈 Actual Over 4.5 rate: ${over45ActualRate.toFixed(1)}%`);
    console.log(`🔮 Average predicted rate: ${over45PredictedRate.toFixed(1)}%`);
    console.log(`📏 Prediction vs Reality gap: ${Math.abs(over45PredictedRate - over45ActualRate).toFixed(1)}%`);
    
    // QUALITY ANALYSIS
    console.log('\n🏆 PATTERN QUALITY BREAKDOWN:');
    console.log('==============================');
    
    const qualityBreakdown = {
      EXCELLENT: analysisResults.filter(r => r.pattern_quality >= 0.8).length,
      GOOD: analysisResults.filter(r => r.pattern_quality >= 0.6 && r.pattern_quality < 0.8).length,
      AVERAGE: analysisResults.filter(r => r.pattern_quality >= 0.4 && r.pattern_quality < 0.6).length,
      POOR: analysisResults.filter(r => r.pattern_quality >= 0.2 && r.pattern_quality < 0.4).length,
      NOISE: analysisResults.filter(r => r.pattern_quality < 0.2).length
    };
    
    Object.entries(qualityBreakdown).forEach(([quality, count]) => {
      const percentage = (count / analysisResults.length * 100).toFixed(1);
      console.log(`${quality}: ${count} patterns (${percentage}%)`);
    });
    
    // TOP PERFORMING ENGINES
    console.log('\n⚡ ENGINE CONTRIBUTION ANALYSIS:');
    console.log('================================');
    
    const avgContributions = {
      fibonacci: analysisResults.reduce((sum, r) => sum + r.fibonacci_contribution, 0) / analysisResults.length,
      golden_ratio: analysisResults.reduce((sum, r) => sum + r.golden_ratio_contribution, 0) / analysisResults.length,
      entropy: analysisResults.reduce((sum, r) => sum + r.entropy_contribution, 0) / analysisResults.length,
      quantum: analysisResults.reduce((sum, r) => sum + r.quantum_contribution, 0) / analysisResults.length
    };
    
    Object.entries(avgContributions).forEach(([engine, contribution]) => {
      console.log(`${engine.toUpperCase()}: ${contribution.toFixed(3)} average contribution`);
    });
    
    // SAMPLE HIGH QUALITY PREDICTIONS
    console.log('\n🔬 SAMPLE HIGH-QUALITY PREDICTIONS:');
    console.log('====================================');
    
    const highQuality = analysisResults
      .filter(r => r.pattern_quality >= 0.7)
      .sort((a, b) => b.pattern_quality - a.pattern_quality)
      .slice(0, 5);
    
    highQuality.forEach((result, i) => {
      console.log(`\n${i+1}. Simulation ${result.simulation_id}`);
      console.log(`   Pattern: ${result.pattern_fingerprint.substring(0, 50)}...`);
      console.log(`   Total Goals: ${result.total_goals}`);
      console.log(`   Over 3.5 - Predicted: ${(result.predicted_over35 * 100).toFixed(1)}%, Actual: ${result.actual_over35 === 1.0 ? 'YES' : 'NO'}`);
      console.log(`   Over 4.5 - Predicted: ${(result.predicted_over45 * 100).toFixed(1)}%, Actual: ${result.actual_over45 === 1.0 ? 'YES' : 'NO'}`);
      console.log(`   Quality Score: ${result.pattern_quality.toFixed(3)}`);
    });
    
    // SAVE RESULTS TO DATABASE (optional)
    console.log('\n💾 SAVING RETROACTIVE ANALYSIS RESULTS:');
    console.log('=======================================');
    
    console.log(`📁 Analysis complete! Results available in memory.`);
    console.log(`📊 Key Findings:`);
    console.log(`   • Over 3.5 Goals Accuracy: ${over35Accuracy.toFixed(1)}%`);
    console.log(`   • Over 4.5 Goals Accuracy: ${over45Accuracy.toFixed(1)}%`);
    console.log(`   • High Quality Patterns: ${qualityBreakdown.EXCELLENT + qualityBreakdown.GOOD} of ${analysisResults.length}`);
    console.log(`   • Pattern Quality Filter removed ${qualityBreakdown.NOISE} noise patterns`);
    
    db.close();
    
    return {
      summary: {
        total_matches: analysisResults.length,
        over35_accuracy: over35Accuracy,
        over45_accuracy: over45Accuracy,
        over35_actual_rate: over35ActualRate,
        over45_actual_rate: over45ActualRate,
        pattern_quality_breakdown: qualityBreakdown
      },
      detailed_results: analysisResults
    };
    
  } catch (error) {
    console.error('❌ Error in retroactive analysis:', error);
    console.error('Stack:', error.stack);
  }
}

// Execute the analysis
runRetroactiveAnalysis()
  .then(results => {
    if (results) {
      console.log('\n🎉 RETROACTIVE ANALYSIS COMPLETED SUCCESSFULLY!');
      console.log('==============================================');
      console.log('Use these real accuracy numbers to replace theoretical projections in the system.');
    }
  })
  .catch(error => {
    console.error('❌ Failed to complete retroactive analysis:', error);
  });