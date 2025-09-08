import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

// GET /api/intelligence - Get league market intelligence data
export async function GET(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('league_id');
    const minOddsCount = parseInt(searchParams.get('min_odds_count') || '5');
    
    if (leagueId) {
      // Get intelligence for specific league
      const result = db.executeQuery(`
        SELECT 
          lmi.*,
          l.name as league_name,
          l.country
        FROM league_market_intelligence lmi
        JOIN leagues l ON lmi.league_id = l.id
        WHERE lmi.league_id = ? AND lmi.odds_count >= ?
        ORDER BY lmi.opportunity_frequency DESC, lmi.odds_avg DESC
      `, [leagueId, minOddsCount]);
      
      if (!result.success) {
        throw new Error('Failed to fetch league intelligence');
      }
      
      const intelligence = result.data;
      
      return NextResponse.json({
        success: true,
        league_intelligence: intelligence
      });
    } else {
      // Get opportunities across all leagues (Argentina-style discoveries)
      const result = db.executeQuery(`
        SELECT 
          l.name as league_name,
          l.country,
          lmi.market_type,
          lmi.market_option,
          lmi.odds_avg,
          lmi.odds_count,
          lmi.opportunity_frequency,
          lmi.market_efficiency,
          lmi.hit_rate,
          lmi.avg_edge_when_value,
          CASE 
            WHEN lmi.opportunity_frequency > 0.6 THEN 'HIGH VALUE'
            WHEN lmi.opportunity_frequency > 0.4 THEN 'MEDIUM VALUE'  
            WHEN lmi.opportunity_frequency > 0.2 THEN 'LOW VALUE'
            ELSE 'AVOID'
          END as value_rating
        FROM leagues l
        JOIN league_market_intelligence lmi ON l.id = lmi.league_id
        WHERE lmi.odds_count >= ?
        ORDER BY lmi.opportunity_frequency DESC, lmi.avg_edge_when_value DESC
        LIMIT 50
      `, [minOddsCount]);
      
      if (!result.success) {
        throw new Error('Failed to fetch value opportunities');
      }
      
      const opportunities = result.data;
      
      return NextResponse.json({
        success: true,
        value_opportunities: opportunities
      });
    }
  } catch (error) {
    console.error('Error fetching intelligence data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch intelligence data' },
      { status: 500 }
    );
  }
}

// POST /api/intelligence/update-result - Update intelligence when match results come in
export async function POST(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    const { simulation_id, actual_results } = await request.json();
    
    if (!simulation_id || !actual_results) {
      return NextResponse.json(
        { success: false, error: 'Simulation ID and actual results are required' },
        { status: 400 }
      );
    }
    
    // Get all odds analysis records for this simulation
    const result = db.executeQuery(`
      SELECT * FROM match_odds_analysis WHERE simulation_id = ?
    `, [simulation_id]);
    
    if (!result.success) {
      throw new Error('Failed to fetch odds analysis');
    }
    
    const oddsAnalysis = result.data;
    
    // Update each record with actual result
    for (const analysis of oddsAnalysis) {
      const marketKey = `${analysis.market_type}_${analysis.market_option}`;
      const actualResult = actual_results[marketKey];
      
      if (actualResult !== undefined) {
        const hit = actualResult === true;
        const edge = hit ? (analysis.input_odds - 1) : -1;
        
        // Update the analysis record
        const updateResult = db.executeQuery(`
          UPDATE match_odds_analysis 
          SET 
            actual_result = ?,
            edge_realized = ?,
            result_confirmed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [hit, edge, analysis.id]);
        
        if (!updateResult.success) {
          console.error('Failed to update analysis record:', updateResult.error);
          continue;
        }
        
        // Update league intelligence hit rate and edge
        const intelligenceResult = db.executeQuery(`
          UPDATE league_market_intelligence
          SET 
            value_opportunities = value_opportunities + CASE WHEN ? > 0 THEN 1 ELSE 0 END,
            avg_edge_when_value = (
              CASE 
                WHEN value_opportunities > 0 THEN 
                  (avg_edge_when_value * value_opportunities + ?) / (value_opportunities + 1)
                ELSE ? 
              END
            ),
            hit_rate = (
              CASE 
                WHEN odds_count > 0 THEN
                  (hit_rate * odds_count + CASE WHEN ? THEN 1.0 ELSE 0.0 END) / odds_count
                ELSE CASE WHEN ? THEN 1.0 ELSE 0.0 END
              END
            ),
            total_profit_loss = total_profit_loss + ?,
            opportunity_frequency = CASE 
              WHEN odds_count > 10 THEN
                LEAST(1.0, value_opportunities * 1.0 / odds_count)
              ELSE opportunity_frequency
            END,
            last_updated = CURRENT_TIMESTAMP
          WHERE league_id = ? AND market_type = ? AND market_option = ?
        `, [
          edge, edge, edge, hit, hit, edge,
          analysis.league_id, analysis.market_type, analysis.market_option
        ]);
        
        if (!intelligenceResult.success) {
          console.error('Failed to update league intelligence:', intelligenceResult.error);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Intelligence updated with match results',
      updated_records: oddsAnalysis.length
    });
    
  } catch (error) {
    console.error('Error updating intelligence with results:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update intelligence' },
      { status: 500 }
    );
  }
}

// PUT /api/intelligence - Manually trigger intelligence update from bet settlement
export async function PUT(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    const { analysis_id } = await request.json();
    
    if (!analysis_id) {
      return NextResponse.json(
        { success: false, error: 'Analysis ID is required' },
        { status: 400 }
      );
    }
    
    // Get the analysis record
    const result = db.executeQuery(`
      SELECT * FROM match_odds_analysis WHERE id = ?
    `, [analysis_id]);
    
    if (!result.success) {
      throw new Error('Failed to fetch analysis record');
    }
    
    const analysis = result.data;
    
    if (analysis.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Analysis record not found' },
        { status: 404 }
      );
    }
    
    const record = analysis[0];
    const hit = record.actual_result === 1;
    const pushed = record.actual_result === 'push';
    
    // Calculate realized edge based on CLV and actual result
    let realizedEdge = 0;
    if (pushed) {
      // Push - no edge realized, neutral outcome
      realizedEdge = 0;
    } else if (record.closing_odds && record.clv_percentage) {
      // Factor in CLV - positive CLV suggests we got better odds than closing
      const clvFactor = 1 + (record.clv_percentage / 100);
      realizedEdge = hit ? (record.selected_odds * clvFactor - 1) : -1;
    } else {
      realizedEdge = hit ? (record.selected_odds - 1) : -1;
    }
    
    // Simplified intelligence update - just update basic metrics for now
    const intelligenceUpdateResult = db.executeQuery(`
      INSERT OR REPLACE INTO league_market_intelligence (
        league_id, market_type, market_option, 
        odds_count, value_opportunities, avg_edge_when_value, 
        hit_rate, total_profit_loss, last_updated
      ) VALUES (?, ?, ?, 
        COALESCE((SELECT odds_count FROM league_market_intelligence 
                  WHERE league_id = ? AND market_type = ? AND market_option = ?), 0) + 1,
        COALESCE((SELECT value_opportunities FROM league_market_intelligence 
                  WHERE league_id = ? AND market_type = ? AND market_option = ?), 0) + ?,
        ?,
        ?,
        COALESCE((SELECT total_profit_loss FROM league_market_intelligence 
                  WHERE league_id = ? AND market_type = ? AND market_option = ?), 0) + ?,
        CURRENT_TIMESTAMP
      )
    `, [
      record.league_id, record.market_type, record.market_option,
      record.league_id, record.market_type, record.market_option,
      record.league_id, record.market_type, record.market_option, 
      realizedEdge > 0 ? 1 : 0,
      realizedEdge,
      hit ? 1.0 : 0.0,
      record.league_id, record.market_type, record.market_option, realizedEdge
    ]);
    
    if (!intelligenceUpdateResult.success) {
      console.error('Failed to update league intelligence:', intelligenceUpdateResult.error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Intelligence updated with bet settlement data',
      learning_data: {
        league_id: record.league_id,
        market: `${record.market_type}_${record.market_option}`,
        hit: hit,
        realized_edge: realizedEdge,
        clv_percentage: record.clv_percentage,
        closing_odds_available: !!record.closing_odds
      }
    });
    
  } catch (error) {
    console.error('Error updating intelligence manually:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update intelligence' },
      { status: 500 }
    );
  }
}