import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

interface DistributionInfo {
  type: 'poisson' | 'negative_binomial';
  name: string;
  description: string;
  bestFor: string[];
  pros: string[];
  cons: string[];
}

interface Team {
  id: number;
  name: string;
}

interface DistributionSelectorProps {
  homeTeam: Team | null;
  awayTeam: Team | null;
  historicalMatches: any;
  bookmakerOdds: any;
  boosts: any;
  patternAnalysis?: {
    uniquePatternId: string;
    patternConfidence: number;
    patternInsights: any;
    firstSimulationResults: any;
  } | null;
  selectedDistribution: 'poisson' | 'negative_binomial';
  selectedIterations: number;
  onSelectionChange: (distribution: 'poisson' | 'negative_binomial', iterations: number) => void;
  onComplete: (results: any) => void;
}

const DistributionSelector: React.FC<DistributionSelectorProps> = ({
  homeTeam,
  awayTeam,
  historicalMatches,
  bookmakerOdds,
  boosts,
  patternAnalysis,
  selectedDistribution,
  selectedIterations,
  onSelectionChange,
  onComplete
}) => {
  const [recommendation, setRecommendation] = useState<'poisson' | 'negative_binomial' | null>(null);
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [enableMultiEngine, setEnableMultiEngine] = useState(true); // Default to multi-engine for better results

  const distributions: DistributionInfo[] = [
    {
      type: 'poisson',
      name: 'Poisson Distribution',
      description: 'Traditional model assuming goals occur at a constant average rate',
      bestFor: [
        'Teams with consistent scoring patterns',
        'Matches with predictable outcomes',
        'Large sample sizes (10+ matches)',
        'When variance ≈ mean in historical data'
      ],
      pros: [
        'Simple and fast computation',
        'Well-established in sports modeling',
        'Good for teams with stable form',
        'Less prone to overfitting'
      ],
      cons: [
        'Assumes constant scoring rate',
        'May underestimate extreme outcomes',
        'Less accurate for volatile teams',
        'Cannot model overdispersion'
      ]
    },
    {
      type: 'negative_binomial',
      name: 'Negative Binomial Distribution',
      description: 'Advanced model that accounts for variability in team performance',
      bestFor: [
        'Teams with inconsistent scoring',
        'When historical variance > mean',
        'Smaller sample sizes',
        'Volatile or unpredictable matchups'
      ],
      pros: [
        'Handles overdispersion naturally',
        'More accurate for inconsistent teams',
        'Better extreme outcome modeling',
        'Adapts to data characteristics'
      ],
      cons: [
        'More complex computation',
        'Requires parameter estimation',
        'Can overfit with small samples',
        'Slower simulation speed'
      ]
    }
  ];

  useEffect(() => {
    if (historicalMatches) {
      analyzeHistoricalData();
    }
  }, [historicalMatches]);

  const analyzeHistoricalData = () => {
    if (!historicalMatches) return;

    // Combine all relevant historical matches
    const allMatches = [
      ...(historicalMatches.h2h || []),
      ...(historicalMatches.home_home || []),
      ...(historicalMatches.away_away || [])
    ];

    if (allMatches.length < 3) {
      setRecommendation('poisson');
      setConfidence('low');
      return;
    }

    // Calculate goal statistics
    const goals = allMatches.flatMap(match => [
      match.home_score_ft || 0,
      match.away_score_ft || 0
    ]);

    const mean = goals.reduce((sum, g) => sum + g, 0) / goals.length;
    const variance = goals.reduce((sum, g) => sum + Math.pow(g - mean, 2), 0) / goals.length;
    const overdispersionRatio = variance / mean;

    // Decision logic
    let recommendedDistribution: 'poisson' | 'negative_binomial';
    let confidenceLevel: 'high' | 'medium' | 'low';

    if (overdispersionRatio > 1.5 && allMatches.length >= 6) {
      recommendedDistribution = 'negative_binomial';
      confidenceLevel = overdispersionRatio > 2.0 ? 'high' : 'medium';
    } else if (overdispersionRatio < 0.8) {
      recommendedDistribution = 'poisson';
      confidenceLevel = allMatches.length >= 10 ? 'high' : 'medium';
    } else {
      recommendedDistribution = 'poisson'; // Default for moderate overdispersion
      confidenceLevel = allMatches.length >= 8 ? 'medium' : 'low';
    }

    setRecommendation(recommendedDistribution);
    setConfidence(confidenceLevel);
  };

  const getConfidenceColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'text-success bg-success/10 border-success/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'low': return 'text-destructive bg-destructive/10 border-destructive/20';
    }
  };

  const getRecommendationIcon = (dist: 'poisson' | 'negative_binomial') => {
    if (!recommendation) return '';
    return recommendation === dist ? '🎯 ' : '';
  };

  const runSimulation = async () => {
    if (!homeTeam?.id || !awayTeam?.id) {
      console.error('Please select both home and away teams');
      alert('Please select both home and away teams');
      return;
    }

    if (!bookmakerOdds) {
      alert('Please enter bookmaker odds');
      return;
    }

    setIsRunning(true);
    setProgress(0);

    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 95));
    }, 200);

    try {
      // Choose API endpoint and data format based on multi-engine setting
      const apiEndpoint = enableMultiEngine ? '/api/multi-engine-simulation' : '/api/simulate';
      
      const simulationData = enableMultiEngine ? {
        // Multi-Engine API format
        homeTeam: { id: homeTeam.id, name: homeTeam.name },
        awayTeam: { id: awayTeam.id, name: awayTeam.name },
        selectedLeague: { id: homeTeam.league_id || awayTeam.league_id || 1, name: 'Selected League' },
        matchDate: new Date().toISOString().split('T')[0],
        historicalMatches: historicalMatches,
        bookmakerOdds: bookmakerOdds,
        boosts: boosts,
        distribution: selectedDistribution,
        iterations: selectedIterations,
        // Multi-engine options
        enablePatternEngine: true,
        enableEngineComparison: !!bookmakerOdds,
        enableAdaptiveLearning: true
      } : {
        // Traditional Monte Carlo API format
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        league_id: homeTeam.league_id || awayTeam.league_id || 1,
        match_date: new Date().toISOString().split('T')[0],
        distribution_type: selectedDistribution,
        iterations: selectedIterations,
        boost_settings: boosts,
        historical_data: historicalMatches,
        bookmaker_odds: bookmakerOdds,
        pattern_analysis: patternAnalysis
      };

      console.log(`Sending ${enableMultiEngine ? 'MULTI-ENGINE' : 'MONTE CARLO'} simulation request:`, simulationData);
      console.log('Home team data DETAILED:', JSON.stringify(homeTeam, null, 2));
      console.log('Away team data DETAILED:', JSON.stringify(awayTeam, null, 2));
      console.log('Boost settings DETAILED:', JSON.stringify(boosts, null, 2));
      console.log('Historical matches DETAILED:', JSON.stringify(historicalMatches, null, 2));

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulationData)
      });

      if (!response.ok) {
        // Try to get the actual error message from the response
        let errorDetails = response.statusText || 'Unknown error';
        try {
          const responseText = await response.text();
          console.log('API Response:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
          
          if (responseText.trim()) {
            try {
              const errorData = JSON.parse(responseText);
              errorDetails = errorData.error || errorData.message || response.statusText;
            } catch (jsonError) {
              console.error('Response is not valid JSON:', jsonError);
              errorDetails = `API returned non-JSON response: ${responseText.substring(0, 200)}`;
            }
          } else {
            errorDetails = `Empty response from API (Status: ${response.status})`;
          }
        } catch (textError) {
          console.error('Failed to read response text:', textError);
          errorDetails = `Failed to read API response (Status: ${response.status})`;
        }
        throw new Error(`Simulation failed: ${errorDetails}`);
      }

      setProgress(75);

      let apiResponse;
      try {
        const responseText = await response.text();
        console.log('Raw Success Response Text:', responseText.substring(0, 500));
        apiResponse = JSON.parse(responseText);
        console.log('Parsed API Response:', apiResponse);
      } catch (parseError) {
        console.error('Failed to parse success response:', parseError);
        throw new Error('API returned invalid JSON response');
      }

      setProgress(90);
      clearInterval(progressInterval);
      setProgress(100);

      // Extract the actual results from the nested response structure
      console.log('[DEBUG] API Response structure:', {
        hasSuccess: 'success' in apiResponse,
        hasResults: 'results' in apiResponse,
        resultsKeys: apiResponse.results ? Object.keys(apiResponse.results) : null,
        hasValueBets: apiResponse.results?.value_bets ? 'YES' : 'NO',
        apiResponseKeys: Object.keys(apiResponse)
      });
      
      // Fixed extraction: Backend returns {success: true, results: {...}} format
      const results = apiResponse.results || apiResponse;
      
      console.log('[DEBUG] Extracted results:', {
        resultsKeys: Object.keys(results),
        hasValueBets: results.value_bets ? 'YES' : 'NO',
        valueBetsType: typeof results.value_bets,
        valueBets: results.value_bets
      });

      // Add some computed metadata
      results.metadata = {
        ...results.metadata,
        processing_time: Date.now() - Date.now(), // This would be calculated properly
        completed_at: new Date().toISOString()
      };

      setTimeout(() => {
        onComplete(results);
        setIsRunning(false);
        setProgress(0);
      }, 500);
    } catch (error) {
      setIsRunning(false);
      setProgress(0);
      clearInterval(progressInterval);
      
      let errorMessage = 'Simulation failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error('Simulation failed:', errorMessage);
      
      // Show user-friendly error message
      const userFriendlyMessage = errorMessage.includes('Python script failed') 
        ? 'Simulation engine encountered an issue. Please try again in a moment.'
        : errorMessage;
      
      alert(`❌ Simulation Error: ${userFriendlyMessage}\n\nPlease check:\n1. All required fields are filled\n2. Historical data is entered\n3. Teams are selected\n4. Network connection is stable`);
    }
  };

  return (
    <Card variant="pattern-discovery" padding="lg">
      <h2 className="text-xl font-bold mb-4 text-card-foreground">Simulation Configuration</h2>
      
      {/* AI Recommendation Banner */}
      {recommendation && (
        <div className={`mb-4 p-3 border rounded-lg ${getConfidenceColor(confidence)}`}>
          <div className="flex items-center gap-2">
            <span className="font-medium text-card-foreground">AI Recommendation:</span>
            <strong className="text-card-foreground">
              {recommendation === 'poisson' ? 'Poisson' : 'Negative Binomial'}
            </strong>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              confidence === 'high' ? 'bg-success/20 text-success' :
              confidence === 'medium' ? 'bg-warning/20 text-warning' :
              'bg-destructive/20 text-destructive'
            }`}>
              {confidence.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Multi-Engine Toggle */}
      <div className="mb-4 p-4 bg-secondary/20 rounded-lg border border-secondary/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-card-foreground mb-1">🧠 Multi-Engine Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Run 3 prediction engines simultaneously for maximum accuracy and value detection
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enableMultiEngine}
              onChange={(e) => setEnableMultiEngine(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${
              enableMultiEngine ? 'bg-primary' : 'bg-border'
            }`}>
              <div className={`w-4 h-4 bg-background rounded-full shadow-md transform transition-transform ${
                enableMultiEngine ? 'translate-x-6' : 'translate-x-1'
              } mt-1`}></div>
            </div>
          </label>
        </div>
        {enableMultiEngine && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <span>🎯</span>
              <span>Monte Carlo</span>
            </div>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded">
              <span>🧠</span>
              <span>Pattern Engine</span>
            </div>
            <div className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded">
              <span>⚖️</span>
              <span>Comparison</span>
            </div>
          </div>
        )}
      </div>

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Top Left: Poisson Distribution */}
        <label
          className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
            selectedDistribution === 'poisson'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-accent-foreground hover:bg-accent/5'
          } ${recommendation === 'poisson' ? 'ring-1 ring-success/30' : ''}`}
        >
          <input
            type="radio"
            checked={selectedDistribution === 'poisson'}
            onChange={() => onSelectionChange('poisson', selectedIterations)}
            className="w-4 h-4 text-primary focus:ring-ring"
          />
          <div>
            <div className="font-medium text-card-foreground">
              Poisson Distribution
            </div>
            <div className="text-xs text-muted-foreground">
              Traditional, consistent teams
            </div>
          </div>
        </label>

        {/* Top Right: Simulation Iterations */}
        <div className="grid grid-cols-7 gap-1">
          {[1, 1000, 5000, 10000, 100000, 500000, 1000000].map((iter) => (
            <label
              key={iter}
              className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all text-sm ${
                selectedIterations === iter
                  ? 'border-primary bg-primary/10 text-card-foreground'
                  : 'border-border hover:border-accent-foreground hover:bg-accent/5 text-card-foreground'
              }`}
            >
              <input
                type="radio"
                checked={selectedIterations === iter}
                onChange={() => onSelectionChange(selectedDistribution, iter)}
                className="w-3 h-3 text-primary focus:ring-ring"
              />
              <span className="font-medium">
                {iter >= 1000000 ? `${iter / 1000000}M` : 
                 iter >= 1000 ? `${iter / 1000}K` : iter}
              </span>
            </label>
          ))}
        </div>

        {/* Bottom Left: Negative Binomial Distribution */}
        <label
          className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
            selectedDistribution === 'negative_binomial'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-accent-foreground hover:bg-accent/5'
          } ${recommendation === 'negative_binomial' ? 'ring-1 ring-success/30' : ''}`}
        >
          <input
            type="radio"
            checked={selectedDistribution === 'negative_binomial'}
            onChange={() => onSelectionChange('negative_binomial', selectedIterations)}
            className="w-4 h-4 text-primary focus:ring-ring"
          />
          <div>
            <div className="font-medium text-card-foreground">
              Negative Binomial Distribution
            </div>
            <div className="text-xs text-muted-foreground">
              Advanced, variable teams
            </div>
          </div>
        </label>

        {/* Bottom Right: Run Simulation Button */}
        <button
          onClick={runSimulation}
          disabled={isRunning || !homeTeam || !awayTeam || !bookmakerOdds}
          className={`w-full h-full flex items-center justify-center gap-3 p-4 border rounded-lg font-medium transition-all ${
            isRunning 
              ? 'bg-muted text-muted-foreground cursor-not-allowed border-border'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl border-primary'
          }`}
        >
          {isRunning ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              <span>Running...</span>
            </div>
          ) : (
            <span>{enableMultiEngine ? 'Run Multi-Engine Analysis' : 'Run Monte Carlo Simulation'}</span>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="mt-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-center mt-2 text-sm text-muted-foreground">
            {enableMultiEngine 
              ? `Running multi-engine analysis (${selectedIterations.toLocaleString()} Monte Carlo + Pattern Engine + Comparison)...`
              : `Simulating ${selectedIterations.toLocaleString()} iterations using ${selectedDistribution} distribution...`
            }
          </div>
        </div>
      )}
    </Card>
  );
};

export default DistributionSelector;