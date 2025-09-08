import { NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

export async function GET() {
  try {
    const db = getOptimizedDatabase();
    
    // 1. Overall Statistics (FIXED: Use user_bet_selections table for accurate data)
    const overallStatsResult = db.executeQuery(`
      SELECT 
        COUNT(*) as total_bets,
        SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) as won_bets,
        SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END) as lost_bets,
        SUM(CASE WHEN bet_status = 'pushed' THEN 1 ELSE 0 END) as pushed_bets,
        SUM(profit_loss) as total_profit_loss,
        AVG(edge_percentage) as avg_edge,
        COUNT(DISTINCT simulation_id) as total_matches
      FROM user_bet_selections 
      WHERE bet_status IN ('won', 'lost', 'pushed')
    `);
    const overallStats = overallStatsResult.success ? overallStatsResult.data[0] : {};

    // 2. Bet Type Performance (FIXED: Use user_bet_selections table for accurate pushed bet tracking)
    const betTypeStatsResult = db.executeQuery(`
      SELECT 
        market_type,
        market_option,
        CASE 
          -- Full Time Markets
          WHEN market_type = '1x2_ft' AND market_option = 'home' THEN '1X2 - Home Win'
          WHEN market_type = '1x2_ft' AND market_option = 'draw' THEN '1X2 - Draw'
          WHEN market_type = '1x2_ft' AND market_option = 'away' THEN '1X2 - Away Win'
          WHEN market_type = 'over_under_25' AND market_option = 'over' THEN 'Over/Under 2.5 - Over'
          WHEN market_type = 'over_under_25' AND market_option = 'under' THEN 'Over/Under 2.5 - Under'
          WHEN market_type = 'over_under_3' AND market_option = 'over' THEN 'Over/Under 3.0 - Over'
          WHEN market_type = 'over_under_3' AND market_option = 'under' THEN 'Over/Under 3.0 - Under'
          WHEN market_type = 'over_under_35' AND market_option = 'over' THEN 'Over/Under 3.5 - Over'
          WHEN market_type = 'over_under_35' AND market_option = 'under' THEN 'Over/Under 3.5 - Under'
          WHEN market_type = 'gg_ng' AND market_option = 'gg' THEN 'Both Teams to Score - Yes (GG)'
          WHEN market_type = 'gg_ng' AND market_option = 'ng' THEN 'Both Teams to Score - No (NG)'
          WHEN market_type = 'double_chance' AND market_option = '1x' THEN 'Double Chance - 1X (Home or Draw)'
          WHEN market_type = 'double_chance' AND market_option = '12' THEN 'Double Chance - 12 (Home or Away)'
          WHEN market_type = 'double_chance' AND market_option = '2x' THEN 'Double Chance - 2X (Away or Draw)'
          WHEN market_type = 'asian_handicap_0' AND market_option = 'home' THEN 'AH+0 - Home +0'
          WHEN market_type = 'asian_handicap_0' AND market_option = 'away' THEN 'AH+0 - Away +0'
          WHEN market_type = 'asian_handicap_minus1_plus1' AND market_option = 'home' THEN 'AH -1/+1 - Home -1'
          WHEN market_type = 'asian_handicap_minus1_plus1' AND market_option = 'away' THEN 'AH -1/+1 - Away +1'
          WHEN market_type = 'asian_handicap_plus1_minus1' AND market_option = 'home' THEN 'AH +1/-1 - Home +1'
          WHEN market_type = 'asian_handicap_plus1_minus1' AND market_option = 'away' THEN 'AH +1/-1 - Away -1'
          
          -- Half Time Markets
          WHEN market_type = '1x2_ht' AND market_option = 'home' THEN '1X2 HT - Home Win'
          WHEN market_type = '1x2_ht' AND market_option = 'draw' THEN '1X2 HT - Draw'
          WHEN market_type = '1x2_ht' AND market_option = 'away' THEN '1X2 HT - Away Win'
          WHEN market_type = 'asian_handicap_0_ht' AND market_option = 'home' THEN 'AH+0 HT - Home +0'
          WHEN market_type = 'asian_handicap_0_ht' AND market_option = 'away' THEN 'AH+0 HT - Away +0'
          WHEN market_type = 'over_under_15_ht' AND market_option = 'over' THEN 'O/U 1.5 HT - Over'
          WHEN market_type = 'over_under_15_ht' AND market_option = 'under' THEN 'O/U 1.5 HT - Under'
          
          -- Legacy Market Support
          WHEN market_type = 'over_under' AND market_option = 'over' THEN 'Over/Under - Over'
          WHEN market_type = 'over_under' AND market_option = 'under' THEN 'Over/Under - Under'
          WHEN market_type = 'ou25' AND market_option = 'over' THEN 'Over/Under 2.5 - Over'
          WHEN market_type = 'ou25' AND market_option = 'under' THEN 'Over/Under 2.5 - Under'
          WHEN market_type = 'ou30' AND market_option = 'over' THEN 'Over/Under 3.0 - Over'
          WHEN market_type = 'ou30' AND market_option = 'under' THEN 'Over/Under 3.0 - Under'
          WHEN market_type = 'ou35' AND market_option = 'over' THEN 'Over/Under 3.5 - Over'
          WHEN market_type = 'ou35' AND market_option = 'under' THEN 'Over/Under 3.5 - Under'
          WHEN market_type = 'ou15' AND market_option = 'over' THEN 'Over/Under 1.5 - Over'
          WHEN market_type = 'ou15' AND market_option = 'under' THEN 'Over/Under 1.5 - Under'
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
          WHEN market_type = 'first_half_gg' AND market_option = 'yes' THEN '1H BTTS - Yes (GG 1H)'
          WHEN market_type = 'first_half_gg' AND market_option = 'no' THEN '1H BTTS - No (NG 1H)'
          WHEN market_type = 'first_half_ou15' AND market_option = 'over' THEN '1H O/U 1.5 - Over'
          WHEN market_type = 'first_half_ou15' AND market_option = 'under' THEN '1H O/U 1.5 - Under'
          ELSE UPPER(market_type || ' - ' || market_option)
        END as display_name,
        COUNT(*) as total_bets,
        SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) as won_bets,
        SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END) as lost_bets,
        SUM(CASE WHEN bet_status = 'pushed' THEN 1 ELSE 0 END) as pushed_bets,
        SUM(profit_loss) as total_profit_loss,
        AVG(edge_percentage) as avg_edge,
        ROUND(
          CASE 
            WHEN SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) + SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END) = 0 
            THEN 0 
            ELSE (SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) * 100.0) / 
                 (SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) + SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END))
          END, 1
        ) as win_rate
      FROM user_bet_selections 
      WHERE bet_status IN ('won', 'lost', 'pushed')
      GROUP BY market_type, market_option
      ORDER BY total_bets DESC
    `);
    const betTypeStats = betTypeStatsResult.success ? betTypeStatsResult.data : [];

    // 3. League Performance
    const leagueStatsResult = db.executeQuery(`
      SELECT 
        CASE 
          WHEN l.name IS NOT NULL THEN l.name
          WHEN moa.league_id IS NULL THEN 'Manual Bet Entry'
          ELSE 'League Data Missing'
        END as league_name,
        moa.league_id,
        COUNT(*) as total_bets,
        SUM(CASE WHEN moa.actual_result = 1 THEN 1 ELSE 0 END) as won_bets,
        SUM(CASE WHEN moa.actual_result = 0 THEN 1 ELSE 0 END) as lost_bets,
        SUM(CASE WHEN moa.actual_result = 0.5 THEN 1 ELSE 0 END) as pushed_bets,
        SUM(moa.profit_loss) as total_profit_loss,
        AVG(moa.edge_percentage) as avg_edge,
        ROUND(AVG(CASE WHEN moa.actual_result = 1 THEN 100.0 ELSE 0.0 END), 1) as win_rate
      FROM match_odds_analysis moa
      LEFT JOIN leagues l ON moa.league_id = l.id
      WHERE moa.actual_result IS NOT NULL
      GROUP BY moa.league_id, l.name
      ORDER BY total_bets DESC
    `);
    const leagueStats = leagueStatsResult.success ? leagueStatsResult.data : [];

    // 4. Edge Analysis - Group bets by edge ranges (FIXED: Use user_bet_selections table)
    const edgeAnalysisResult = db.executeQuery(`
      SELECT 
        CASE 
          WHEN edge_percentage >= 50 THEN '50%+'
          WHEN edge_percentage >= 30 THEN '30-50%'
          WHEN edge_percentage >= 15 THEN '15-30%'
          WHEN edge_percentage >= 5 THEN '5-15%'
          ELSE '0-5%'
        END as edge_range,
        COUNT(*) as total_bets,
        SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) as won_bets,
        SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END) as lost_bets,
        SUM(CASE WHEN bet_status = 'pushed' THEN 1 ELSE 0 END) as pushed_bets,
        SUM(profit_loss) as total_profit_loss,
        ROUND(
          CASE 
            WHEN SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) + SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END) = 0 
            THEN 0 
            ELSE (SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) * 100.0) / 
                 (SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) + SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END))
          END, 1
        ) as win_rate
      FROM user_bet_selections 
      WHERE bet_status IN ('won', 'lost', 'pushed')
      GROUP BY 
        CASE 
          WHEN edge_percentage >= 50 THEN '50%+'
          WHEN edge_percentage >= 30 THEN '30-50%'
          WHEN edge_percentage >= 15 THEN '15-30%'
          WHEN edge_percentage >= 5 THEN '5-15%'
          ELSE '0-5%'
        END
      ORDER BY MIN(edge_percentage) DESC
    `);
    const edgeAnalysis = edgeAnalysisResult.success ? edgeAnalysisResult.data : [];

    // 5. Odds Range Analysis - Group bets by odds ranges (FIXED: Use user_bet_selections table)
    const oddsAnalysisResult = db.executeQuery(`
      SELECT 
        CASE 
          WHEN selected_odds >= 5.0 THEN '5.00+'
          WHEN selected_odds >= 3.0 THEN '3.00-4.99'
          WHEN selected_odds >= 2.0 THEN '2.00-2.99'
          WHEN selected_odds >= 1.5 THEN '1.50-1.99'
          WHEN selected_odds >= 1.0 THEN '1.00-1.49'
          ELSE 'N/A'
        END as odds_range,
        COUNT(*) as total_bets,
        SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) as won_bets,
        SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END) as lost_bets,
        SUM(CASE WHEN bet_status = 'pushed' THEN 1 ELSE 0 END) as pushed_bets,
        SUM(profit_loss) as total_profit_loss,
        ROUND(
          CASE 
            WHEN SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) + SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END) = 0 
            THEN 0 
            ELSE (SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) * 100.0) / 
                 (SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) + SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END))
          END, 1
        ) as win_rate,
        ROUND(AVG(selected_odds), 2) as avg_odds
      FROM user_bet_selections 
      WHERE bet_status IN ('won', 'lost', 'pushed') AND selected_odds > 0
      GROUP BY 
        CASE 
          WHEN selected_odds >= 5.0 THEN '5.00+'
          WHEN selected_odds >= 3.0 THEN '3.00-4.99'
          WHEN selected_odds >= 2.0 THEN '2.00-2.99'
          WHEN selected_odds >= 1.5 THEN '1.50-1.99'
          WHEN selected_odds >= 1.0 THEN '1.00-1.49'
          ELSE 'N/A'
        END
      ORDER BY AVG(selected_odds) ASC
    `);
    const oddsAnalysis = oddsAnalysisResult.success ? oddsAnalysisResult.data : [];

    // 6. Recent Bet History (FIXED: Use user_bet_selections table with proper joins)
    const recentBetsResult = db.executeQuery(`
      SELECT 
        ubs.*,
        ht.name as home_team_name,
        at.name as away_team_name,
        s.match_date,
        CASE 
          WHEN l.name IS NOT NULL THEN l.name
          ELSE 'Unknown League'
        END as league_name
      FROM user_bet_selections ubs
      LEFT JOIN simulations s ON ubs.simulation_id = s.id
      LEFT JOIN teams ht ON s.home_team_id = ht.id
      LEFT JOIN teams at ON s.away_team_id = at.id
      LEFT JOIN leagues l ON s.league_id = l.id
      WHERE ubs.bet_status IN ('won', 'lost', 'pushed')
      ORDER BY ubs.placed_at DESC
      LIMIT 20
    `);
    const recentBets = recentBetsResult.success ? recentBetsResult.data : [];

    // 7. Monthly Performance Trends (FIXED: Use user_bet_selections table)
    const monthlyTrendsResult = db.executeQuery(`
      SELECT 
        strftime('%Y-%m', placed_at) as month,
        COUNT(*) as total_bets,
        SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) as won_bets,
        SUM(profit_loss) as total_profit_loss,
        ROUND(
          CASE 
            WHEN SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) + SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END) = 0 
            THEN 0 
            ELSE (SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) * 100.0) / 
                 (SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) + SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END))
          END, 1
        ) as win_rate
      FROM user_bet_selections 
      WHERE bet_status IN ('won', 'lost', 'pushed')
      GROUP BY strftime('%Y-%m', placed_at)
      ORDER BY month ASC
    `);
    const monthlyTrends = monthlyTrendsResult.success ? monthlyTrendsResult.data : [];

    return NextResponse.json({
      overallStats,
      betTypeStats,
      leagueStats,
      edgeAnalysis,
      oddsAnalysis,
      recentBets,
      monthlyTrends
    });

  } catch (error) {
    console.error('Error fetching betting analytics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}