import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

export async function GET(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    
    console.log('Fetching accuracy stats...');
    
    // Check if tables exist and have data
    const simulationsResult = db.executeQuery('SELECT COUNT(*) as count FROM simulations');
    const simulationsCount = simulationsResult.success ? simulationsResult.data[0] as { count: number } : { count: 0 };
    console.log('Total simulations:', simulationsCount);
    
    const matchResultsResult = db.executeQuery('SELECT COUNT(*) as count FROM match_results');
    const matchResultsCount = matchResultsResult.success ? matchResultsResult.data[0] as { count: number } : { count: 0 };
    console.log('Total match results:', matchResultsCount);
    
    const bookmakerOddsResult = db.executeQuery('SELECT COUNT(*) as count FROM bookmaker_odds');
    const bookmakerOddsCount = bookmakerOddsResult.success ? bookmakerOddsResult.data[0] as { count: number } : { count: 0 };
    console.log('Total bookmaker odds:', bookmakerOddsCount);
    
    // Check for analysis data
    const analysisResult = db.executeQuery('SELECT COUNT(*) as count FROM match_odds_analysis WHERE actual_result IS NOT NULL');
    const analysisCount = analysisResult.success ? analysisResult.data[0] as { count: number } : { count: 0 };
    console.log('Total analysis records with results:', analysisCount);
    
    // If no analysis data, return empty stats
    if (analysisCount?.count === 0) {
      console.log('No settled bet analysis found, returning empty stats');
      return NextResponse.json({
        total_simulations: 0,
        market_accuracy: []
      });
    }
    
    const totalSimulationsResult = db.executeQuery(`
      SELECT COUNT(DISTINCT simulation_id) as count FROM match_odds_analysis
      WHERE actual_result IS NOT NULL
    `);
    const totalSimulations = totalSimulationsResult.success ? totalSimulationsResult.data[0] as { count: number } : { count: 0 };
    console.log('Total simulations with results:', totalSimulations);

    // Query using match_odds_analysis for accuracy calculations
    const marketAccuracyResult = db.executeQuery(`
      SELECT 
        moa.market_type,
        COUNT(*) as total_predictions,
        ROUND(AVG(CASE WHEN moa.actual_result = 1 THEN 100.0 ELSE 0.0 END), 1) as accuracy_percentage
      FROM match_odds_analysis moa
      WHERE moa.actual_result IS NOT NULL
      GROUP BY moa.market_type
    `);
    const marketAccuracy = marketAccuracyResult.success ? marketAccuracyResult.data as Array<{
      market_type: string;
      total_predictions: number;
      accuracy_percentage: number;
    }> : [];
    console.log('Market accuracy data:', marketAccuracy);

    const stats = {
      total_simulations: totalSimulations?.count || 0,
      market_accuracy: marketAccuracy || []
    };
    console.log('Returning accuracy stats:', stats);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching accuracy stats:', error);
    console.error('Error stack:', (error as Error).stack);
    return NextResponse.json(
      { error: 'Failed to fetch accuracy statistics' },
      { status: 500 }
    );
  }
}