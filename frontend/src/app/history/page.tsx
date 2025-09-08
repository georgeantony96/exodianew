'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { MatchDetails } from '@/components/Match/MatchDetails';
import { BankrollManager } from '@/components/Bankroll/BankrollManager';

interface PendingBet {
  id: number;
  market_type: string;
  market_option: string;
  selected_odds: number;
  actual_stake: number;
  edge_percentage: number;
  true_probability?: number;
}

interface Simulation {
  id: number;
  home_team_name: string;
  away_team_name: string;
  league_name?: string;
  match_date: string;
  distribution_type: 'poisson' | 'negative_binomial';
  iterations: number;
  home_boost: number;
  away_boost: number;
  home_advantage: number;
  true_odds: string; // JSON string
  value_bets: string; // JSON string
  created_at: string;
  has_result?: boolean;
  accuracy?: number;
  bet_status?: 'pending' | 'won' | 'lost' | 'mixed' | 'none';
  total_bets?: number;
  pending_bets?: number;
  won_bets?: number;
  lost_bets?: number;
  pending_bet_details?: PendingBet[]; // Add detailed bet information
}

interface SimulationResult {
  id: number;
  simulation_id: number;
  home_score_ht: number;
  away_score_ht: number;
  home_score_ft: number;
  away_score_ft: number;
  accuracy_metrics: string;
  result_entered_at: string;
}

export default function HistoryPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultForm, setResultForm] = useState({
    home_score_ht: 0,
    away_score_ht: 0,
    home_score_ft: 0,
    away_score_ft: 0
  });
  const [filterBy, setFilterBy] = useState<'pending_bets' | 'archive'>('pending_bets');
  const [sortBy, setSortBy] = useState<'league' | 'accuracy' | 'time_input'>('league');
  const [selectedForDelete, setSelectedForDelete] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedSimulations, setExpandedSimulations] = useState<Set<number>>(new Set());
  const [deleteType, setDeleteType] = useState<'single' | 'selected' | 'all'>('single');
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedForDetails, setSelectedForDetails] = useState<Simulation | null>(null);

  useEffect(() => {
    fetchSimulations();
  }, []);

  const fetchSimulations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/simulations');
      if (response.ok) {
        const data = await response.json();
        
        // Fetch pending bet details for each simulation with pending bets
        const enrichedSimulations = await Promise.all(data.map(async (simulation: Simulation) => {
          if (simulation.pending_bets && simulation.pending_bets > 0) {
            try {
              const betResponse = await fetch(`/api/place-bet?simulation_id=${simulation.id}`);
              if (betResponse.ok) {
                const betData = await betResponse.json();
                simulation.pending_bet_details = betData.pending_bets || [];
              }
            } catch (error) {
              console.error(`Failed to fetch bet details for simulation ${simulation.id}:`, error);
            }
          }
          return simulation;
        }));
        
        setSimulations(enrichedSimulations);
      } else {
        console.error('Failed to fetch simulations');
      }
    } catch (error) {
      console.error('Error fetching simulations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddResult = (simulation: Simulation) => {
    setSelectedSimulation(simulation);
    setShowResultModal(true);
    setResultForm({
      home_score_ht: 0,
      away_score_ht: 0,
      home_score_ft: 0,
      away_score_ft: 0
    });
  };

  const submitResult = async () => {
    if (!selectedSimulation) return;

    try {
      const response = await fetch('/api/match-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          simulation_id: selectedSimulation.id,
          ...resultForm
        })
      });

      if (response.ok) {
        setShowResultModal(false);
        fetchSimulations(); // Refresh the list
      } else {
        console.error('Failed to submit result');
      }
    } catch (error) {
      console.error('Error submitting result:', error);
    }
  };

  const handleDeleteSingle = (simulationId: number) => {
    setDeleteType('single');
    setDeleteTargetId(simulationId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteSelected = () => {
    if (selectedForDelete.size === 0) return;
    setDeleteType('selected');
    setShowDeleteConfirm(true);
  };

  const handleDeleteAll = () => {
    setDeleteType('all');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);

      let url = '/api/simulations';
      if (deleteType === 'single' && deleteTargetId) {
        url += `?id=${deleteTargetId}`;
      } else if (deleteType === 'selected') {
        const ids = Array.from(selectedForDelete).join(',');
        url += `?ids=${ids}`;
      } else if (deleteType === 'all') {
        url += '?bulk=all';
      }

      const response = await fetch(url, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        setSelectedForDelete(new Set());
        fetchSimulations(); // Refresh the list
      } else {
        console.error('Failed to delete simulations');
      }
    } catch (error) {
      console.error('Error deleting simulations:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectForDelete = (simulationId: number) => {
    setSelectedForDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(simulationId)) {
        newSet.delete(simulationId);
      } else {
        newSet.add(simulationId);
      }
      return newSet;
    });
  };

  const selectAllForDelete = () => {
    const allIds = new Set(filteredAndSortedSimulations.map(sim => sim.id));
    setSelectedForDelete(allIds);
  };

  const deselectAll = () => {
    setSelectedForDelete(new Set());
  };

  const toggleSimulationDetails = (simulationId: number) => {
    setExpandedSimulations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(simulationId)) {
        newSet.delete(simulationId);
      } else {
        newSet.add(simulationId);
      }
      return newSet;
    });
  };

  const handleViewDetails = (simulation: Simulation) => {
    toggleSimulationDetails(simulation.id);
  };

  const filteredAndSortedSimulations = simulations
    .filter(sim => {
      switch (filterBy) {
        case 'pending_bets': return (sim.pending_bets || 0) > 0;
        case 'archive': return (sim.pending_bets || 0) === 0;
        default: return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'league':
          const aLeague = a.league_name || 'Unknown League';
          const bLeague = b.league_name || 'Unknown League';
          return aLeague.localeCompare(bLeague);
        case 'accuracy':
          return (b.accuracy || 0) - (a.accuracy || 0);
        case 'time_input':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  const getValueBetsCount = (simulation: Simulation): number => {
    try {
      const valueBets = JSON.parse(simulation.value_bets || '{}');
      let count = 0;
      
      // Handle different JSON structures
      if (Array.isArray(valueBets)) {
        count = valueBets.length;
      } else {
        // Handle nested object structure
        Object.values(valueBets).forEach((markets: any) => {
          if (typeof markets === 'object' && markets !== null) {
            count += Object.keys(markets).length;
          } else {
            count += 1; // Direct value bet
          }
        });
      }
      return count;
    } catch (error) {
      console.log('Error parsing value_bets for simulation', simulation.id, ':', error);
      return 0;
    }
  };

  const formatDate = (dateString: string): string => {
    // Handle both UTC and local timestamp formats
    let date;
    
    // Check if it's already a proper ISO string or needs conversion
    if (dateString.includes('T') || dateString.includes('Z')) {
      date = new Date(dateString);
    } else {
      // SQLite CURRENT_TIMESTAMP format - treat as local time
      date = new Date(dateString + ' UTC'); // Force UTC interpretation then convert
      // Adjust for local timezone offset
      const offset = date.getTimezoneOffset() * 60000;
      date = new Date(date.getTime() - offset);
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getLeagueColor = (league: string): string => {
    // Generate consistent colors based on league name hash
    const hash = league.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const colorIndex = Math.abs(hash) % 6;
    const colors = [
      'bg-primary/10 text-primary border border-primary/20',
      'bg-chart-1/10 text-chart-1 border border-chart-1/20',
      'bg-chart-2/10 text-chart-2 border border-chart-2/20',
      'bg-chart-3/10 text-chart-3 border border-chart-3/20',
      'bg-chart-4/10 text-chart-4 border border-chart-4/20',
      'bg-chart-5/10 text-chart-5 border border-chart-5/20'
    ];
    return colors[colorIndex];
  };

  const formatBetDetails = (bet: PendingBet) => {
    // Format market name (e.g., "ou25_over" -> "O/U 2.5 - Over")
    let marketDisplayName = bet.market_type || '';
    if (marketDisplayName.includes('ou')) {
      const line = marketDisplayName.replace('ou', '');
      const formattedLine = (parseInt(line) / 10).toFixed(1);
      marketDisplayName = `O/U ${formattedLine}`;
    } else if (marketDisplayName === '1x2') {
      marketDisplayName = '1X2';
    } else if (marketDisplayName === 'btts') {
      marketDisplayName = 'BTTS';
    } else if (marketDisplayName.includes('ah')) {
      marketDisplayName = 'AH ' + marketDisplayName.replace('ah', '').replace('_', '/');
    }
    
    const optionDisplay = (bet.market_option || '').charAt(0).toUpperCase() + (bet.market_option || '').slice(1);
    const fullMarketName = `${marketDisplayName} - ${optionDisplay}`;
    
    // Calculate true odds from true probability with defensive checks
    const trueOdds = (bet.true_probability && bet.true_probability > 0) ? (1 / bet.true_probability).toFixed(2) : 'N/A';
    const stake = bet.actual_stake || 0;
    const bookOdds = (bet.selected_odds || 0).toFixed(2);
    
    return `${fullMarketName} | $${stake} @ ${bookOdds} (Book) vs ${trueOdds} (True)`;
  };

  const getBetStatusInfo = (simulation: Simulation) => {
    const pendingBets = simulation.pending_bets || 0;
    const wonBets = simulation.won_bets || 0;
    const lostBets = simulation.lost_bets || 0;
    const totalBets = simulation.total_bets || 0;

    if (totalBets === 0) {
      return {
        status: 'none' as const,
        color: 'border-border bg-card',
        icon: '⚪',
        label: 'No Bets',
        details: null
      };
    }

    if (pendingBets > 0 && (wonBets + lostBets) === 0) {
      // Show detailed bet information if available
      const betDetails = simulation.pending_bet_details || [];
      const detailsText = betDetails.length > 0 
        ? betDetails.map(bet => formatBetDetails(bet)).join(' • ')
        : `${pendingBets} Pending`;
      
      return {
        status: 'pending' as const,
        color: 'border-warning bg-warning/5',
        icon: '🟡',
        label: detailsText,
        details: betDetails
      };
    }

    if (pendingBets === 0 && wonBets > 0 && lostBets === 0) {
      return {
        status: 'won' as const,
        color: 'border-success bg-success/5',
        icon: '🟢',
        label: `${wonBets} Won`,
        details: null
      };
    }

    if (pendingBets === 0 && wonBets === 0 && lostBets > 0) {
      return {
        status: 'lost' as const,
        color: 'border-destructive bg-destructive/5',
        icon: '🔴',
        label: `${lostBets} Lost`,
        details: null
      };
    }

    return {
      status: 'mixed' as const,
      color: 'border-blue-500 bg-blue-500/5',
      icon: '🔵',
      label: `${wonBets}W/${lostBets}L/${pendingBets}P`,
      details: null
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading simulation history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                Simulation History
              </h1>
              <p className="text-muted-foreground mt-1 font-medium">View and manage past Monte Carlo simulations</p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-card-foreground bg-secondary border border-border rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                ← Back to Simulation
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bankroll Overview */}
        <div className="mb-8">
          <Card variant="pattern-discovery" padding="lg">
            <h2 className="text-xl font-bold text-card-foreground mb-4">Bankroll & Performance</h2>
            <BankrollManager 
              onBankrollUpdate={() => {
                // Only reload if there's a specific change that affects simulations
                // Removed automatic reload to prevent infinite loop
              }}
            />
          </Card>
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card variant="pattern-discovery" padding="lg">
            <div className="text-2xl font-bold text-primary">
              {simulations.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Simulations</div>
          </Card>
          <Card variant="pattern-discovery" padding="lg">
            <div className="text-2xl font-bold text-success">
              {simulations.filter(s => s.has_result).length}
            </div>
            <div className="text-sm text-muted-foreground">With Results</div>
          </Card>
          <Card variant="pattern-discovery" padding="lg">
            <div className="text-2xl font-bold text-warning">
              {simulations.filter(s => s.accuracy && s.accuracy > 60).length}
            </div>
            <div className="text-sm text-muted-foreground">Accurate Predictions (&gt;60%)</div>
          </Card>
          <Card variant="pattern-discovery" padding="lg">
            <div className="text-2xl font-bold text-chart-5">
              {(() => {
                const accuracySimulations = simulations.filter(s => s.accuracy);
                return accuracySimulations.length > 0 
                  ? (accuracySimulations.reduce((sum, s) => sum + (s.accuracy || 0), 0) / accuracySimulations.length).toFixed(1)
                  : '0.0';
              })()}%
            </div>
            <div className="text-sm text-muted-foreground">Average Accuracy</div>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card variant="pattern-discovery" padding="lg" className="mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">Filter</label>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="px-3 py-2 border border-border rounded-lg text-sm bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="pending_bets">Pending Bets (Default)</option>
                  <option value="archive">Archive (All Others)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-border rounded-lg text-sm bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="league">League</option>
                  <option value="accuracy">Accuracy</option>
                  <option value="time_input">Time Input</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredAndSortedSimulations.length} of {simulations.length} simulations
              </div>
            </div>
          </div>
        </Card>

        {/* Simulations List */}
        <div className="space-y-4">
          {filteredAndSortedSimulations.length === 0 ? (
            <Card variant="pattern-discovery" padding="xl" className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-card-foreground mb-2">No Simulations Found</h3>
              <p className="text-muted-foreground mb-6">
                {filterBy === 'pending_bets' 
                  ? "No pending bets found. All simulations have been settled!" 
                  : "No archived simulations found."}
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
              >
                Run Your First Simulation
              </Link>
            </Card>
          ) : (
            filteredAndSortedSimulations.map((simulation) => {
              const betStatusInfo = getBetStatusInfo(simulation);
              return (
                <div key={simulation.id} className={`p-6 rounded-xl shadow-lg transition-all ${betStatusInfo.color}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-lg">{betStatusInfo.icon}</span>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${getLeagueColor(simulation.league_name || 'Unknown League')}`}>
                        {simulation.league_name || 'Unknown League'}
                      </span>
                      <h3 className="text-lg font-semibold text-card-foreground">
                        {simulation.home_team_name} vs {simulation.away_team_name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        betStatusInfo.status === 'pending' ? 'bg-warning/10 text-warning border border-warning/20' :
                        betStatusInfo.status === 'won' ? 'bg-success/10 text-success border border-success/20' :
                        betStatusInfo.status === 'lost' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                        betStatusInfo.status === 'mixed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                        'bg-muted/10 text-muted-foreground border border-muted/20'
                      }`}>
                        {betStatusInfo.label}
                      </span>
                        {simulation.has_result && simulation.accuracy && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (simulation.accuracy || 0) > 70 ? 'bg-success/10 text-success border border-success/20' :
                            (simulation.accuracy || 0) > 50 ? 'bg-warning/10 text-warning border border-warning/20' :
                            'bg-destructive/10 text-destructive border border-destructive/20'
                          }`}>
                            {(simulation.accuracy || 0).toFixed(1)}% Accurate
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-8">
                    <button
                      onClick={() => handleViewDetails(simulation)}
                      className="px-2 py-1 text-xs font-medium text-card-foreground bg-secondary border border-border rounded hover:bg-accent transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      👁️ View Details
                    </button>
                    <button
                      onClick={() => handleDeleteSingle(simulation.id)}
                      className="px-2 py-1 text-xs font-medium text-destructive-foreground bg-destructive/80 rounded hover:bg-destructive transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  {/* Expandable Match Details */}
                  {expandedSimulations.has(simulation.id) && (
                    <div className="mt-6 border-t border-border pt-6">
                      <MatchDetails 
                        simulation={simulation}
                        onBetSettlement={fetchSimulations}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Result Entry Modal */}
      {showResultModal && selectedSimulation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border shadow-2xl">
            <h2 className="text-xl font-bold text-card-foreground mb-4">
              📊 Enter Match Result
            </h2>
            <p className="text-muted-foreground mb-6">
              {selectedSimulation.home_team_name} vs {selectedSimulation.away_team_name}
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    🏠 {selectedSimulation.home_team_name} (HT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={resultForm.home_score_ht}
                    onChange={(e) => setResultForm(prev => ({ ...prev, home_score_ht: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    ✈️ {selectedSimulation.away_team_name} (HT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={resultForm.away_score_ht}
                    onChange={(e) => setResultForm(prev => ({ ...prev, away_score_ht: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    🏠 {selectedSimulation.home_team_name} (FT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={resultForm.home_score_ft}
                    onChange={(e) => setResultForm(prev => ({ ...prev, home_score_ft: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    ✈️ {selectedSimulation.away_team_name} (FT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={resultForm.away_score_ft}
                    onChange={(e) => setResultForm(prev => ({ ...prev, away_score_ft: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowResultModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-card-foreground bg-secondary border border-border rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                Cancel
              </button>
              <button
                onClick={submitResult}
                className="flex-1 px-4 py-2 text-sm font-medium text-primary-foreground bg-success rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
              >
                💾 Save Result
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border shadow-2xl">
            <h2 className="text-xl font-bold text-destructive mb-4">
              🗑️ Confirm Deletion
            </h2>
            
            <p className="text-card-foreground mb-6">
              {deleteType === 'single' && 'Are you sure you want to delete this simulation?'}
              {deleteType === 'selected' && `Are you sure you want to delete ${selectedForDelete.size} selected simulation${selectedForDelete.size > 1 ? 's' : ''}?`}
              {deleteType === 'all' && `Are you sure you want to delete ALL ${simulations.length} simulations?`}
            </p>

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-6">
              <p className="text-sm text-destructive font-medium">
                ⚠️ This action cannot be undone!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This will permanently delete the simulation data, match results, and associated bet selections.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTargetId(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-card-foreground bg-secondary border border-border rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                {isDeleting ? '🗑️ Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedForDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-border shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-card-foreground">
                📊 Simulation Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-muted-foreground hover:text-card-foreground rounded-lg hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-card-foreground mb-2">Match</h3>
                  <p className="text-lg">
                    {selectedForDetails.home_team_name} vs {selectedForDetails.away_team_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedForDetails.match_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-2">Simulation Info</h3>
                  <p className="text-sm text-muted-foreground">
                    ID: #{selectedForDetails.id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Created: {formatDate(selectedForDetails.created_at)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Iterations: {selectedForDetails.iterations.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Parameters */}
              <div>
                <h3 className="font-semibold text-card-foreground mb-3">Simulation Parameters</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
                  <div>
                    <span className="text-sm text-muted-foreground">Distribution</span>
                    <div className="font-medium text-primary">{selectedForDetails.distribution_type.toUpperCase()}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Home Boost</span>
                    <div className="font-medium">{(selectedForDetails.home_boost || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Away Boost</span>
                    <div className="font-medium">{(selectedForDetails.away_boost || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Home Advantage</span>
                    <div className="font-medium text-primary">+{(selectedForDetails.home_advantage || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Value Bets */}
              <div>
                <h3 className="font-semibold text-card-foreground mb-3">Value Bets Found</h3>
                <div className="p-4 bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {getValueBetsCount(selectedForDetails)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Value betting opportunities identified
                  </div>
                  
                  {selectedForDetails.value_bets && selectedForDetails.value_bets !== '{}' && (
                    <div className="mt-4">
                      <pre className="text-xs bg-background p-3 rounded border overflow-x-auto max-h-40">
                        {JSON.stringify(JSON.parse(selectedForDetails.value_bets || '{}'), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* True Odds */}
              {selectedForDetails.true_odds && selectedForDetails.true_odds !== '{}' && (
                <div>
                  <h3 className="font-semibold text-card-foreground mb-3">True Odds</h3>
                  <div className="p-4 bg-muted/20 rounded-lg">
                    <pre className="text-xs bg-background p-3 rounded border overflow-x-auto max-h-40">
                      {JSON.stringify(JSON.parse(selectedForDetails.true_odds || '{}'), null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Accuracy Info */}
              {selectedForDetails.has_result && (
                <div>
                  <h3 className="font-semibold text-card-foreground mb-3">Results & Accuracy</h3>
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <div className="text-2xl font-bold text-success mb-1">
                      {(selectedForDetails.accuracy || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Prediction accuracy score
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-6 border-t border-border">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-sm font-medium text-card-foreground bg-secondary border border-border rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}