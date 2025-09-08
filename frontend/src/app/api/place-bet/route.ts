// BET PLACEMENT API - FLAT STAKING
// Tracks which value bets user actually selects and places

import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

interface PlaceBetRequest {
  simulation_id: number;
  market_type: string;           // "ou25", "1x2", "btts"
  market_option: string;         // "over", "home", "yes"
  selected_odds: number;         // 2.75
  bookmaker?: string;            // "Bet365", "Pinnacle"
  
  // Value bet calculations (from frontend)
  true_probability: number;      // 0.425 (from simulation)
  edge_percentage: number;       // 16.8%
  actual_stake: number;          // What user actually wants to bet
  
  // Context
  league_id?: number;
  match_date?: string;
  bet_reasoning?: string;        // "Argentina always goes over"
  confidence_level?: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface PlaceBetResponse {
  success: boolean;
  bet_id?: number;
  bankroll_updated?: any;
  value_analysis?: any;
  error?: string;
}

// POST /api/place-bet - Place a bet and track it
export async function POST(request: NextRequest): Promise<NextResponse<PlaceBetResponse>> {
  try {
    const data: PlaceBetRequest = await request.json();
    
    const {
      simulation_id,
      market_type,
      market_option, 
      selected_odds,
      bookmaker = 'Unknown',
      true_probability,
      edge_percentage,
      actual_stake,
      league_id,
      match_date,
      bet_reasoning,
      confidence_level = 'MEDIUM'
    } = data;

    // Validate required fields
    console.log('Received bet placement data:', {
      simulation_id,
      market_type,
      market_option,
      selected_odds,
      true_probability,
      edge_percentage,
      actual_stake
    });

    if (simulation_id === undefined || simulation_id === null || !market_type || !market_option || !selected_odds || 
        true_probability === undefined || true_probability === null || 
        edge_percentage === undefined || edge_percentage === null || 
        !actual_stake) {
      return NextResponse.json({
        success: false,
        error: `Missing required fields. Received: simulation_id=${simulation_id}, market_type=${market_type}, market_option=${market_option}, selected_odds=${selected_odds}, true_probability=${true_probability}, edge_percentage=${edge_percentage}, actual_stake=${actual_stake}`
      }, { status: 400 });
    }

    if (actual_stake <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Stake must be greater than 0'
      }, { status: 400 });
    }

    const db = getOptimizedDatabase();

    // Get current bankroll
    const bankroll = db.db.prepare(`
      SELECT current_balance
      FROM user_bankroll 
      WHERE id = 1
    `).get();

    if (!bankroll) {
      return NextResponse.json({
        success: false,
        error: 'Bankroll not found. Please initialize bankroll system.'
      }, { status: 404 });
    }

    // Validate stake against bankroll
    if (actual_stake > bankroll.current_balance) {
      return NextResponse.json({
        success: false,
        error: `Insufficient funds. Available: $${bankroll.current_balance}`
      }, { status: 400 });
    }

    // Calculate flat staking metrics
    const implied_probability = 1 / selected_odds;
    const stake_percentage = (actual_stake / bankroll.current_balance) * 100;
    
    // Insert bet record
    console.log('Inserting bet with simulation_id:', simulation_id);
    const betInsertResult = db.db.prepare(`
      INSERT INTO user_bet_selections (
        simulation_id, market_type, market_option, selected_odds, bookmaker,
        true_probability, implied_probability, edge_percentage,
        bankroll_when_placed, actual_stake, stake_percentage,
        league_id, bet_reasoning, confidence_level, placed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      simulation_id, 
      market_type, 
      market_option, 
      selected_odds, 
      bookmaker,
      parseFloat(true_probability.toFixed(4)),
      parseFloat(implied_probability.toFixed(4)),
      parseFloat(edge_percentage.toFixed(2)),
      bankroll.current_balance,
      actual_stake,
      parseFloat(stake_percentage.toFixed(2)),
      league_id || null,
      bet_reasoning || null,
      confidence_level
    );
    
    const bet_id = betInsertResult.lastInsertRowid;

    // Update bankroll (subtract stake)
    const newBalance = bankroll.current_balance - actual_stake;
    
    db.db.prepare(`
      UPDATE user_bankroll 
      SET 
        current_balance = ?,
        total_staked = total_staked + ?,
        total_bets_placed = total_bets_placed + 1,
        pending_bets = pending_bets + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(newBalance, actual_stake);

    // Get updated bankroll
    const updatedBankroll = db.db.prepare(`
      SELECT * FROM user_bankroll WHERE id = 1
    `).get();

    // Build value analysis response
    const value_analysis = {
      edge_percentage: parseFloat(edge_percentage.toFixed(2)),
      stake_as_bankroll_percentage: parseFloat(stake_percentage.toFixed(2)),
      implied_probability: parseFloat(implied_probability.toFixed(4)),
      true_probability: parseFloat(true_probability.toFixed(4)),
      potential_profit: parseFloat((actual_stake * (selected_odds - 1)).toFixed(2)),
      potential_loss: actual_stake
    };

    return NextResponse.json({
      success: true,
      bet_id: Number(bet_id),
      bankroll_updated: updatedBankroll,
      value_analysis,
      message: `Bet placed: $${actual_stake} on ${market_option} @ ${selected_odds}`
    });

  } catch (error) {
    console.error('Place bet error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to place bet'
    }, { status: 500 });
  }
}

// GET /api/place-bet - Get pending bets and betting statistics
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const simulationId = searchParams.get('simulation_id');
  const includeSettled = searchParams.get('include_settled') === 'true';
  
  try {
    const db = getOptimizedDatabase();
    
    // Get pending bets - either all or for specific simulation
    const pendingQuery = `
      SELECT 
        ubs.id,
        ubs.simulation_id,
        ubs.market_type,
        ubs.market_option,
        ubs.selected_odds,
        ubs.actual_stake,
        ubs.edge_percentage,
        ubs.true_probability,
        ubs.actual_stake * (ubs.selected_odds - 1) as max_win,
        ubs.actual_stake as max_loss,
        ubs.confidence_level,
        ubs.bet_reasoning,
        ubs.placed_at,
        ubs.bet_status,
        ubs.profit_loss,
        ubs.actual_result,
        l.name as league_name
      FROM user_bet_selections ubs
      LEFT JOIN leagues l ON ubs.league_id = l.id
      WHERE ubs.bet_status = 'pending'
    `;
    
    const pendingBets = simulationId 
      ? db.db.prepare(pendingQuery + ` AND ubs.simulation_id = ? ORDER BY ubs.placed_at DESC`).all(parseInt(simulationId))
      : db.db.prepare(pendingQuery + ` ORDER BY ubs.placed_at DESC`).all();
      
    let settledBets = [];
    if (includeSettled) {
      const settledQuery = `
        SELECT 
          ubs.id,
          ubs.simulation_id,
          ubs.market_type,
          ubs.market_option,
          ubs.selected_odds,
          ubs.actual_stake,
          ubs.edge_percentage,
          ubs.true_probability,
          ubs.actual_stake * (ubs.selected_odds - 1) as max_win,
          ubs.actual_stake as max_loss,
          ubs.confidence_level,
          ubs.bet_reasoning,
          ubs.placed_at,
          ubs.bet_status,
          ubs.profit_loss,
          ubs.actual_result,
          l.name as league_name
        FROM user_bet_selections ubs
        LEFT JOIN leagues l ON ubs.league_id = l.id
        WHERE ubs.bet_status != 'pending'
      `;
      
      settledBets = simulationId 
        ? db.db.prepare(settledQuery + ` AND ubs.simulation_id = ? ORDER BY ubs.placed_at DESC`).all(parseInt(simulationId))
        : db.db.prepare(settledQuery + ` ORDER BY ubs.placed_at DESC`).all();
    }
    
    // Get betting statistics
    const stats = db.db.prepare(`
      SELECT 
        COUNT(*) as total_bets,
        SUM(actual_stake) as total_staked,
        AVG(edge_percentage) as avg_edge_taken,
        AVG(actual_stake) as avg_stake,
        SUM(CASE WHEN bet_status = 'pending' THEN 1 ELSE 0 END) as pending_bets_count,
        SUM(CASE WHEN bet_status = 'won' THEN 1 ELSE 0 END) as winning_bets,
        SUM(CASE WHEN bet_status = 'lost' THEN 1 ELSE 0 END) as losing_bets
      FROM user_bet_selections
    `).get();

    return NextResponse.json({
      success: true,
      pending_bets: pendingBets || [],
      settled_bets: settledBets || [],
      betting_stats: stats,
      flat_staking: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get betting data error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get betting data'
    }, { status: 500 });
  }
}

// PUT /api/place-bet - Settle a bet (manual trigger)
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { bet_id, actual_result, closing_odds } = await request.json();
    
    if (!bet_id || actual_result === undefined) {
      return NextResponse.json({
        success: false,
        error: 'bet_id and actual_result are required'
      }, { status: 400 });
    }

    const db = getOptimizedDatabase();

    // 🔄 SPECIAL RESET OPERATION - Allow resetting settled bets back to pending
    if (actual_result === 'reset_to_pending') {
      const settledBet = db.db.prepare(`
        SELECT * FROM user_bet_selections WHERE id = ?
      `).get(bet_id);

      if (!settledBet) {
        return NextResponse.json({
          success: false,
          error: 'Bet not found'
        }, { status: 404 });
      }

      if (settledBet.bet_status === 'pending') {
        return NextResponse.json({
          success: false,
          error: 'Bet is already pending'
        }, { status: 400 });
      }

      // Get current bankroll
      const currentBankroll = db.db.prepare(`SELECT * FROM user_bankroll WHERE id = 1`).get();

      // Reset bet to pending
      db.db.prepare(`
        UPDATE user_bet_selections 
        SET bet_status = 'pending', actual_result = NULL, profit_loss = 0
        WHERE id = ?
      `).run(bet_id);

      // Reverse the bankroll changes (add back any lost stake, subtract any winnings)
      let balanceAdjustment = 0;
      let profitLossAdjustment = 0;

      if (settledBet.bet_status === 'lost') {
        // Add back the lost stake
        balanceAdjustment = settledBet.actual_stake;
        profitLossAdjustment = -settledBet.profit_loss; // Reverse the negative P&L
      } else if (settledBet.bet_status === 'won') {
        // Remove the winnings (payout was stake * odds)
        const payout = settledBet.actual_stake * settledBet.selected_odds;
        balanceAdjustment = -payout;
        profitLossAdjustment = -settledBet.profit_loss; // Reverse the positive P&L
      } else if (settledBet.bet_status === 'pushed') {
        // Remove the returned stake (no profit/loss to reverse)
        balanceAdjustment = -settledBet.actual_stake;
      }

      const newBalance = currentBankroll.current_balance + balanceAdjustment;
      const newTotalProfitLoss = currentBankroll.total_profit_loss + profitLossAdjustment;
      const newPendingBets = currentBankroll.pending_bets + 1;

      db.db.prepare(`
        UPDATE user_bankroll 
        SET 
          current_balance = ?,
          total_profit_loss = ?,
          pending_bets = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(newBalance, newTotalProfitLoss, newPendingBets);

      console.log(`🔄 Bet #${bet_id} reset to pending. Balance: ${currentBankroll.current_balance} → ${newBalance}, P&L: ${currentBankroll.total_profit_loss} → ${newTotalProfitLoss}`);

      return NextResponse.json({
        success: true,
        message: `Bet #${bet_id} reset to pending status`,
        previous_status: settledBet.bet_status,
        balance_adjustment: balanceAdjustment,
        profit_loss_adjustment: profitLossAdjustment
      });
    }

    // Get the bet details (regular settlement)
    const bet = db.db.prepare(`
      SELECT * FROM user_bet_selections WHERE id = ? AND bet_status = 'pending'
    `).get(bet_id);

    if (!bet) {
      return NextResponse.json({
        success: false,
        error: 'Bet not found or already settled'
      }, { status: 404 });
    }

    // Calculate settlement amounts
    const won = actual_result === true;
    const lost = actual_result === false;
    const pushed = actual_result === 'push';
    
    let payout = 0;
    let profit_loss = 0;
    let bet_status = 'lost';
    
    if (pushed) {
      // Push - return original stake
      payout = bet.actual_stake;
      profit_loss = 0;
      bet_status = 'pushed';
    } else if (won) {
      // Win - return stake + winnings
      payout = bet.actual_stake * bet.selected_odds;
      profit_loss = payout - bet.actual_stake;
      bet_status = 'won';
    } else {
      // Loss - no payout
      payout = 0;
      profit_loss = -bet.actual_stake;
      bet_status = 'lost';
    }
    
    // Calculate CLV if closing odds provided
    let clv_percentage = null;
    if (closing_odds && closing_odds > 0) {
      clv_percentage = ((bet.selected_odds - closing_odds) / closing_odds) * 100;
    }

    // Update bet record with settlement - only update existing columns
    db.db.prepare(`
      UPDATE user_bet_selections 
      SET 
        bet_status = ?,
        actual_result = ?,
        profit_loss = ?
      WHERE id = ?
    `).run(
      bet_status,
      actual_result === 'push' ? 0.5 : (actual_result ? 1 : 0),
      profit_loss,
      bet_id
    );

    // Update bankroll
    const currentBankroll = db.db.prepare(`
      SELECT * FROM user_bankroll WHERE id = 1
    `).get();

    const newBalance = currentBankroll.current_balance + payout;
    const newTotalProfitLoss = currentBankroll.total_profit_loss + profit_loss;

    db.db.prepare(`
      UPDATE user_bankroll 
      SET 
        current_balance = ?,
        total_profit_loss = ?,
        pending_bets = pending_bets - 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(newBalance, newTotalProfitLoss);

    // Create odds analysis record for intelligence learning (prevent duplicates)
    try {
      // Check if record already exists for this bet
      const existingRecord = db.db.prepare(`
        SELECT id FROM match_odds_analysis WHERE bet_id = ?
      `).get(bet_id);
      
      if (existingRecord) {
        console.log('📝 Updating existing intelligence record for bet ID:', bet_id);
        // Update existing record instead of creating duplicate
        db.db.prepare(`
          UPDATE match_odds_analysis 
          SET closing_odds = ?, clv_percentage = ?, actual_result = ?, 
              profit_loss = ?, recorded_at = CURRENT_TIMESTAMP
          WHERE bet_id = ?
        `).run(
          closing_odds || null,
          clv_percentage,
          actual_result === 'push' ? 0.5 : (actual_result ? 1 : 0),
          profit_loss,
          bet_id
        );
        console.log('✅ Intelligence record updated for bet ID:', bet_id);
      } else {
        console.log('📝 Creating new intelligence record for bet ID:', bet_id);
        
        // FIX: Get correct league_id from simulation, not corrupted bet record
        let correct_league_id = null;
        if (bet.simulation_id) {
          const simulationData = db.db.prepare(`
            SELECT league_id FROM simulations WHERE id = ?
          `).get(bet.simulation_id);
          correct_league_id = simulationData?.league_id || null;
          console.log(`🔧 Fixed league_id: ${bet.league_id} → ${correct_league_id} for simulation #${bet.simulation_id}`);
        }
        
        // Create new record with CORRECT league_id
        const analysisResult = db.db.prepare(`
          INSERT INTO match_odds_analysis (
            simulation_id, league_id, market_type, market_option,
            input_odds, selected_odds, closing_odds, clv_percentage,
            true_probability, edge_percentage, actual_result,
            profit_loss, bet_id, recorded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          bet.simulation_id,
          correct_league_id, // 🔧 FIX: Use correct league_id from simulation
          bet.market_type,
          bet.market_option,
          bet.selected_odds, // This was our input odds
          bet.selected_odds, // Selected odds (same for now)
          closing_odds || null,
          clv_percentage,
          bet.true_probability,
          bet.edge_percentage,
          actual_result === 'push' ? 0.5 : (actual_result ? 1 : 0),
          profit_loss,
          bet_id
        );

        const analysisId = analysisResult.lastInsertRowid;
        console.log('✅ Intelligence learning record created:', analysisId);
      }
    } catch (intelligenceError) {
      console.warn('Intelligence learning failed:', intelligenceError.message);
      // Don't fail the settlement if intelligence update fails
    }

    // Trigger league intelligence learning update
    if (!existingRecord) {
      // Only trigger learning for new records (not updates)
      try {
        const intelligenceResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/intelligence`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis_id: analysisId })
        });
        
        if (intelligenceResponse.ok) {
          console.log('✅ League intelligence learning updated');
        } else {
          console.warn('⚠️ Intelligence update failed, but bet settlement succeeded');
        }
      } catch (intelligenceError) {
        console.warn('⚠️ Intelligence update error:', intelligenceError.message);
        // Don't fail the settlement if intelligence update fails
      }
    }

    // Get updated bankroll
    const updatedBankroll = db.db.prepare(`
      SELECT * FROM user_bankroll WHERE id = 1
    `).get();

    const settlementMessage = pushed
      ? `Bet PUSHED! Stake returned: $${payout.toFixed(2)} (No profit/loss)`
      : won 
        ? `Bet WON! Payout: $${payout.toFixed(2)} (Profit: +$${profit_loss.toFixed(2)})`
        : `Bet LOST. Loss: -$${bet.actual_stake.toFixed(2)}`;

    const clvMessage = clv_percentage 
      ? ` | CLV: ${clv_percentage > 0 ? '+' : ''}${clv_percentage.toFixed(2)}%`
      : '';

    return NextResponse.json({
      success: true,
      message: settlementMessage + clvMessage,
      settlement_details: {
        bet_id: bet_id,
        won: won,
        pushed: pushed,
        lost: lost,
        payout: payout,
        profit_loss: profit_loss,
        clv_percentage: clv_percentage,
        closing_odds: closing_odds,
        bet_status: bet_status
      },
      bankroll_updated: updatedBankroll
    });

  } catch (error) {
    console.error('Bet settlement error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to settle bet'
    }, { status: 500 });
  }
}