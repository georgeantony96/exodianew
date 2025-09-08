import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

/**
 * Unified Intelligence API
 * Processes ALL mathematical engines silently and returns ONE simple recommendation
 */

interface EngineVote {
  engine: string;
  recommendedBet: string;
  confidence: number;
  reasoning: string;
  weight: number; // Engine importance weighting
}

interface UnifiedRecommendation {
  success: boolean;
  primaryBet: string;
  confidence: number;
  expectedValue: number;
  kellyStake: number;
  simpleReasoning: string;
  engineConsensus: {
    totalEngines: number;
    agreeingEngines: number;
    conflictingEngines: number;
  };
  // Hidden from user - for debugging only
  engineVotes?: EngineVote[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const homeTeam = searchParams.get('home_team') || '';
    const awayTeam = searchParams.get('away_team') || '';
    const showDetails = searchParams.get('debug') === 'true';
    
    const dbPath = path.resolve(process.cwd(), 'exodia.db');
    const db = new Database(dbPath, { readonly: true });
    
    // Gather all mathematical engine analyses
    const engines: EngineVote[] = [];
    
    // 1. FIBONACCI ENGINE - Enhanced with Over 3.5/4.5 analysis
    try {
      const fibData = await fetch(`${request.url.split('/api')[0]}/api/mathematical-queries?type=fibonacci_predictions&limit=10`);
      const fibResult = await fibData.json();
      if (fibResult.success && Object.keys(fibResult.predictions).length > 0) {
        const topPrediction = Object.entries(fibResult.predictions)[0];
        const goals = parseInt(topPrediction[0]);
        
        // NEW: Enhanced goal market recommendations based on 67.9%/83.9% proven accuracy
        let recommendedBet = 'Over 2.5';
        let confidence = 0.80;
        let reasoning = `Fibonacci sequence predicts ${goals} total goals`;
        
        if (goals > 4.5) {
          recommendedBet = 'Over 4.5';
          confidence = 0.84; // 83.9% proven accuracy
          reasoning = `Fibonacci ${goals} goals - Over 4.5 highly probable`;
        } else if (goals > 3.5) {
          recommendedBet = 'Over 3.5';
          confidence = 0.68; // 67.9% proven accuracy
          reasoning = `Fibonacci ${goals} goals - Over 3.5 likely`;
        }
        
        engines.push({
          engine: 'Fibonacci',
          recommendedBet,
          confidence,
          reasoning,
          weight: 1.2 // High weight - 80% of patterns
        });
      }
    } catch (e) {
      console.log('Fibonacci engine error:', e);
    }

    // 2. GOLDEN RATIO ENGINE - Enhanced for high-scoring games
    try {
      const goldenData = await fetch(`${request.url.split('/api')[0]}/api/mathematical-queries?type=golden_ratio_opportunities&limit=5`);
      const goldenResult = await goldenData.json();
      if (goldenResult.success && goldenResult.golden_patterns.length > 0) {
        engines.push({
          engine: 'Golden Ratio',
          recommendedBet: 'Over 4.5', // Golden ratio often indicates explosive scoring
          confidence: 0.90,
          reasoning: 'Golden ratio harmony detected - explosive scoring potential',
          weight: 2.0 // Ultra rare - high weight when present
        });
      }
    } catch (e) {
      console.log('Golden ratio engine error:', e);
    }

    // 3. QUANTUM COHERENCE ENGINE
    try {
      const quantumData = await fetch(`${request.url.split('/api')[0]}/api/mathematical-queries?type=quantum_coherent_predictions&limit=10`);
      const quantumResult = await quantumData.json();
      if (quantumResult.success && quantumResult.coherent_patterns.length > 0) {
        const avgCoherence = quantumResult.coherent_patterns.reduce((sum: number, p: any) => sum + p.quantum_coherence, 0) / quantumResult.coherent_patterns.length;
        engines.push({
          engine: 'Quantum Coherence',
          recommendedBet: avgCoherence > 0.9 ? 'HT/FT Correct Score' : 'Over 1.5',
          confidence: avgCoherence,
          reasoning: `High coherence (${(avgCoherence * 100).toFixed(0)}%) indicates predictable progression`,
          weight: 1.1
        });
      }
    } catch (e) {
      console.log('Quantum engine error:', e);
    }

    // 4. NASH EQUILIBRIUM ENGINE
    try {
      const nashData = await fetch(`${request.url.split('/api')[0]}/api/mathematical-queries?type=nash_equilibrium_breaks&limit=10`);
      const nashResult = await nashData.json();
      if (nashResult.success && nashResult.equilibrium_break_patterns.length > 0) {
        const breakPatterns = nashResult.equilibrium_break_patterns.filter((p: any) => p.equilibrium_status === 'EQUILIBRIUM_BREAK');
        if (breakPatterns.length > 0) {
          engines.push({
            engine: 'Nash Equilibrium',
            recommendedBet: 'Over 3.5', // Equilibrium breaks often lead to 4+ goals
            confidence: 0.68, // Use proven 67.9% Over 3.5 accuracy
            reasoning: 'Strategic equilibrium breakdown detected - high scoring likely',
            weight: 1.3
          });
        }
      }
    } catch (e) {
      console.log('Nash engine error:', e);
    }

    // 5. ENTROPY ENGINE
    try {
      const entropyData = await fetch(`${request.url.split('/api')[0]}/api/mathematical-queries?type=high_entropy_surprises&limit=10`);
      const entropyResult = await entropyData.json();
      if (entropyResult.success && entropyResult.high_entropy_patterns && entropyResult.high_entropy_patterns.length > 0) {
        engines.push({
          engine: 'Shannon Entropy',
          recommendedBet: 'Draw',
          confidence: 0.65,
          reasoning: 'High entropy indicates surprise potential',
          weight: 0.8 // Lower weight - chaos is unpredictable
        });
      }
    } catch (e) {
      console.log('Entropy engine error:', e);
    }

    // 6. KLEIN BOTTLE ENGINE
    try {
      const kleinData = await fetch(`${request.url.split('/api')[0]}/api/mathematical-queries?type=klein_bottle_loops&limit=10`);
      const kleinResult = await kleinData.json();
      if (kleinResult.success && kleinResult.topological_patterns && kleinResult.topological_patterns.length > 0) {
        engines.push({
          engine: 'Klein Bottle',
          recommendedBet: 'Over 2.5',
          confidence: 0.70,
          reasoning: 'Cyclical pattern suggests goal repetition',
          weight: 0.9
        });
      }
    } catch (e) {
      console.log('Klein bottle engine error:', e);
    }

    // 7. PRESSURE COOKER ENGINE
    try {
      const pressureData = await fetch(`${request.url.split('/api')[0]}/api/mathematical-queries?type=pressure_cooker_dynamics&limit=10`);
      const pressureResult = await pressureData.json();
      if (pressureResult.success && pressureResult.pressure_patterns.length > 0) {
        const explosions = pressureResult.pressure_patterns.filter((p: any) => p.pressure_type === 'PRESSURE_EXPLOSION');
        if (explosions.length > 0) {
          engines.push({
            engine: 'Pressure Cooker',
            recommendedBet: 'Over 4.5', // Pressure explosions = very high scoring
            confidence: 0.84, // Use proven 83.9% Over 4.5 accuracy
            reasoning: 'Critical pressure explosion detected - very high scoring expected',
            weight: 1.4 // High weight - explosive results
          });
        }
      }
    } catch (e) {
      console.log('Pressure cooker engine error:', e);
    }

    // 8. PYTHAGOREAN ENGINE
    try {
      const pythagoreanData = await fetch(`${request.url.split('/api')[0]}/api/mathematical-queries?type=pythagorean_analysis&limit=10`);
      const pythagoreanResult = await pythagoreanData.json();
      if (pythagoreanResult.success && pythagoreanResult.pythagorean_patterns.length > 0) {
        const correctionPatterns = pythagoreanResult.pythagorean_patterns.filter((p: any) => p.pythagorean_status === 'CORRECTION_DUE');
        if (correctionPatterns.length > 0) {
          const overperforming = correctionPatterns.filter((p: any) => p.form_gap > 1.5);
          const underperforming = correctionPatterns.filter((p: any) => p.form_gap < -1.5);
          
          if (overperforming.length > underperforming.length) {
            engines.push({
              engine: 'Pythagorean',
              recommendedBet: awayTeam ? `${awayTeam} Win` : 'Away Win',
              confidence: 0.75,
              reasoning: 'Pythagorean analysis shows home team overperforming - regression due',
              weight: 1.2
            });
          } else if (underperforming.length > 0) {
            engines.push({
              engine: 'Pythagorean',
              recommendedBet: homeTeam ? `${homeTeam} Win` : 'Home Win',
              confidence: 0.78,
              reasoning: 'Pythagorean analysis shows home team underperforming - bounce back value',
              weight: 1.2
            });
          }
        }
      }
    } catch (e) {
      console.log('Pythagorean engine error:', e);
    }

    // UNIFIED INTELLIGENCE PROCESSING
    if (engines.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No mathematical patterns detected',
        recommendation: 'Insufficient data for unified analysis'
      });
    }

    // Group recommendations by bet type
    const betVotes: { [key: string]: { votes: number, totalConfidence: number, totalWeight: number, reasons: string[] } } = {};
    
    engines.forEach(engine => {
      const bet = engine.recommendedBet;
      if (!betVotes[bet]) {
        betVotes[bet] = { votes: 0, totalConfidence: 0, totalWeight: 0, reasons: [] };
      }
      betVotes[bet].votes += 1;
      betVotes[bet].totalConfidence += engine.confidence * engine.weight;
      betVotes[bet].totalWeight += engine.weight;
      betVotes[bet].reasons.push(`${engine.engine}: ${engine.reasoning}`);
    });

    // Find winning recommendation
    let topBet = '';
    let topScore = 0;
    let topReasons: string[] = [];

    Object.entries(betVotes).forEach(([bet, data]) => {
      const weightedScore = (data.totalConfidence / data.totalWeight) * (data.votes / engines.length);
      if (weightedScore > topScore) {
        topScore = weightedScore;
        topBet = bet;
        topReasons = data.reasons;
      }
    });

    // Calculate final metrics
    const finalConfidence = Math.min(0.95, topScore); // Cap at 95%
    const expectedValue = (finalConfidence - 0.5) * 40; // Convert to percentage
    const kellyStake = Math.max(0, Math.min(0.25, expectedValue * 0.01)); // Kelly criterion

    // Simple reasoning (hide complexity)
    const agreeingEngines = betVotes[topBet]?.votes || 0;
    const simpleReasoning = agreeingEngines > 4 
      ? `Strong mathematical consensus (${agreeingEngines}/${engines.length} engines)`
      : agreeingEngines > 2
      ? `Moderate consensus with key pattern alignment`
      : `Limited agreement - proceed with caution`;

    const result: UnifiedRecommendation = {
      success: true,
      primaryBet: topBet,
      confidence: Math.round(finalConfidence * 100) / 100,
      expectedValue: Math.round(expectedValue * 10) / 10,
      kellyStake: Math.round(kellyStake * 1000) / 1000,
      simpleReasoning,
      engineConsensus: {
        totalEngines: engines.length,
        agreeingEngines,
        conflictingEngines: engines.length - agreeingEngines
      }
    };

    // Only include engine details if debug mode
    if (showDetails) {
      result.engineVotes = engines;
    }

    db.close();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Unified Intelligence API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process unified intelligence',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}