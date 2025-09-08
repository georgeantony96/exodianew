'use client';

import React, { useState, useMemo, useEffect } from 'react';

interface ValueBet {
  edge: number;
  true_odds: number;
  bookmaker_odds: number;
  true_probability: number;
  confidence: 'High' | 'Medium' | 'Low' | 'None';
}

interface ValueBets {
  [market: string]: {
    [outcome: string]: ValueBet;
  };
}

interface BankrollStatus {
  current_balance: number;
}

interface ValueBetsWithFlatStakingProps {
  simulationResults: any;
  simulationId: number;
  bookmakerOdds: any;
  leagueContext: any;
  onBankrollUpdate?: () => void;
  flatStakeAmount?: number;
}

export const ValueBetsWithFlatStaking: React.FC<ValueBetsWithFlatStakingProps> = ({
  simulationResults,
  simulationId,
  bookmakerOdds,
  leagueContext,
  onBankrollUpdate,
  flatStakeAmount = 100
}) => {
  const [bankroll, setBankroll] = useState<BankrollStatus | null>(null);
  const [selectedBets, setSelectedBets] = useState<Set<string>>(new Set());
  const [customStakes, setCustomStakes] = useState<Record<string, number>>({});
  const [placingBets, setPlacingBets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [defaultStake, setDefaultStake] = useState(flatStakeAmount);

  // Extract simulation data
  const valueBets = simulationResults?.results?.value_bets || simulationResults?.value_bets || {};
  const homeTeamName = simulationResults?.results?.home_team || simulationResults?.home_team || 'Home Team';
  const awayTeamName = simulationResults?.results?.away_team || simulationResults?.away_team || 'Away Team';

  // Load bankroll and set default stakes
  useEffect(() => {
    // Only run if we have simulation results AND value bets data
    if (simulationResults && valueBets && typeof valueBets === 'object' && Object.keys(valueBets).length > 0) {
      loadBankrollAndSetDefaults();
    } else {
      // Clear loading state if no data to process
      setLoading(false);
    }
  }, [simulationResults, defaultStake]);

  const loadBankrollAndSetDefaults = async () => {
    try {
      setLoading(true);
      
      // Get current bankroll with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const bankrollResponse = await fetch('/api/bankroll', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!bankrollResponse.ok) {
        throw new Error(`Bankroll API failed: ${bankrollResponse.status}`);
      }
      
      const bankrollData = await bankrollResponse.json();
      
      if (bankrollData.success) {
        setBankroll(bankrollData.bankroll);
        
        // Set default flat stakes for each value bet
        if (valueBets && typeof valueBets === 'object') {
          const stakes: Record<string, number> = {};
          for (const [market, outcomes] of Object.entries(valueBets)) {
            if (outcomes && typeof outcomes === 'object') {
              for (const [outcome] of Object.entries(outcomes as any)) {
                const betKey = `${market}_${outcome}`;
                stakes[betKey] = defaultStake;
              }
            }
          }
          setCustomStakes(stakes);
        }
      } else {
        console.warn('Bankroll API response was not successful:', bankrollData);
      }
    } catch (error) {
      console.error('Error loading bankroll:', error);
      // Set empty state to prevent infinite loops
      setBankroll(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getDisplayName = (market: string, outcome: string): string => {
    switch (market) {
      case '1x2':
        if (outcome === 'home') return `${homeTeamName} Win`;
        if (outcome === 'away') return `${awayTeamName} Win`;
        if (outcome === 'draw') return 'Draw';
        break;
      case 'over_under':
        if (outcome.includes('over')) {
          const goals = outcome.replace('over_', '').replace('5', '.5');
          return `Over ${goals} Goals`;
        }
        if (outcome.includes('under')) {
          const goals = outcome.replace('under_', '').replace('5', '.5');
          return `Under ${goals} Goals`;
        }
        break;
      case 'both_teams_score':
        return outcome === 'yes' ? 'Both Teams Score' : 'Both Teams Not Score';
    }
    return `${market} - ${outcome}`;
  };

  // Flatten and process value bets
  const processedValueBets = useMemo(() => {
    const flattened: Array<{
      market: string;
      outcome: string;
      bet: ValueBet;
      displayName: string;
      betKey: string;
    }> = [];

    if (valueBets && typeof valueBets === 'object') {
      Object.entries(valueBets).forEach(([market, outcomes]) => {
        if (outcomes && typeof outcomes === 'object') {
          Object.entries(outcomes).forEach(([outcome, bet]) => {
            const betKey = `${market}_${outcome}`;
            const displayName = getDisplayName(market, outcome);
            
            flattened.push({
              market,
              outcome,
              bet,
              displayName,
              betKey
            });
          });
        }
      });
    }

    // Sort by edge descending
    return flattened.sort((a, b) => b.bet.edge - a.bet.edge);
  }, [valueBets, homeTeamName, awayTeamName]);

  const handleBetSelection = (betKey: string, selected: boolean) => {
    setSelectedBets(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(betKey);
      } else {
        newSet.delete(betKey);
      }
      return newSet;
    });
  };

  const handleStakeChange = (betKey: string, stake: number) => {
    setCustomStakes(prev => ({
      ...prev,
      [betKey]: Math.max(0, stake)
    }));
  };

  const placeBet = async (item: any) => {
    const { market, outcome, bet, betKey } = item;
    const customStake = customStakes[betKey] || 0;
    
    if (customStake <= 0) {
      alert('Please enter a valid stake amount');
      return;
    }

    if (!bankroll || customStake > bankroll.current_balance) {
      alert('Insufficient funds');
      return;
    }

    try {
      setPlacingBets(prev => new Set([...prev, betKey]));

      const betData = {
        simulation_id: simulationId,
        market_type: market,
        market_option: outcome,
        selected_odds: bet.bookmaker_odds,
        true_probability: bet.true_probability ? (bet.true_probability > 1 ? bet.true_probability / 100 : bet.true_probability) : 0,
        edge_percentage: bet.edge || 0,
        actual_stake: customStake,
        league_id: leagueContext?.id,
        bet_reasoning: `Value bet with ${(bet.edge || 0).toFixed(1)}% edge`,
        confidence_level: bet.confidence?.toUpperCase() || 'MEDIUM'
      };

      console.log('Sending bet data:', betData);
      console.log('simulationId prop received:', simulationId);

      const response = await fetch('/api/place-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(betData)
      });

      const data = await response.json();

      if (data.success) {
        alert(`Bet placed successfully! $${customStake} on ${getDisplayName(market, outcome)}`);
        
        // Update bankroll
        if (data.bankroll_updated) {
          setBankroll(data.bankroll_updated);
          onBankrollUpdate?.();
        }

        // Remove from selected bets
        setSelectedBets(prev => {
          const newSet = new Set(prev);
          newSet.delete(betKey);
          return newSet;
        });
      } else {
        alert(`Error placing bet: ${data.error}`);
      }
    } catch (error) {
      console.error('Error placing bet:', error);
      alert('Failed to place bet. Please try again.');
    } finally {
      setPlacingBets(prev => {
        const newSet = new Set(prev);
        newSet.delete(betKey);
        return newSet;
      });
    }
  };

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'very_high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getEdgeColor = (edge: number): string => {
    if (edge >= 15) return 'bg-green-600 text-white';
    if (edge >= 10) return 'bg-green-700 text-white';
    if (edge >= 5) return 'bg-blue-600 text-white';
    return 'bg-yellow-600 text-white';
  };

  // Don't render anything if there are no simulation results
  if (!simulationResults) {
    return null;
  }

  // Don't render if there are no value bets to process
  if (!valueBets || typeof valueBets !== 'object' || Object.keys(valueBets).length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-white">🎯 Flat Staking Analysis</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-white mb-2">No Value Bets Available</h3>
          <p className="text-gray-300">
            Flat staking requires value betting opportunities.
          </p>
        </div>
      </div>
    );
  }

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

  if (!processedValueBets.length) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-white">🎯 Flat Staking Analysis</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-white mb-2">No Value Bets Found</h3>
          <p className="text-gray-300">
            The current bookmaker odds appear to be efficiently priced relative to our simulation results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">🎯 Value Bets with Flat Staking</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-300">
            Balance: <span className="text-green-400 font-semibold">${bankroll?.current_balance.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Default Stake:</label>
            <input
              type="number"
              min="1"
              max={bankroll?.current_balance || 1000}
              value={defaultStake}
              onChange={(e) => {
                const newStake = parseFloat(e.target.value) || 100;
                setDefaultStake(newStake);
                // Update all custom stakes to new default
                const newStakes: Record<string, number> = {};
                processedValueBets.forEach(item => {
                  newStakes[item.betKey] = newStake;
                });
                setCustomStakes(newStakes);
              }}
              className="w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-700 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {processedValueBets.length}
          </div>
          <div className="text-sm text-gray-300">Value Bets Found</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {processedValueBets.filter(item => item.bet.edge >= 5).length}
          </div>
          <div className="text-sm text-gray-300">High Value (5%+)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {processedValueBets.length > 0 
              ? Math.max(...processedValueBets.map(item => item.bet.edge)).toFixed(1) 
              : '0.0'
            }%
          </div>
          <div className="text-sm text-gray-300">Best Edge</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{color: 'var(--purple-text-medium)'}}>
            ${processedValueBets.length > 0 
              ? (processedValueBets.length * defaultStake).toFixed(0)
              : '0'
            }
          </div>
          <div className="text-sm text-gray-300">Total Flat Stakes</div>
        </div>
      </div>

      {/* Value Bets List */}
      <div className="space-y-4">
        {processedValueBets.map((item) => {
          const isSelected = selectedBets.has(item.betKey);
          const customStake = customStakes[item.betKey] || 0;
          const isPlacing = placingBets.has(item.betKey);
          const potentialProfit = customStake * (item.bet.bookmaker_odds - 1);

          return (
            <div
              key={item.betKey}
              className={`p-4 border-2 rounded-lg transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-900/20' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleBetSelection(item.betKey, e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        {item.displayName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {item.bet.confidence} Confidence • {(item.bet.true_probability || 0).toFixed(1)}% True Probability
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-400">Edge:</span>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-bold ml-2 ${getEdgeColor(item.bet.edge || 0)}`}>
                        +{(item.bet.edge || 0).toFixed(1)}%
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-400">Odds:</span>
                      <div className="text-white font-bold">
                        {(item.bet.bookmaker_odds || 0).toFixed(2)}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-400">Flat Stake:</span>
                      <div className="text-blue-400 font-bold">
                        ${defaultStake}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-400">Potential Profit:</span>
                      <div className="text-green-400 font-bold">
                        ${(defaultStake * (item.bet.bookmaker_odds - 1)).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Flat Staking Analysis */}
                  <div className="bg-gray-700 p-3 rounded-lg mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-blue-400">Flat Staking Analysis</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.bet.edge >= 3 ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                      }`}>
                        {item.bet.edge >= 3 ? 'GOOD VALUE' : 'LOW VALUE'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Flat Stake:</span>
                        <div className="text-green-400 font-bold">
                          ${defaultStake.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Expected Value:</span>
                        <div className="text-green-400 font-bold">
                          +{((item.bet.edge / 100) * defaultStake).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bet Placement */}
                  {isSelected && (
                    <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-600">
                      <h4 className="font-semibold text-blue-300 mb-3">Place Your Bet</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Stake Amount ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={bankroll?.current_balance || 0}
                            value={customStake}
                            onChange={(e) => handleStakeChange(item.betKey, parseFloat(e.target.value) || 0)}
                            className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white"
                            placeholder="Enter stake"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Default flat stake: ${defaultStake.toFixed(2)}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Potential Profit</label>
                          <div className="mt-1 p-2 bg-gray-700 rounded border">
                            <span className="text-green-400 font-bold">
                              ${potentialProfit.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            If bet wins
                          </p>
                        </div>
                        
                        <div className="flex items-end">
                          <button
                            onClick={() => placeBet(item)}
                            disabled={customStake <= 0 || isPlacing || !bankroll || customStake > bankroll.current_balance}
                            className={`w-full py-2 px-4 rounded font-semibold ${
                              customStake > 0 && !isPlacing && bankroll && customStake <= bankroll.current_balance
                                ? 'bg-green-600 hover:bg-green-500 text-white'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {isPlacing ? 'Placing...' : 'Place Bet'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Flat Staking Actions */}
      {selectedBets.size > 0 && (
        <div className="mt-6 p-4 bg-green-900/20 rounded-lg border border-green-600/30">
          <h3 className="font-semibold text-green-300 mb-2">
            Quick Actions ({selectedBets.size} bets selected)
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                selectedBets.forEach(betKey => {
                  handleStakeChange(betKey, defaultStake);
                });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              Use Default Stakes (${defaultStake})
            </button>
            <button
              onClick={() => {
                selectedBets.forEach(betKey => {
                  handleStakeChange(betKey, 10);
                });
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500"
            >
              $10 Stakes
            </button>
            <button
              onClick={() => {
                selectedBets.forEach(betKey => {
                  handleStakeChange(betKey, 50);
                });
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-500"
            >
              $50 Stakes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};