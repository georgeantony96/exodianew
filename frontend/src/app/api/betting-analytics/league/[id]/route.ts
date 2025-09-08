import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const leagueId = parseInt(resolvedParams.id);
    
    if (isNaN(leagueId)) {
      return NextResponse.json({ error: 'Invalid league ID' }, { status: 400 });
    }

    const db = getOptimizedDatabase();

    // Get league name
    const leagueResult = db.executeQuery(`
      SELECT name FROM leagues WHERE id = ?
    `, [leagueId]);
    
    const leagueName = leagueResult.success && leagueResult.data.length > 0 
      ? leagueResult.data[0].name 
      : 'Unknown League';

    // Get overall stats for this league
    const overallStatsResult = db.executeQuery(`
      SELECT 
        COUNT(*) as total_bets,
        SUM(CASE WHEN actual_result = 1 THEN 1 ELSE 0 END) as won_bets,
        SUM(CASE WHEN actual_result = 0 THEN 1 ELSE 0 END) as lost_bets,
        SUM(CASE WHEN actual_result = 0.5 THEN 1 ELSE 0 END) as pushed_bets,
        SUM(profit_loss) as total_profit_loss,
        ROUND(
          CASE 
            WHEN SUM(CASE WHEN actual_result = 1 THEN 1 ELSE 0 END) + SUM(CASE WHEN actual_result = 0 THEN 1 ELSE 0 END) = 0 
            THEN 0 
            ELSE (SUM(CASE WHEN actual_result = 1 THEN 1 ELSE 0 END) * 100.0) / 
                 (SUM(CASE WHEN actual_result = 1 THEN 1 ELSE 0 END) + SUM(CASE WHEN actual_result = 0 THEN 1 ELSE 0 END))
          END, 1
        ) as win_rate
      FROM match_odds_analysis 
      WHERE league_id = ? AND actual_result IS NOT NULL
    `, [leagueId]);

    const overallStats = overallStatsResult.success && overallStatsResult.data.length > 0 
      ? overallStatsResult.data[0] 
      : { total_bets: 0, won_bets: 0, lost_bets: 0, total_profit_loss: 0, win_rate: 0 };

    // Get bet type breakdown for this league (FIXED: Group by market_type AND market_option for granular analysis)
    const betTypeBreakdownResult = db.executeQuery(`
      SELECT 
        market_type,
        market_option,
        CASE 
          WHEN market_type = 'over_under' AND market_option = 'over' THEN 'Over/Under - Over'
          WHEN market_type = 'over_under' AND market_option = 'under' THEN 'Over/Under - Under'
          WHEN market_type = 'ou25' AND market_option = 'over' THEN 'Over/Under 2.5 - Over'
          WHEN market_type = 'ou25' AND market_option = 'under' THEN 'Over/Under 2.5 - Under'
          WHEN market_type = 'ou35' AND market_option = 'over' THEN 'Over/Under 3.5 - Over'
          WHEN market_type = 'ou35' AND market_option = 'under' THEN 'Over/Under 3.5 - Under'
          WHEN market_type = 'ou45' AND market_option = 'over' THEN 'Over/Under 4.5 - Over'
          WHEN market_type = 'ou45' AND market_option = 'under' THEN 'Over/Under 4.5 - Under'
          WHEN market_type = 'ou55' AND market_option = 'over' THEN 'Over/Under 5.5 - Over'
          WHEN market_type = 'ou55' AND market_option = 'under' THEN 'Over/Under 5.5 - Under'
          WHEN market_type = 'both_teams_score' AND market_option = 'yes' THEN 'BTTS - Yes'
          WHEN market_type = 'both_teams_score' AND market_option = 'no' THEN 'BTTS - No'
          WHEN market_type = 'btts' AND market_option = 'yes' THEN 'BTTS - Yes'
          WHEN market_type = 'btts' AND market_option = 'no' THEN 'BTTS - No'
          WHEN market_type = 'asian_handicap' AND market_option = 'home' THEN 'Asian Handicap - Home'
          WHEN market_type = 'asian_handicap' AND market_option = 'away' THEN 'Asian Handicap - Away'
          WHEN market_type = 'ah_minus1_plus1' AND market_option = 'minus1' THEN 'AH -1/+1 - Home (-1)'
          WHEN market_type = 'ah_minus1_plus1' AND market_option = 'plus1' THEN 'AH -1/+1 - Away (+1)'
          WHEN market_type = 'ah_plus1_minus1' AND market_option = 'plus1' THEN 'AH +1/-1 - Home (+1)'
          WHEN market_type = 'ah_plus1_minus1' AND market_option = 'minus1' THEN 'AH +1/-1 - Away (-1)'
          WHEN market_type = '1x2' AND market_option = 'home' THEN '1X2 - Home Win'
          WHEN market_type = '1x2' AND market_option = 'draw' THEN '1X2 - Draw'
          WHEN market_type = '1x2' AND market_option = 'away' THEN '1X2 - Away Win'
          WHEN market_type = 'double_chance' AND market_option = 'dc_1x' THEN 'Double Chance - 1X (Home or Draw)'
          WHEN market_type = 'double_chance' AND market_option = 'dc_12' THEN 'Double Chance - 12 (Home or Away)'
          WHEN market_type = 'double_chance' AND market_option = 'dc_x2' THEN 'Double Chance - X2 (Draw or Away)'
          ELSE UPPER(market_type || ' - ' || market_option)
        END as display_name,
        COUNT(*) as bets,
        SUM(CASE WHEN actual_result = 1 THEN 1 ELSE 0 END) as won,
        SUM(CASE WHEN actual_result = 0 THEN 1 ELSE 0 END) as lost,
        SUM(CASE WHEN actual_result = 0.5 THEN 1 ELSE 0 END) as pushed,
        SUM(profit_loss) as profit_loss,
        ROUND(
          CASE 
            WHEN SUM(CASE WHEN actual_result = 1 THEN 1 ELSE 0 END) + SUM(CASE WHEN actual_result = 0 THEN 1 ELSE 0 END) = 0 
            THEN 0 
            ELSE (SUM(CASE WHEN actual_result = 1 THEN 1 ELSE 0 END) * 100.0) / 
                 (SUM(CASE WHEN actual_result = 1 THEN 1 ELSE 0 END) + SUM(CASE WHEN actual_result = 0 THEN 1 ELSE 0 END))
          END, 1
        ) as win_rate
      FROM match_odds_analysis 
      WHERE league_id = ? AND actual_result IS NOT NULL
      GROUP BY market_type, market_option
      ORDER BY bets DESC
    `, [leagueId]);

    const betTypeBreakdown = betTypeBreakdownResult.success ? betTypeBreakdownResult.data : [];

    // Format response according to the specification in the TODO document
    const response = {
      league_name: leagueName,
      total_stats: {
        bets: overallStats.total_bets || 0,
        win_rate: overallStats.win_rate || 0,
        profit_loss: overallStats.total_profit_loss || 0
      },
      bet_type_breakdown: betTypeBreakdown.map(breakdown => ({
        market_type: breakdown.display_name || breakdown.market_type,
        bets: breakdown.bets,
        won: breakdown.won,
        lost: breakdown.lost,
        pushed: breakdown.pushed || 0,
        win_rate: breakdown.win_rate || 0,
        profit_loss: breakdown.profit_loss || 0
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching league analytics:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch league analytics' 
    }, { status: 500 });
  }
}