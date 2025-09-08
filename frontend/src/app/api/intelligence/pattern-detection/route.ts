import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

// GET /api/intelligence/pattern-detection - Discover Argentina O2.5 style patterns
export async function GET(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('league_id');
    const minDataPoints = parseInt(searchParams.get('min_data_points') || '10');
    
    if (!leagueId) {
      return NextResponse.json(
        { success: false, error: 'League ID is required' },
        { status: 400 }
      );
    }
    
    // Discover high-opportunity patterns (like Argentina O2.5)
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
        l.name as league_name,
        l.country,
        CASE 
          WHEN lmi.opportunity_frequency > 0.7 AND lmi.odds_count >= ? THEN 'HIGH'
          WHEN lmi.opportunity_frequency > 0.5 AND lmi.odds_count >= ? THEN 'MEDIUM'
          WHEN lmi.opportunity_frequency > 0.3 AND lmi.odds_count >= ? THEN 'LOW'
          ELSE 'INSUFFICIENT_DATA'
        END as pattern_strength,
        CASE 
          WHEN lmi.opportunity_frequency > 0.7 THEN 'CONSISTENTLY PROFITABLE - Strong betting opportunity'
          WHEN lmi.opportunity_frequency > 0.5 THEN 'FREQUENTLY PROFITABLE - Good value potential'
          WHEN lmi.opportunity_frequency > 0.3 THEN 'OCCASIONALLY PROFITABLE - Monitor for patterns'
          ELSE 'INSUFFICIENT DATA - Need more observations'
        END as pattern_description
      FROM league_market_intelligence lmi
      JOIN leagues l ON lmi.league_id = l.id
      WHERE lmi.league_id = ? 
        AND lmi.odds_count >= ?
      ORDER BY lmi.opportunity_frequency DESC, lmi.avg_edge_when_value DESC
    `, [minDataPoints, Math.max(5, minDataPoints/2), Math.max(3, minDataPoints/3), leagueId, minDataPoints]);
    
    if (!result.success) {
      throw new Error('Failed to fetch pattern detection data');
    }
    
    const patterns = result.data;
    
    // Group patterns by market type for better organization
    const groupedPatterns = patterns.reduce((acc: any, pattern: any) => {
      const marketKey = `${pattern.market_type}_${pattern.market_option}`;
      
      if (!acc[pattern.market_type]) {
        acc[pattern.market_type] = {
          market: pattern.market_type,
          data_points: 0,
          patterns: []
        };
      }
      
      acc[pattern.market_type].data_points += pattern.odds_count;
      acc[pattern.market_type].patterns.push({
        type: marketKey,
        description: `${pattern.league_name} ${pattern.market_type.toUpperCase()} ${pattern.market_option} - ${pattern.pattern_description}`,
        strength: pattern.pattern_strength,
        recommendation: generateRecommendation(pattern),
        discovered_at: new Date().toISOString(),
        avg_odds: pattern.odds_avg,
        opportunity_frequency: pattern.opportunity_frequency,
        hit_rate: pattern.hit_rate,
        avg_edge: pattern.avg_edge_when_value,
        market_efficiency: pattern.market_efficiency
      });
      
      return acc;
    }, {});
    
    return NextResponse.json({
      success: true,
      discovered_patterns: Object.values(groupedPatterns),
      league_name: patterns[0]?.league_name || 'Unknown League',
      total_patterns: patterns.length,
      high_value_patterns: patterns.filter((p: any) => p.pattern_strength === 'HIGH').length
    });
    
  } catch (error) {
    console.error('Error in pattern detection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to detect patterns' },
      { status: 500 }
    );
  }
}

function generateRecommendation(pattern: any): string {
  const marketType = pattern.market_type;
  const option = pattern.market_option;
  const freq = pattern.opportunity_frequency;
  const edge = pattern.avg_edge_when_value;
  const odds = pattern.odds_avg;
  
  if (freq > 0.7) {
    return `STRONG BET: ${marketType.toUpperCase()} ${option} consistently shows value (${(freq * 100).toFixed(0)}% frequency, avg ${edge?.toFixed(1)}% edge at ${odds?.toFixed(2)} odds)`;
  } else if (freq > 0.5) {
    return `GOOD VALUE: Monitor ${marketType.toUpperCase()} ${option} for opportunities (${(freq * 100).toFixed(0)}% frequency, avg ${edge?.toFixed(1)}% edge)`;
  } else if (freq > 0.3) {
    return `OCCASIONAL VALUE: Consider ${marketType.toUpperCase()} ${option} when other factors align (${(freq * 100).toFixed(0)}% frequency)`;
  } else {
    return `MONITOR: Insufficient data for ${marketType.toUpperCase()} ${option} - need more observations`;
  }
}