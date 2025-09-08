import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';
import MonteCarloEngine from '@/utils/montecarlo-engine';

interface SimulationRequest {
  home_team_id: number;
  away_team_id: number;
  league_id: number; // NEW: Required league context
  match_date: string;
  distribution_type: 'poisson' | 'negative_binomial';
  iterations: number;
  boost_settings: {
    home_advantage: number;
    custom_home_boost: number;
    custom_away_boost: number;
    enable_streak_analysis: boolean;
    chaos_config?: any; // Mathematical Chaos Engine configuration
  };
  historical_data: {
    h2h: any[];
    home_home: any[];
    away_away: any[];
  };
  pattern_analysis?: {
    uniquePatternId: string;
    patternConfidence: number;
    patternInsights: any;
    firstSimulationResults: any;
  };
  bookmaker_odds: any;
  chaos_config?: any; // Also allow at root level for backward compatibility
}

// Database storage functions (OPTIMIZED WITH better-sqlite3)
async function saveSimulationToDatabase(data: SimulationRequest, results: any) {
  try {
    const db = getOptimizedDatabase();
    
    // Use prepared statement for maximum performance
    const result = db.statements.insertSimulation.run(
      data.home_team_id,
      data.away_team_id,
      data.league_id,
      data.match_date,
      data.distribution_type,
      data.iterations,
      data.boost_settings.custom_home_boost,
      data.boost_settings.custom_away_boost,
      data.boost_settings.home_advantage,
      JSON.stringify(results.results?.true_odds || results.true_odds || {}),
      JSON.stringify(results.results?.value_bets || results.value_bets || {})
    );
    
    const simulationId = result.lastInsertRowid;
    
    console.log('✅ Simulation saved to database with ID:', simulationId);
    return simulationId;
  } catch (error) {
    console.error('❌ Failed to save simulation to database:', error);
    throw error;
  }
}

async function trackOddsForIntelligence(data: SimulationRequest, results: any, simulationId: number) {
  try {
    const db = getOptimizedDatabase();
    
    // Track odds for pattern discovery
    const actualValueBets = results.results?.value_bets || results.value_bets;
    if (data.bookmaker_odds && actualValueBets) {
      Object.entries(data.bookmaker_odds).forEach(([market, odds]) => {
        // Extract odds values for the current market
        const oddsObj = odds as any;
        db.statements.insertBookmakerOdds.run(
          simulationId,
          market,
          oddsObj?.home_odds || 0,
          oddsObj?.draw_odds || 0, 
          oddsObj?.away_odds || 0,
          oddsObj?.over_odds || 0,
          oddsObj?.under_odds || 0,
          oddsObj?.yes_odds || 0,
          oddsObj?.no_odds || 0
        );
      });
    }
    
    console.log('✅ Odds tracked for intelligence system');
  } catch (error) {
    console.error('❌ Failed to track odds:', error);
    // Don't throw - this is non-critical
  }
}

// POST /api/simulate - Run Monte Carlo simulation
export async function POST(request: NextRequest) {
  let data: SimulationRequest | undefined;
  
  try {
    data = await request.json();
    
    // Enhanced logging for debugging
    console.log('=== SIMULATION API DEBUG ===');
    console.log('Raw request data:', data);
    console.log('home_team_id:', data.home_team_id, typeof data.home_team_id);
    console.log('away_team_id:', data.away_team_id, typeof data.away_team_id);
    console.log('league_id:', data.league_id, typeof data.league_id);
    console.log('distribution_type:', data.distribution_type);
    console.log('iterations:', data.iterations);
    console.log('============================');
    
    // Validate required fields
    if (!data.home_team_id || !data.away_team_id) {
      return NextResponse.json(
        { success: false, error: 'Both home and away team IDs are required' },
        { status: 400 }
      );
    }
    
    if (!data.league_id) {
      return NextResponse.json(
        { success: false, error: 'League ID is required' },
        { status: 400 }
      );
    }
    
    if (!data.distribution_type || !['poisson', 'negative_binomial'].includes(data.distribution_type)) {
      return NextResponse.json(
        { success: false, error: 'Valid distribution type is required' },
        { status: 400 }
      );
    }
    
    if (!data.iterations || data.iterations < 1 || data.iterations > 1000000) {
      return NextResponse.json(
        { success: false, error: 'Iterations must be between 1 and 1,000,000' },
        { status: 400 }
      );
    }

    // Database is managed by schema.sql - tables should already exist
    // Basic database connectivity check
    try {
      const db = getOptimizedDatabase();
      // Simple connectivity test
      db.db.prepare('SELECT 1 as test').get();
    } catch (dbError) {
      console.error('Database connectivity check failed:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Use Node.js Monte Carlo engine (eliminates Python dependency)
    console.log('🚀 Starting Node.js Monte Carlo simulation...');
    const engine = new MonteCarloEngine();
    const simulationResults = {
      success: true,
      results: engine.simulate(data)
    };
    
    // Note: Simulation saving is now manual via "Save & Bet Selected" button
    // This prevents duplicate simulations from being created automatically
    
    // Track odds for league intelligence (Argentina O2.5 style discovery) - no simulation ID needed
    await trackOddsForIntelligence(data, simulationResults, 0);
    
    console.log('[API] Returning simulation results:', {
      success: true,
      resultsKeys: simulationResults ? Object.keys(simulationResults) : null,
      hasValueBets: simulationResults?.results?.value_bets || simulationResults?.value_bets ? 'YES' : 'NO',
      valueBets: simulationResults?.results?.value_bets || simulationResults?.value_bets
    });

    return NextResponse.json({
      success: true,
      results: simulationResults
    });
    
  } catch (error) {
    console.error('=== SIMULATION ERROR DETAILS ===');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Request data keys:', data ? Object.keys(data) : 'No data available');
    console.error('================================');
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Simulation failed',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : 'No stack trace') : undefined,
        debug: {
          engine: 'Node.js Monte Carlo',
          dataReceived: !!data
        }
      },
      { status: 500 }
    );
  }
}

// Python simulation function removed - now using pure Node.js implementation
