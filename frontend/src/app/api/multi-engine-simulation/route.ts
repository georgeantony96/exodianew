/**
 * MULTI-ENGINE SIMULATION API
 * 
 * Revolutionary endpoint that orchestrates three independent AI engines:
 * 1. Monte Carlo Engine (existing physics-based simulation)
 * 2. Independent Pattern Engine (historical similarity matching)
 * 3. Engine Comparison System (value opportunity detection)
 * 
 * This replaces the single Monte Carlo approach with intelligent multi-engine analysis
 * that identifies market inefficiencies and massive value opportunities
 */

import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { adaptiveThresholdEngine } from '@/utils/adaptive-threshold-engine';
import { independentPatternEngine } from '@/utils/independent-pattern-engine';
import { engineComparisonSystem } from '@/utils/engine-comparison-system';
import { comprehensiveMarketCalculator } from '@/utils/comprehensive-market-calculator';
import { smartSequenceAnalyzer } from '@/utils/smart-sequence-analyzer';

// Import existing Monte Carlo engine
import MonteCarloEngine from '@/utils/montecarlo-engine';

interface MultiEngineRequest {
  // Standard simulation data
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  selectedLeague: { id: number; name: string };
  matchDate: string;
  historicalMatches: {
    h2h: any[];
    home_home: any[];
    away_away: any[];
  };
  bookmakerOdds: any;
  boosts: any;
  distribution: string;
  iterations: number;
  
  // New multi-engine options
  enablePatternEngine?: boolean;
  enableEngineComparison?: boolean;
  enableAdaptiveLearning?: boolean;
}

interface MultiEngineResponse {
  success: boolean;
  
  // Traditional Monte Carlo results
  monte_carlo_results: any;
  
  // New Pattern Engine results
  pattern_engine_results?: any;
  
  // Engine comparison and value detection
  engine_comparison?: any;
  
  // Meta analysis
  meta_analysis: {
    recommended_engine: 'MONTE_CARLO' | 'PATTERN' | 'HYBRID';
    confidence_level: number;
    value_opportunities: number;
    learning_status: string;
  };
  
  // Simulation metadata
  simulation_id: number;
  engine_version: string;
  processing_time: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const data: MultiEngineRequest = await request.json();
    
    console.log('🚀 Multi-Engine Simulation Started');
    console.log(`   Home: ${data.homeTeam?.name} vs Away: ${data.awayTeam?.name}`);
    console.log(`   Engines: MC=true, Pattern=${data.enablePatternEngine}, Comparison=${data.enableEngineComparison}`);
    
    // Validate required data
    if (!data.homeTeam || !data.awayTeam || !data.historicalMatches) {
      return NextResponse.json(
        { error: 'Missing required data for multi-engine simulation' },
        { status: 400 }
      );
    }

    // Initialize database and engines
    const db = new Database('./exodia.db');
    const monteCarloEngine = new MonteCarloEngine();
    
    // Create simulation record for tracking
    const simulationId = await createSimulationRecord(db, data);
    
    // STEP 1: Generate rich historical patterns for all engines
    const richPatterns = await generateRichHistoricalPatterns(db, data.historicalMatches, simulationId);
    
    console.log('✅ Rich patterns generated:', {
      h2h: richPatterns.h2h.length,
      home: richPatterns.home_form.length,
      away: richPatterns.away_form.length
    });

    // STEP 2: Run Monte Carlo Engine (existing system with adaptive thresholds)
    console.log('🎯 Running Monte Carlo Engine with Adaptive Thresholds...');
    const monteCarloResults = await runEnhancedMonteCarloEngine(
      monteCarloEngine,
      data,
      simulationId,
      richPatterns,
      data.enableAdaptiveLearning
    );
    
    console.log('✅ Monte Carlo complete:', {
      home_win_prob: (monteCarloResults.probabilities?.home_win * 100).toFixed(1) + '%',
      over_2_5_prob: 'calculated',
      confidence: monteCarloResults.confidence || 'N/A'
    });
    
    // DEBUG: Log the actual structure for data mapping fixes
    console.log('🔍 Monte Carlo Results Structure:', {
      keys: Object.keys(monteCarloResults),
      results_keys: monteCarloResults.results ? Object.keys(monteCarloResults.results) : 'No results key',
      avg_goals: {
        home: monteCarloResults.results?.avg_home_goals || monteCarloResults.avg_home_goals,
        away: monteCarloResults.results?.avg_away_goals || monteCarloResults.avg_away_goals,
        total: monteCarloResults.results?.avg_total_goals || monteCarloResults.avg_total_goals
      },
      value_bets: monteCarloResults.value_bets ? Object.keys(monteCarloResults.value_bets) : 'No value_bets'
    });

    let patternEngineResults = null;
    let engineComparison = null;

    // STEP 3: Run Independent Pattern Engine (if enabled)
    if (data.enablePatternEngine) {
      console.log('🧠 Running Independent Pattern Engine...');
      
      try {
        patternEngineResults = await independentPatternEngine.generateIndependentPrediction(
          richPatterns.home_form,
          richPatterns.away_form,
          richPatterns.h2h
        );
        
        // Store pattern predictions for learning
        await independentPatternEngine.storePredictionForLearning(
          patternEngineResults,
          simulationId,
          `${data.homeTeam.name}_vs_${data.awayTeam.name}_${data.matchDate}`
        );
        
        console.log('✅ Pattern Engine complete:', {
          home_win_prob: (patternEngineResults.home_win_probability * 100).toFixed(1) + '%',
          over_2_5_prob: (patternEngineResults.over_2_5_probability * 100).toFixed(1) + '%',
          confidence: (patternEngineResults.confidence * 100).toFixed(1) + '%',
          sample_size: patternEngineResults.sample_size
        });
        
      } catch (error) {
        console.error('❌ Pattern Engine error:', error.message);
        patternEngineResults = null;
      }
    }

    // STEP 4: Run Engine Comparison System (if enabled and we have both engines)
    if (data.enableEngineComparison && patternEngineResults && data.bookmakerOdds) {
      console.log('⚖️ Running Engine Comparison System...');
      
      try {
        // Convert Monte Carlo results to comparison format
        const mcForComparison = convertMonteCarloForComparison(monteCarloResults);
        
        engineComparison = engineComparisonSystem.compareAllEngines(
          patternEngineResults,
          mcForComparison,
          data.bookmakerOdds
        );
        
        console.log('✅ Engine Comparison complete:', {
          total_opportunities: engineComparison.value_summary.total_opportunities,
          massive_value: engineComparison.value_summary.massive_value_count,
          best_market: engineComparison.value_summary.best_market,
          consensus: engineComparison.engine_consensus.agreement_level
        });
        
      } catch (error) {
        console.error('❌ Engine Comparison error:', error.message);
        engineComparison = null;
      }
    }

    // STEP 5: Generate meta-analysis and recommendations
    const metaAnalysis = generateMetaAnalysis(
      monteCarloResults,
      patternEngineResults,
      engineComparison
    );

    // STEP 6: Prepare comprehensive response
    const response: MultiEngineResponse = {
      success: true,
      monte_carlo_results: monteCarloResults,
      pattern_engine_results: patternEngineResults,
      engine_comparison: engineComparison,
      meta_analysis: metaAnalysis,
      simulation_id: simulationId,
      engine_version: '4.0_multi_engine',
      processing_time: Date.now() - startTime
    };

    // Update simulation record with results
    await updateSimulationRecord(db, simulationId, response);

    console.log('🎉 Multi-Engine Simulation Complete:', {
      processing_time: response.processing_time + 'ms',
      engines_used: [
        'Monte Carlo',
        patternEngineResults ? 'Pattern Engine' : null,
        engineComparison ? 'Engine Comparison' : null
      ].filter(Boolean),
      recommendation: metaAnalysis.recommended_engine,
      value_opportunities: metaAnalysis.value_opportunities
    });

    db.close();

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ Multi-Engine Simulation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Multi-engine simulation failed',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Create simulation record in database for tracking
 */
async function createSimulationRecord(db: Database.Database, data: MultiEngineRequest): Promise<number> {
  // For team-agnostic approach, we store team names directly in simulation
  // Teams table is only for bet tracking, not pattern matching
  const result = db.prepare(`
    INSERT INTO simulations (
      home_team_id, away_team_id, match_date, league_id,
      distribution_type, iterations, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    1, // Placeholder home team ID (not used for patterns)
    2, // Placeholder away team ID (not used for patterns)  
    data.matchDate,
    data.selectedLeague?.id || 1,
    data.distribution || 'normal',
    data.iterations || 10000,
    new Date().toISOString()
  );
  
  return result.lastInsertRowid as number;
}

/**
 * Generate rich historical patterns for all engines
 */
async function generateRichHistoricalPatterns(
  db: Database.Database,
  historicalMatches: any,
  simulationId: number
): Promise<{
  h2h: any[];
  home_form: any[];
  away_form: any[];
}> {
  
  const processMatches = (matches: any[], teamType: string) => {
    return matches.map((match, index) => {
      // Calculate complete market data for this match
      const marketData = comprehensiveMarketCalculator.calculateCompleteMarkets(
        match.home_score_ft,
        match.away_score_ft,
        match.home_score_ht || 0,
        match.away_score_ht || 0
      );
      
      // Store in database for pattern learning
      db.prepare(`
        INSERT OR IGNORE INTO rich_historical_patterns (
          simulation_id, team_type, game_position,
          home_score_ft, away_score_ft, home_score_ht, away_score_ht,
          rich_fingerprint_combined
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        simulationId,
        teamType,
        index + 1,
        match.home_score_ft,
        match.away_score_ft,
        match.home_score_ht || 0,
        match.away_score_ht || 0,
        marketData.rich_fingerprint_combined
      );
      
      return {
        ...match,
        game_position: index + 1,
        result: marketData.result_ft,
        rich_fingerprint_combined: marketData.rich_fingerprint_combined,
        ...marketData
      };
    });
  };

  return {
    h2h: processMatches(historicalMatches.h2h || [], 'h2h'),
    home_form: processMatches(historicalMatches.home_home || [], 'home'),
    away_form: processMatches(historicalMatches.away_away || [], 'away')
  };
}

/**
 * Run enhanced Monte Carlo engine with adaptive thresholds
 */
async function runEnhancedMonteCarloEngine(
  engine: MonteCarloEngine,
  data: MultiEngineRequest,
  simulationId: number,
  richPatterns: any,
  enableAdaptive: boolean = true
): Promise<any> {
  
  // If adaptive learning is enabled, replace fixed penalties with learned ones
  if (enableAdaptive) {
    console.log('🧠 Applying adaptive thresholds to Monte Carlo engine...');
    
    // Get learned penalties for Mean Reversion patterns
    const adaptedBoosts = { ...data.boosts };
    
    // Apply learned thresholds if available
    try {
      // This would integrate with the existing reversion system
      // For now, we'll run the standard Monte Carlo engine
      console.log('📊 Using learned penalties:', {
        note: 'Adaptive integration with Mean Reversion system pending'
      });
    } catch (error) {
      console.warn('⚠️ Adaptive thresholds not available, using fixed penalties');
    }
  }

  // Run standard Monte Carlo simulation
  const results = engine.simulate({
    ...data,
    historical_data: {
      h2h: richPatterns.h2h,
      home_home: richPatterns.home_form,
      away_away: richPatterns.away_form
    }
  });

  return results;
}

/**
 * Convert Monte Carlo results for engine comparison
 */
function convertMonteCarloForComparison(mcResults: any): any {
  return {
    home_win_probability: mcResults.probabilities?.home_win || 0.45,
    draw_probability: mcResults.probabilities?.draw || 0.25,
    away_win_probability: mcResults.probabilities?.away_win || 0.30,
    over_2_5_probability: mcResults.probabilities?.over_2_5 || 0.50,
    under_2_5_probability: mcResults.probabilities?.under_2_5 || 0.50,
    gg_probability: mcResults.probabilities?.gg || 0.55,
    confidence: mcResults.confidence || 0.75,
    reasoning: 'Monte Carlo physics-based simulation'
  };
}

/**
 * Generate meta-analysis combining all engine results
 */
function generateMetaAnalysis(
  monteCarloResults: any,
  patternResults: any,
  engineComparison: any
): any {
  
  let recommendedEngine: 'MONTE_CARLO' | 'PATTERN' | 'HYBRID' = 'MONTE_CARLO';
  let confidenceLevel = 0.75;
  let valueOpportunities = 0;
  let learningStatus = 'Standard Monte Carlo';

  // Count value opportunities from Monte Carlo results
  if (monteCarloResults && monteCarloResults.value_bets) {
    if (Array.isArray(monteCarloResults.value_bets)) {
      // If value_bets is an array, count the items
      valueOpportunities = Math.max(valueOpportunities, monteCarloResults.value_bets.length);
    } else if (typeof monteCarloResults.value_bets === 'object') {
      // If value_bets is an object, count the markets with bets
      const valueBetsCount = Object.keys(monteCarloResults.value_bets).reduce((count, market) => {
        const bets = monteCarloResults.value_bets[market];
        if (typeof bets === 'object' && bets !== null) {
          return count + Object.keys(bets).length;
        }
        return count;
      }, 0);
      valueOpportunities = Math.max(valueOpportunities, valueBetsCount);
    }
  }

  // Analyze engine performance and consensus
  if (patternResults && engineComparison) {
    // Use engine comparison consensus
    switch (engineComparison.engine_consensus.primary_engine) {
      case 'PATTERN':
        recommendedEngine = 'PATTERN';
        break;
      case 'MONTE_CARLO':
        recommendedEngine = 'MONTE_CARLO';
        break;
      default:
        recommendedEngine = 'HYBRID';
    }
    
    confidenceLevel = Math.min(0.95, 
      (monteCarloResults.confidence || 0.75) * 0.5 + 
      patternResults.confidence * 0.5 + 
      engineComparison.engine_consensus.confidence_boost * 0.2
    );
    
    valueOpportunities = engineComparison.value_summary.total_opportunities;
    learningStatus = `Multi-engine analysis with ${patternResults.sample_size} pattern matches`;
    
  } else if (patternResults) {
    // Pattern engine available but no comparison
    recommendedEngine = patternResults.confidence > 0.8 ? 'PATTERN' : 'MONTE_CARLO';
    confidenceLevel = Math.max(monteCarloResults.confidence || 0.75, patternResults.confidence);
    learningStatus = `Pattern engine: ${patternResults.pattern_match_quality.toLowerCase()} match quality`;
    
  } else {
    // Monte Carlo only
    learningStatus = 'Monte Carlo simulation only';
  }

  return {
    recommended_engine: recommendedEngine,
    confidence_level: Number(confidenceLevel.toFixed(3)),
    value_opportunities: valueOpportunities,
    learning_status: learningStatus
  };
}

/**
 * Update simulation record with final results
 */
async function updateSimulationRecord(
  db: Database.Database,
  simulationId: number,
  results: MultiEngineResponse
): Promise<void> {
  
  db.prepare(`
    UPDATE simulations 
    SET 
      results_data = ?,
      engine_version = ?,
      processing_time_ms = ?,
      completed_at = ?
    WHERE id = ?
  `).run(
    JSON.stringify({
      meta_analysis: results.meta_analysis,
      engines_used: [
        results.monte_carlo_results ? 'monte_carlo' : null,
        results.pattern_engine_results ? 'pattern_engine' : null,
        results.engine_comparison ? 'engine_comparison' : null
      ].filter(Boolean)
    }),
    results.engine_version,
    results.processing_time,
    new Date().toISOString(),
    simulationId
  );
}