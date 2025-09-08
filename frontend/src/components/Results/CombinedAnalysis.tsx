'use client';

import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Card } from '@/components/ui/Card';
import OddsComparison, { OddsComparisonRef } from './OddsComparison';
import ComprehensiveMarketDisplay from './ComprehensiveMarketDisplay';

interface CombinedAnalysisProps {
  simulationResults: any;
  bookmakerOdds: any;
  leagueContext: any;
  simulationData?: any;
  onBankrollUpdate?: () => void;
}

export interface CombinedAnalysisRef {
  getSelectedBets: () => any[];
  saveSelectedBets: (simulationId?: number) => Promise<void>;
}

const CombinedAnalysis = forwardRef<CombinedAnalysisRef, CombinedAnalysisProps>(({
  simulationResults,
  bookmakerOdds,
  leagueContext,
  simulationData,
  onBankrollUpdate
}, ref) => {
  const oddsComparisonRef = useRef<OddsComparisonRef>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getSelectedBets: () => {
      return oddsComparisonRef.current?.getSelectedBets() || [];
    },
    saveSelectedBets: async (simulationId?: number) => {
      await oddsComparisonRef.current?.saveSelectedBets(simulationId);
    }
  }));

  // Check if this is a multi-engine result
  const isMultiEngine = !!(simulationResults.pattern_engine_results || simulationResults.engine_comparison || simulationResults.meta_analysis);
  
  // Check if comprehensive markets are available
  const hasComprehensiveMarkets = !!(simulationResults.comprehensive_markets || simulationResults.monte_carlo_results?.comprehensive_markets);

  return (
    <Card variant="pattern-discovery" padding="lg">
      {/* Multi-Engine Header */}
      {isMultiEngine && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-800/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
                <span>🧠</span>
                <span>Multi-Engine Analysis Results</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {simulationResults.meta_analysis?.recommended_engine || 'HYBRID'} engine recommended 
                ({(simulationResults.meta_analysis?.confidence_level * 100 || 75).toFixed(1)}% confidence)
              </p>
            </div>
            <div className="flex gap-2">
              {simulationResults.monte_carlo_results && (
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  Monte Carlo ✓
                </div>
              )}
              {simulationResults.pattern_engine_results && (
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                  Pattern Engine ✓
                </div>
              )}
              {simulationResults.engine_comparison && (
                <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                  Comparison ✓
                </div>
              )}
            </div>
          </div>
          
          {/* Meta Analysis Summary */}
          {simulationResults.meta_analysis && (
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/50">
                <div className="font-medium text-card-foreground">Recommended Engine</div>
                <div className="text-lg font-bold text-primary">
                  {simulationResults.meta_analysis.recommended_engine}
                </div>
              </div>
              <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/50">
                <div className="font-medium text-card-foreground">Confidence Level</div>
                <div className="text-lg font-bold text-green-600">
                  {(simulationResults.meta_analysis.confidence_level * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/50">
                <div className="font-medium text-card-foreground">Value Opportunities</div>
                <div className="text-lg font-bold text-purple-600">
                  {simulationResults.meta_analysis.value_opportunities}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comprehensive Markets Notification */}
      {!isMultiEngine && hasComprehensiveMarkets && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg border border-green-800/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <h3 className="font-semibold text-card-foreground">Comprehensive Market Analysis Available!</h3>
              <p className="text-sm text-muted-foreground">
                Monte Carlo engine calculated 50+ goal-based betting markets automatically. 
                Discover value opportunities in markets you didn't check!
              </p>
            </div>
          </div>
        </div>
      )}

        {/* Content */}
        <div className="space-y-2">
          {/* Average Goals Section - Compact & Top */}
          <div className="bg-muted/30 rounded-lg p-2">
            <h3 className="text-lg font-semibold text-card-foreground mb-2 text-center">Average Goals</h3>
            
            <div className="grid grid-cols-2 gap-2">
              {/* Full Time */}
              <div>
                <h4 className="text-xs font-medium text-card-foreground mb-1 text-center">Full Time</h4>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className="bg-card rounded p-1 border border-border">
                    <div className="text-lg font-bold text-primary">
                      {(simulationResults?.monte_carlo_results?.avg_home_goals || 
                        simulationResults?.results?.results?.avg_home_goals || 
                        simulationResults?.results?.avg_home_goals || 
                        simulationResults?.avg_home_goals)?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-xs text-card-foreground">Home</div>
                  </div>
                  <div className="bg-card rounded p-1 border border-border">
                    <div className="text-lg font-bold text-primary">
                      {(simulationResults?.monte_carlo_results?.avg_away_goals || 
                        simulationResults?.results?.results?.avg_away_goals || 
                        simulationResults?.results?.avg_away_goals || 
                        simulationResults?.avg_away_goals)?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-xs text-card-foreground">Away</div>
                  </div>
                  <div className="bg-card rounded p-1 border border-border">
                    <div className="text-lg font-bold text-success">
                      {(simulationResults?.monte_carlo_results?.avg_total_goals || 
                        simulationResults?.results?.results?.avg_total_goals || 
                        simulationResults?.results?.avg_total_goals || 
                        simulationResults?.avg_total_goals)?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-xs text-card-foreground">Total</div>
                  </div>
                </div>
              </div>

              {/* First Half */}
              <div>
                <h4 className="text-xs font-medium text-card-foreground mb-1 text-center">First Half</h4>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className="bg-card rounded p-1 border border-border">
                    <div className="text-lg font-bold text-blue-500">
                      {((simulationResults?.monte_carlo_results?.results?.avg_home_goals || 
                         simulationResults?.results?.results?.avg_home_goals || 
                         simulationResults?.results?.avg_home_goals || 
                         simulationResults?.avg_home_goals || 0) * 0.45)?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-xs text-card-foreground">Home</div>
                  </div>
                  <div className="bg-card rounded p-1 border border-border">
                    <div className="text-lg font-bold text-blue-500">
                      {((simulationResults?.monte_carlo_results?.avg_away_goals || 
                         simulationResults?.results?.results?.avg_away_goals || 
                         simulationResults?.results?.avg_away_goals || 
                         simulationResults?.avg_away_goals || 0) * 0.45)?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-xs text-card-foreground">Away</div>
                  </div>
                  <div className="bg-card rounded p-1 border border-border">
                    <div className="text-lg font-bold text-orange-500">
                      {((simulationResults?.monte_carlo_results?.avg_total_goals || 
                         simulationResults?.results?.results?.avg_total_goals || 
                         simulationResults?.results?.avg_total_goals || 
                         simulationResults?.avg_total_goals || 0) * 0.45)?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-xs text-card-foreground">Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Engine Comparison Table */}
          {isMultiEngine && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4 text-center">
                🔍 Engine Predictions Comparison
              </h3>
              <div className="grid grid-cols-3 gap-4">
                
                {/* Monte Carlo Results */}
                {simulationResults.monte_carlo_results && (
                  <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-blue-600">🎯</span>
                      <h4 className="font-semibold text-blue-800">Monte Carlo Engine</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Home Win:</span>
                        <span className="font-medium">
                          {((simulationResults.monte_carlo_results.probabilities?.home_win || 0.33) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Over 2.5:</span>
                        <span className="font-medium">
                          {((simulationResults.monte_carlo_results.probabilities?.over_2_5 || 0.50) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">BTTS:</span>
                        <span className="font-medium">
                          {((simulationResults.monte_carlo_results.probabilities?.gg || 0.55) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pattern Engine Results */}
                {simulationResults.pattern_engine_results && (
                  <div className="bg-green-900/20 rounded-lg p-4 border border-green-800/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-green-600">🧠</span>
                      <h4 className="font-semibold text-green-800">Pattern Engine</h4>
                      <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded">
                        {simulationResults.pattern_engine_results.sample_size} matches
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Home Win:</span>
                        <span className="font-medium">
                          {((simulationResults.pattern_engine_results.home_win_probability || 0.33) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Over 2.5:</span>
                        <span className="font-medium">
                          {((simulationResults.pattern_engine_results.over_2_5_probability || 0.50) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">BTTS:</span>
                        <span className="font-medium">
                          {((simulationResults.pattern_engine_results.gg_probability || 0.55) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Engine Comparison Results */}
                {simulationResults.engine_comparison && (
                  <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-800/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-purple-600">⚖️</span>
                      <h4 className="font-semibold text-purple-800">Best Value Bets</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      {simulationResults.engine_comparison.value_summary?.best_market && (
                        <div className="bg-purple-100 rounded p-2">
                          <div className="font-medium text-purple-800">
                            {simulationResults.engine_comparison.value_summary.best_market}
                          </div>
                          <div className="text-xs text-purple-600">
                            Best opportunity detected
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Opportunities:</span>
                        <span className="font-medium">
                          {simulationResults.engine_comparison.value_summary?.total_opportunities || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Massive Value:</span>
                        <span className="font-medium">
                          {simulationResults.engine_comparison.value_summary?.massive_value_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Engine Consensus */}
              {simulationResults.engine_comparison?.engine_consensus && (
                <div className="mt-4 p-3 bg-gray-800/40 rounded-lg border border-gray-700/50">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Engine Consensus</div>
                    <div className="font-semibold text-card-foreground">
                      Agreement Level: {simulationResults.engine_comparison.engine_consensus.agreement_level || 'Moderate'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Primary Engine: {simulationResults.engine_comparison.engine_consensus.primary_engine || 'HYBRID'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comprehensive Market Analysis */}
          {(simulationResults.comprehensive_markets || simulationResults.monte_carlo_results?.comprehensive_markets) && (
            <div className="mb-6">
              <ComprehensiveMarketDisplay
                comprehensiveMarkets={
                  simulationResults.comprehensive_markets || 
                  simulationResults.monte_carlo_results?.comprehensive_markets
                }
                bookmakerOdds={bookmakerOdds}
                homeTeamName={simulationData?.homeTeam?.name || 'Home'}
                awayTeamName={simulationData?.awayTeam?.name || 'Away'}
              />
            </div>
          )}

          {/* Complete Odds Comparison Table */}
          <div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2 text-center">Complete Odds Comparison</h3>
            <OddsComparison
              ref={oddsComparisonRef}
              simulationResults={simulationResults}
              bookmakerOdds={bookmakerOdds}
              leagueContext={leagueContext}
              simulationData={simulationData}
              onBankrollUpdate={onBankrollUpdate}
            />
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">RPS Score</div>
              <div className="text-lg font-bold text-card-foreground">
                {(simulationResults?.monte_carlo_results?.rps_score || 
                  simulationResults?.results?.results?.rps_score || 
                  simulationResults?.results?.rps_score || 
                  simulationResults?.rps_score)?.toFixed(4) || 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                Target: ≤0.2012
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Confidence</div>
              <div className="text-lg font-bold text-card-foreground">
                {(simulationResults?.monte_carlo_results?.confidence_score || 
                  simulationResults?.results?.results?.confidence_score || 
                  simulationResults?.results?.confidence_score || 
                  simulationResults?.confidence_score ||
                  simulationResults?.meta_analysis?.confidence_level)
                  ? `${((simulationResults?.monte_carlo_results?.confidence_score || 
                         simulationResults?.results?.results?.confidence_score || 
                         simulationResults?.results?.confidence_score || 
                         simulationResults?.confidence_score ||
                         simulationResults?.meta_analysis?.confidence_level) * 100).toFixed(1)}%`
                  : 'N/A'
                }
              </div>
            </div>
          </div>
        </div>
    </Card>
  );
});

export default CombinedAnalysis;