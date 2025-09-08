'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

interface PatternAnalysisData {
  uniquePatternId: string | null;
  patternConfidence: number;
  patternInsights: any;
  firstSimulationResults: any;
}

interface PatternAnalysisStepProps {
  homeTeam: { id: number; name: string } | null;
  awayTeam: { id: number; name: string } | null;
  historicalMatches: {
    h2h: any[];
    home_home: any[];
    away_away: any[];
  };
  patternAnalysis: PatternAnalysisData | null;
  onPatternAnalysisComplete: (analysis: PatternAnalysisData) => void;
}

export default function PatternAnalysisStep({
  homeTeam,
  awayTeam,
  historicalMatches,
  patternAnalysis,
  onPatternAnalysisComplete
}: PatternAnalysisStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  
  // Score input state
  const [showScoreInput, setShowScoreInput] = useState(false);
  const [homeScoreHT, setHomeScoreHT] = useState('');
  const [awayScoreHT, setAwayScoreHT] = useState('');
  const [homeScoreFT, setHomeScoreFT] = useState('');
  const [awayScoreFT, setAwayScoreFT] = useState('');
  const [submittingScore, setSubmittingScore] = useState(false);

  const submitActualScore = async () => {
    if (!patternAnalysis?.firstSimulationResults?.simulation_id) return;
    
    setSubmittingScore(true);
    
    try {
      const response = await fetch('/api/input-actual-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulation_id: patternAnalysis.firstSimulationResults.simulation_id,
          home_score_ht: parseInt(homeScoreHT) || 0,
          away_score_ht: parseInt(awayScoreHT) || 0,
          home_score_ft: parseInt(homeScoreFT) || 0,
          away_score_ft: parseInt(awayScoreFT) || 0,
          match_identifier: `${homeTeam?.name}_vs_${awayTeam?.name}_${new Date().toISOString().split('T')[0]}`
        })
      });
      
      if (response.ok) {
        setShowScoreInput(false);
        setCurrentPhase('✅ Actual result submitted for learning!');
      } else {
        throw new Error('Failed to submit score');
      }
    } catch (error) {
      console.error('Score submission failed:', error);
      setCurrentPhase('❌ Score submission failed');
    } finally {
      setSubmittingScore(false);
    }
  };

  const runPatternAnalysis = async () => {
    if (!homeTeam || !awayTeam) return;
    
    setIsGenerating(true);
    setAnalysisProgress(0);
    setCurrentPhase('Encoding historical patterns...');

    try {
      // Phase 1: Run team-agnostic multi-engine simulation to generate rich patterns
      setAnalysisProgress(25);
      setCurrentPhase('Generating team-agnostic rich patterns...');
      
      const baselineSimulation = await fetch('/api/multi-engine-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Team-agnostic approach - only names matter for display, not IDs
          homeTeam: { id: 1, name: homeTeam?.name || 'Home Team' },
          awayTeam: { id: 2, name: awayTeam?.name || 'Away Team' },
          selectedLeague: { id: 1, name: 'Pattern Analysis' },
          matchDate: new Date().toISOString().split('T')[0],
          distribution: 'poisson',
          iterations: 10000, // Smaller simulation for pattern generation
          boosts: {
            home_advantage: 0.10,
            custom_home_boost: 0,
            custom_away_boost: 0,
            enable_streak_analysis: false
          },
          historicalMatches: {
            h2h: historicalMatches.h2h || [],
            home_home: historicalMatches.home_home || [],
            away_away: historicalMatches.away_away || []
          },
          bookmakerOdds: {
            '1x2_ft': { home: 2.0, draw: 3.0, away: 4.0 } // Dummy odds for pattern generation
          },
          // Enable pattern generation only
          enablePatternEngine: false,
          enableEngineComparison: false,
          enableAdaptiveLearning: false
        })
      });

      if (!baselineSimulation.ok) {
        throw new Error('Baseline simulation failed');
      }

      const baselineResults = await baselineSimulation.json();

      // Phase 2: Verify rich patterns were generated
      setAnalysisProgress(50);
      setCurrentPhase('Verifying rich pattern storage...');
      
      if (!baselineResults.success || !baselineResults.simulation_id) {
        throw new Error('Pattern generation failed - no simulation ID returned');
      }
      
      // Phase 3: Generate unique pattern ID from simulation
      setAnalysisProgress(75);
      setCurrentPhase('Creating pattern fingerprint...');
      
      const uniquePatternId = `sim_${baselineResults.simulation_id}_${Date.now()}`;
      const confidence = calculatePatternConfidence(historicalMatches);
      
      // Phase 4: Extract team-agnostic insights
      setAnalysisProgress(90);
      setCurrentPhase('Extracting team-agnostic insights...');
      
      const insights = extractTeamAgnosticInsights(historicalMatches, baselineResults);
      
      setAnalysisProgress(100);
      setCurrentPhase('Pattern analysis complete!');

      const analysisResults: PatternAnalysisData = {
        uniquePatternId,
        patternConfidence: confidence,
        patternInsights: insights,
        firstSimulationResults: baselineResults
      };

      // Complete the analysis
      setTimeout(() => {
        onPatternAnalysisComplete(analysisResults);
        setIsGenerating(false);
      }, 500);

    } catch (error) {
      console.error('Pattern analysis failed:', error);
      setIsGenerating(false);
      setCurrentPhase('Analysis failed - please try again');
    }
  };

  const generatePatternFingerprint = (historical: any) => {
    const h2h = historical.h2h || [];
    const home = historical.home_home || [];
    const away = historical.away_away || [];

    // Create fingerprint based on recent form patterns
    const h2hGoals = h2h.slice(0, 4).map((m: any) => (m.home_score_ft || 0) + (m.away_score_ft || 0));
    const homeGoals = home.slice(0, 5).map((m: any) => (m.home_score_ft || 0) + (m.away_score_ft || 0));
    const awayGoals = away.slice(0, 5).map((m: any) => (m.home_score_ft || 0) + (m.away_score_ft || 0));

    const h2hAvg = h2hGoals.length > 0 ? h2hGoals.reduce((s: number, g: number) => s + g, 0) / h2hGoals.length : 2.5;
    const homeAvg = homeGoals.length > 0 ? homeGoals.reduce((s: number, g: number) => s + g, 0) / homeGoals.length : 2.5;
    const awayAvg = awayGoals.length > 0 ? awayGoals.reduce((s: number, g: number) => s + g, 0) / awayGoals.length : 2.5;

    // Create hash-like fingerprint
    const combined = `${h2hAvg.toFixed(1)}_${homeAvg.toFixed(1)}_${awayAvg.toFixed(1)}_${h2h.length}_${home.length}_${away.length}`;
    return btoa(combined).substring(0, 12);
  };

  const calculatePatternConfidence = (historical: any) => {
    let confidence = 0.3; // Base confidence

    // Confidence based on data availability
    const h2hCount = (historical.h2h || []).length;
    const homeCount = (historical.home_home || []).length;
    const awayCount = (historical.away_away || []).length;

    if (h2hCount >= 4) confidence += 0.2;
    if (homeCount >= 5) confidence += 0.2;
    if (awayCount >= 5) confidence += 0.2;

    // Bonus for comprehensive data
    if (h2hCount >= 6 && homeCount >= 8 && awayCount >= 8) {
      confidence += 0.1;
    }

    return Math.min(0.95, confidence);
  };

  const extractTeamAgnosticInsights = (historical: any, simulation: any) => {
    const h2h = historical.h2h || [];
    const home = historical.home_home || [];
    const away = historical.away_away || [];

    // Team-agnostic pattern analysis - focus on match characteristics, not team identities
    return {
      dataQuality: {
        h2hMatches: h2h.length,
        homeMatches: home.length,
        awayMatches: away.length,
        totalDataPoints: h2h.length + home.length + away.length,
        patternsGenerated: simulation?.simulation_id ? 'Successfully generated' : 'Failed'
      },
      marketPatterns: {
        avgH2HGoals: h2h.length > 0 ? h2h.reduce((s: number, m: any) => s + (m.home_score_ft || 0) + (m.away_score_ft || 0), 0) / h2h.length : null,
        avgHomeFormGoals: home.length > 0 ? home.slice(0, 5).reduce((s: number, m: any) => s + (m.home_score_ft || 0) + (m.away_score_ft || 0), 0) / Math.min(5, home.length) : null,
        avgAwayFormGoals: away.length > 0 ? away.slice(0, 5).reduce((s: number, m: any) => s + (m.home_score_ft || 0) + (m.away_score_ft || 0), 0) / Math.min(5, away.length) : null
      },
      richFingerprintGeneration: {
        simulationId: simulation?.simulation_id,
        engineVersion: simulation?.engine_version,
        processingTime: simulation?.processing_time,
        patternsStored: 'Team-agnostic rich fingerprints generated for pattern matching'
      },
      multiEngineResults: {
        avgTotalGoals: simulation?.monte_carlo_results?.avg_total_goals,
        homeWinProb: simulation?.monte_carlo_results?.probabilities?.home_win,
        confidence: simulation?.meta_analysis?.confidence_level
      }
    };
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            🧬 Team-Agnostic Pattern Generation
          </h3>
          <p className="text-sm text-muted-foreground">
            Generate rich market fingerprints based on match characteristics, not team identities
          </p>
        </div>

        {!patternAnalysis && !isGenerating && (
          <div className="space-y-6">
            <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>H2H Matches Available:</span>
                  <span className="font-medium">{historicalMatches.h2h?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Home Form Matches:</span>
                  <span className="font-medium">{historicalMatches.home_home?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Away Form Matches:</span>
                  <span className="font-medium">{historicalMatches.away_away?.length || 0}</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={runPatternAnalysis}
                disabled={!homeTeam || !awayTeam}
                className="px-6 py-3 bg-accent hover:bg-accent-muted text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚀 Generate Rich Patterns
              </button>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="space-y-4">
            <div className="w-full bg-bg-secondary rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {currentPhase}
            </div>
            <div className="text-center text-xs text-muted-foreground">
              {analysisProgress}% Complete
            </div>
          </div>
        )}

        {patternAnalysis && (
          <div className="space-y-4">
            <div className="flex items-center justify-center text-green-600 mb-4">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>

            <div className="bg-success/10 p-4 rounded-lg border border-success/20">
              <div className="text-center mb-4">
                <h4 className="font-semibold text-success mb-2">Pattern Analysis Complete</h4>
                <p className="text-sm text-muted-foreground">Unique game fingerprint generated successfully</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Pattern ID:</span>
                  <code className="text-xs bg-bg-secondary px-2 py-1 rounded">
                    {patternAnalysis.uniquePatternId?.substring(0, 16)}...
                  </code>
                </div>
                <div className="flex justify-between">
                  <span>Pattern Confidence:</span>
                  <span className="font-medium text-success">
                    {(patternAnalysis.patternConfidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Data Quality:</span>
                  <span className="font-medium">
                    {patternAnalysis.patternInsights?.dataQuality?.totalDataPoints || 0} matches
                  </span>
                </div>
              </div>
            </div>

            {/* Score Input Section */}
            {!showScoreInput && (
              <div className="text-center space-y-3">
                <button
                  onClick={() => setShowScoreInput(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  ⚽ Input Final Score
                </button>
                <button
                  onClick={runPatternAnalysis}
                  className="block mx-auto px-4 py-2 text-sm bg-bg-secondary hover:bg-accent/20 rounded-lg transition-colors"
                >
                  🔄 Regenerate Pattern
                </button>
              </div>
            )}

            {showScoreInput && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h5 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">
                  Input Final Score: {homeTeam?.name} vs {awayTeam?.name}
                </h5>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Half Time Score</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="0"
                        value={homeScoreHT}
                        onChange={(e) => setHomeScoreHT(e.target.value)}
                        className="w-16 px-2 py-1 border rounded text-center"
                        min="0"
                        max="20"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={awayScoreHT}
                        onChange={(e) => setAwayScoreHT(e.target.value)}
                        className="w-16 px-2 py-1 border rounded text-center"
                        min="0"
                        max="20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Full Time Score</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="0"
                        value={homeScoreFT}
                        onChange={(e) => setHomeScoreFT(e.target.value)}
                        className="w-16 px-2 py-1 border rounded text-center"
                        min="0"
                        max="20"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={awayScoreFT}
                        onChange={(e) => setAwayScoreFT(e.target.value)}
                        className="w-16 px-2 py-1 border rounded text-center"
                        min="0"
                        max="20"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={submitActualScore}
                    disabled={submittingScore || !homeScoreFT || !awayScoreFT}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {submittingScore ? 'Submitting...' : '✅ Submit Score'}
                  </button>
                  <button
                    onClick={() => setShowScoreInput(false)}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="text-sm space-y-2">
          <h4 className="font-medium text-primary">How Team-Agnostic Pattern Generation Works:</h4>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4">
            <li>• Runs multi-engine simulation to calculate 50+ betting markets</li>
            <li>• Generates rich fingerprints based on match scores and market outcomes</li>
            <li>• Stores team-agnostic patterns for future similarity matching</li>
            <li>• Enables pattern recognition without team identity dependencies</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}