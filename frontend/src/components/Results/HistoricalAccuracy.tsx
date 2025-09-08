import React, { useState, useEffect } from 'react';

interface AccuracyStats {
  total_simulations: number;
  market_accuracy: Array<{
    market_type: string;
    total_predictions: number;
    accuracy_percentage: number;
  }>;
}

interface HistoricalAccuracyProps {
  leagueContext: any;
  marketTypes: string[];
  onStatsUpdate?: (stats: AccuracyStats | null) => void;
}

const HistoricalAccuracy: React.FC<HistoricalAccuracyProps> = ({ leagueContext, marketTypes, onStatsUpdate }) => {
  const [stats, setStats] = useState<AccuracyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccuracyStats();
  }, []);

  useEffect(() => {
    onStatsUpdate?.(stats);
  }, [stats, onStatsUpdate]);

  const fetchAccuracyStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching accuracy stats from API...');
      const response = await fetch('/api/accuracy-stats');
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        setStats(data);
      } else {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to fetch accuracy stats: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching accuracy stats:', error);
      setError(`Failed to load accuracy statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getMarketDisplayName = (marketType: string): string => {
    switch (marketType) {
      case '1x2': return 'Match Result (1X2)';
      case 'ou_2.5': return 'Over/Under 2.5 Goals';
      case 'ou_3.5': return 'Over/Under 3.5 Goals';
      case 'ou_4.5': return 'Over/Under 4.5 Goals';
      case 'ou_5.5': return 'Over/Under 5.5 Goals';
      case 'btts': return 'Both Teams to Score';
      case 'gg_1h': return 'Both Teams Score 1st Half';
      default: return marketType.toUpperCase().replace('_', ' ');
    }
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (accuracy >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (accuracy >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getAccuracyIcon = (accuracy: number): string => {
    if (accuracy >= 70) return '🎯';
    if (accuracy >= 60) return '✅';
    if (accuracy >= 50) return '⚠️';
    return '❌';
  };

  const getAccuracyRating = (accuracy: number): string => {
    if (accuracy >= 70) return 'Excellent';
    if (accuracy >= 60) return 'Good';
    if (accuracy >= 50) return 'Average';
    return 'Needs Improvement';
  };

  if (isLoading) {
    return (
      <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-muted-foreground">Loading accuracy statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-card-foreground mb-2">Error Loading Statistics</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={fetchAccuracyStats}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats || stats.total_simulations === 0) {
    return (
      <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
        <h2 className="text-xl font-bold mb-6 text-card-foreground">📈 Historical Accuracy</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-card-foreground mb-2">No Historical Data</h3>
          <p className="text-muted-foreground mb-4">
            Start adding match results to your simulations to track accuracy over time.
          </p>
          <div className="text-sm text-muted-foreground">
            Accuracy tracking helps improve prediction models and identify successful strategies.
          </div>
        </div>
      </div>
    );
  }

  const overallAccuracy = stats.market_accuracy.length > 0
    ? stats.market_accuracy.reduce((sum, market) => sum + market.accuracy_percentage, 0) / stats.market_accuracy.length
    : 0;

  return (
    <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Historical Accuracy</h2>
        <button
          onClick={fetchAccuracyStats}
          className="px-3 py-2 text-sm text-muted-foreground hover:text-muted-foreground800 focus:outline-none"
          title="Refresh statistics"
        >
          🔄
        </button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted rounded-lg border border-border">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {stats.total_simulations}
          </div>
          <div className="text-sm text-muted-foreground">Total Predictions</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            overallAccuracy >= 60 ? 'text-green-600' : 
            overallAccuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {overallAccuracy.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Overall Accuracy</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{color: 'var(--purple-text-medium)'}}>
            {stats.market_accuracy.length}
          </div>
          <div className="text-sm text-muted-foreground">Markets Tracked</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${
            overallAccuracy >= 60 ? 'text-green-600' : 
            overallAccuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {getAccuracyRating(overallAccuracy)}
          </div>
          <div className="text-sm text-muted-foreground">Rating</div>
        </div>
      </div>

      {/* Market-by-Market Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Market Performance</h3>
        <div className="space-y-3">
          {stats.market_accuracy
            .sort((a, b) => b.accuracy_percentage - a.accuracy_percentage)
            .map((market, index) => (
              <div 
                key={market.market_type}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  backgroundColor: '#1f2937',
                  marginBottom: '12px'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {getAccuracyIcon(market.accuracy_percentage)}
                    </span>
                    <div>
                      <h4 style={{ fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                        {getMarketDisplayName(market.market_type)}
                      </h4>
                      <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                        {market.total_predictions} predictions tracked
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold',
                      color: market.accuracy_percentage >= 70 ? '#10b981' : 
                             market.accuracy_percentage >= 60 ? '#3b82f6' :
                             market.accuracy_percentage >= 50 ? '#f59e0b' : '#ef4444'
                    }}>
                      {market.accuracy_percentage.toFixed(1)}%
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#9ca3af',
                      fontWeight: '600'
                    }}>
                      {getAccuracyRating(market.accuracy_percentage)}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="bg-white bg-opacity-50 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, market.accuracy_percentage)}%`,
                        backgroundColor: 
                          market.accuracy_percentage >= 70 ? '#059669' :
                          market.accuracy_percentage >= 60 ? '#2563eb' :
                          market.accuracy_percentage >= 50 ? '#d97706' : '#dc2626'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div style={{
        marginTop: '24px',
        padding: '16px', 
        backgroundColor: '#374151',
        borderRadius: '8px',
        border: '1px solid #4b5563'
      }}>
        <h4 style={{ fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>Performance Insights</h4>
        <div style={{ fontSize: '14px', color: '#d1d5db' }}>
          {overallAccuracy >= 65 && (
            <div style={{ marginBottom: '4px' }}>• Excellent overall performance! Your model shows strong predictive accuracy.</div>
          )}
          {overallAccuracy >= 50 && overallAccuracy < 65 && (
            <div style={{ marginBottom: '4px' }}>• Good performance with room for improvement. Consider refining boost factors.</div>
          )}
          {overallAccuracy < 50 && (
            <div style={{ marginBottom: '4px' }}>• Consider adjusting your methodology. Review historical data quality and boost settings.</div>
          )}
          
          {stats.market_accuracy.length > 0 && (
            <>
              <div style={{ marginBottom: '4px' }}>• Best performing market: {getMarketDisplayName(
                stats.market_accuracy.reduce((prev, current) => 
                  prev.accuracy_percentage > current.accuracy_percentage ? prev : current
                ).market_type
              )}</div>
              
              {stats.market_accuracy.some(m => m.accuracy_percentage < 50) && (
                <div style={{ marginBottom: '4px' }}>• Focus on improving markets with &lt;50% accuracy for better overall results.</div>
              )}
            </>
          )}
          
          <div style={{ marginBottom: '4px' }}>• Track more results to improve statistical significance of these metrics.</div>
        </div>
      </div>

      {/* Accuracy Benchmarks */}
    </div>
  );
};

export default HistoricalAccuracy;