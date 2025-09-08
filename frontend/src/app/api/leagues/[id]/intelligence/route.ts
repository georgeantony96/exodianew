import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

// GET /api/leagues/[id]/intelligence - Get intelligence data for a specific league
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getOptimizedDatabase();
    const leagueId = parseInt(params.id);
    
    if (!leagueId || isNaN(leagueId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid league ID' },
        { status: 400 }
      );
    }
    
    // Get league intelligence summary
    const result = db.executeQuery(`
      SELECT 
        lmi.market_type,
        lmi.market_option,
        lmi.odds_avg,
        lmi.odds_count,
        lmi.opportunity_frequency,
        lmi.hit_rate,
        lmi.avg_edge_when_value,
        lmi.market_efficiency,
        lmi.total_profit_loss,
        l.name as league_name,
        l.country
      FROM league_market_intelligence lmi
      JOIN leagues l ON lmi.league_id = l.id
      WHERE lmi.league_id = ? AND lmi.odds_count > 0
      ORDER BY lmi.opportunity_frequency DESC, lmi.avg_edge_when_value DESC
    `, [leagueId]);
    
    if (!result.success) {
      throw new Error('Failed to fetch league intelligence');
    }
    
    const intelligence = result.data;
    
    // Calculate overall league statistics
    const stats = {
      total_markets_tracked: intelligence.length,
      total_opportunities: intelligence.reduce((sum: number, item: any) => sum + (item.value_opportunities || 0), 0),
      avg_opportunity_frequency: intelligence.length > 0 
        ? intelligence.reduce((sum: number, item: any) => sum + item.opportunity_frequency, 0) / intelligence.length 
        : 0,
      best_market: intelligence.length > 0 ? intelligence[0] : null,
      total_profit_loss: intelligence.reduce((sum: number, item: any) => sum + (item.total_profit_loss || 0), 0)
    };
    
    return NextResponse.json({
      success: true,
      intelligence: intelligence,
      league_stats: stats,
      league_name: intelligence[0]?.league_name || 'Unknown League',
      country: intelligence[0]?.country || 'Unknown Country'
    });
    
  } catch (error) {
    console.error('Error fetching league intelligence:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch league intelligence' },
      { status: 500 }
    );
  }
}