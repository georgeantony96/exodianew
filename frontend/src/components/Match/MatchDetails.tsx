'use client';

import React, { useState, useEffect } from 'react';

interface BetData {
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
  bet_status: 'pending' | 'won' | 'lost' | 'pushed';
  profit_loss?: number;
  actual_result?: number | null;
}

interface MatchDetailsProps {
  simulation: {
    id: number;
    home_team_name: string;
    away_team_name: string;
    match_date: string;
    distribution_type: string;
    iterations: number;
    value_bets: string; // JSON string
    created_at: string;
  };
  onBetSettlement?: () => void;
}

export const MatchDetails: React.FC<MatchDetailsProps> = ({ 
  simulation, 
  onBetSettlement 
}) => {
  const [allBets, setAllBets] = useState<BetData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load bets for this specific simulation
  useEffect(() => {
    loadSimulationBets();
  }, [simulation.id]);

  const loadSimulationBets = async () => {
    try {
      // Get both pending and settled bets in one call
      const response = await fetch(`/api/place-bet?simulation_id=${simulation.id}&include_settled=true`);
      const data = await response.json();
      
      if (data.success) {
        const pendingBets = (data.pending_bets || []).map((bet: any) => ({
          ...bet,
          bet_status: bet.bet_status || 'pending' as const
        }));
        
        const settledBets = (data.settled_bets || []).map((bet: any) => ({
          ...bet,
          bet_status: bet.bet_status || 'settled' as const
        }));
        
        setAllBets([...pendingBets, ...settledBets]);
      }
    } catch (error) {
      console.error('Error loading simulation bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMarketDisplayName = (bet: BetData): string => {
    const { market_type, market_option } = bet;
    
    switch (market_type) {
      case '1x2':
        return `${market_option === 'home' ? '1 - Home Win' : 
                market_option === 'away' ? '2 - Away Win' : 'X - Draw'}`;
      case 'btts':
      case 'both_teams_score':
        return `BTTS - ${market_option === 'yes' ? 'Yes (GG)' : 'No (NG)'}`;
      case 'first_half_gg':
        return `1H BTTS - ${market_option === 'yes' ? 'Yes (GG 1H)' : 'No (NG 1H)'}`;
      case 'first_half_ou15':
        return `1H O/U 1.5 - ${market_option === 'over' ? 'Over' : 'Under'}`;
      case 'asian_handicap':
        return `AH+0 - ${market_option === 'home' ? 'Home' : 'Away'}`;
      case 'ou25':
        return `O/U 2.5 - ${market_option === 'over' ? 'Over' : 'Under'}`;
      case 'ou30':
        return `O/U 3.0 - ${market_option === 'over' ? 'Over' : 'Under'}`;
      case 'ou35':
        return `O/U 3.5 - ${market_option === 'over' ? 'Over' : 'Under'}`;
      default:
        return `${market_type} - ${market_option}`;
    }
  };



  // Parse value bets from simulation
  let valueBets: any = {};
  try {
    valueBets = JSON.parse(simulation.value_bets || '{}');
  } catch (e) {
    // Invalid JSON, use empty object
  }

  const pendingBets = allBets.filter(bet => bet.bet_status === 'pending');
  const settledBets = allBets.filter(bet => bet.bet_status !== 'pending');
  const totalStaked = allBets.reduce((sum, bet) => sum + bet.actual_stake, 0);
  const totalProfitLoss = settledBets.reduce((sum, bet) => sum + (bet.profit_loss || 0), 0);
  const maxPotentialWin = pendingBets.reduce((sum, bet) => sum + bet.max_win, 0);
  
  const getBetStatusColor = (status: string) => {
    switch (status) {
      case 'won': return 'text-success bg-success/10 border-success/20';
      case 'lost': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'pushed': return 'text-muted-foreground bg-muted/10 border-muted/20';
      default: return 'text-warning bg-warning/10 border-warning/20';
    }
  };
  
  const getBetStatusIcon = (status: string) => {
    switch (status) {
      case 'won': return '🟢';
      case 'lost': return '🔴';
      case 'pushed': return '⚪';
      default: return '🟡';
    }
  };
  
  const getBetStatusLabel = (status: string) => {
    switch (status) {
      case 'won': return 'WON';
      case 'lost': return 'LOST';
      case 'pushed': return 'PUSH';
      default: return 'PENDING';
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      {/* Match Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-card-foreground">
            {simulation.home_team_name} vs {simulation.away_team_name}
          </h3>
          <p className="text-muted-foreground">
            {new Date(simulation.match_date).toLocaleDateString()} • {simulation.iterations.toLocaleString()} iterations
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Simulation ID</div>
          <div className="text-lg font-bold text-primary">#{simulation.id}</div>
        </div>
      </div>


      {/* Bets Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/20 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{allBets.length}</div>
          <div className="text-sm text-muted-foreground">Total Bets</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-warning">${totalStaked.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">Total Staked</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
            ${totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">P&L</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-muted-foreground">${maxPotentialWin.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">Pending Win</div>
        </div>
      </div>

      {/* All Bets with Status */}
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : allBets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">📊</div>
          <p>No bets placed on this match</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="font-semibold text-card-foreground mb-3">💰 Match Bets ({allBets.length})</h4>
          {allBets.map((bet) => (
            <div key={bet.id} className={`p-4 rounded-lg border transition-all ${
              getBetStatusColor(bet.bet_status)
            }`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getBetStatusIcon(bet.bet_status)}</span>
                    <h5 className="font-semibold text-card-foreground">
                      {simulation.home_team_name} vs {simulation.away_team_name}
                    </h5>
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${
                      getBetStatusColor(bet.bet_status)
                    }`}>
                      {getBetStatusLabel(bet.bet_status)}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-card-foreground mb-1">
                    {getMarketDisplayName(bet)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${bet.actual_stake} @ {bet.selected_odds.toFixed(2)} (Book) vs {(bet.true_probability && Number(bet.true_probability) > 0) ? (1 / Number(bet.true_probability)).toFixed(2) : 'N/A'} (True) • {bet.confidence_level} confidence
                  </div>
                  {bet.bet_status !== 'pending' && bet.profit_loss !== undefined && (
                    <div className="mt-2 text-sm">
                      <span className={`font-bold ${
                        bet.profit_loss > 0 ? 'text-success' : 
                        bet.profit_loss < 0 ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {bet.profit_loss > 0 ? '+' : ''}${bet.profit_loss.toFixed(2)} 
                        {bet.profit_loss > 0 ? 'Profit' : bet.profit_loss < 0 ? 'Loss' : 'Break Even'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-success font-bold">+{bet.edge_percentage.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">edge</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simple Match Settlement - Scores Only */}
      <SimpleMatchSettlement
        simulationId={simulation.id}
        homeTeamName={simulation.home_team_name}
        awayTeamName={simulation.away_team_name}
        hasPendingBets={pendingBets.length > 0}
        pendingBets={pendingBets}
        onSettlement={() => {
          loadSimulationBets(); // This will reload and show updated bet statuses
          onBetSettlement?.();
        }}
      />
    </div>
  );
};

interface PendingBet {
  id: number;
  market_type: string;
  market_option: string;
  selected_odds: number;
  actual_stake: number;
  edge_percentage: number;
  max_win: number;
}

interface SimpleMatchSettlementProps {
  simulationId: number;
  homeTeamName: string;
  awayTeamName: string;
  hasPendingBets: boolean;
  pendingBets: PendingBet[];
  onSettlement: () => void;
}

const SimpleMatchSettlement: React.FC<SimpleMatchSettlementProps> = ({
  simulationId,
  homeTeamName,
  awayTeamName,
  hasPendingBets,
  pendingBets,
  onSettlement
}) => {
  const [matchScore, setMatchScore] = useState({
    home_score_ht: '',
    away_score_ht: '',
    home_score_ft: '',
    away_score_ft: ''
  });
  const [betResults, setBetResults] = useState<{ [betId: number]: 'won' | 'lost' | 'push' }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmitResult = async () => {
    if (!matchScore.home_score_ft || !matchScore.away_score_ft || 
        !matchScore.home_score_ht || !matchScore.away_score_ht) {
      alert('Please enter both half-time and full-time scores');
      return;
    }

    // Check that all pending bets have results selected
    const missingResults = pendingBets.filter(bet => !betResults[bet.id]);
    if (missingResults.length > 0) {
      alert(`Please select Won/Lost/Push for all bets. Missing: ${missingResults.length} bet(s)`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // First save the match result
      const matchResponse = await fetch('/api/match-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulation_id: simulationId,
          home_score_ht: parseInt(matchScore.home_score_ht),
          away_score_ht: parseInt(matchScore.away_score_ht),
          home_score_ft: parseInt(matchScore.home_score_ft),
          away_score_ft: parseInt(matchScore.away_score_ft)
        })
      });

      if (!matchResponse.ok) {
        const errorData = await matchResponse.text();
        throw new Error(`Failed to save match result: ${errorData}`);
      }

      // Then manually settle each bet
      const settlementPromises = pendingBets.map(async (bet) => {
        const result = betResults[bet.id];
        return fetch('/api/place-bet', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bet_id: bet.id,
            actual_result: result === 'push' ? 'push' : (result === 'won')
          })
        });
      });

      await Promise.all(settlementPromises);

      setShowForm(false);
      setMatchScore({ home_score_ht: '', away_score_ht: '', home_score_ft: '', away_score_ft: '' });
      setBetResults({});
      onSettlement();
      alert('✅ Match result and bets settled successfully!');
    } catch (error) {
      console.error('Settlement error:', error);
      alert(`❌ Failed to save result: ${error.message}\n\nPlease check the console for details and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-lg font-semibold text-card-foreground">⚽ Match Settlement</h4>
          <p className="text-sm text-muted-foreground">
            {hasPendingBets ? 'Enter final scores to settle bets manually' : 'Enter final scores for learning system'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity"
        >
          {showForm ? '❌ Cancel' : '📊 Mark as Settled'}
        </button>
      </div>

      {showForm && (
        <div className="bg-primary/10 rounded-lg p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Half-Time Scores */}
            <div>
              <h5 className="text-sm font-medium text-card-foreground mb-3">Half-Time Score</h5>
              <div className="flex items-center gap-3 justify-center">
                <div className="text-center">
                  <label className="block text-xs text-muted-foreground mb-1">{homeTeamName} (HT)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={matchScore.home_score_ht}
                    onChange={(e) => setMatchScore(prev => ({ ...prev, home_score_ht: e.target.value }))}
                    className="w-16 px-2 py-2 bg-input rounded text-card-foreground text-center font-bold border border-border focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="text-muted-foreground font-bold text-xl">-</div>
                <div className="text-center">
                  <label className="block text-xs text-muted-foreground mb-1">{awayTeamName} (HT)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={matchScore.away_score_ht}
                    onChange={(e) => setMatchScore(prev => ({ ...prev, away_score_ht: e.target.value }))}
                    className="w-16 px-2 py-2 bg-input rounded text-card-foreground text-center font-bold border border-border focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Full-Time Scores */}
            <div>
              <h5 className="text-sm font-medium text-card-foreground mb-3">Full-Time Score</h5>
              <div className="flex items-center gap-3 justify-center">
                <div className="text-center">
                  <label className="block text-xs text-muted-foreground mb-1">{homeTeamName} (FT)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={matchScore.home_score_ft}
                    onChange={(e) => setMatchScore(prev => ({ ...prev, home_score_ft: e.target.value }))}
                    className="w-16 px-2 py-2 bg-input rounded text-card-foreground text-center font-bold border border-border focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="text-muted-foreground font-bold text-xl">-</div>
                <div className="text-center">
                  <label className="block text-xs text-muted-foreground mb-1">{awayTeamName} (FT)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={matchScore.away_score_ft}
                    onChange={(e) => setMatchScore(prev => ({ ...prev, away_score_ft: e.target.value }))}
                    className="w-16 px-2 py-2 bg-input rounded text-card-foreground text-center font-bold border border-border focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Manual Bet Settlement */}
          {pendingBets.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h5 className="text-sm font-medium text-card-foreground mb-4">⚽ Bet Results - Select Won/Lost/Push</h5>
              <div className="space-y-3">
                {pendingBets.map((bet) => (
                  <div key={bet.id} className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="font-medium text-card-foreground text-sm">
                          {bet.market_type} - {bet.market_option}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${bet.actual_stake} @ {bet.selected_odds} (+{bet.edge_percentage.toFixed(1)}%)
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setBetResults(prev => ({ ...prev, [bet.id]: 'won' }))}
                          style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '600',
                            borderRadius: '8px',
                            minWidth: '80px',
                            backgroundColor: betResults[bet.id] === 'won' ? '#16a34a' : '#374151',
                            color: betResults[bet.id] === 'won' ? '#ffffff' : '#ffffff',
                            border: '2px solid #6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Won
                        </button>
                        <button
                          onClick={() => setBetResults(prev => ({ ...prev, [bet.id]: 'lost' }))}
                          style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '600',
                            borderRadius: '8px',
                            minWidth: '80px',
                            backgroundColor: betResults[bet.id] === 'lost' ? '#dc2626' : '#374151',
                            color: betResults[bet.id] === 'lost' ? '#ffffff' : '#ffffff',
                            border: '2px solid #6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Lost
                        </button>
                        <button
                          onClick={() => setBetResults(prev => ({ ...prev, [bet.id]: 'push' }))}
                          style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '600',
                            borderRadius: '8px',
                            minWidth: '80px',
                            backgroundColor: betResults[bet.id] === 'push' ? '#ca8a04' : '#374151',
                            color: betResults[bet.id] === 'push' ? '#ffffff' : '#ffffff',
                            border: '2px solid #6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Push
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={handleSubmitResult}
              disabled={isSubmitting || !matchScore.home_score_ft || !matchScore.away_score_ft || !matchScore.home_score_ht || !matchScore.away_score_ht}
              className="px-6 py-3 bg-success text-success-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isSubmitting ? '⚡ Settling...' : `💾 Save Result ${hasPendingBets ? '& Settle Bets' : ''}`}
            </button>
          </div>

        </div>
      )}
    </div>
  );
};