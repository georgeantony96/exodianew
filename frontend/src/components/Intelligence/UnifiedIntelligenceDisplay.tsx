'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

interface UnifiedRecommendation {
  success: boolean;
  primaryBet: string;
  confidence: number;
  expectedValue: number;
  kellyStake: number;
  simpleReasoning: string;
  engineConsensus: {
    totalEngines: number;
    agreeingEngines: number;
    conflictingEngines: number;
  };
  engineVotes?: Array<{
    engine: string;
    recommendedBet: string;
    confidence: number;
    reasoning: string;
    weight: number;
  }>;
}

interface UnifiedIntelligenceDisplayProps {
  homeTeam?: string;
  awayTeam?: string;
  className?: string;
}

export default function UnifiedIntelligenceDisplay({ 
  homeTeam = '', 
  awayTeam = '', 
  className = '' 
}: UnifiedIntelligenceDisplayProps) {
  const [intelligence, setIntelligence] = useState<UnifiedRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEngineDetails, setShowEngineDetails] = useState(false);

  const fetchIntelligence = async () => {
    if (!homeTeam || !awayTeam) return;
    
    setLoading(true);
    try {
      const debugParam = showEngineDetails ? '&debug=true' : '';
      const response = await fetch(
        `/api/unified-intelligence?home_team=${encodeURIComponent(homeTeam)}&away_team=${encodeURIComponent(awayTeam)}${debugParam}`
      );
      const data = await response.json();
      setIntelligence(data);
    } catch (error) {
      console.error('Failed to fetch unified intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, [homeTeam, awayTeam]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBackground = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (confidence >= 0.6) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  if (!homeTeam || !awayTeam) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-2">🧠 Mathematical Intelligence Ready</div>
          <p className="text-gray-400 text-sm">Select teams to activate unified analysis</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin text-2xl mb-4">🧠</div>
          <div className="text-gray-600">Processing mathematical intelligence...</div>
          <div className="text-sm text-gray-500 mt-2">
            Analyzing Fibonacci, Golden Ratio, Quantum, Nash, Entropy, Klein Bottle, Pressure, and Pythagorean patterns
          </div>
        </div>
      </Card>
    );
  }

  if (!intelligence || !intelligence.success) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 text-lg mb-2">⚠️ Analysis Incomplete</div>
          <p className="text-gray-500 text-sm">Unable to generate unified recommendation</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* MAIN RECOMMENDATION - What user sees */}
      <Card className={`p-6 border-2 ${getConfidenceBackground(intelligence.confidence)}`}>
        <div className="text-center">
          <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            🧠 UNIFIED MATHEMATICAL INTELLIGENCE
          </div>
          
          {/* Primary Recommendation */}
          <div className="text-3xl font-bold mb-4">
            🎯 {intelligence.primaryBet}
          </div>
          
          {/* Confidence */}
          <div className={`text-xl font-semibold mb-3 ${getConfidenceColor(intelligence.confidence)}`}>
            📊 {Math.round(intelligence.confidence * 100)}% Confidence
          </div>
          
          {/* Simple Reasoning */}
          <div className="text-gray-700 dark:text-gray-300 mb-4 text-lg">
            {intelligence.simpleReasoning}
          </div>
          
          {/* Engine Consensus */}
          <div className="flex justify-center items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
            <span>🤝 {intelligence.engineConsensus.agreeingEngines}/{intelligence.engineConsensus.totalEngines} engines agree</span>
            {intelligence.engineConsensus.conflictingEngines > 0 && (
              <span>⚡ {intelligence.engineConsensus.conflictingEngines} conflicts detected</span>
            )}
          </div>

          {/* Value Metrics */}
          {intelligence.expectedValue > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">Expected Value</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  +{intelligence.expectedValue.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">Kelly Stake</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {(intelligence.kellyStake * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Toggle for Engine Details */}
          <button
            onClick={() => setShowEngineDetails(!showEngineDetails)}
            className="mt-6 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {showEngineDetails ? '🔽 Hide Engine Details' : '🔼 Show Engine Breakdown'}
          </button>
        </div>
      </Card>

      {/* ENGINE DETAILS - Hidden by default */}
      {showEngineDetails && intelligence.engineVotes && (
        <Card className="mt-4 p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">🔬 Mathematical Engine Breakdown</h3>
          <div className="space-y-3">
            {intelligence.engineVotes.map((engine, index) => (
              <div 
                key={engine.engine} 
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{engine.engine}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{engine.reasoning}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{engine.recommendedBet}</div>
                  <div className="text-sm text-gray-500">
                    {Math.round(engine.confidence * 100)}% • Weight: {engine.weight}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}