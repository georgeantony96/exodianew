import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';
import { detectValueBets, TrueOdds, BookmakerOdds } from '@/utils/calculations';

interface AccuracyMetrics {
  correct_predictions: number;
  total_predictions: number;
  accuracy_percentage: number;
  market_accuracy: {
    [market: string]: {
      correct: number;
      total: number;
      accuracy: number;
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    const { searchParams } = new URL(request.url);
    const simulationId = searchParams.get('simulation_id');

    if (!simulationId) {
      return NextResponse.json(
        { error: 'simulation_id is required' },
        { status: 400 }
      );
    }

    const result = db.executeQuery('SELECT * FROM match_results WHERE simulation_id = ?', [parseInt(simulationId)]);
    if (!result.success || result.data.length === 0) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.data[0]);
  } catch (error) {
    console.error('Error fetching match result:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match result' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const {
      simulation_id,
      home_score_ht,
      away_score_ht,
      home_score_ft,
      away_score_ft
    } = body;

    if (simulation_id === undefined || 
        home_score_ht === undefined || 
        away_score_ht === undefined || 
        home_score_ft === undefined || 
        away_score_ft === undefined) {
      return NextResponse.json(
        { error: 'All score fields are required' },
        { status: 400 }
      );
    }

    // Get the original simulation to calculate accuracy
    const db = getOptimizedDatabase();
    const simResult = db.executeQuery('SELECT * FROM simulations WHERE id = ?', [simulation_id]);
    if (!simResult.success || simResult.data.length === 0) {
      return NextResponse.json(
        { error: 'Simulation not found' },
        { status: 404 }
      );
    }
    const simulation = simResult.data[0];

    // Calculate accuracy metrics
    const accuracyMetrics = calculateAccuracy(
      simulation,
      { home_score_ht, away_score_ht, home_score_ft, away_score_ft }
    );

    // Check if result already exists for this simulation
    const existingResult = db.executeQuery('SELECT id FROM match_results WHERE simulation_id = ?', [simulation_id]);
    if (existingResult.success && existingResult.data.length > 0) {
      return NextResponse.json(
        { error: 'Match result already exists for this simulation' },
        { status: 409 }
      );
    }

    // Create match result using better-sqlite3
    const createResult = db.executeQuery(`
      INSERT INTO match_results (
        simulation_id, home_score_ht, away_score_ht, 
        home_score_ft, away_score_ft, accuracy_metrics, result_entered_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      simulation_id,
      home_score_ht,
      away_score_ht,
      home_score_ft,
      away_score_ft,
      JSON.stringify(accuracyMetrics)
    ]);

    if (!createResult.success) {
      console.error('Database insertion failed:', createResult.error);
      throw new Error(`Database insertion failed: ${createResult.error || 'Unknown error'}`);
    }

    // Get the created match result
    const newResult = db.executeQuery('SELECT * FROM match_results WHERE simulation_id = ? ORDER BY id DESC LIMIT 1', [simulation_id]);
    const matchResult = newResult.success ? newResult.data[0] : null;

    // Optional: Trigger intelligence update for simulation results (separate from bet settlement)
    // This is for when users input match results without necessarily having bets
    try {
      const actualResults: { [key: string]: boolean } = {};
      
      // Calculate actual results based on scores
      const homeWin = home_score_ft > away_score_ft;
      const draw = home_score_ft === away_score_ft;
      const awayWin = away_score_ft > home_score_ft;
      const totalGoals = home_score_ft + away_score_ft;
      const btts = home_score_ft > 0 && away_score_ft > 0;
      
      // Build results object
      actualResults['1x2_home'] = homeWin;
      actualResults['1x2_draw'] = draw;
      actualResults['1x2_away'] = awayWin;
      actualResults['over_under_over_25'] = totalGoals > 2.5;
      actualResults['over_under_under_25'] = totalGoals <= 2.5;
      actualResults['over_under_over_35'] = totalGoals > 3.5;
      actualResults['over_under_under_35'] = totalGoals <= 3.5;
      actualResults['over_under_over_45'] = totalGoals > 4.5;
      actualResults['over_under_under_45'] = totalGoals <= 4.5;
      actualResults['both_teams_score_yes'] = btts;
      actualResults['both_teams_score_no'] = !btts;

      // Asian Handicap results
      const goalDifference = home_score_ft - away_score_ft;
      
      // AH -1/+1: Home gives away 1 goal, Away gets 1 goal
      actualResults['ah_minus1_plus1_minus1'] = goalDifference > 1; // Home wins by 2+ goals
      actualResults['ah_minus1_plus1_plus1'] = goalDifference < 1;  // Away wins or loses by < 1 goal
      
      // AH +1/-1: Home gets 1 goal, Away gives away 1 goal  
      actualResults['ah_plus1_minus1_plus1'] = goalDifference > -1; // Home doesn't lose by 2+ goals
      actualResults['ah_plus1_minus1_minus1'] = goalDifference < -1; // Away wins by 2+ goals

      console.log('📊 Match result saved - manual settlement required for any pending bets');

      // Trigger intelligence update for simulation analysis (not bet-specific)
      const intelligenceResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          simulation_id: simulation_id,
          actual_results: actualResults 
        })
      });
      
      if (!intelligenceResponse.ok) {
        console.warn('Simulation intelligence update failed, but match result saved');
      }
    } catch (intelligenceError) {
      console.warn('Simulation intelligence update error:', intelligenceError);
      // Don't fail the match result if intelligence update fails
    }

    return NextResponse.json(matchResult, { status: 201 });
  } catch (error) {
    console.error('Error creating match result:', error);
    return NextResponse.json(
      { error: 'Failed to create match result' },
      { status: 500 }
    );
  }
}

// Auto-settlement functions removed - using manual settlement only

function calculateAccuracy(simulation: any, actualResult: any): AccuracyMetrics {
  try {
    const trueOdds: TrueOdds = JSON.parse(simulation.true_odds || '{}');
    const { home_score_ft, away_score_ft } = actualResult;
    const totalGoals = home_score_ft + away_score_ft;
    
    let correctPredictions = 0;
    let totalPredictions = 0;
    const marketAccuracy: { [market: string]: { correct: number; total: number; accuracy: number } } = {};

    // 1X2 Market Accuracy
    if (trueOdds['1x2']) {
      const homeWin = home_score_ft > away_score_ft;
      const draw = home_score_ft === away_score_ft;
      const awayWin = away_score_ft > home_score_ft;

      // Find the most likely outcome from true odds
      const odds1x2 = trueOdds['1x2'];
      const homeProb = 1 / odds1x2.home;
      const drawProb = 1 / odds1x2.draw;
      const awayProb = 1 / odds1x2.away;

      let predictedOutcome = 'home';
      if (drawProb > homeProb && drawProb > awayProb) predictedOutcome = 'draw';
      else if (awayProb > homeProb) predictedOutcome = 'away';

      const actualOutcome = homeWin ? 'home' : draw ? 'draw' : 'away';
      const correct = predictedOutcome === actualOutcome;

      marketAccuracy['1x2'] = {
        correct: correct ? 1 : 0,
        total: 1,
        accuracy: correct ? 100 : 0
      };

      if (correct) correctPredictions++;
      totalPredictions++;
    }

    // Over/Under Markets Accuracy
    if (trueOdds.over_under) {
      const ouMarkets = [
        { key: 'over_25', under_key: 'under_25', line: 2.5 },
        { key: 'over_35', under_key: 'under_35', line: 3.5 },
        { key: 'over_45', under_key: 'under_45', line: 4.5 },
        { key: 'over_55', under_key: 'under_55', line: 5.5 }
      ];

      ouMarkets.forEach(market => {
        const overOdds = trueOdds.over_under[market.key as keyof typeof trueOdds.over_under];
        const underOdds = trueOdds.over_under[market.under_key as keyof typeof trueOdds.over_under];

        if (overOdds && underOdds) {
          const overProb = 1 / overOdds;
          const underProb = 1 / underOdds;
          
          const predictedOver = overProb > underProb;
          const actualOver = totalGoals > market.line;
          const correct = predictedOver === actualOver;

          const marketKey = `ou_${market.line}`;
          marketAccuracy[marketKey] = {
            correct: correct ? 1 : 0,
            total: 1,
            accuracy: correct ? 100 : 0
          };

          if (correct) correctPredictions++;
          totalPredictions++;
        }
      });
    }

    // Both Teams Score Accuracy
    if (trueOdds.both_teams_score) {
      const yesOdds = trueOdds.both_teams_score.yes;
      const noOdds = trueOdds.both_teams_score.no;

      if (yesOdds && noOdds) {
        const yesProb = 1 / yesOdds;
        const noProb = 1 / noOdds;
        
        const predictedBTTS = yesProb > noProb;
        const actualBTTS = home_score_ft > 0 && away_score_ft > 0;
        const correct = predictedBTTS === actualBTTS;

        marketAccuracy['btts'] = {
          correct: correct ? 1 : 0,
          total: 1,
          accuracy: correct ? 100 : 0
        };

        if (correct) correctPredictions++;
        totalPredictions++;
      }
    }

    // Asian Handicap Accuracy
    const goalDifference = home_score_ft - away_score_ft;
    
    // AH -1/+1 Market
    if (trueOdds.ah_minus1_plus1) {
      const minus1Odds = trueOdds.ah_minus1_plus1.minus1;
      const plus1Odds = trueOdds.ah_minus1_plus1.plus1;

      if (minus1Odds && plus1Odds) {
        const minus1Prob = 1 / minus1Odds; // Home AH-1 (home gives 1 goal)
        const plus1Prob = 1 / plus1Odds;   // Away AH+1 (away gets 1 goal)
        
        const predictedMinus1 = minus1Prob > plus1Prob;
        const actualMinus1 = goalDifference > 1; // Home wins by 2+ goals
        const correct = predictedMinus1 === actualMinus1;

        marketAccuracy['ah_minus1_plus1'] = {
          correct: correct ? 1 : 0,
          total: 1,
          accuracy: correct ? 100 : 0
        };

        if (correct) correctPredictions++;
        totalPredictions++;
      }
    }

    // AH +1/-1 Market  
    if (trueOdds.ah_plus1_minus1) {
      const plus1Odds = trueOdds.ah_plus1_minus1.plus1;
      const minus1Odds = trueOdds.ah_plus1_minus1.minus1;

      if (plus1Odds && minus1Odds) {
        const plus1Prob = 1 / plus1Odds;   // Home AH+1 (home gets 1 goal)
        const minus1Prob = 1 / minus1Odds; // Away AH-1 (away gives 1 goal)
        
        const predictedPlus1 = plus1Prob > minus1Prob;
        const actualPlus1 = goalDifference > -1; // Home doesn't lose by 2+ goals
        const correct = predictedPlus1 === actualPlus1;

        marketAccuracy['ah_plus1_minus1'] = {
          correct: correct ? 1 : 0,
          total: 1,
          accuracy: correct ? 100 : 0
        };

        if (correct) correctPredictions++;
        totalPredictions++;
      }
    }

    const accuracyPercentage = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

    return {
      correct_predictions: correctPredictions,
      total_predictions: totalPredictions,
      accuracy_percentage: accuracyPercentage,
      market_accuracy: marketAccuracy
    };
  } catch (error) {
    console.error('Error calculating accuracy:', error);
    return {
      correct_predictions: 0,
      total_predictions: 0,
      accuracy_percentage: 0,
      market_accuracy: {}
    };
  }
}