import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

interface MathematicalInsights {
  total_patterns: number;
  sample_size: number;
  mathematical_metrics: {
    golden_ratio: {
      patterns_in_harmony: number;
      average_harmony: number;
      strongest_harmony: number;
    };
    fibonacci: {
      fibonacci_aligned: number;
      most_common_fibonacci_index: string;
      spiral_coherence: number;
    };
    information_theory: {
      average_entropy: number;
      high_information_patterns: number;
      most_surprising_pattern: number;
    };
    quantum_mechanics: {
      coherent_patterns: number;
      entangled_patterns: number;
      average_coherence: number;
    };
    game_theory: {
      equilibrium_distribution: Record<string, number>;
      average_strategic_balance: number;
      most_balanced_patterns: number;
    };
    topology: {
      average_hyperbolic_distance: number;
      pattern_space_diameter: number;
      clustering_coefficient: number;
    };
  };
}

interface MathematicalDiscoveries {
  golden_ratio_discoveries: number;
  perfect_fibonacci_patterns: number;
  maximum_entropy_patterns: number;
  quantum_coherence_peaks: number;
  perfect_strategic_balance: number;
  hyperbolic_outliers: number;
}

const MathematicalAnalysisDisplay: React.FC = () => {
  const [insights, setInsights] = useState<MathematicalInsights | null>(null);
  const [discoveries, setDiscoveries] = useState<MathematicalDiscoveries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enhancementTableCreated, setEnhancementTableCreated] = useState(false);

  useEffect(() => {
    fetchMathematicalAnalysis();
  }, []);

  const fetchMathematicalAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mathematical-analysis?type=summary');
      const data = await response.json();

      if (data.success) {
        setInsights(data.insights);
        setDiscoveries(data.mathematical_discoveries);
      } else {
        setError(data.error || 'Failed to fetch mathematical analysis');
      }
    } catch (err) {
      setError('Error fetching mathematical analysis: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const createEnhancementTable = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mathematical-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          create_enhancement_table: true
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setEnhancementTableCreated(true);
        // Refresh the analysis
        await fetchMathematicalAnalysis();
      } else {
        setError(data.error || 'Failed to create enhancement table');
      }
    } catch (err) {
      setError('Error creating enhancement table: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card variant="premium" padding="lg">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analyzing mathematical patterns...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="premium" padding="lg">
        <div className="text-center p-8">
          <div className="text-destructive mb-4">❌ {error}</div>
          <button
            onClick={fetchMathematicalAnalysis}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors"
          >
            Retry Analysis
          </button>
        </div>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card variant="premium" padding="lg">
        <div className="text-center p-8">
          <p className="text-muted-foreground">No mathematical analysis available</p>
        </div>
      </Card>
    );
  }

  const formatPercentage = (value: number) => (value * 100).toFixed(1) + '%';
  const formatNumber = (value: number) => value.toFixed(2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="premium" padding="lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-card-foreground">
            🌟 Mathematical Pattern Universe Analysis
          </h2>
          <p className="text-muted-foreground">
            Advanced mathematical models reveal the hidden structure of football
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            Analyzing {insights.total_patterns.toLocaleString()} patterns • Sample size: {insights.sample_size}
          </div>
        </div>
      </Card>

      {/* Mathematical Discoveries */}
      {discoveries && (
        <Card variant="premium" padding="lg">
          <h3 className="text-xl font-semibold mb-4 text-card-foreground">
            🔬 Mathematical Discoveries
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-lg border border-yellow-500/20">
              <div className="text-2xl font-bold text-yellow-600">{discoveries.golden_ratio_discoveries}</div>
              <div className="text-sm text-muted-foreground">Golden Ratio Patterns</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-600">{discoveries.perfect_fibonacci_patterns}</div>
              <div className="text-sm text-muted-foreground">Fibonacci Alignments</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-600">{discoveries.quantum_coherence_peaks}</div>
              <div className="text-sm text-muted-foreground">Quantum Coherent</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-lg border border-purple-500/20">
              <div className="text-2xl font-bold text-purple-600">{discoveries.maximum_entropy_patterns}</div>
              <div className="text-sm text-muted-foreground">Maximum Entropy</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-lg border border-red-500/20">
              <div className="text-2xl font-bold text-red-600">{discoveries.perfect_strategic_balance}</div>
              <div className="text-sm text-muted-foreground">Perfect Balance</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 rounded-lg border border-indigo-500/20">
              <div className="text-2xl font-bold text-indigo-600">{discoveries.hyperbolic_outliers}</div>
              <div className="text-sm text-muted-foreground">Hyperbolic Outliers</div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Golden Ratio Analysis */}
        <Card variant="mathematical" padding="lg">
          <h3 className="text-lg font-semibold mb-4 text-card-foreground flex items-center">
            🌀 Golden Ratio (φ = 1.618)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Harmonic Patterns:</span>
              <span className="font-medium">{insights.mathematical_metrics.golden_ratio.patterns_in_harmony}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average Harmony:</span>
              <span className="font-medium">{formatNumber(insights.mathematical_metrics.golden_ratio.average_harmony)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Strongest Harmony:</span>
              <span className="font-medium text-yellow-600">{formatNumber(insights.mathematical_metrics.golden_ratio.strongest_harmony)}</span>
            </div>
            <div className="mt-4 p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
              <p className="text-sm text-card-foreground">
                <strong>Insight:</strong> Patterns following golden ratio show natural harmony in score progressions, 
                indicating fundamental mathematical structure in football outcomes.
              </p>
            </div>
          </div>
        </Card>

        {/* Fibonacci Analysis */}
        <Card variant="mathematical" padding="lg">
          <h3 className="text-lg font-semibold mb-4 text-card-foreground flex items-center">
            🔢 Fibonacci Sequence
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aligned Patterns:</span>
              <span className="font-medium">{insights.mathematical_metrics.fibonacci.fibonacci_aligned}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Common Fib Index:</span>
              <span className="font-medium">{insights.mathematical_metrics.fibonacci.most_common_fibonacci_index}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Spiral Coherence:</span>
              <span className="font-medium text-green-600">{insights.mathematical_metrics.fibonacci.spiral_coherence}</span>
            </div>
            <div className="mt-4 p-3 bg-green-500/10 rounded border border-green-500/20">
              <p className="text-sm text-card-foreground">
                <strong>Discovery:</strong> Goal totals cluster around Fibonacci numbers (1,1,2,3,5,8), 
                suggesting natural numerical progression in football scoring.
              </p>
            </div>
          </div>
        </Card>

        {/* Information Theory */}
        <Card variant="mathematical" padding="lg">
          <h3 className="text-lg font-semibold mb-4 text-card-foreground flex items-center">
            🔥 Information Theory
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average Entropy:</span>
              <span className="font-medium">{formatNumber(insights.mathematical_metrics.information_theory.average_entropy)} bits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">High Info Patterns:</span>
              <span className="font-medium">{insights.mathematical_metrics.information_theory.high_information_patterns}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Most Surprising:</span>
              <span className="font-medium text-blue-600">{formatNumber(insights.mathematical_metrics.information_theory.most_surprising_pattern)} bits</span>
            </div>
            <div className="mt-4 p-3 bg-blue-500/10 rounded border border-blue-500/20">
              <p className="text-sm text-card-foreground">
                <strong>Compression:</strong> Patterns contain measurable information content. 
                Higher entropy = more surprising outcomes, lower entropy = more predictable.
              </p>
            </div>
          </div>
        </Card>

        {/* Quantum Mechanics */}
        <Card variant="mathematical" padding="lg">
          <h3 className="text-lg font-semibold mb-4 text-card-foreground flex items-center">
            ⚡ Quantum Properties
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coherent Patterns:</span>
              <span className="font-medium">{insights.mathematical_metrics.quantum_mechanics.coherent_patterns}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entangled Patterns:</span>
              <span className="font-medium">{insights.mathematical_metrics.quantum_mechanics.entangled_patterns}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Coherence:</span>
              <span className="font-medium text-purple-600">{formatNumber(insights.mathematical_metrics.quantum_mechanics.average_coherence)}</span>
            </div>
            <div className="mt-4 p-3 bg-purple-500/10 rounded border border-purple-500/20">
              <p className="text-sm text-card-foreground">
                <strong>Quantum Model:</strong> High coherence patterns show quantum-like behavior. 
                Entangled patterns exhibit mysterious correlations across time.
              </p>
            </div>
          </div>
        </Card>

        {/* Game Theory */}
        <Card variant="mathematical" padding="lg">
          <h3 className="text-lg font-semibold mb-4 text-card-foreground flex items-center">
            🎲 Game Theory
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Strategic Balance:</span>
              <span className="font-medium">{formatNumber(insights.mathematical_metrics.game_theory.average_strategic_balance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balanced Patterns:</span>
              <span className="font-medium">{insights.mathematical_metrics.game_theory.most_balanced_patterns}</span>
            </div>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-2">Nash Equilibrium Distribution:</p>
              <div className="space-y-1">
                {Object.entries(insights.mathematical_metrics.game_theory.equilibrium_distribution).map(([equilibrium, count]) => (
                  <div key={equilibrium} className="flex justify-between text-sm">
                    <span className="capitalize">{equilibrium.replace('_', ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 p-3 bg-red-500/10 rounded border border-red-500/20">
              <p className="text-sm text-card-foreground">
                <strong>Strategic Analysis:</strong> Teams reach equilibrium states. 
                Defensive equilibrium dominates, with occasional attacking equilibriums creating high-scoring games.
              </p>
            </div>
          </div>
        </Card>

        {/* Topology */}
        <Card variant="mathematical" padding="lg">
          <h3 className="text-lg font-semibold mb-4 text-card-foreground flex items-center">
            🌌 Topology & Geometry
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Hyperbolic Distance:</span>
              <span className="font-medium">{formatNumber(insights.mathematical_metrics.topology.average_hyperbolic_distance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pattern Space Diameter:</span>
              <span className="font-medium">{formatNumber(insights.mathematical_metrics.topology.pattern_space_diameter)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Clustering Coefficient:</span>
              <span className="font-medium text-indigo-600">{formatNumber(insights.mathematical_metrics.topology.clustering_coefficient)}</span>
            </div>
            <div className="mt-4 p-3 bg-indigo-500/10 rounded border border-indigo-500/20">
              <p className="text-sm text-card-foreground">
                <strong>Pattern Space:</strong> Patterns exist in curved hyperdimensional space. 
                High clustering indicates natural pattern neighborhoods and mathematical structure.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Enhancement Controls */}
      <Card variant="premium" padding="lg">
        <h3 className="text-lg font-semibold mb-4 text-card-foreground">
          🚀 Mathematical Enhancement Controls
        </h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={createEnhancementTable}
            disabled={enhancementTableCreated || loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors disabled:opacity-50"
          >
            {enhancementTableCreated ? '✅ Enhancement Table Ready' : '🔧 Create Enhancement Table'}
          </button>
          
          <button
            onClick={fetchMathematicalAnalysis}
            disabled={loading}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            🔄 Refresh Analysis
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-muted/50 rounded border">
          <p className="text-sm text-muted-foreground">
            <strong>Next Steps:</strong> The mathematical analysis reveals deep structure in your patterns. 
            Create the enhancement table to permanently store mathematical properties and unlock 
            advanced pattern recognition capabilities.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default MathematicalAnalysisDisplay;