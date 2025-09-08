import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';

interface ActualResultRequest {
  simulation_id: number;
  home_score_ht: number;
  away_score_ht: number;
  home_score_ft: number;
  away_score_ft: number;
  match_identifier: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ActualResultRequest = await request.json();
    
    console.log('📝 Inputting actual result:', {
      simulation_id: data.simulation_id,
      score_ht: `${data.home_score_ht}-${data.away_score_ht}`,
      score_ft: `${data.home_score_ft}-${data.away_score_ft}`,
      match: data.match_identifier
    });

    // Validate input
    if (!data.simulation_id || typeof data.home_score_ft !== 'number' || typeof data.away_score_ft !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: simulation_id, home_score_ft, away_score_ft' },
        { status: 400 }
      );
    }

    const db = new Database('./exodia.db');
    
    try {
      // Generate rich fingerprint for actual result
      const actualResult = generateRichFingerprint(
        data.home_score_ht,
        data.away_score_ht,
        data.home_score_ft,
        data.away_score_ft
      );

      console.log('🧬 Generated fingerprint:', actualResult.rich_fingerprint_combined);

      // Store in match_results table
      const resultId = db.prepare(`
        INSERT INTO match_results (
          simulation_id,
          home_score_ht,
          away_score_ht,
          home_score_ft,
          away_score_ft,
          accuracy_metrics
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        data.simulation_id,
        data.home_score_ht,
        data.away_score_ht,
        data.home_score_ft,
        data.away_score_ft,
        JSON.stringify({
          rich_fingerprint: actualResult.rich_fingerprint_combined,
          result_ft: actualResult.result_ft,
          btts_ft: actualResult.btts_ft,
          total_goals: actualResult.total_goals_ft,
          over_2_5_ft: actualResult.over_2_5_ft,
          match_identifier: data.match_identifier,
          input_method: 'ui_form'
        })
      );

      console.log('✅ Match result stored with ID:', resultId.lastInsertRowid);

      // Store pattern learning outcomes for key markets
      const learningInserts = [
        {
          market: 'match_result',
          predicted: 0.333, // Baseline assumption
          actual: actualResult.result_ft === 'W' ? 1.0 : (actualResult.result_ft === 'D' ? 0.5 : 0.0)
        },
        {
          market: 'over_2_5_goals',
          predicted: 0.50,
          actual: actualResult.over_2_5_ft ? 1.0 : 0.0
        },
        {
          market: 'over_3_5_goals',
          predicted: 0.33, // Will be replaced by real pattern engine predictions
          actual: actualResult.total_goals_ft > 3.5 ? 1.0 : 0.0
        },
        {
          market: 'over_4_5_goals',
          predicted: 0.20, // Baseline ~20% for very high scoring
          actual: actualResult.total_goals_ft > 4.5 ? 1.0 : 0.0
        },
        {
          market: 'both_teams_score',
          predicted: 0.55,
          actual: actualResult.btts_ft === 'gg' ? 1.0 : 0.0
        }
      ];

      const learningIds = [];
      for (const learning of learningInserts) {
        const learningId = db.prepare(`
          INSERT INTO pattern_learning_outcomes (
            pattern_fingerprint,
            market_type,
            predicted_outcome,
            actual_outcome,
            confidence_level,
            simulation_id
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          actualResult.rich_fingerprint_combined,
          learning.market,
          learning.predicted,
          learning.actual,
          0.75, // Medium confidence baseline
          data.simulation_id
        );
        learningIds.push(learningId.lastInsertRowid);
      }

      console.log('✅ Learning outcomes stored with IDs:', learningIds);

      return NextResponse.json({
        success: true,
        result_id: resultId.lastInsertRowid,
        learning_ids: learningIds,
        rich_fingerprint: actualResult.rich_fingerprint_combined,
        message: 'Actual result stored successfully for pattern learning'
      }, { status: 200 });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('❌ Error inputting actual result:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to input actual result',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Generate rich fingerprint for actual match result
 * Matches the same format as the pattern generation system
 */
function generateRichFingerprint(
  home_score_ht: number,
  away_score_ht: number,
  home_score_ft: number,
  away_score_ft: number
) {
  // Half-time analysis
  const result_ht = home_score_ht > away_score_ht ? 'W' : 
                    home_score_ht < away_score_ht ? 'L' : 'D';
  const btts_ht = home_score_ht > 0 && away_score_ht > 0 ? 'gg' : 'ng';
  const total_goals_ht = home_score_ht + away_score_ht;
  const over_1_5_ht = total_goals_ht > 1.5;

  // Full-time analysis  
  const result_ft = home_score_ft > away_score_ft ? 'W' :
                    home_score_ft < away_score_ft ? 'L' : 'D';
  const btts_ft = home_score_ft > 0 && away_score_ft > 0 ? 'gg' : 'ng';
  const total_goals_ft = home_score_ft + away_score_ft;
  const over_2_5_ft = total_goals_ft > 2.5;
  const goal_margin = Math.abs(home_score_ft - away_score_ft);
  const second_half_goals = (home_score_ft - home_score_ht) + (away_score_ft - away_score_ht);

  // Generate rich fingerprint
  const rich_fingerprint_combined = 
    `${result_ht}(${home_score_ht}-${away_score_ht},${btts_ht},${over_1_5_ht ? 'o' : 'u'}1.5)→` +
    `${result_ft}(${home_score_ft}-${away_score_ft},${btts_ft},${over_2_5_ft ? 'o' : 'u'}2.5,m${goal_margin},2h${second_half_goals})`;

  return {
    result_ht,
    result_ft,
    btts_ht,
    btts_ft,
    total_goals_ht,
    total_goals_ft,
    over_1_5_ht,
    over_2_5_ft,
    goal_margin,
    second_half_goals,
    rich_fingerprint_combined
  };
}