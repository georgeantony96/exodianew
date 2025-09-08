import { NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

// 🛠️ DATA REPAIR UTILITY
// Fixes corrupted league_id assignments in match_odds_analysis table

export async function POST() {
  try {
    const db = getOptimizedDatabase();
    
    console.log("=== STARTING DATA INTEGRITY REPAIR ===");
    
    // Get all corrupted records that have simulation_id but wrong league_id
    const corruptedRecords = db.executeQuery(`
      SELECT 
        moa.id as analysis_id,
        moa.simulation_id,
        moa.league_id as current_league_id,
        s.league_id as correct_league_id,
        s_league.name as correct_league_name,
        bet_league.name as current_league_name
      FROM match_odds_analysis moa
      LEFT JOIN simulations s ON moa.simulation_id = s.id
      LEFT JOIN leagues s_league ON s.league_id = s_league.id
      LEFT JOIN leagues bet_league ON moa.league_id = bet_league.id
      WHERE moa.simulation_id IS NOT NULL 
        AND s.id IS NOT NULL
        AND moa.league_id != s.league_id
      ORDER BY moa.id ASC
    `);
    
    if (!corruptedRecords.success) {
      throw new Error('Failed to query corrupted records');
    }
    
    const recordsToFix = corruptedRecords.data || [];
    console.log(`🔍 Found ${recordsToFix.length} corrupted records`);
    
    if (recordsToFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No corrupted records found",
        repaired_count: 0
      });
    }
    
    // Show what we're about to fix
    recordsToFix.forEach(record => {
      console.log(`🔧 Analysis ID ${record.analysis_id}: ${record.current_league_name || 'NULL'} (${record.current_league_id}) → ${record.correct_league_name} (${record.correct_league_id})`);
    });
    
    // Fix each corrupted record
    let repaired_count = 0;
    const repair_log = [];
    
    for (const record of recordsToFix) {
      try {
        const updateResult = db.executeQuery(`
          UPDATE match_odds_analysis 
          SET league_id = ?
          WHERE id = ?
        `, [record.correct_league_id, record.analysis_id]);
        
        if (updateResult.success) {
          repaired_count++;
          const repair_entry = {
            analysis_id: record.analysis_id,
            simulation_id: record.simulation_id,
            old_league: record.current_league_name || 'NULL',
            new_league: record.correct_league_name,
            old_league_id: record.current_league_id,
            new_league_id: record.correct_league_id
          };
          repair_log.push(repair_entry);
          console.log(`✅ Fixed analysis ID ${record.analysis_id}: ${repair_entry.old_league} → ${repair_entry.new_league}`);
        } else {
          console.error(`❌ Failed to fix analysis ID ${record.analysis_id}:`, updateResult.error);
        }
      } catch (error) {
        console.error(`❌ Error fixing analysis ID ${record.analysis_id}:`, error);
      }
    }
    
    // Verify the repair
    const verificationResult = db.executeQuery(`
      SELECT 
        COUNT(*) as remaining_corrupted
      FROM match_odds_analysis moa
      LEFT JOIN simulations s ON moa.simulation_id = s.id
      WHERE moa.simulation_id IS NOT NULL 
        AND s.id IS NOT NULL
        AND moa.league_id != s.league_id
    `);
    
    const remaining_corrupted = verificationResult.success ? verificationResult.data[0].remaining_corrupted : 'UNKNOWN';
    
    console.log("=== REPAIR COMPLETED ===");
    console.log(`✅ Repaired: ${repaired_count} records`);
    console.log(`⚠️ Remaining corrupted: ${remaining_corrupted}`);
    
    return NextResponse.json({
      success: true,
      message: `Data integrity repair completed`,
      repaired_count,
      remaining_corrupted,
      repair_log,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Data repair error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Data repair failed' 
    }, { status: 500 });
  }
}