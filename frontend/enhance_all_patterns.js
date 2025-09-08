/**
 * Phase 2: Enhance All Existing Patterns with Mathematical Analysis
 * Processes all 2,860+ patterns and stores mathematical properties
 */

const Database = require('better-sqlite3');
const path = require('path');

class MathematicalPatternProcessor {
  constructor() {
    this.PHI = 1.6180339887498948;
    this.FIBONACCI_SEQUENCE = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  }

  analyzePattern(pattern) {
    const htTotal = pattern.home_score_ht + pattern.away_score_ht;
    const ftTotal = pattern.home_score_ft + pattern.away_score_ft;
    
    // Golden Ratio Analysis
    const progressionRatio = htTotal > 0 ? ftTotal / htTotal : ftTotal;
    const phiDeviation = Math.abs(progressionRatio - this.PHI);
    const goldenRatioHarmony = 1 / (phiDeviation + 0.1);
    const isGoldenPattern = phiDeviation < 0.08;
    
    // Fibonacci Analysis
    const fibonacciIndex = this.findClosestFibonacciIndex(ftTotal);
    const fibonacciStrength = this.calculateFibonacciStrength(ftTotal);
    const isFibonacciTotal = this.FIBONACCI_SEQUENCE.includes(ftTotal);
    const spiralCoherence = this.calculateSpiralCoherence(pattern);
    
    // Information Theory
    const shannonEntropy = this.calculateShannonEntropy(pattern);
    const informationContent = -Math.log2(this.estimatePatternProbability(pattern));
    const surpriseFactor = Math.min(ftTotal * 0.3, 3);
    const predictabilityIndex = 1 / (shannonEntropy + 0.1);
    const patternRarity = 1 / this.estimatePatternProbability(pattern);
    const compressionRatio = 4 / this.countUniqueValues(pattern);
    
    // Quantum Analysis
    const quantumCoherence = Math.exp(-Math.abs(htTotal - ftTotal) / 3);
    const quantumEntanglement = htTotal > 0 ? Math.min(1, ftTotal / htTotal / 3) : 0.1;
    const superpositionState = this.calculateSuperpositionState(pattern);
    const waveFunctionAmplitude = this.calculateWaveFunction(pattern);
    const collapseEntropy = shannonEntropy;
    const quantumTunneling = ftTotal > 7;
    
    // Game Theory
    const nashEquilibrium = this.classifyNashEquilibrium(pattern);
    const strategicBalance = this.calculateStrategicBalance(pattern);
    const attackDefenseRatio = Math.min(ftTotal / 2, 3);
    const cooperationIndex = (pattern.home_score_ft > 0 && pattern.away_score_ft > 0) ? 
      Math.min(pattern.home_score_ft * pattern.away_score_ft / 4, 1) : 0;
    const dominantStrategy = ftTotal === 0 ? 'defensive' : ftTotal > 4 ? 'attacking' : 'balanced';
    const payoffMatrix = this.generatePayoffMatrix(pattern);
    
    // Topology
    const manifoldPosition = [
      pattern.home_score_ht, pattern.away_score_ht,
      pattern.home_score_ft, pattern.away_score_ft, ftTotal
    ];
    const hyperbolicDistance = Math.sqrt(
      Math.pow(pattern.home_score_ht, 2) + Math.pow(pattern.away_score_ht, 2) +
      Math.pow(pattern.home_score_ft, 2) + Math.pow(pattern.away_score_ft, 2)
    );
    const curvatureMeasure = 1 / (1 + hyperbolicDistance);
    const topologicalStability = Math.exp(-ftTotal / 10);
    const patternNeighbors = [`similar_${pattern.home_score_ft}-${pattern.away_score_ft}`];
    const kleinBottleIndicator = pattern.home_score_ht === pattern.away_score_ft && 
                                pattern.away_score_ht === pattern.home_score_ft;
    
    return {
      pattern_id: pattern.id,
      
      // Golden Ratio
      golden_ratio_score: phiDeviation,
      golden_ratio_harmony: goldenRatioHarmony,
      is_golden_pattern: isGoldenPattern ? 1 : 0,
      phi_deviation: phiDeviation,
      
      // Fibonacci
      fibonacci_index: fibonacciIndex,
      fibonacci_strength: fibonacciStrength,
      is_fibonacci_total: isFibonacciTotal ? 1 : 0,
      spiral_coherence: spiralCoherence,
      
      // Information Theory
      shannon_entropy: shannonEntropy,
      information_content: informationContent,
      surprise_factor: surpriseFactor,
      predictability_index: predictabilityIndex,
      pattern_rarity: patternRarity,
      compression_ratio: compressionRatio,
      
      // Quantum
      quantum_coherence: quantumCoherence,
      quantum_entanglement: quantumEntanglement,
      superposition_state: superpositionState,
      wave_function_amplitude: JSON.stringify(waveFunctionAmplitude),
      collapse_entropy: collapseEntropy,
      quantum_tunneling: quantumTunneling ? 1 : 0,
      
      // Game Theory
      nash_equilibrium: nashEquilibrium,
      strategic_balance: strategicBalance,
      attack_defense_ratio: attackDefenseRatio,
      cooperation_index: cooperationIndex,
      dominant_strategy: dominantStrategy,
      payoff_matrix: JSON.stringify(payoffMatrix),
      
      // Topology
      manifold_position: JSON.stringify(manifoldPosition),
      hyperbolic_distance: hyperbolicDistance,
      curvature_measure: curvatureMeasure,
      topological_stability: topologicalStability,
      pattern_neighbors: JSON.stringify(patternNeighbors),
      klein_bottle_indicator: kleinBottleIndicator ? 1 : 0,
      
      analysis_version: '1.0.0'
    };
  }

  // Helper methods
  findClosestFibonacciIndex(value) {
    let closest = 0;
    let minDiff = Math.abs(value - this.FIBONACCI_SEQUENCE[0]);
    
    for (let i = 1; i < this.FIBONACCI_SEQUENCE.length; i++) {
      const diff = Math.abs(value - this.FIBONACCI_SEQUENCE[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }
    return closest;
  }

  calculateFibonacciStrength(value) {
    const closestIndex = this.findClosestFibonacciIndex(value);
    const closestFib = this.FIBONACCI_SEQUENCE[closestIndex];
    const deviation = Math.abs(value - closestFib);
    return 1 / (deviation + 0.1);
  }

  calculateSpiralCoherence(pattern) {
    const htTotal = pattern.home_score_ht + pattern.away_score_ht;
    const ftTotal = pattern.home_score_ft + pattern.away_score_ft;
    const htFibStrength = this.calculateFibonacciStrength(htTotal);
    const ftFibStrength = this.calculateFibonacciStrength(ftTotal);
    return (htFibStrength + ftFibStrength) / 2;
  }

  calculateShannonEntropy(pattern) {
    const outcomes = [
      pattern.home_score_ht, pattern.away_score_ht,
      pattern.home_score_ft, pattern.away_score_ft
    ];
    
    const total = outcomes.reduce((sum, val) => sum + val, 0);
    if (total === 0) return 0;
    
    let entropy = 0;
    outcomes.forEach(outcome => {
      if (outcome > 0) {
        const probability = outcome / total;
        entropy -= probability * Math.log2(probability);
      }
    });
    
    return entropy;
  }

  estimatePatternProbability(pattern) {
    const ftTotal = pattern.home_score_ft + pattern.away_score_ft;
    const commonScores = [0, 1, 2, 3];
    
    if (commonScores.includes(ftTotal)) {
      return 0.3 - (ftTotal * 0.05);
    }
    
    return Math.max(0.01, 0.1 / Math.pow(ftTotal, 1.5));
  }

  countUniqueValues(pattern) {
    return new Set([
      pattern.home_score_ht, pattern.away_score_ht,
      pattern.home_score_ft, pattern.away_score_ft
    ]).size;
  }

  calculateSuperpositionState(pattern) {
    const homeFT = pattern.home_score_ft;
    const awayFT = pattern.away_score_ft;
    
    if (homeFT > awayFT) return 'collapsed_win';
    if (homeFT < awayFT) return 'collapsed_loss';
    return 'collapsed_draw';
  }

  calculateWaveFunction(pattern) {
    const total = pattern.home_score_ft + pattern.away_score_ft;
    return [
      Math.sqrt(pattern.home_score_ft / (total + 1)),
      Math.sqrt(pattern.away_score_ft / (total + 1)),
      Math.sqrt(1 / (total + 1))
    ];
  }

  classifyNashEquilibrium(pattern) {
    const homeFT = pattern.home_score_ft;
    const awayFT = pattern.away_score_ft;
    
    if (homeFT === 0 && awayFT === 0) return 'defensive_equilibrium';
    if (homeFT > 2 && awayFT > 2) return 'attacking_equilibrium';
    if (homeFT === awayFT) return 'balanced_equilibrium';
    return 'asymmetric_equilibrium';
  }

  calculateStrategicBalance(pattern) {
    const homeFT = pattern.home_score_ft;
    const awayFT = pattern.away_score_ft;
    const total = homeFT + awayFT;
    
    if (total === 0) return 0.5;
    return 1 - Math.abs(homeFT - awayFT) / total;
  }

  generatePayoffMatrix(pattern) {
    const homeFT = pattern.home_score_ft;
    const awayFT = pattern.away_score_ft;
    
    return [
      [homeFT + awayFT, homeFT - awayFT],
      [homeFT - awayFT, 0]
    ];
  }
}

async function enhanceAllPatterns() {
  console.log('🧬 PHASE 2: MATHEMATICAL PATTERN ENHANCEMENT');
  console.log('=' .repeat(60));
  
  try {
    const dbPath = path.resolve('exodia.db');
    const db = new Database(dbPath);
    const processor = new MathematicalPatternProcessor();
    
    console.log('📊 Database Connection: ✅ Connected');
    
    // Get all patterns that need mathematical analysis
    const patterns = db.prepare(`
      SELECT rhp.id, rhp.home_score_ht, rhp.away_score_ht, rhp.home_score_ft, rhp.away_score_ft
      FROM rich_historical_patterns rhp
      LEFT JOIN mathematical_enhancements me ON rhp.id = me.pattern_id
      WHERE me.id IS NULL
      ORDER BY rhp.created_at DESC
    `).all();
    
    console.log(`📈 Patterns to Enhance: ${patterns.length.toLocaleString()}`);
    
    if (patterns.length === 0) {
      console.log('✅ All patterns already have mathematical analysis!');
      db.close();
      return;
    }
    
    // Prepare insert statement
    const insertStmt = db.prepare(`
      INSERT INTO mathematical_enhancements (
        pattern_id, golden_ratio_score, golden_ratio_harmony, is_golden_pattern, phi_deviation,
        fibonacci_index, fibonacci_strength, is_fibonacci_total, spiral_coherence,
        shannon_entropy, information_content, surprise_factor, predictability_index, 
        pattern_rarity, compression_ratio,
        quantum_coherence, quantum_entanglement, superposition_state, wave_function_amplitude,
        collapse_entropy, quantum_tunneling,
        nash_equilibrium, strategic_balance, attack_defense_ratio, cooperation_index,
        dominant_strategy, payoff_matrix,
        manifold_position, hyperbolic_distance, curvature_measure, topological_stability,
        pattern_neighbors, klein_bottle_indicator, analysis_version
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);
    
    // Process patterns in batches
    const batchSize = 100;
    let processed = 0;
    let discoveries = {
      goldenPatterns: 0,
      fibonacciPatterns: 0,
      highEntropyPatterns: 0,
      coherentPatterns: 0,
      kleinBottles: 0
    };
    
    console.log('\n🔬 Processing patterns with mathematical analysis...');
    
    for (let i = 0; i < patterns.length; i += batchSize) {
      const batch = patterns.slice(i, i + batchSize);
      
      db.transaction(() => {
        batch.forEach(pattern => {
          const analysis = processor.analyzePattern(pattern);
          
          insertStmt.run(
            analysis.pattern_id, analysis.golden_ratio_score, analysis.golden_ratio_harmony,
            analysis.is_golden_pattern, analysis.phi_deviation,
            analysis.fibonacci_index, analysis.fibonacci_strength, analysis.is_fibonacci_total,
            analysis.spiral_coherence, analysis.shannon_entropy, analysis.information_content,
            analysis.surprise_factor, analysis.predictability_index, analysis.pattern_rarity,
            analysis.compression_ratio, analysis.quantum_coherence, analysis.quantum_entanglement,
            analysis.superposition_state, analysis.wave_function_amplitude, analysis.collapse_entropy,
            analysis.quantum_tunneling, analysis.nash_equilibrium, analysis.strategic_balance,
            analysis.attack_defense_ratio, analysis.cooperation_index, analysis.dominant_strategy,
            analysis.payoff_matrix, analysis.manifold_position, analysis.hyperbolic_distance,
            analysis.curvature_measure, analysis.topological_stability, analysis.pattern_neighbors,
            analysis.klein_bottle_indicator, analysis.analysis_version
          );
          
          // Track discoveries
          if (analysis.is_golden_pattern) discoveries.goldenPatterns++;
          if (analysis.is_fibonacci_total) discoveries.fibonacciPatterns++;
          if (analysis.shannon_entropy > 1.5) discoveries.highEntropyPatterns++;
          if (analysis.quantum_coherence > 0.8) discoveries.coherentPatterns++;
          if (analysis.klein_bottle_indicator) discoveries.kleinBottles++;
          
          processed++;
        });
      })();
      
      // Progress update
      const progress = ((i + batch.length) / patterns.length * 100).toFixed(1);
      console.log(`📊 Progress: ${progress}% (${processed.toLocaleString()}/${patterns.length.toLocaleString()}) - Latest discoveries: Golden ${discoveries.goldenPatterns}, Fib ${discoveries.fibonacciPatterns}, Coherent ${discoveries.coherentPatterns}`);
    }
    
    console.log('\n🎉 MATHEMATICAL ENHANCEMENT COMPLETE!');
    console.log('=' .repeat(60));
    console.log(`📊 Patterns Enhanced: ${processed.toLocaleString()}`);
    console.log('\n🌟 MATHEMATICAL DISCOVERIES:');
    console.log(`   🌀 Golden Ratio Patterns: ${discoveries.goldenPatterns.toLocaleString()}`);
    console.log(`   🔢 Fibonacci Patterns: ${discoveries.fibonacciPatterns.toLocaleString()}`);
    console.log(`   🔥 High Entropy Patterns: ${discoveries.highEntropyPatterns.toLocaleString()}`);
    console.log(`   ⚡ Quantum Coherent Patterns: ${discoveries.coherentPatterns.toLocaleString()}`);
    console.log(`   🌌 Klein Bottle Patterns: ${discoveries.kleinBottles.toLocaleString()}`);
    
    // Generate summary statistics
    const finalStats = db.prepare(`
      SELECT 
        COUNT(*) as total_enhanced,
        AVG(golden_ratio_harmony) as avg_golden_ratio,
        AVG(fibonacci_strength) as avg_fibonacci,
        AVG(shannon_entropy) as avg_entropy,
        AVG(quantum_coherence) as avg_coherence,
        COUNT(CASE WHEN is_golden_pattern THEN 1 END) as golden_count,
        COUNT(CASE WHEN is_fibonacci_total THEN 1 END) as fibonacci_count,
        COUNT(CASE WHEN quantum_coherence > 0.8 THEN 1 END) as coherent_count
      FROM mathematical_enhancements
    `).get();
    
    console.log('\n📈 SYSTEM-WIDE MATHEMATICAL STATISTICS:');
    console.log(`   Total Enhanced: ${finalStats.total_enhanced.toLocaleString()}`);
    console.log(`   Avg Golden Ratio Harmony: ${finalStats.avg_golden_ratio.toFixed(3)}`);
    console.log(`   Avg Fibonacci Strength: ${finalStats.avg_fibonacci.toFixed(3)}`);
    console.log(`   Avg Shannon Entropy: ${finalStats.avg_entropy.toFixed(3)} bits`);
    console.log(`   Avg Quantum Coherence: ${finalStats.avg_coherence.toFixed(3)}`);
    
    const goldenPercentage = (finalStats.golden_count / finalStats.total_enhanced * 100).toFixed(1);
    const fibonacciPercentage = (finalStats.fibonacci_count / finalStats.total_enhanced * 100).toFixed(1);
    const coherentPercentage = (finalStats.coherent_count / finalStats.total_enhanced * 100).toFixed(1);
    
    console.log('\n🎯 MATHEMATICAL PATTERN DISTRIBUTION:');
    console.log(`   Golden Ratio: ${goldenPercentage}% of patterns`);
    console.log(`   Fibonacci: ${fibonacciPercentage}% of patterns`);
    console.log(`   Quantum Coherent: ${coherentPercentage}% of patterns`);
    
    db.close();
    
    console.log('\n🚀 PHASE 2 COMPLETE - YOUR PATTERNS NOW HAVE MATHEMATICAL SUPERPOWERS!');
    
  } catch (error) {
    console.error('❌ Enhancement failed:', error.message);
  }
}

// Run the enhancement
if (require.main === module) {
  enhanceAllPatterns();
}

module.exports = { enhanceAllPatterns };