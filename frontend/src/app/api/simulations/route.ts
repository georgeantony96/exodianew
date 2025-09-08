import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

export async function GET(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get specific simulation
      const result = db.executeQuery('SELECT * FROM simulations WHERE id = ?', [parseInt(id)]);
      if (!result.success || result.data.length === 0) {
        return NextResponse.json(
          { error: 'Simulation not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(result.data[0]);
    } else {
      // Get all simulations with bet status information
      const result = db.executeQuery(`
        SELECT 
          s.*,
          ht.name as home_team_name,
          at.name as away_team_name,
          l.name as league_name,
          mr.id as has_result,
          mr.accuracy_metrics,
          COUNT(ubs.id) as total_bets,
          SUM(CASE WHEN ubs.bet_status = 'pending' THEN 1 ELSE 0 END) as pending_bets,
          SUM(CASE WHEN ubs.bet_status = 'won' THEN 1 ELSE 0 END) as won_bets,
          SUM(CASE WHEN ubs.bet_status = 'lost' THEN 1 ELSE 0 END) as lost_bets
        FROM simulations s
        LEFT JOIN teams ht ON s.home_team_id = ht.id
        LEFT JOIN teams at ON s.away_team_id = at.id
        LEFT JOIN leagues l ON s.league_id = l.id
        LEFT JOIN match_results mr ON s.id = mr.simulation_id
        LEFT JOIN user_bet_selections ubs ON s.id = ubs.simulation_id
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `);
      if (!result.success) {
        throw new Error('Failed to fetch simulations from database');
      }
      
      // Process the results to add accuracy calculation
      const processedData = result.data.map(simulation => {
        let accuracy = null;
        if (simulation.accuracy_metrics) {
          try {
            const metrics = JSON.parse(simulation.accuracy_metrics);
            accuracy = metrics.overall_accuracy || null;
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
        
        return {
          ...simulation,
          has_result: simulation.has_result ? true : false,
          accuracy: accuracy,
          total_bets: simulation.total_bets || 0,
          pending_bets: simulation.pending_bets || 0,
          won_bets: simulation.won_bets || 0,
          lost_bets: simulation.lost_bets || 0
        };
      });
      
      return NextResponse.json(processedData);
    }
  } catch (error) {
    console.error('Error fetching simulations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch simulations' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const bulk = searchParams.get('bulk');
    const ids = searchParams.get('ids');

    if (bulk === 'all') {
      // Delete all simulations
      db.db.prepare('DELETE FROM bookmaker_odds').run();
      db.db.prepare('DELETE FROM match_results').run();
      db.db.prepare('DELETE FROM user_bet_selections WHERE simulation_id IN (SELECT id FROM simulations)').run();
      const deleteSimulations = db.db.prepare('DELETE FROM simulations').run();

      return NextResponse.json({
        success: true,
        message: 'All simulations deleted successfully',
        deleted_count: deleteSimulations.changes || 0
      });
    } 
    else if (ids) {
      // Delete multiple simulations by IDs
      const idArray = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      if (idArray.length === 0) {
        return NextResponse.json(
          { error: 'No valid IDs provided' },
          { status: 400 }
        );
      }

      const placeholders = idArray.map(() => '?').join(',');
      
      // Delete related data first
      db.db.prepare(`DELETE FROM bookmaker_odds WHERE simulation_id IN (${placeholders})`).run(...idArray);
      db.db.prepare(`DELETE FROM match_results WHERE simulation_id IN (${placeholders})`).run(...idArray);
      db.db.prepare(`DELETE FROM user_bet_selections WHERE simulation_id IN (${placeholders})`).run(...idArray);
      
      // Delete simulations
      const deleteResult = db.db.prepare(`DELETE FROM simulations WHERE id IN (${placeholders})`).run(...idArray);

      return NextResponse.json({
        success: true,
        message: `${deleteResult.changes} simulations deleted successfully`,
        deleted_count: deleteResult.changes || 0
      });
    }
    else if (id) {
      // Delete single simulation
      const simulationId = parseInt(id);
      
      if (isNaN(simulationId)) {
        return NextResponse.json(
          { error: 'Invalid simulation ID' },
          { status: 400 }
        );
      }

      // Delete related data first (foreign key constraints)
      db.db.prepare('DELETE FROM bookmaker_odds WHERE simulation_id = ?').run(simulationId);
      db.db.prepare('DELETE FROM match_results WHERE simulation_id = ?').run(simulationId);
      db.db.prepare('DELETE FROM user_bet_selections WHERE simulation_id = ?').run(simulationId);
      
      // Delete simulation
      const result = db.db.prepare('DELETE FROM simulations WHERE id = ?').run(simulationId);
      
      if (result.changes === 0) {
        return NextResponse.json(
          { error: 'Simulation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Simulation deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Missing simulation ID or bulk parameter' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting simulation:', error);
    return NextResponse.json(
      { error: 'Failed to delete simulation' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getOptimizedDatabase();
    const body = await request.json();
    
    // Validate required fields
    const {
      home_team_id,
      away_team_id,
      league_id,
      match_date,
      distribution_type,
      iterations,
      home_boost = 0,
      away_boost = 0,
      home_advantage = 0.20,
      true_odds,
      value_bets
    } = body;

    if (!home_team_id || !away_team_id || !match_date || !distribution_type || !iterations) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate distribution type
    if (!['poisson', 'negative_binomial'].includes(distribution_type)) {
      return NextResponse.json(
        { error: 'Invalid distribution type' },
        { status: 400 }
      );
    }

    // Create simulation using prepared statement
    const insertResult = db.statements.insertSimulation.run(
      home_team_id,
      away_team_id,
      league_id || null,
      match_date,
      distribution_type,
      iterations,
      home_boost,
      away_boost,
      home_advantage,
      JSON.stringify(true_odds || {}),
      JSON.stringify(value_bets || {})
    );

    if (!insertResult.lastInsertRowid) {
      throw new Error('Failed to create simulation');
    }

    // Return the created simulation with ID
    const simulationId = Number(insertResult.lastInsertRowid);
    const createdResult = db.executeQuery('SELECT * FROM simulations WHERE id = ?', [simulationId]);
    const simulation = createdResult.success ? createdResult.data[0] : null;

    if (simulation) {
      return NextResponse.json({
        success: true,
        simulation_id: simulationId,
        ...simulation
      }, { status: 201 });
    } else {
      throw new Error('Failed to retrieve created simulation');
    }
  } catch (error) {
    console.error('Error creating simulation:', error);
    return NextResponse.json(
      { error: 'Failed to create simulation' },
      { status: 500 }
    );
  }
}