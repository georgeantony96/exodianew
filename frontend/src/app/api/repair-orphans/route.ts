import { NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

// 🔧 ORPHANED RECORDS REPAIR UTILITY
// Restores proper simulation_id and league_id references for orphaned match_odds_analysis records

export async function POST() {
  try {
    const db = getOptimizedDatabase();
    
    console.log("=== ORPHANED RECORDS REPAIR ===" );
    
    // Get orphaned records with their bet connections and correct league from simulation
    const orphanedWithBets = db.executeQuery(`
      SELECT 
        moa.id as analysis_id,
        moa.bet_id,
        moa.market_type,
        moa.recorded_at,
        ubs.simulation_id as correct_simulation_id,
        s.league_id as correct_league_id,
        l.name as correct_league_name
      FROM match_odds_analysis moa
      LEFT JOIN user_bet_selections ubs ON moa.bet_id = ubs.id
      LEFT JOIN simulations s ON ubs.simulation_id = s.id
      LEFT JOIN leagues l ON s.league_id = l.id
      WHERE moa.simulation_id IS NULL 
        AND moa.league_id IS NULL
        AND ubs.simulation_id IS NOT NULL
        AND s.league_id IS NOT NULL
      ORDER BY moa.id ASC
    `);
    
    if (!orphanedWithBets.success) {
      throw new Error('Failed to query orphaned records');
    }
    
    const recordsToRepair = orphanedWithBets.data || [];
    console.log(`🔍 Found ${recordsToRepair.length} repairable orphaned records`);
    
    if (recordsToRepair.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No repairable orphaned records found",
        repaired_count: 0
      });
    }
    
    // Show what we're about to repair
    recordsToRepair.forEach(record => {
      console.log(`🔧 Analysis ID ${record.analysis_id}: Bet ${record.bet_id} → Simulation ${record.correct_simulation_id}, ${record.correct_league_name} (${record.correct_league_id})`);
    });
    
    // Repair each orphaned record
    let repaired_count = 0;
    const repair_log = [];
    
    for (const record of recordsToRepair) {
      try {
        const updateResult = db.executeQuery(`
          UPDATE match_odds_analysis 
          SET simulation_id = ?, league_id = ?
          WHERE id = ?
        `, [record.correct_simulation_id, record.correct_league_id, record.analysis_id]);
        
        if (updateResult.success) {
          repaired_count++;
          const repair_entry = {
            analysis_id: record.analysis_id,
            bet_id: record.bet_id,
            restored_simulation_id: record.correct_simulation_id,
            restored_league_id: record.correct_league_id,
            restored_league_name: record.correct_league_name,
            market_type: record.market_type,
            recorded_at: record.recorded_at
          };
          repair_log.push(repair_entry);
          console.log(`✅ Repaired analysis ID ${record.analysis_id}: Restored simulation ${record.correct_simulation_id} and league ${record.correct_league_name}`);
        } else {
          console.error(`❌ Failed to repair analysis ID ${record.analysis_id}:`, updateResult.error);
        }
      } catch (error) {
        console.error(`❌ Error repairing analysis ID ${record.analysis_id}:`, error);
      }
    }
    
    // Verify the repair
    const verificationResult = db.executeQuery(`
      SELECT COUNT(*) as remaining_orphaned
      FROM match_odds_analysis 
      WHERE simulation_id IS NULL AND league_id IS NULL
    `);
    
    const remaining_orphaned = verificationResult.success ? verificationResult.data[0].remaining_orphaned : 'UNKNOWN';
    
    // Check if any records still show as "Manual Bet Entry" in analytics
    const manualEntryCheck = db.executeQuery(`
      SELECT 
        COUNT(*) as manual_entries,
        GROUP_CONCAT(moa.id) as analysis_ids
      FROM match_odds_analysis moa
      LEFT JOIN simulations s ON moa.simulation_id = s.id
      LEFT JOIN leagues l ON moa.league_id = l.id  
      WHERE moa.actual_result IS NOT NULL
        AND (s.id IS NULL OR l.id IS NULL)
    `);
    
    const manual_entries = manualEntryCheck.success ? manualEntryCheck.data[0].manual_entries : 'UNKNOWN';
    
    console.log("=== ORPHAN REPAIR COMPLETED ===");
    console.log(`✅ Repaired: ${repaired_count} records`);
    console.log(`⚠️ Remaining orphaned: ${remaining_orphaned}`);
    console.log(`📊 Manual entries still showing: ${manual_entries}`);
    
    return NextResponse.json({
      success: true,
      message: `Orphaned records repair completed`,
      repaired_count,
      remaining_orphaned,
      manual_entries_remaining: manual_entries,
      repair_log,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Orphaned records repair error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Orphaned records repair failed' 
    }, { status: 500 });
  }
}