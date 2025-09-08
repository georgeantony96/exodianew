import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// Type definitions for our mathematical analysis
interface PatternScore {
  home_score_ht: number;
  away_score_ht: number;
  home_score_ft: number;
  away_score_ft: number;
}

interface MathematicalEnhancement {
  pattern_id: number;
  golden_ratio_score: number;
  golden_ratio_harmony: number;
  fibonacci_index: number;
  fibonacci_strength: number;
  shannon_entropy: number;
  information_content: number;
  quantum_coherence: number;
  quantum_entanglement: number;
  nash_equilibrium: string;
  strategic_balance: number;
  manifold_position: string;
  hyperbolic_distance: number;
  created_at: string;
}

// Mathematical Analysis Engine (inline implementation)
class MathematicalAnalyzer {
  private readonly PHI = 1.6180339887498948;
  private readonly FIBONACCI_SEQUENCE = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  
  analyze(pattern: PatternScore & { id: number }): MathematicalEnhancement {
    const htTotal = pattern.home_score_ht + pattern.away_score_ht;
    const ftTotal = pattern.home_score_ft + pattern.away_score_ft;
    
    // Golden Ratio Analysis
    const progressionRatio = htTotal > 0 ? ftTotal / htTotal : ftTotal;
    const goldenRatioScore = Math.abs(progressionRatio - this.PHI);
    const goldenRatioHarmony = 1 / (goldenRatioScore + 0.1);
    
    // Fibonacci Analysis
    const fibonacciIndex = this.findClosestFibonacciIndex(ftTotal);
    const fibonacciStrength = this.calculateFibonacciStrength(ftTotal);
    
    // Information Theory
    const shannonEntropy = this.calculateShannonEntropy(pattern);
    const informationContent = -Math.log2(this.estimatePatternProbability(pattern));
    
    // Quantum Analysis
    const quantumCoherence = Math.exp(-Math.abs(htTotal - ftTotal) / 3);
    const quantumEntanglement = htTotal > 0 ? Math.min(1, ftTotal / htTotal / 3) : 0.1;
    
    // Game Theory
    const nashEquilibrium = this.classifyNashEquilibrium(pattern);
    const strategicBalance = this.calculateStrategicBalance(pattern);
    
    // Topology
    const manifoldPosition = JSON.stringify([
      pattern.home_score_ht, pattern.away_score_ht,
      pattern.home_score_ft, pattern.away_score_ft, ftTotal
    ]);
    const hyperbolicDistance = Math.sqrt(
      Math.pow(pattern.home_score_ht, 2) + Math.pow(pattern.away_score_ht, 2) +
      Math.pow(pattern.home_score_ft, 2) + Math.pow(pattern.away_score_ft, 2)
    );
    
    return {
      pattern_id: pattern.id,
      golden_ratio_score: goldenRatioScore,
      golden_ratio_harmony: goldenRatioHarmony,
      fibonacci_index: fibonacciIndex,
      fibonacci_strength: fibonacciStrength,
      shannon_entropy: shannonEntropy,
      information_content: informationContent,
      quantum_coherence: quantumCoherence,
      quantum_entanglement: quantumEntanglement,
      nash_equilibrium: nashEquilibrium,
      strategic_balance: strategicBalance,
      manifold_position: manifoldPosition,
      hyperbolic_distance: hyperbolicDistance,
      created_at: new Date().toISOString()
    };
  }
  
  private findClosestFibonacciIndex(value: number): number {
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
  
  private calculateFibonacciStrength(value: number): number {
    const closestIndex = this.findClosestFibonacciIndex(value);
    const closestFib = this.FIBONACCI_SEQUENCE[closestIndex];
    const deviation = Math.abs(value - closestFib);
    return 1 / (deviation + 0.1);
  }
  
  private calculateShannonEntropy(pattern: PatternScore): number {
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
  
  private estimatePatternProbability(pattern: PatternScore): number {
    const ftTotal = pattern.home_score_ft + pattern.away_score_ft;
    const commonScores = [0, 1, 2, 3];
    
    if (commonScores.includes(ftTotal)) {
      return 0.3 - (ftTotal * 0.05);
    }
    
    return Math.max(0.01, 0.1 / Math.pow(ftTotal, 1.5));
  }
  
  private classifyNashEquilibrium(pattern: PatternScore): string {
    const homeFT = pattern.home_score_ft;
    const awayFT = pattern.away_score_ft;
    
    if (homeFT === 0 && awayFT === 0) return 'defensive_equilibrium';
    if (homeFT > 2 && awayFT > 2) return 'attacking_equilibrium';
    if (homeFT === awayFT) return 'balanced_equilibrium';
    return 'asymmetric_equilibrium';
  }
  
  private calculateStrategicBalance(pattern: PatternScore): number {
    const homeFT = pattern.home_score_ft;
    const awayFT = pattern.away_score_ft;
    const total = homeFT + awayFT;
    
    if (total === 0) return 0.5;
    return 1 - Math.abs(homeFT - awayFT) / total;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('type') || 'summary';
    const patternId = searchParams.get('patternId');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Connect to database
    const dbPath = path.resolve(process.cwd(), 'exodia.db');
    const db = new Database(dbPath, { readonly: true });
    
    try {
      if (analysisType === 'analyze' && patternId) {
        // Analyze specific pattern
        const pattern = db.prepare(`
          SELECT id, home_score_ht, away_score_ht, home_score_ft, away_score_ft
          FROM rich_historical_patterns 
          WHERE id = ?
        `).get(patternId) as PatternScore & { id: number };
        
        if (!pattern) {
          return NextResponse.json({ error: 'Pattern not found' }, { status: 404 });
        }
        
        const analyzer = new MathematicalAnalyzer();
        const analysis = analyzer.analyze(pattern);
        
        return NextResponse.json({
          success: true,
          pattern_id: patternId,
          mathematical_analysis: analysis,
          timestamp: new Date().toISOString()
        });
      }
      
      if (analysisType === 'batch') {
        // Batch analyze multiple patterns
        const patterns = db.prepare(`
          SELECT id, home_score_ht, away_score_ht, home_score_ft, away_score_ft
          FROM rich_historical_patterns 
          ORDER BY created_at DESC 
          LIMIT ?
        `).all(limit) as (PatternScore & { id: number })[];
        
        const analyzer = new MathematicalAnalyzer();
        const analyses = patterns.map(pattern => analyzer.analyze(pattern));
        
        // Calculate aggregate statistics
        const aggregateStats = {
          total_patterns: analyses.length,
          average_golden_ratio_harmony: analyses.reduce((sum, a) => sum + a.golden_ratio_harmony, 0) / analyses.length,
          fibonacci_patterns: analyses.filter(a => a.fibonacci_strength > 2).length,
          high_entropy_patterns: analyses.filter(a => a.shannon_entropy > 1.5).length,
          quantum_coherent_patterns: analyses.filter(a => a.quantum_coherence > 0.7).length,
          nash_equilibrium_distribution: this.calculateEquilibriumDistribution(analyses)
        };
        
        return NextResponse.json({
          success: true,
          analysis_type: 'batch',
          patterns_analyzed: analyses.length,
          aggregate_statistics: aggregateStats,
          individual_analyses: analyses.slice(0, 10), // Return first 10 for inspection
          timestamp: new Date().toISOString()
        });
      }
      
      if (analysisType === 'summary') {
        // Mathematical summary of all patterns
        const totalPatterns = db.prepare('SELECT COUNT(*) as count FROM rich_historical_patterns').get() as { count: number };
        
        // Sample patterns for mathematical analysis
        const samplePatterns = db.prepare(`
          SELECT id, home_score_ht, away_score_ht, home_score_ft, away_score_ft
          FROM rich_historical_patterns 
          ORDER BY RANDOM() 
          LIMIT 100
        `).all() as (PatternScore & { id: number })[];
        
        const analyzer = new MathematicalAnalyzer();
        const analyses = samplePatterns.map(pattern => analyzer.analyze(pattern));
        
        // Mathematical insights
        const insights = {
          total_patterns: totalPatterns.count,
          sample_size: analyses.length,
          mathematical_metrics: {
            golden_ratio: {
              patterns_in_harmony: analyses.filter(a => a.golden_ratio_harmony > 5).length,
              average_harmony: analyses.reduce((sum, a) => sum + a.golden_ratio_harmony, 0) / analyses.length,
              strongest_harmony: Math.max(...analyses.map(a => a.golden_ratio_harmony))
            },
            fibonacci: {
              fibonacci_aligned: analyses.filter(a => a.fibonacci_strength > 5).length,
              most_common_fibonacci_index: this.getMostCommonFibIndex(analyses),
              spiral_coherence: analyses.filter(a => a.fibonacci_strength > 2).length
            },
            information_theory: {
              average_entropy: analyses.reduce((sum, a) => sum + a.shannon_entropy, 0) / analyses.length,
              high_information_patterns: analyses.filter(a => a.information_content > 5).length,
              most_surprising_pattern: Math.max(...analyses.map(a => a.information_content))
            },
            quantum_mechanics: {
              coherent_patterns: analyses.filter(a => a.quantum_coherence > 0.8).length,
              entangled_patterns: analyses.filter(a => a.quantum_entanglement > 0.5).length,
              average_coherence: analyses.reduce((sum, a) => sum + a.quantum_coherence, 0) / analyses.length
            },
            game_theory: {
              equilibrium_distribution: this.calculateEquilibriumDistribution(analyses),
              average_strategic_balance: analyses.reduce((sum, a) => sum + a.strategic_balance, 0) / analyses.length,
              most_balanced_patterns: analyses.filter(a => a.strategic_balance > 0.8).length
            },
            topology: {
              average_hyperbolic_distance: analyses.reduce((sum, a) => sum + a.hyperbolic_distance, 0) / analyses.length,
              pattern_space_diameter: Math.max(...analyses.map(a => a.hyperbolic_distance)),
              clustering_coefficient: this.estimateClusteringCoefficient(analyses)
            }
          }
        };
        
        return NextResponse.json({
          success: true,
          analysis_type: 'mathematical_summary',
          insights,
          mathematical_discoveries: this.identifyMathematicalDiscoveries(analyses),
          timestamp: new Date().toISOString()
        });
      }
      
      return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
      
    } finally {
      db.close();
    }
    
  } catch (error) {
    console.error('Mathematical analysis error:', error);
    return NextResponse.json({ 
      error: 'Mathematical analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pattern_ids, create_enhancement_table } = body;
    
    const dbPath = path.resolve(process.cwd(), 'exodia.db');
    const db = new Database(dbPath);
    
    try {
      // Create mathematical enhancement table if requested
      if (create_enhancement_table) {
        db.exec(`
          CREATE TABLE IF NOT EXISTS mathematical_enhancements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pattern_id INTEGER NOT NULL,
            golden_ratio_score REAL,
            golden_ratio_harmony REAL,
            fibonacci_index INTEGER,
            fibonacci_strength REAL,
            shannon_entropy REAL,
            information_content REAL,
            quantum_coherence REAL,
            quantum_entanglement REAL,
            nash_equilibrium TEXT,
            strategic_balance REAL,
            manifold_position TEXT,
            hyperbolic_distance REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pattern_id) REFERENCES rich_historical_patterns(id)
          );
          
          CREATE INDEX IF NOT EXISTS idx_mathematical_pattern_id ON mathematical_enhancements(pattern_id);
          CREATE INDEX IF NOT EXISTS idx_mathematical_golden_ratio ON mathematical_enhancements(golden_ratio_harmony);
          CREATE INDEX IF NOT EXISTS idx_mathematical_fibonacci ON mathematical_enhancements(fibonacci_strength);
          CREATE INDEX IF NOT EXISTS idx_mathematical_entropy ON mathematical_enhancements(shannon_entropy);
        `);
        
        return NextResponse.json({
          success: true,
          message: 'Mathematical enhancement table created',
          timestamp: new Date().toISOString()
        });
      }
      
      // Enhance specific patterns with mathematical analysis
      if (pattern_ids && Array.isArray(pattern_ids)) {
        const analyzer = new MathematicalAnalyzer();
        const enhancements: MathematicalEnhancement[] = [];
        
        const insertStmt = db.prepare(`
          INSERT OR REPLACE INTO mathematical_enhancements (
            pattern_id, golden_ratio_score, golden_ratio_harmony, fibonacci_index,
            fibonacci_strength, shannon_entropy, information_content, quantum_coherence,
            quantum_entanglement, nash_equilibrium, strategic_balance, manifold_position,
            hyperbolic_distance, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const patternId of pattern_ids) {
          const pattern = db.prepare(`
            SELECT id, home_score_ht, away_score_ht, home_score_ft, away_score_ft
            FROM rich_historical_patterns 
            WHERE id = ?
          `).get(patternId) as PatternScore & { id: number };
          
          if (pattern) {
            const analysis = analyzer.analyze(pattern);
            enhancements.push(analysis);
            
            insertStmt.run(
              analysis.pattern_id, analysis.golden_ratio_score, analysis.golden_ratio_harmony,
              analysis.fibonacci_index, analysis.fibonacci_strength, analysis.shannon_entropy,
              analysis.information_content, analysis.quantum_coherence, analysis.quantum_entanglement,
              analysis.nash_equilibrium, analysis.strategic_balance, analysis.manifold_position,
              analysis.hyperbolic_distance, analysis.created_at
            );
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'Mathematical enhancements created',
          patterns_enhanced: enhancements.length,
          enhancements: enhancements.slice(0, 5), // Return first 5 for inspection
          timestamp: new Date().toISOString()
        });
      }
      
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      
    } finally {
      db.close();
    }
    
  } catch (error) {
    console.error('Mathematical enhancement creation error:', error);
    return NextResponse.json({
      error: 'Failed to create mathematical enhancements',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions for mathematical analysis
function calculateEquilibriumDistribution(analyses: MathematicalEnhancement[]) {
  const distribution = analyses.reduce((acc, analysis) => {
    acc[analysis.nash_equilibrium] = (acc[analysis.nash_equilibrium] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return distribution;
}

function getMostCommonFibIndex(analyses: MathematicalEnhancement[]) {
  const fibIndexCounts = analyses.reduce((acc, analysis) => {
    acc[analysis.fibonacci_index] = (acc[analysis.fibonacci_index] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  return Object.keys(fibIndexCounts).reduce((a, b) => 
    fibIndexCounts[parseInt(a)] > fibIndexCounts[parseInt(b)] ? a : b
  );
}

function estimateClusteringCoefficient(analyses: MathematicalEnhancement[]) {
  // Simplified clustering coefficient based on hyperbolic distances
  const avgDistance = analyses.reduce((sum, a) => sum + a.hyperbolic_distance, 0) / analyses.length;
  const variance = analyses.reduce((sum, a) => sum + Math.pow(a.hyperbolic_distance - avgDistance, 2), 0) / analyses.length;
  
  return 1 / (1 + variance); // Higher clustering = lower variance in distances
}

function identifyMathematicalDiscoveries(analyses: MathematicalEnhancement[]) {
  return {
    golden_ratio_discoveries: analyses.filter(a => a.golden_ratio_harmony > 10).length,
    perfect_fibonacci_patterns: analyses.filter(a => a.fibonacci_strength > 10).length,
    maximum_entropy_patterns: analyses.filter(a => a.shannon_entropy > 2).length,
    quantum_coherence_peaks: analyses.filter(a => a.quantum_coherence > 0.95).length,
    perfect_strategic_balance: analyses.filter(a => a.strategic_balance === 1).length,
    hyperbolic_outliers: analyses.filter(a => a.hyperbolic_distance > 10).length
  };
}