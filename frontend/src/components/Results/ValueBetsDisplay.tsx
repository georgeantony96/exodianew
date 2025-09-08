'use client';

import React, { useMemo, useState, useImperativeHandle, forwardRef } from 'react';

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

interface ValueBetsDisplayProps {
  simulationResults: any;
  simulationId: number;
  bookmakerOdds: any;
  leagueContext: any;
  onBankrollUpdate?: () => void;
  onSelectedBetsChange?: (selectedBets: Set<string>, processedBets: any[]) => void;
}

export interface ValueBetsDisplayRef {
  getSelectedBets: () => any[];
  saveSelectedBets: (simulationId?: number) => Promise<void>;
}

export const ValueBetsDisplay = forwardRef<ValueBetsDisplayRef, ValueBetsDisplayProps>((
  {
    simulationResults,
    simulationId,
    bookmakerOdds,
    leagueContext,
    onBankrollUpdate,
    onSelectedBetsChange
  },
  ref
) => {
  const [selectedBets, setSelectedBets] = useState<Set<string>>(new Set());
  const [savingBets, setSavingBets] = useState(false);

  // Extract simulation data
  const valueBets = simulationResults?.results?.value_bets || simulationResults?.value_bets || {};
  const homeTeamName = simulationResults?.results?.home_team || simulationResults?.home_team || 'Home Team';
  const awayTeamName = simulationResults?.results?.away_team || simulationResults?.away_team || 'Away Team';

  // Process value bets for display
  const processedValueBets = useMemo(() => {
    const bets: Array<{
      id: string;
      market: string;
      outcome: string;
      displayName: string;
      edge: number;
      trueOdds: number;
      bookmakerOdds: number;
      trueProbability: number;
      confidence: string;
      potentialProfit: number;
    }> = [];

    if (!valueBets || typeof valueBets !== 'object') {
      return bets;
    }

    Object.entries(valueBets).forEach(([market, outcomes]) => {
      if (!outcomes || typeof outcomes !== 'object') return;

      Object.entries(outcomes).forEach(([outcome, bet]) => {
        if (!bet || typeof bet !== 'object') return;

        const valueBet = bet as ValueBet;
        if (!valueBet.edge || valueBet.edge <= 0) return;

        // Get display name
        let displayName = '';
        switch (market) {
          // Full Time Markets
          case '1x2_ft':
            switch (outcome) {
              case 'home': displayName = `${homeTeamName} Win`; break;
              case 'away': displayName = `${awayTeamName} Win`; break;
              case 'draw': displayName = 'Draw'; break;
              default: displayName = outcome;
            }
            break;
          case 'over_under_25':
            displayName = `Over/Under 2.5 Goals - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          case 'over_under_3':
            displayName = `Over/Under 3.0 Goals - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          case 'over_under_35':
            displayName = `Over/Under 3.5 Goals - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          case 'gg_ng':
            displayName = outcome === 'gg' ? 'Both Teams to Score - Yes (GG)' : 'Both Teams to Score - No (NG)';
            break;
          case 'double_chance':
            switch (outcome) {
              case '1x': displayName = `Double Chance - 1X (${homeTeamName} or Draw)`; break;
              case '12': displayName = `Double Chance - 12 (${homeTeamName} or ${awayTeamName})`; break;
              case '2x': displayName = `Double Chance - 2X (${awayTeamName} or Draw)`; break;
              default: displayName = `Double Chance - ${outcome}`;
            }
            break;
          case 'asian_handicap_0':
            displayName = `AH+0 - ${outcome === 'home' ? homeTeamName + ' +0' : awayTeamName + ' +0'}`;
            break;
          case 'asian_handicap_minus1_plus1':
            displayName = `AH -1/+1 - ${outcome === 'home' ? homeTeamName + ' -1' : awayTeamName + ' +1'}`;
            break;
          case 'asian_handicap_plus1_minus1':
            displayName = `AH +1/-1 - ${outcome === 'home' ? homeTeamName + ' +1' : awayTeamName + ' -1'}`;
            break;
          
          // Half Time Markets
          case '1x2_ht':
            switch (outcome) {
              case 'home': displayName = `${homeTeamName} Win (HT)`; break;
              case 'away': displayName = `${awayTeamName} Win (HT)`; break;
              case 'draw': displayName = 'Draw (HT)'; break;
              default: displayName = `${outcome} (HT)`;
            }
            break;
          case 'asian_handicap_0_ht':
            displayName = `AH+0 HT - ${outcome === 'home' ? homeTeamName + ' +0' : awayTeamName + ' +0'}`;
            break;
          case 'over_under_15_ht':
            displayName = `Over/Under 1.5 Goals (HT) - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          
          // Legacy support for old market names
          case '1x2':
            switch (outcome) {
              case 'home': displayName = `${homeTeamName} Win`; break;
              case 'away': displayName = `${awayTeamName} Win`; break;
              case 'draw': displayName = 'Draw'; break;
              default: displayName = outcome;
            }
            break;
          case 'btts':
            displayName = outcome === 'yes' ? 'Both Teams to Score - Yes' : 'Both Teams to Score - No';
            break;
          case 'ou25':
            displayName = `Over/Under 2.5 Goals - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          case 'ou30':
            displayName = `Over/Under 3.0 Goals - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          case 'ou35':
            displayName = `Over/Under 3.5 Goals - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          case 'asian_handicap':
            displayName = `AH+0 - ${outcome === 'home' ? 'Home +0' : 'Away +0'}`;
            break;
          case 'first_half_gg':
            displayName = `1H BTTS - ${outcome === 'yes' ? 'Yes (GG 1H)' : 'No (NG 1H)'}`;
            break;
          case 'first_half_ou15':
            displayName = `1H O/U 1.5 - ${outcome === 'over' ? 'Over' : 'Under'}`;
            break;
          default:
            displayName = `${market} - ${outcome}`;
        }

        bets.push({
          id: `${market}_${outcome}`,
          market,
          outcome,
          displayName,
          edge: valueBet.edge,
          trueOdds: valueBet.true_odds,
          bookmakerOdds: valueBet.bookmaker_odds,
          trueProbability: valueBet.true_probability,
          confidence: valueBet.confidence || 'Medium',
          potentialProfit: (valueBet.bookmaker_odds - 1) * 100 // Assuming $100 stake for display
        });
      });
    });

    return bets.sort((a, b) => b.edge - a.edge);
  }, [valueBets, homeTeamName, awayTeamName]);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high': return 'text-success';
      case 'medium': return 'text-warning';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getEdgeColor = (edge: number) => {
    if (edge >= 10) return 'text-success font-bold';
    if (edge >= 5) return 'text-warning font-semibold';
    if (edge >= 2) return 'text-primary font-medium';
    return 'text-muted-foreground';
  };

  const toggleBetSelection = (betId: string) => {
    setSelectedBets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(betId)) {
        newSet.delete(betId);
      } else {
        newSet.add(betId);
      }
      // Notify parent of selected bets change
      onSelectedBetsChange?.(newSet, processedValueBets);
      return newSet;
    });
  };

  const selectAllBets = () => {
    const newSet = new Set(processedValueBets.map(bet => bet.id));
    setSelectedBets(newSet);
    onSelectedBetsChange?.(newSet, processedValueBets);
  };

  const deselectAllBets = () => {
    const newSet = new Set();
    setSelectedBets(newSet);
    onSelectedBetsChange?.(newSet, processedValueBets);
  };

  const saveSelectedBets = async (overrideSimulationId?: number) => {
    const targetSimulationId = overrideSimulationId || simulationId;
    console.log('saveSelectedBets called', { selectedBets: Array.from(selectedBets), simulationId: targetSimulationId });
    
    if (selectedBets.size === 0) {
      return; // Silent return when no bets selected
    }

    if (!targetSimulationId) {
      alert('No simulation ID available. Please save the simulation first.');
      return;
    }

    setSavingBets(true);
    
    try {
      const selectedBetDetails = processedValueBets.filter(bet => selectedBets.has(bet.id));
      console.log('selectedBetDetails:', selectedBetDetails);
      
      const savePromises = selectedBetDetails.map(async (bet) => {
        console.log('Saving bet:', bet);
        const requestData = {
          simulation_id: targetSimulationId,
          market_type: bet.market,
          market_option: bet.outcome,
          selected_odds: bet.bookmakerOdds,
          true_probability: bet.trueProbability,
          edge_percentage: bet.edge,
          actual_stake: 100, // Default $100 flat stake
          confidence_level: bet.confidence,
          bet_reasoning: `Value bet: +${bet.edge.toFixed(1)}% edge`
        };
        console.log('Request data:', requestData);
        
        const response = await fetch('/api/place-bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to save bet');
        }
        return result;
      });

      await Promise.all(savePromises);
      
      if (!overrideSimulationId) {
        alert(`Successfully saved ${selectedBets.size} bets! View them in History → View Details.`);
      }
      setSelectedBets(new Set());
      onBankrollUpdate?.();
      
    } catch (error) {
      console.error('Error saving bets:', error);
      alert('Failed to save some bets: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSavingBets(false);
    }
  };

  // Expose methods via ref for parent component
  useImperativeHandle(ref, () => ({
    getSelectedBets: () => {
      return processedValueBets.filter(bet => selectedBets.has(bet.id));
    },
    saveSelectedBets: (overrideSimulationId?: number) => saveSelectedBets(overrideSimulationId)
  }));

  if (!processedValueBets.length) {
    return (
      <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
        <h2 className="text-xl font-bold text-card-foreground mb-4">🎯 Value Opportunities</h2>
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">📊</div>
          <p>No value betting opportunities found</p>
          <p className="text-sm mt-1">The simulation found no markets with positive expected value</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-card-foreground">🎯 Value Opportunities</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {processedValueBets.length} opportunities found
          </div>
          {selectedBets.size > 0 && (
            <div className="text-sm font-medium text-primary">
              {selectedBets.size} selected
            </div>
          )}
        </div>
      </div>

      {/* Selection Controls */}
      <div className="mb-4 flex justify-between items-center p-3 bg-muted/10 rounded-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={selectAllBets}
            className="text-sm text-primary hover:underline"
          >
            Select All
          </button>
          <button
            onClick={deselectAllBets}
            className="text-sm text-muted-foreground hover:underline"
          >
            Deselect All
          </button>
        </div>
        
        <button
          onClick={saveSelectedBets}
          disabled={selectedBets.size === 0 || savingBets || !simulationId}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {savingBets ? '💾 Saving...' : `💾 Save Selected Bets (${selectedBets.size})`}
        </button>
      </div>

      <div className="space-y-4">
        {processedValueBets.map((bet) => (
          <div
            key={bet.id}
            className={`p-4 rounded-lg border transition-colors cursor-pointer ${
              selectedBets.has(bet.id)
                ? 'bg-primary/10 border-primary/30 hover:bg-primary/15'
                : 'bg-muted/20 border-border hover:bg-muted/30'
            }`}
            onClick={() => toggleBetSelection(bet.id)}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={selectedBets.has(bet.id)}
                  onChange={() => toggleBetSelection(bet.id)}
                  className="mt-1 w-4 h-4 text-primary bg-input border-border rounded focus:ring-ring focus:ring-2"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-card-foreground mb-1">
                    {bet.displayName}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Market: {bet.market.toUpperCase()}</span>
                    <span className={getConfidenceColor(bet.confidence)}>
                      {bet.confidence} Confidence
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${getEdgeColor(bet.edge)}`}>
                  +{bet.edge.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Edge</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">True Odds:</span>
                <div className="font-semibold text-card-foreground">{bet.trueOdds.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Book Odds:</span>
                <div className="font-semibold text-card-foreground">{bet.bookmakerOdds.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">True Probability:</span>
                <div className="font-semibold text-card-foreground">{(bet.trueProbability * 100).toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Potential Profit:</span>
                <div className="font-semibold text-success">${bet.potentialProfit.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">($100 stake)</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-success/10 rounded-lg border border-success/20">
        <p className="text-sm text-muted-foreground">
          ✅ <strong>Workflow:</strong> Select bets above → Save Selected Bets → Go to <strong>History → View Details</strong> to settle them with closing odds.
        </p>
      </div>
    </div>
  );
});

ValueBetsDisplay.displayName = 'ValueBetsDisplay';