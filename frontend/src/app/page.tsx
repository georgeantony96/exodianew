'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import TeamSelector from '@/components/DataEntry/TeamSelector';
import HistoricalMatches from '@/components/DataEntry/HistoricalMatches';
import PatternAnalysisStep from '@/components/PatternAnalysis/PatternAnalysisStep';
import OddsInput from '@/components/DataEntry/OddsInput';
import BoostSettings from '@/components/DataEntry/BoostSettings';
import DistributionSelector from '@/components/Simulation/DistributionSelector';
import ValueOpportunities from '@/components/ValueFirst/ValueOpportunities';
import LeagueSelector from '@/components/ValueFirst/LeagueSelector';
import TrueOddsDisplay from '@/components/Results/TrueOddsDisplay';
import ValueBetsHighlight from '@/components/Results/ValueBetsHighlight';
import BookmakerAnalysis from '@/components/Results/BookmakerAnalysis';
import HistoricalAccuracy from '@/components/Results/HistoricalAccuracy';
import OddsComparison from '@/components/Results/OddsComparison';
import CombinedAnalysis, { CombinedAnalysisRef } from '@/components/Results/CombinedAnalysis';
import UnifiedIntelligenceDisplay from '@/components/Intelligence/UnifiedIntelligenceDisplay';
import { validateSimulationResponse, sanitizeBookmakerOdds } from '@/utils/api-response-validator';
import type { SimulationApiResponse, ValueAnalysis } from '@/types/simulation';

interface Team {
  id: number;
  name: string;
  league_id?: number;
}

interface League {
  id: number;
  name: string;
  country: string;
  season: string;
  intelligence_enabled: boolean;
}

interface HistoricalMatch {
  id?: number;
  home_team_id: number;
  away_team_id: number;
  home_score_ht: number;
  away_score_ht: number;
  home_score_ft: number;
  away_score_ft: number;
  match_type: string;
  match_date: string;
}

interface SimulationData {
  selectedLeague: League | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
  matchDate: string;
  historicalMatches: {
    h2h: HistoricalMatch[];
    home_home: HistoricalMatch[];
    away_away: HistoricalMatch[];
  };
  patternAnalysis: {
    uniquePatternId: string | null;
    patternConfidence: number;
    patternInsights: any;
    firstSimulationResults: any;
  } | null;
  bookmakerOdds: any;
  boosts: {
    home: number;
    away: number;
    homeAdvantage: number;
  };
  distribution: 'poisson' | 'negative_binomial';
  iterations: number;
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);
  const [simulationData, setSimulationData] = useState<SimulationData>({
    selectedLeague: null,
    homeTeam: null,
    awayTeam: null,
    matchDate: new Date().toISOString().split('T')[0],
    historicalMatches: {
      h2h: [],
      home_home: [],
      away_away: []
    },
    patternAnalysis: null,
    bookmakerOdds: null,
    boosts: {
      home_advantage: 0.10,
      custom_home_boost: 0,
      custom_away_boost: 0,
      enable_streak_analysis: true,
      // Legacy fields for compatibility
      home: 0,
      away: 0,
      homeAdvantage: 0.10
    },
    distribution: 'poisson',
    iterations: 100000
  });
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [simulationId, setSimulationId] = useState<number | null>(null);
  const combinedAnalysisRef = useRef<CombinedAnalysisRef>(null);

  // Hydration effect - load stored values after component mounts
  useEffect(() => {
    const storedStep = sessionStorage.getItem('currentStep');
    if (storedStep) {
      setCurrentStep(parseInt(storedStep, 10));
    }
    
    const storedData = sessionStorage.getItem('currentSimulationData');
    if (storedData) {
      try {
        setSimulationData(JSON.parse(storedData));
      } catch (e) {
        console.log('Failed to parse stored simulation data');
      }
    }
    
    const storedResults = sessionStorage.getItem('currentSimulationResults');
    if (storedResults) {
      try {
        setSimulationResults(JSON.parse(storedResults));
      } catch (e) {
        console.log('Failed to parse stored simulation results');
      }
    }
    
    const storedId = sessionStorage.getItem('currentSimulationId');
    if (storedId) {
      setSimulationId(parseInt(storedId, 10));
    }
    
    setIsHydrated(true);
  }, []);

  // Add useEffect hooks to persist state changes to sessionStorage
  useEffect(() => {
    if (isHydrated) {
      sessionStorage.setItem('currentStep', currentStep.toString());
    }
  }, [currentStep, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      sessionStorage.setItem('currentSimulationResults', JSON.stringify(simulationResults));
    }
  }, [simulationResults, isHydrated]);

  useEffect(() => {
    if (isHydrated && simulationId !== null) {
      sessionStorage.setItem('currentSimulationId', simulationId.toString());
    }
  }, [simulationId, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      sessionStorage.setItem('currentSimulationData', JSON.stringify(simulationData));
    }
  }, [simulationData, isHydrated]);

  const steps = [
    { id: 1, title: 'League Selection', description: 'Choose league for AI intelligence' },
    { id: 2, title: 'Teams & Date', description: 'Select home and away teams' },
    { id: 3, title: 'Historical Data', description: 'Enter past match results' },
    { id: 4, title: 'Pattern Analysis', description: '🧬 Generate unique game fingerprint' },
    { id: 5, title: 'Bookmaker Odds', description: 'Input current betting odds' },
    { id: 6, title: 'Boosts & Settings', description: 'Configure advantages and adjustments' },
    { id: 7, title: 'Simulation', description: 'Run Monte Carlo analysis' },
    { id: 8, title: 'Value Analysis', description: 'View betting opportunities' }
  ];

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return simulationData.selectedLeague; // Must select a league first
      case 2:
        return simulationData.homeTeam && simulationData.awayTeam;
      case 3:
        // Historical data is optional - allow proceeding without it
        // Monte Carlo engine will use default lambdas if no historical data provided
        // This handles cases where teams are playing for the first time
        return true; // Always allow proceeding from historical data step
      case 4:
        // Pattern analysis must be completed
        return simulationData.patternAnalysis && simulationData.patternAnalysis.uniquePatternId;
      case 5:
        return simulationData.bookmakerOdds && 
               simulationData.bookmakerOdds['1x2_ft'] && 
               simulationData.bookmakerOdds['1x2_ft'].home > 0 &&
               simulationData.bookmakerOdds['1x2_ft'].draw > 0 &&
               simulationData.bookmakerOdds['1x2_ft'].away > 0;
      case 6:
        return true; // Boosts are optional
      case 7:
        return simulationResults; // Simulation completed
      default:
        return true;
    }
  };

  const handleLeagueSelection = (league: League | null) => {
    setSimulationData(prev => ({
      ...prev,
      selectedLeague: league,
      // Reset teams when changing league
      homeTeam: null,
      awayTeam: null
    }));
  };

  const handleTeamSelection = (homeTeam: Team | null, awayTeam: Team | null) => {
    setSimulationData(prev => ({
      ...prev,
      homeTeam,
      awayTeam
    }));
  };

  const handleHistoricalMatches = useCallback((matches: any) => {
    setSimulationData(prev => ({
      ...prev,
      historicalMatches: matches
    }));
  }, []);

  const handlePatternAnalysisComplete = useCallback((analysis: any) => {
    setSimulationData(prev => ({
      ...prev,
      patternAnalysis: analysis
    }));
    showToast('🧬 Pattern analysis complete! Unique fingerprint generated.', 'success');
  }, []);

  const handleOddsInput = useCallback((odds: any) => {
    // ENHANCED: Sanitize bookmaker odds input to prevent errors
    const sanitizedOdds = sanitizeBookmakerOdds(odds);
    console.log('📊 Odds sanitized:', { original: odds, sanitized: sanitizedOdds });
    
    setSimulationData(prev => ({
      ...prev,
      bookmakerOdds: sanitizedOdds
    }));
  }, []);

  const handleBoostSettings = useCallback((boosts: any) => {
    // Transform BoostSettings structure to match expected format
    // Keep all boost settings for Monte Carlo engine
    const transformedBoosts = {
      home_advantage: boosts.home_advantage || 0.10,
      custom_home_boost: boosts.custom_home_boost || 0,
      custom_away_boost: boosts.custom_away_boost || 0,
      enable_streak_analysis: boosts.enable_streak_analysis !== false, // Default true
      chaos_config: boosts.chaos_config, // Pass through chaos configuration
      reversion_config: boosts.reversion_config, // Pass through Mean Reversion configuration
      // Legacy fields for compatibility
      home: boosts.custom_home_boost || 0,
      away: boosts.custom_away_boost || 0,
      homeAdvantage: boosts.home_advantage || 0.10
    };
    setSimulationData(prev => ({
      ...prev,
      boosts: transformedBoosts
    }));
  }, []);

  const handleDistributionSelection = (distribution: 'poisson' | 'negative_binomial', iterations: number) => {
    setSimulationData(prev => ({
      ...prev,
      distribution,
      iterations
    }));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleBankrollUpdate = () => {
    showToast('💰 Bankroll updated successfully', 'success');
  };

  const handleSimulationComplete = (results: any) => {
    console.log('Received simulation results:', results);
    console.log('Results structure:', JSON.stringify(results, null, 2));
    
    // CRITICAL FIX: Extract simulation_id from API response and set it immediately
    if (results?.simulation_id) {
      console.log('🎯 Setting simulation ID from API response:', results.simulation_id);
      setSimulationId(results.simulation_id);
    } else {
      console.warn('⚠️ No simulation_id in API response:', results);
    }
    
    // ENHANCED: Validate and normalize the API response
    const validation = validateSimulationResponse(results);
    
    if (!validation.isValid) {
      console.error('❌ Simulation response validation failed:', validation.errors);
      showToast('⚠️ Simulation completed but response format is invalid', 'error');
      // Still proceed with raw results as fallback, but include simulation_id
      setSimulationResults({
        ...results,
        simulation_id: results?.simulation_id || null
      });
    } else {
      console.log('✅ Simulation response validation passed');
      // Ensure simulation_id is preserved in normalized response
      setSimulationResults({
        ...validation.normalizedResponse,
        simulation_id: results?.simulation_id || null
      });
    }
    
    setCurrentStep(8); // Move to results automatically (step 8 now)
    showToast('✅ Simulation completed successfully!', 'success');
  };

  // Transform simulation results to ValueOpportunities format using BACKEND'S professional calibrated value detection
  const transformToValueFormat = (simResults: SimulationApiResponse | any, bookmakerOdds: any): ValueAnalysis | null => {
    console.log('[DEBUG] transformToValueFormat called with:', {
      simResults: simResults ? Object.keys(simResults) : null,
      bookmakerOdds: bookmakerOdds ? Object.keys(bookmakerOdds) : null,
      hasValueBets: !!simResults?.value_bets,
      valueBetsType: typeof simResults?.value_bets,
      valueBets: simResults?.value_bets
    });

    if (!simResults || !bookmakerOdds) {
      console.log('[DEBUG] Early return: missing simResults or bookmakerOdds');
      return null;
    }

    const opportunities: Array<{
      market: string;
      trueOdds: number;
      bookmakerOdds: number;
      edge: number;
      probability: number;
      confidence: number;
      kellyStake?: number;
    }> = [];

    // CRITICAL FIX: Extract value_bets from correct nested location
    const actualValueBets = simResults.results?.value_bets || simResults.value_bets || {};
    console.log('[DEBUG] Extracted actual value bets:', actualValueBets);
    
    // PRIORITY 1: Use backend's professional calibrated value_bets (our fix)
    if (actualValueBets && typeof actualValueBets === 'object' && Object.keys(actualValueBets).length > 0) {
      console.log('[DEBUG] Processing backend value_bets:', actualValueBets);
      Object.entries(actualValueBets).forEach(([marketCategory, outcomes]: [string, any]) => {
        if (outcomes && typeof outcomes === 'object') {
          Object.entries(outcomes).forEach(([outcome, bet]: [string, any]) => {
            if (bet && bet.edge > 0) {
              opportunities.push({
                market: `${outcome.toUpperCase()} (${marketCategory.toUpperCase()})`,
                trueOdds: bet.true_odds,
                bookmakerOdds: bet.bookmaker_odds,
                edge: bet.edge,
                probability: bet.true_probability * 100, // Convert to percentage
                confidence: bet.confidence === 'High' ? 0.9 : bet.confidence === 'Medium' ? 0.7 : 0.5,
                kellyStake: bet.edge > 3 ? (bet.edge * 0.01) : undefined
              });
            }
          });
        }
      });
    }

    // FALLBACK: Manual calculation only if backend value_bets not available
    if (opportunities.length === 0) {
      console.log('[DEBUG] No backend value_bets found, using fallback manual calculation');
      // Process 1X2 market
      if (simResults.true_odds?.['1x2'] && bookmakerOdds['1x2']) {
        const trueOdds = simResults.true_odds['1x2'];
        const bookOdds = bookmakerOdds['1x2'];
        
        ['home', 'draw', 'away'].forEach(outcome => {
          const trueOdd = trueOdds[outcome];
          const bookOdd = bookOdds[outcome];
          const edge = ((bookOdd / trueOdd) - 1) * 100;
          const probability = 1 / trueOdd;
          const confidence = simResults.confidence_score || 0.75;

          if (edge > 0) { // Only include positive edge opportunities
            opportunities.push({
              market: `${outcome.toUpperCase()} (1X2)`,
              trueOdds: trueOdd,
              bookmakerOdds: bookOdd,
              edge,
              probability,
              confidence,
              kellyStake: edge > 3 ? (edge * 0.01) : undefined
            });
          }
        });
      }

      // Process Over/Under markets
      ['o25', 'u25'].forEach(market => {
        if (simResults.true_odds?.[market] && bookmakerOdds[market]) {
          const trueOdd = simResults.true_odds[market];
          const bookOdd = bookmakerOdds[market];
          const edge = ((bookOdd / trueOdd) - 1) * 100;
          const probability = 1 / trueOdd;
          const confidence = simResults.confidence_score || 0.75;

          if (edge > 0) {
            opportunities.push({
              market: `${market.toUpperCase().replace('O', 'Over ').replace('U', 'Under ')}`,
              trueOdds: trueOdd,
              bookmakerOdds: bookOdd,
              edge,
              probability,
              confidence,
              kellyStake: edge > 3 ? (edge * 0.01) : undefined
            });
          }
        }
      });
    }

    // Analyze for conflicts
    const sortedByProbability = [...opportunities].sort((a, b) => b.probability - a.probability);
    const sortedByEdge = [...opportunities].sort((a, b) => b.edge - a.edge);
    
    const highestProbability = sortedByProbability[0];
    const highestEdge = sortedByEdge[0];
    
    const hasConflict = highestProbability && highestEdge && 
                       highestProbability.market !== highestEdge.market;

    const analysis = {
      highestProbability: highestProbability ? {
        market: highestProbability.market,
        probability: highestProbability.probability,
        trueOdds: highestProbability.trueOdds
      } : { market: '', probability: 0, trueOdds: 0 },
      highestEdge: highestEdge ? {
        market: highestEdge.market,
        edge: highestEdge.edge,
        probability: highestEdge.probability
      } : { market: '', edge: 0, probability: 0 },
      hasConflict,
      recommendation: hasConflict ? {
        primary: highestEdge.edge > 7 ? highestEdge.market : highestProbability.market,
        reason: highestEdge.edge > 7 
          ? `High edge (${highestEdge.edge.toFixed(1)}%) makes this the priority bet despite lower probability`
          : `Higher probability (${(highestProbability.probability * 100).toFixed(1)}%) makes this safer despite lower edge`,
        secondary: highestEdge.edge > 7 ? highestProbability.market : highestEdge.market
      } : undefined
    };

    console.log('[DEBUG] Final opportunities generated:', opportunities.length, opportunities);
    console.log('[DEBUG] Final analysis:', analysis);
    
    return { opportunities, analysis };
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <LeagueSelector
            selectedLeague={simulationData.selectedLeague}
            onLeagueSelect={handleLeagueSelection}
          />
        );

      case 2:
        return simulationData.selectedLeague ? (
          <div className="space-y-6">
            <div className="bg-info-bg p-4 rounded-lg border-l-4 border-info mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-info text-lg">🎯</span>
                <span className="font-medium text-text-primary">
                  League Selected: {simulationData.selectedLeague.name}
                </span>
              </div>
              <p className="text-text-secondary text-sm">
                Teams will be filtered for {simulationData.selectedLeague.country} league context
              </p>
            </div>
            
            <TeamSelector
              selectedHomeTeam={simulationData.homeTeam}
              selectedAwayTeam={simulationData.awayTeam}
              onTeamSelect={handleTeamSelection}
              leagueFilter={simulationData.selectedLeague.id}
            />
            <div className="mt-6">
              <label className="block text-sm font-medium text-card-foreground mb-2">
                📅 Match Date
              </label>
              <input
                type="date"
                value={simulationData.matchDate}
                onChange={(e) => setSimulationData(prev => ({ ...prev, matchDate: e.target.value }))}
                className="px-4 py-3 border border-border rounded-lg bg-input text-card-foreground focus:ring-2 focus:ring-ring focus:border-ring hover:border-accent-foreground transition-colors"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">🏆 Please select a league first</div>
            <p className="text-muted-foreground text-sm mt-2">Go back to step 1 to choose your league</p>
          </div>
        );

      case 3:
        return simulationData.homeTeam && simulationData.awayTeam ? (
          <HistoricalMatches
            homeTeam={simulationData.homeTeam}
            awayTeam={simulationData.awayTeam}
            historicalMatches={simulationData.historicalMatches}
            onMatchesUpdate={handleHistoricalMatches}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">⚽ Please select teams first</div>
            <p className="text-muted-foreground text-sm mt-2">Go back to step 2 to select your home and away teams</p>
          </div>
        );

      case 4:
        return (
          <PatternAnalysisStep
            homeTeam={simulationData.homeTeam}
            awayTeam={simulationData.awayTeam}
            historicalMatches={simulationData.historicalMatches}
            patternAnalysis={simulationData.patternAnalysis}
            onPatternAnalysisComplete={handlePatternAnalysisComplete}
          />
        );
      case 5:
        return (
          <OddsInput
            odds={simulationData.bookmakerOdds}
            onOddsChange={handleOddsInput}
            homeTeamName={simulationData.homeTeam?.name || ''}
            awayTeamName={simulationData.awayTeam?.name || ''}
          />
        );

      case 6:
        return (
          <BoostSettings
            homeTeam={simulationData.homeTeam}
            awayTeam={simulationData.awayTeam}
            historicalMatches={simulationData.historicalMatches}
            boosts={simulationData.boosts}
            onBoostsChange={handleBoostSettings}
          />
        );

      case 7:
        return (
          <div className="space-y-6">
            <DistributionSelector
              homeTeam={simulationData.homeTeam}
              awayTeam={simulationData.awayTeam}
              historicalMatches={simulationData.historicalMatches}
              bookmakerOdds={simulationData.bookmakerOdds}
              boosts={simulationData.boosts}
              patternAnalysis={simulationData.patternAnalysis}
              selectedDistribution={simulationData.distribution}
              selectedIterations={simulationData.iterations}
              onSelectionChange={handleDistributionSelection}
              onComplete={handleSimulationComplete}
            />
          </div>
        );

      case 8:
        return simulationResults ? (() => {
          console.log('[DEBUG] About to transform simulation results:', {
            simulationResults,
            bookmakerOdds: simulationData.bookmakerOdds
          });
          
          // CRITICAL DEBUG: Log the bookmaker odds being passed to results
          console.log('[DEBUG] simulationData.bookmakerOdds complete structure:', JSON.stringify(simulationData.bookmakerOdds, null, 2));
          console.log('[DEBUG] Bookmaker odds validation check:', {
            'has_1x2': !!simulationData.bookmakerOdds?.['1x2'],
            '1x2_away_exists': !!simulationData.bookmakerOdds?.['1x2']?.away,
            '1x2_away_value': simulationData.bookmakerOdds?.['1x2']?.away,
            'has_asian_handicap': !!simulationData.bookmakerOdds?.asian_handicap,
            'asian_handicap_away_exists': !!simulationData.bookmakerOdds?.asian_handicap?.away,
            'asian_handicap_away_value': simulationData.bookmakerOdds?.asian_handicap?.away,
            'has_btts': !!simulationData.bookmakerOdds?.both_teams_score,
            'btts_yes_exists': !!simulationData.bookmakerOdds?.both_teams_score?.yes,
            'btts_yes_value': simulationData.bookmakerOdds?.both_teams_score?.yes
          });
          const valueData = transformToValueFormat(simulationResults, simulationData.bookmakerOdds);
          console.log('[DEBUG] Value data returned:', valueData);
          
          if (!valueData) {
            return (
              <div className="text-center py-12">
                <div className="text-muted-foreground text-lg">⚠️ Unable to process results</div>
                <p className="text-muted-foreground text-sm mt-2">There was an issue processing the simulation results</p>
              </div>
            );
          }

          const leagueContext = {
            name: simulationData.selectedLeague?.name || 'General League',
            country: simulationData.selectedLeague?.country || 'Unknown',
            userAccuracy: 0.68, // TODO: Get from user's historical accuracy
            leagueAverage: 0.55, // TODO: Get from league statistics
            marketSpecificAccuracy: {
              '1X2': 0.72,
              'O/U 2.5': 0.65
            }
          };

          return (
            <div className="space-y-8">
              {/* UNIFIED MATHEMATICAL INTELLIGENCE - Primary Display */}
              <UnifiedIntelligenceDisplay 
                homeTeam={simulationData.homeTeam?.name}
                awayTeam={simulationData.awayTeam?.name}
                className="mb-8"
              />

              {/* Complete Analysis Results with Bet Selection */}
              <CombinedAnalysis
                ref={combinedAnalysisRef}
                simulationResults={simulationResults}
                bookmakerOdds={simulationData.bookmakerOdds}
                leagueContext={leagueContext}
                simulationData={{...simulationData, simulationId}}
                onBankrollUpdate={handleBankrollUpdate}
              />



              {/* Historical Accuracy Section */}
              <div className="grid grid-cols-1 gap-8">
                <HistoricalAccuracy
                  leagueContext={leagueContext}
                  marketTypes={Object.keys(simulationData.bookmakerOdds || {})}
                />
              </div>
            </div>
          );
        })() : (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">📊 Complete simulation to view results</div>
            <p className="text-muted-foreground text-sm mt-2">Run the Monte Carlo simulation to see true odds and value bets</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                EXODIA FINAL
              </h1>
            </div>
            <div className="flex gap-3">
              <Link
                href="/analytics"
                className="px-4 py-2 text-sm font-medium text-card-foreground bg-secondary border border-border rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                📊 Analytics
              </Link>
              <Link
                href="/history"
                className="px-4 py-2 text-sm font-medium text-card-foreground bg-secondary border border-border rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                📋 History
              </Link>
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setSimulationData({
                    selectedLeague: null,
                    homeTeam: null,
                    awayTeam: null,
                    matchDate: new Date().toISOString().split('T')[0],
                    historicalMatches: {
                      h2h: [],
                      home_home: [],
                      away_away: []
                    },
                    patternAnalysis: null,
                    bookmakerOdds: null,
                    boosts: {
                      home_advantage: 0.10,
                      custom_home_boost: 0,
                      custom_away_boost: 0,
                      enable_streak_analysis: true,
                      // Legacy fields for compatibility
                      home: 0,
                      away: 0,
                      homeAdvantage: 0.10
                    },
                    distribution: 'poisson',
                    iterations: 100000
                  });
                  setSimulationResults(null);
                }}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
              >
                ✨ New Simulation
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">


        {/* Main Content */}
        <div className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-lg mx-auto">
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 mb-6 pb-6 border-b border-border">
            <Card variant="pattern-discovery" padding="none" className="inline-block">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="group px-6 py-3 text-sm font-medium text-card-foreground bg-transparent hover:bg-accent/10 rounded-lg hover:scale-105 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <span className="inline-flex items-center">
                  <span className="mr-2 group-hover:-translate-x-1 transition-transform duration-200">←</span>
                  Previous
                </span>
              </button>
            </Card>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {currentStep < 8 && (
                <Card variant="pattern-discovery" padding="none" className="inline-block">
                  <button
                    onClick={() => setCurrentStep(Math.min(8, currentStep + 1))}
                    disabled={!canProceedToNext()}
                    className={`group px-6 py-3 text-sm font-medium rounded-lg transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring ${
                      canProceedToNext()
                        ? 'text-white bg-accent hover:bg-accent-muted hover:scale-105 hover:shadow-lg shadow-md cursor-pointer'
                        : 'text-text-disabled bg-bg-secondary/50 opacity-60 cursor-not-allowed hover:scale-100'
                    }`}
                  >
                    <span className="inline-flex items-center">
                      Next
                      <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">→</span>
                    </span>
                  </button>
                </Card>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-card-foreground text-center">
              {steps[currentStep - 1]?.title}
            </h2>
          </div>

          {renderStepContent()}

        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
          <div className={`px-4 py-3 rounded-lg shadow-lg border max-w-sm ${
            toast.type === 'success' 
              ? 'bg-success/10 text-success border-success/20' 
              : toast.type === 'error' 
              ? 'bg-destructive/10 text-destructive border-destructive/20'
              : 'bg-primary/10 text-primary border-primary/20'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="text-xs opacity-70 hover:opacity-100 ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
