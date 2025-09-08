import { NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

// 🕵️ ORPHANED RECORDS INVESTIGATION
// Deep dive into the 5 orphaned match_odds_analysis records

export async function GET() {
  try {
    const db = getOptimizedDatabase();
    
    console.log("=== INVESTIGATING ORPHANED RECORDS ===");
    
    // 1. Get all orphaned records with detailed info
    const orphanedRecords = db.executeQuery(`
      SELECT 
        moa.*,
        'Orphaned Record Analysis' as investigation
      FROM match_odds_analysis moa
      WHERE moa.simulation_id IS NULL AND moa.league_id IS NULL
      ORDER BY moa.recorded_at ASC
    `);
    
    console.log("1. ORPHANED RECORDS:", orphanedRecords.data);
    
    // 2. Look for matching bets in user_bet_selections by bet_id
    const betConnections = [];
    if (orphanedRecords.success && orphanedRecords.data) {
      for (const record of orphanedRecords.data) {
        const betResult = db.executeQuery(`
          SELECT 
            ubs.*,
            l.name as league_name
          FROM user_bet_selections ubs
          LEFT JOIN leagues l ON ubs.league_id = l.id
          WHERE ubs.id = ?
        `, [record.bet_id]);
        
        if (betResult.success && betResult.data.length > 0) {
          betConnections.push({
            analysis_record: record,
            bet_record: betResult.data[0]
          });
        }
      }
    }
    
    console.log("2. BET CONNECTIONS FOUND:", betConnections.length);
    betConnections.forEach((conn, i) => {
      console.log(`Connection ${i + 1}:`, {
        analysis_id: conn.analysis_record.id,
        bet_id: conn.bet_record.id,
        simulation_id: conn.bet_record.simulation_id,
        league_id: conn.bet_record.league_id,
        league_name: conn.bet_record.league_name,
        market_type: conn.analysis_record.market_type,
        recorded_at: conn.analysis_record.recorded_at
      });
    });
    
    // 3. Check if simulations exist for these bet records
    const simulationConnections = [];
    for (const conn of betConnections) {
      if (conn.bet_record.simulation_id) {
        const simResult = db.executeQuery(`
          SELECT 
            s.*,
            l.name as league_name,
            ht.name as home_team,
            at.name as away_team
          FROM simulations s
          LEFT JOIN leagues l ON s.league_id = l.id
          LEFT JOIN teams ht ON s.home_team_id = ht.id
          LEFT JOIN teams at ON s.away_team_id = at.id
          WHERE s.id = ?
        `, [conn.bet_record.simulation_id]);
        
        if (simResult.success && simResult.data.length > 0) {
          simulationConnections.push({
            ...conn,
            simulation_record: simResult.data[0]
          });
        }
      }
    }
    
    console.log("3. SIMULATION CONNECTIONS:", simulationConnections.length);
    simulationConnections.forEach((conn, i) => {
      console.log(`Simulation ${i + 1}:`, {
        analysis_id: conn.analysis_record.id,
        simulation_id: conn.simulation_record.id,
        correct_league_id: conn.simulation_record.league_id,
        correct_league_name: conn.simulation_record.league_name,
        teams: `${conn.simulation_record.home_team} vs ${conn.simulation_record.away_team}`,
        bet_league_id: conn.bet_record.league_id,
        bet_league_name: conn.bet_record.league_name
      });
    });
    
    // 4. Timeline analysis - when were these orphaned records created?
    const timelineAnalysis = db.executeQuery(`
      SELECT 
        DATE(recorded_at) as settlement_date,
        COUNT(*) as records_count,
        GROUP_CONCAT(id) as analysis_ids,
        'Timeline Analysis' as investigation
      FROM match_odds_analysis 
      WHERE simulation_id IS NULL AND league_id IS NULL
      GROUP BY DATE(recorded_at)
      ORDER BY settlement_date ASC
    `);
    
    console.log("4. TIMELINE ANALYSIS:", timelineAnalysis.data);
    
    return NextResponse.json({
      investigation: "Orphaned records investigation completed",
      orphaned_records: orphanedRecords.data || [],
      bet_connections: betConnections,
      simulation_connections: simulationConnections,
      timeline_analysis: timelineAnalysis.data || [],
      summary: {
        total_orphaned: orphanedRecords.data?.length || 0,
        recoverable_connections: simulationConnections.length,
        recovery_possible: simulationConnections.length > 0
      }
    });

  } catch (error) {
    console.error('Orphaned records investigation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Investigation failed' 
    }, { status: 500 });
  }
}