'use client';

import { useState, useEffect } from 'react';

interface PendingBet {
  id: number;
  simulation_id: number;
  market_type: string;
  market_option: string;
  selected_odds: number;
  actual_stake: number;
  edge_percentage: number;
  max_win: number;
  max_loss: number;
  confidence_level: string;
  bet_reasoning: string;
  placed_at: string;
  league_name?: string;
}

interface BetOutcome {
  bet_id: number;
  actual_result: boolean;
  closing_odds?: number;
}

interface SettlementModal {
  bet: PendingBet | null;
  isOpen: boolean;
}

export const BetTracker = ({ onBankrollUpdate }: { onBankrollUpdate?: () => void }) => {
  const [pendingBets, setPendingBets] = useState<PendingBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingBets, setSettlingBets] = useState<Set<number>>(new Set());
  const [expandedBets, setExpandedBets] = useState<Set<number>>(new Set());
  const [closingOdds, setClosingOdds] = useState<{[betId: number]: string}>({});

  useEffect(() => {
    loadPendingBets();
  }, []);

  const loadPendingBets = async () => {
    try {
      setLoading(true);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch('/api/place-bet', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Pending bets API failed: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setPendingBets(data.pending_bets);
      }
    } catch (error) {
      console.error('Error loading pending bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const settleBet = async (bet: PendingBet, result: boolean | 'push', inputClosingOdds?: string) => {
    const resultText = result === 'push' ? 'PUSHED' : result ? 'WON' : 'LOST';
    if (!confirm(`Settle bet as ${resultText}?`)) {
      return;
    }

    try {
      setSettlingBets(prev => new Set([...prev, bet.id]));

      const closingOddsValue = inputClosingOdds && inputClosingOdds.trim() 
        ? parseFloat(inputClosingOdds.trim()) 
        : bet.selected_odds;

      const response = await fetch('/api/place-bet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bet_id: bet.id,
          actual_result: result,
          closing_odds: closingOddsValue
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        
        // Clear the closing odds input
        setClosingOdds(prev => {
          const newOdds = { ...prev };
          delete newOdds[bet.id];
          return newOdds;
        });
        
        // Refresh pending bets
        await loadPendingBets();
        
        // Update bankroll
        onBankrollUpdate?.();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error settling bet:', error);
      alert('Failed to settle bet');
    } finally {
      setSettlingBets(prev => {
        const newSet = new Set(prev);
        newSet.delete(bet.id);
        return newSet;
      });
    }
  };

  const toggleBetDetails = (betId: number) => {
    setExpandedBets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(betId)) {
        newSet.delete(betId);
      } else {
        newSet.add(betId);
      }
      return newSet;
    });
  };

  const getMarketDisplayName = (bet: PendingBet): string => {
    const { market_type, market_option } = bet;
    
    switch (market_type) {
      case '1x2':
        return `Match Result - ${market_option === 'home' ? 'Home Win' : 
                              market_option === 'away' ? 'Away Win' : 'Draw'}`;
      case 'over_under':
        const goals = market_option.replace('over_', '').replace('under_', '').replace('5', '.5');
        return `Goals - ${market_option.includes('over') ? 'Over' : 'Under'} ${goals}`;
      case 'both_teams_score':
        return `BTTS - ${market_option === 'yes' ? 'Yes' : 'No'}`;
      default:
        return `${market_type} - ${market_option}`;
    }
  };

  const getConfidenceColor = (confidence: string): string => {
    switch (confidence?.toLowerCase()) {
      case 'high': return 'text-green-400 bg-green-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-800';
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (pendingBets.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-white">📋 Pending Bets</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-white mb-2">No Pending Bets</h3>
          <p className="text-muted-foreground">
            Place some value bets to track them here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">📋 Pending Bets ({pendingBets.length})</h2>
        <button
          onClick={loadPendingBets}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-700 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {pendingBets.length}
          </div>
          <div className="text-sm text-muted-foreground">Active Bets</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            ${pendingBets.reduce((sum, bet) => sum + bet.actual_stake, 0).toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">Total Staked</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            ${pendingBets.reduce((sum, bet) => sum + bet.max_win, 0).toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">Max Potential</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{color: 'var(--purple-text-medium)'}}>
            {(pendingBets.reduce((sum, bet) => sum + bet.edge_percentage, 0) / pendingBets.length).toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Avg Edge</div>
        </div>
      </div>

      {/* Pending Bets List */}
      <div className="space-y-4">
        {pendingBets.map((bet) => {
          const isSettling = settlingBets.has(bet.id);
          const potentialProfit = bet.max_win - bet.actual_stake;
          const roiPercentage = (potentialProfit / bet.actual_stake) * 100;

          return (
            <div
              key={bet.id}
              className="p-4 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white text-lg">
                      {getMarketDisplayName(bet)}
                    </h3>
                    <div className={`px-2 py-1 rounded text-xs ${getConfidenceColor(bet.confidence_level)}`}>
                      {bet.confidence_level.toUpperCase()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">Stake:</span>
                      <div className="text-white font-bold">
                        ${bet.actual_stake.toFixed(2)}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Odds:</span>
                      <div className="text-blue-400 font-bold">
                        {bet.selected_odds.toFixed(2)}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Edge:</span>
                      <div className="text-green-400 font-bold">
                        +{bet.edge_percentage.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Stake:</span>
                      <div className="text-blue-400 font-bold">
                        ${bet.actual_stake.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Potential Outcomes */}
                  <div className="bg-gray-700 p-3 rounded-lg mb-3">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Potential Outcomes</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-400">If Won:</span>
                        <div className="text-green-400 font-bold">
                          +${potentialProfit.toFixed(2)} ({roiPercentage.toFixed(1)}% ROI)
                        </div>
                      </div>
                      <div>
                        <span className="text-red-400">If Lost:</span>
                        <div className="text-red-400 font-bold">
                          -${bet.actual_stake.toFixed(2)} (-100% ROI)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="text-xs text-muted-foreground mb-3">
                    {bet.league_name && <span>League: {bet.league_name} • </span>}
                    <span>Placed: {getTimeAgo(bet.placed_at)}</span>
                    {bet.bet_reasoning && (
                      <span> • Reasoning: {bet.bet_reasoning}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Settlement Actions */}
              <div className="border-t border-gray-600 pt-3">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-white">Settlement Options</h4>
                  <button
                    onClick={() => toggleBetDetails(bet.id)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    {expandedBets.has(bet.id) ? 'Hide Details' : 'View Details'}
                  </button>
                </div>

                {/* Closing Odds Input */}
                {expandedBets.has(bet.id) && (
                  <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Closing Odds (Optional - for CLV tracking)
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        step="0.01"
                        min="1.01"
                        placeholder={`Original: ${bet.selected_odds.toFixed(2)}`}
                        value={closingOdds[bet.id] || ''}
                        onChange={(e) => setClosingOdds(prev => ({
                          ...prev,
                          [bet.id]: e.target.value
                        }))}
                        className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      />
                      <span className="text-sm text-gray-400">
                        {closingOdds[bet.id] && parseFloat(closingOdds[bet.id]) && (
                          `CLV: ${(((bet.selected_odds - parseFloat(closingOdds[bet.id])) / parseFloat(closingOdds[bet.id])) * 100).toFixed(2)}%`
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Settlement Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => settleBet(bet, true, closingOdds[bet.id])}
                    disabled={isSettling}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {isSettling ? 'Settling...' : '✅ WON'}
                  </button>
                  
                  <button
                    onClick={() => settleBet(bet, false, closingOdds[bet.id])}
                    disabled={isSettling}
                    className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {isSettling ? 'Settling...' : '❌ LOST'}
                  </button>

                  <button
                    onClick={() => settleBet(bet, 'push', closingOdds[bet.id])}
                    disabled={isSettling}
                    className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {isSettling ? 'Settling...' : '🔄 PUSH'}
                  </button>
                </div>

                {/* Settlement Info */}
                <div className="mt-3 text-xs text-gray-400">
                  <p>Click "View Details" to add closing odds for CLV tracking</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Settlement Tips */}
      <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-600/30">
        <h4 className="font-medium text-blue-300 mb-2">💡 Settlement Tips</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Check match results carefully before settling bets</li>
          <li>• Enter closing odds to track your closing line value (CLV)</li>
          <li>• Settled bets automatically update your bankroll balance</li>
          <li>• Use the closing odds feature to improve future edge detection</li>
        </ul>
      </div>
    </div>
  );
};