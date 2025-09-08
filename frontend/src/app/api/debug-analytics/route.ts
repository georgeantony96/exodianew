import { NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

export async function GET() {
  try {
    const db = getOptimizedDatabase();
    
    console.log("=== COMPREHENSIVE DATABASE AUDIT ===");
    
    // 1. Check all leagues in the system
    const leaguesResult = db.executeQuery(`
      SELECT id, name, country FROM leagues ORDER BY id
    `);
    console.log("1. ALL LEAGUES:", leaguesResult.data);
    
    // 2. Check ALL simulations with league references
    const simulationsResult = db.executeQuery(`
      SELECT 
        s.id, 
        s.league_id, 
        l.name as league_name,
        s.created_at,
        ht.name as home_team,
        at.name as away_team
      FROM simulations s
      LEFT JOIN leagues l ON s.league_id = l.id  
      LEFT JOIN teams ht ON s.home_team_id = ht.id
      LEFT JOIN teams at ON s.away_team_id = at.id
      ORDER BY s.id ASC
    `);
    console.log("2. ALL SIMULATIONS:", simulationsResult.data);
    
    // 3. Check match_odds_analysis records with problematic data
    const oddsAnalysisResult = db.executeQuery(`
      SELECT 
        moa.id,
        moa.simulation_id,
        moa.league_id,
        moa.market_type,
        moa.actual_result,
        moa.recorded_at,
        s.id as sim_exists,
        l.name as league_name
      FROM match_odds_analysis moa
      LEFT JOIN simulations s ON moa.simulation_id = s.id
      LEFT JOIN leagues l ON moa.league_id = l.id
      WHERE moa.actual_result IS NOT NULL
      ORDER BY moa.recorded_at DESC
    `);
    console.log("3. MATCH ODDS ANALYSIS WITH RELATIONSHIPS:", oddsAnalysisResult.data);
    
    // 4. Find orphaned records (no simulation or league reference)
    const orphanedResult = db.executeQuery(`
      SELECT 
        moa.*,
        CASE WHEN s.id IS NULL THEN 'MISSING_SIMULATION' ELSE 'HAS_SIMULATION' END as sim_status,
        CASE WHEN l.id IS NULL THEN 'MISSING_LEAGUE' ELSE 'HAS_LEAGUE' END as league_status
      FROM match_odds_analysis moa
      LEFT JOIN simulations s ON moa.simulation_id = s.id
      LEFT JOIN leagues l ON moa.league_id = l.id
      WHERE moa.actual_result IS NOT NULL
        AND (s.id IS NULL OR l.id IS NULL)
      ORDER BY moa.recorded_at DESC
    `);
    console.log("4. ORPHANED RECORDS:", orphanedResult.data);
    
    // 5. Check for Denmark leagues specifically
    const denmarkResult = db.executeQuery(`
      SELECT * FROM leagues WHERE name LIKE '%Denmark%' OR country LIKE '%Denmark%'
    `);
    console.log("5. DENMARK LEAGUES:", denmarkResult.data);
    
    // 6. COMPREHENSIVE CORRELATION ANALYSIS - Simulation vs Bet Data
    const correlationResult = db.executeQuery(`
      SELECT 
        s.id as sim_id,
        s.league_id as sim_league_id,
        s_league.name as sim_league_name,
        s.created_at as sim_created,
        ht.name as sim_home_team,
        at.name as sim_away_team,
        
        moa.id as bet_id,
        moa.league_id as bet_league_id,
        bet_league.name as bet_league_name,
        moa.market_type,
        moa.actual_result,
        moa.recorded_at as bet_settled,
        
        CASE 
          WHEN s.league_id = moa.league_id THEN 'CORRECT'
          WHEN s.league_id != moa.league_id THEN 'CORRUPTED'
          WHEN moa.league_id IS NULL THEN 'NULL_BET_LEAGUE'
          ELSE 'OTHER'
        END as data_integrity_status
        
      FROM simulations s
      LEFT JOIN leagues s_league ON s.league_id = s_league.id
      LEFT JOIN teams ht ON s.home_team_id = ht.id
      LEFT JOIN teams at ON s.away_team_id = at.id
      LEFT JOIN match_odds_analysis moa ON s.id = moa.simulation_id
      LEFT JOIN leagues bet_league ON moa.league_id = bet_league.id
      WHERE moa.actual_result IS NOT NULL
      ORDER BY s.id ASC
    `);
    console.log("6. SIMULATION VS BET CORRELATION ANALYSIS:", correlationResult.data);
    
    // 7. Settlement pattern analysis
    const settlementPatternsResult = db.executeQuery(`
      SELECT 
        recorded_at,
        simulation_id,
        league_id,
        market_type,
        actual_result,
        'Settlement Pattern Analysis' as note
      FROM match_odds_analysis 
      WHERE actual_result IS NOT NULL
      ORDER BY recorded_at ASC
    `);
    console.log("7. SETTLEMENT PATTERNS (CHRONOLOGICAL):", settlementPatternsResult.data);

    return NextResponse.json({
      investigation: "Comprehensive database audit completed",
      leagues: leaguesResult.data || [],
      simulations: simulationsResult.data || [],
      oddsAnalysis: oddsAnalysisResult.data || [],
      orphanedRecords: orphanedResult.data || [],
      denmarkLeagues: denmarkResult.data || [],
      correlationAnalysis: correlationResult.data || [],
      settlementPatterns: settlementPatternsResult.data || []
    });

  } catch (error) {
    console.error('Database diagnostic error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Database diagnostic failed',
      investigation: "Failed"
    }, { status: 500 });
  }
}