'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
// Simple icons replacement for lucide-react
const Icons = {
  Loader2: () => <div className="animate-spin">⏳</div>,
  TrendingUp: () => <span>📈</span>,
  Zap: () => <span>⚡</span>,
  Target: () => <span>🎯</span>,
  Brain: () => <span>🧠</span>,
  Infinity: () => <span>∞</span>,
  Sparkles: () => <span>✨</span>
};

interface MathematicalSummary {
  success: boolean;
  query_type: string;
  system_overview: {
    total_patterns: number;
    mathematical_distribution: {
      golden_ratio: string;
      fibonacci: string;
      high_entropy: string;
      quantum_coherent: string;
      klein_bottle: string;
    };
    mathematical_averages: {
      golden_harmony: string;
      fibonacci_strength: string;
      entropy: string;
      coherence: string;
      strategic_balance: string;
    };
  };
  top_mathematical_patterns: Array<{
    pattern_id: number;
    home_score_ht: number;
    away_score_ht: number;
    home_score_ft: number;
    away_score_ft: number;
    mathematical_type: string;
    math_confidence: number;
    golden_ratio_harmony: number;
    fibonacci_strength: number;
    quantum_coherence: number;
    shannon_entropy: number;
  }>;
  betting_insights: {
    fibonacci_dominance: string;
    golden_opportunities: string;
    surprise_value: string;
    predictable_quantum: string;
  };
}

interface FibonacciPrediction {
  success: boolean;
  predictions: Record<string, Array<{
    pattern_id: number;
    home_score_ht: number;
    away_score_ht: number;
    home_score_ft: number;
    away_score_ft: number;
    fibonacci_strength: number;
    quantum_coherence: number;
    mathematical_type: string;
    total_goals: number;
    outcome: string;
  }>>;
  betting_advice: string;
  patterns_analyzed: number;
}

interface GoldenRatioOpportunities {
  success: boolean;
  golden_patterns: Array<{
    pattern_id: number;
    home_score_ht: number;
    away_score_ht: number;
    home_score_ft: number;
    away_score_ft: number;
    golden_ratio_harmony: number;
    quantum_coherence: number;
    strategic_balance: number;
    mathematical_type: string;
    outcome: string;
  }>;
  outcome_distribution: Record<string, number>;
  betting_strategy: string;
  rarity: string;
}

const Badge: React.FC<{ children: React.ReactNode; variant?: 'default' | 'secondary' | 'outline'; className?: string }> = ({ children, variant = 'default', className = '' }) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    outline: 'border border-gray-200 text-gray-700 dark:border-gray-600 dark:text-gray-300'
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export function MathematicalInsightsPanel() {
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<Record<string, any>>({});

  const fetchData = async (queryType: string) => {
    if (data[queryType]) return; // Already loaded
    
    setLoading(prev => ({ ...prev, [queryType]: true }));
    try {
      const response = await fetch(`/api/mathematical-queries?type=${queryType}&limit=10`);
      const result = await response.json();
      setData(prev => ({ ...prev, [queryType]: result }));
    } catch (error) {
      console.error(`Error fetching ${queryType}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [queryType]: false }));
    }
  };

  useEffect(() => {
    fetchData('mathematical_summary');
  }, []);

  const formatScore = (ht_home: number, ht_away: number, ft_home: number, ft_away: number) => 
    `HT ${ht_home}-${ht_away} → FT ${ft_home}-${ft_away}`;

  const tabs = [
    { id: 'summary', label: 'Overview', icon: Icons.Brain },
    { id: 'fibonacci_predictions', label: 'Fibonacci', icon: Icons.TrendingUp },
    { id: 'golden_ratio_opportunities', label: 'Golden Ratio', icon: Icons.Sparkles },
    { id: 'high_entropy_surprises', label: 'High Entropy', icon: Icons.Zap },
    { id: 'quantum_coherent_predictions', label: 'Quantum', icon: Icons.Target },
    { id: 'nash_equilibrium_breaks', label: 'Game Theory', icon: Icons.Infinity },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'summary') {
      fetchData(tabId);
    }
  };

  const renderSummary = () => {
    const summary: MathematicalSummary = data.mathematical_summary;
    if (!summary) return (
      <div className="text-center p-8">
        <div className="w-8 h-8 mx-auto mb-4"><Icons.Loader2 /></div>
        <div>Loading mathematical insights...</div>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* System Overview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icons.Brain />
            Mathematical System Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {summary.system_overview.total_patterns.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Patterns</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {summary.system_overview.mathematical_distribution.fibonacci}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Fibonacci Patterns</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {summary.system_overview.mathematical_distribution.golden_ratio}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Golden Ratio</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {summary.system_overview.mathematical_distribution.quantum_coherent}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Quantum Coherent</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {summary.system_overview.mathematical_distribution.high_entropy}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">High Entropy</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {summary.system_overview.mathematical_distribution.klein_bottle}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Klein Bottle</div>
            </div>
          </div>
        </Card>

        {/* Betting Insights */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icons.Target />
            Key Betting Insights
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg">
              <div className="font-semibold text-yellow-800 dark:text-yellow-200">🔢 Fibonacci Dominance</div>
              <div className="text-yellow-700 dark:text-yellow-300">{summary.betting_insights.fibonacci_dominance}</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
              <div className="font-semibold text-purple-800 dark:text-purple-200">🌟 Golden Opportunities</div>
              <div className="text-purple-700 dark:text-purple-300">{summary.betting_insights.golden_opportunities}</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg">
              <div className="font-semibold text-red-800 dark:text-red-200">🔥 Surprise Value</div>
              <div className="text-red-700 dark:text-red-300">{summary.betting_insights.surprise_value}</div>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
              <div className="font-semibold text-green-800 dark:text-green-200">⚡ Quantum Predictability</div>
              <div className="text-green-700 dark:text-green-300">{summary.betting_insights.predictable_quantum}</div>
            </div>
          </div>
        </Card>

        {/* Top Mathematical Patterns */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icons.Sparkles />
            Top Mathematical Patterns
          </h3>
          <div className="space-y-3">
            {summary.top_mathematical_patterns.slice(0, 5).map((pattern, index) => (
              <div key={pattern.pattern_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">#{index + 1}</Badge>
                  <div>
                    <div className="font-medium">
                      Pattern {pattern.pattern_id}: {formatScore(pattern.home_score_ht, pattern.away_score_ht, pattern.home_score_ft, pattern.away_score_ft)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Type: {pattern.mathematical_type} • Confidence: {pattern.math_confidence.toFixed(2)}
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={pattern.mathematical_type === 'Golden' ? 'default' : 
                           pattern.mathematical_type === 'Fibonacci' ? 'secondary' : 'outline'}
                >
                  {pattern.mathematical_type}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderFibonacciPredictions = () => {
    const fibData: FibonacciPrediction = data.fibonacci_predictions;
    if (loading.fibonacci_predictions) {
      return (
        <div className="flex items-center justify-center p-8">
          <Icons.Loader2 />
          <span className="ml-2">Loading Fibonacci predictions...</span>
        </div>
      );
    }
    if (!fibData) return null;

    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icons.TrendingUp />
          Fibonacci Sequence Predictions
        </h3>
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Betting Strategy</div>
          <div className="text-yellow-700 dark:text-yellow-300">{fibData.betting_advice}</div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
            Analyzed {fibData.patterns_analyzed} Fibonacci patterns
          </div>
        </div>
        
        <div className="space-y-4">
          {Object.entries(fibData.predictions).map(([nextFib, patterns]) => (
            <div key={nextFib} className="border rounded-lg p-4">
              <div className="font-semibold mb-3 text-lg">
                🎯 Next Fibonacci Total: <Badge variant="secondary" className="ml-2">{nextFib} goals</Badge>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {patterns.length} patterns suggest this outcome
              </div>
              <div className="space-y-2">
                {patterns.slice(0, 3).map((pattern) => (
                  <div key={pattern.pattern_id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
                    <div>
                      <span className="font-medium">Pattern {pattern.pattern_id}</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                        {formatScore(pattern.home_score_ht, pattern.away_score_ht, pattern.home_score_ft, pattern.away_score_ft)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{pattern.outcome}</Badge>
                      <span className="text-sm text-gray-500">Fib: {pattern.fibonacci_strength}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const renderTab = (tabKey: string) => {
    switch (tabKey) {
      case 'summary':
        return renderSummary();
      case 'fibonacci_predictions':
        return renderFibonacciPredictions();
      default:
        return (
          <Card className="p-6">
            <div className="text-center">
              <div className="text-gray-500 mb-4">Load {tabKey.replace('_', ' ')} data</div>
              <Button 
                onClick={() => fetchData(tabKey)} 
                disabled={loading[tabKey]}
              >
                {loading[tabKey] && <Icons.Loader2 />}
                Load Data
              </Button>
            </div>
          </Card>
        );
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Mathematical Pattern Analysis</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Advanced mathematical insights using Golden Ratio, Fibonacci, Information Theory, Quantum Analysis, and Game Theory
        </p>
      </div>

      {/* Simple Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabClick(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
<Icon />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTab(activeTab)}
      </div>
    </div>
  );
}