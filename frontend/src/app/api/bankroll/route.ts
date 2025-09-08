// BANKROLL MANAGEMENT API
// Full user control: Edit balance, reset, performance stats

import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

// GET /api/bankroll - Get current bankroll status
export async function GET() {
  try {
    const db = getOptimizedDatabase();
    
    // Get base bankroll data
    const baseBankroll = db.db.prepare(`
      SELECT * FROM user_bankroll WHERE id = 1
    `).get();

    if (!baseBankroll) {
      return NextResponse.json({
        success: false,
        error: 'Bankroll not initialized'
      }, { status: 404 });
    }

    // Calculate actual bet statistics (override potentially stale counters)
    const actualBetStats = db.db.prepare(`
      SELECT 
        COUNT(*) as total_bets_placed,
        SUM(actual_stake) as total_staked,
        SUM(CASE WHEN bet_status = 'pending' THEN 1 ELSE 0 END) as pending_bets,
        SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) as winning_bets,
        SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END) as losing_bets,
        SUM(CASE WHEN profit_loss IS NOT NULL THEN profit_loss ELSE 0 END) as total_profit_loss
      FROM user_bet_selections
    `).get();

    // Calculate max drawdown from betting history
    const drawdownQuery = db.db.prepare(`
      SELECT 
        MIN(running_balance) as lowest_balance,
        MAX(running_balance) as highest_balance
      FROM (
        SELECT 
          SUM(profit_loss) OVER (ORDER BY placed_at ROWS UNBOUNDED PRECEDING) + ? as running_balance
        FROM user_bet_selections 
        WHERE bet_status != 'pending' 
        ORDER BY placed_at
      ) as balance_history
    `).get(baseBankroll.starting_balance);

    const maxDrawdown = drawdownQuery ? 
      Math.max(0, (drawdownQuery.highest_balance || baseBankroll.starting_balance) - (drawdownQuery.lowest_balance || baseBankroll.starting_balance)) : 0;

    // Merge base bankroll with actual bet statistics
    const bankrollStatus = {
      ...baseBankroll,
      total_bets_placed: actualBetStats.total_bets_placed || 0,
      total_staked: actualBetStats.total_staked || 0,
      pending_bets: actualBetStats.pending_bets || 0,
      winning_bets: actualBetStats.winning_bets || 0,
      losing_bets: actualBetStats.losing_bets || 0,
      total_profit_loss: actualBetStats.total_profit_loss || baseBankroll.total_profit_loss,
      win_rate: actualBetStats.total_bets_placed > 0 ? (actualBetStats.winning_bets / actualBetStats.total_bets_placed) * 100 : 0,
      roi_percentage: actualBetStats.total_staked > 0 ? (actualBetStats.total_profit_loss / actualBetStats.total_staked) * 100 : 0,
      roi_on_turnover: actualBetStats.total_staked > 0 ? (actualBetStats.total_profit_loss / actualBetStats.total_staked) * 100 : 0,
      net_profit_loss: baseBankroll.current_balance - baseBankroll.starting_balance,
      total_roi_percentage: (baseBankroll.current_balance - baseBankroll.starting_balance) / baseBankroll.starting_balance * 100,
      risk_level: baseBankroll.current_balance >= baseBankroll.starting_balance * 0.8 ? 'LOW RISK' : 'HIGH RISK',
      kelly_10pct_edge: baseBankroll.current_balance * 0.05, // 5% of bankroll for 10% edge
      max_drawdown: maxDrawdown
    };

    // Get recent betting performance
    const recentPerformance = db.db.prepare(`
      SELECT * FROM recent_betting_performance
    `).all();

    // Get bet history summary
    const betHistory = db.db.prepare(`
      SELECT 
        COUNT(*) as total_bets,
        SUM(CASE WHEN bet_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) as won,
        SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END) as lost,
        AVG(actual_stake) as avg_stake,
        AVG(edge_percentage) as avg_edge_taken,
        MAX(placed_at) as last_bet_date
      FROM user_bet_selections
    `).get();

    return NextResponse.json({
      success: true,
      bankroll: bankrollStatus,
      recent_performance: recentPerformance,
      bet_history: betHistory,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bankroll GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// PUT /api/bankroll - Update bankroll settings (USER EDITABLE!)
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const db = getOptimizedDatabase();

    // Validate input
    const allowedUpdates = [
      'starting_balance', 
      'current_balance', 
      'currency'
    ];

    const updates = {};
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (allowedUpdates.includes(key)) {
        updates[key] = value;
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid fields to update'
      }, { status: 400 });
    }

    // Add updated timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    // Update bankroll
    const updateQuery = `
      UPDATE user_bankroll 
      SET ${updateFields.join(', ')}
      WHERE id = 1
    `;

    const result = db.db.prepare(updateQuery).run(...values);

    if (result.changes === 0) {
      return NextResponse.json({
        success: false,
        error: 'No bankroll found to update'
      }, { status: 404 });
    }

    // Get updated status
    const updatedStatus = db.db.prepare(`
      SELECT * FROM bankroll_status
    `).get();

    return NextResponse.json({
      success: true,
      message: 'Bankroll updated successfully',
      bankroll: updatedStatus,
      updated_fields: Object.keys(updates)
    });

  } catch (error) {
    console.error('Bankroll PUT error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST /api/bankroll - Reset bankroll (FRESH START!)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { action, starting_balance = 1000.00 } = data;

    if (action !== 'reset') {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use action: "reset"'
      }, { status: 400 });
    }

    const db = getOptimizedDatabase();

    // Reset bankroll to fresh state
    const resetQuery = `
      UPDATE user_bankroll SET
        starting_balance = ?,
        current_balance = ?,
        total_profit_loss = 0.00,
        total_staked = 0.00,
        total_bets_placed = 0,
        winning_bets = 0,
        losing_bets = 0,
        pending_bets = 0,
        win_rate = 0.00,
        roi_percentage = 0.00,
        roi_on_turnover = 0.00,
        max_balance = ?,
        max_drawdown = 0.00,
        max_drawdown_amount = 0.00,
        current_drawdown = 0.00,
        last_reset = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `;

    const result = db.db.prepare(resetQuery).run(starting_balance, starting_balance, starting_balance);

    if (result.changes === 0) {
      return NextResponse.json({
        success: false,
        error: 'No bankroll found to reset'
      }, { status: 404 });
    }

    // Optional: Clear all bet history if requested
    if (data.clear_history === true) {
      db.db.prepare('DELETE FROM user_bet_selections').run();
    }

    // Get fresh status
    const freshStatus = db.db.prepare(`
      SELECT * FROM bankroll_status
    `).get();

    return NextResponse.json({
      success: true,
      message: `Bankroll reset to $${starting_balance}`,
      bankroll: freshStatus,
      history_cleared: data.clear_history === true
    });

  } catch (error) {
    console.error('Bankroll POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE /api/bankroll - Clear all bet history (DANGER ZONE!)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');

    if (confirm !== 'yes') {
      return NextResponse.json({
        success: false,
        error: 'Must confirm with ?confirm=yes to delete all bet history'
      }, { status: 400 });
    }

    const db = getOptimizedDatabase();

    // Delete all bet selections
    const deleteResult = db.db.prepare('DELETE FROM user_bet_selections').run();

    // Reset bet counters and P&L in bankroll
    db.db.prepare(`
      UPDATE user_bankroll SET
        total_bets_placed = 0,
        winning_bets = 0,
        losing_bets = 0,
        pending_bets = 0,
        win_rate = 0.00,
        total_profit_loss = 0.00,
        total_staked = 0.00,
        roi_percentage = 0.00,
        roi_on_turnover = 0.00,
        max_drawdown = 0.00,
        max_drawdown_amount = 0.00,
        current_drawdown = 0.00,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run();

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleteResult.changes} bet records`,
      deleted_count: deleteResult.changes
    });

  } catch (error) {
    console.error('Bankroll DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}