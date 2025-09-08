import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import ProgressIndicator from './ProgressIndicator';

interface SimulationConfig {
  iterations: number;
  distribution: 'poisson' | 'negative_binomial';
  homeTeamId: number;
  awayTeamId: number;
  matchDate: string;
  boostSettings: any;
  historicalData: any;
  bookmakerOdds: any;
}

interface SimulationResult {
  '1x2': {
    home: number;
    draw: number;
    away: number;
  };
  over_under: {
    [key: string]: number;
  };
  both_teams_score: {
    yes: number;
    no: number;
  };
  statistics: {
    avg_home_goals: number;
    avg_away_goals: number;
    avg_total_goals: number;
  };
  true_odds: any;
  value_bets: any;
  metadata: {
    distribution_type: string;
    iterations: number;
    processing_time: number;
  };
}

interface Team {
  id: number;
  name: string;
}

interface SimulationRunnerProps {
  homeTeam: Team;
  awayTeam: Team;
  historicalMatches: any;
  bookmakerOdds: any;
  boosts: any;
  distribution: 'poisson' | 'negative_binomial';
  iterations: number;
  onComplete: (results: SimulationResult) => void;
  enableMultiEngine?: boolean; // New option for multi-engine simulation
}

const SimulationRunner: React.FC<SimulationRunnerProps> = ({
  homeTeam,
  awayTeam,
  historicalMatches,
  bookmakerOdds,
  boosts,
  distribution,
  iterations,
  onComplete,
  enableMultiEngine = false
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(0);

  const iterationOptions = [
    { value: 1, label: '1', time: '<1ms', accuracy: 'Pure Chaos', recommended: false },
    { value: 1000, label: '1K', time: '<1s', accuracy: 'Fast Test', recommended: false },
    { value: 5000, label: '5K', time: '~1s', accuracy: 'Quick Test', recommended: false },
    { value: 10000, label: '10K', time: '~2s', accuracy: 'Good', recommended: false },
    { value: 50000, label: '50K', time: '~8s', accuracy: 'Better', recommended: true },
    { value: 100000, label: '100K', time: '~15s', accuracy: 'Very Good', recommended: false },
    { value: 500000, label: '500K', time: '~45s', accuracy: 'Excellent', recommended: false },
    { value: 1000000, label: '1M', time: '~90s', accuracy: 'Maximum', recommended: false }
  ];

  const runSimulation = async () => {
    if (!homeTeam?.id || !awayTeam?.id) {
      console.error('Please select both home and away teams');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setCurrentStep('Initializing simulation...');

    try {
      // Estimate processing time
      const selectedOption = iterationOptions.find(opt => opt.value === iterations);
      setEstimatedTime(selectedOption ? parseInt(selectedOption.time.replace(/[^\d]/g, '')) : 15);

      // Step 1: Prepare historical data
      setCurrentStep('Analyzing historical data...');
      setProgress(10);
      await delay(500);

      // Step 2: Calculate parameters
      setCurrentStep('Calculating model parameters...');
      setProgress(25);
      await delay(500);

      // Step 3: Run simulation
      setCurrentStep(enableMultiEngine 
        ? `Running multi-engine analysis (${iterations.toLocaleString()} Monte Carlo + Pattern Engine + Comparison)...`
        : `Running ${iterations.toLocaleString()} Monte Carlo iterations...`
      );
      setProgress(40);

      // Choose API endpoint based on multi-engine setting
      const apiEndpoint = enableMultiEngine ? '/api/multi-engine-simulation' : '/api/simulate';
      
      const requestData = enableMultiEngine ? {
        // Multi-Engine API format
        homeTeam: { id: homeTeam.id, name: homeTeam.name },
        awayTeam: { id: awayTeam.id, name: awayTeam.name },
        selectedLeague: { id: homeTeam.league_id || awayTeam.league_id || 1, name: 'Selected League' },
        matchDate: new Date().toISOString().split('T')[0],
        historicalMatches: historicalMatches,
        bookmakerOdds: bookmakerOdds,
        boosts: boosts,
        distribution: distribution,
        iterations: iterations,
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
        distribution_type: distribution,
        iterations: iterations,
        boost_settings: boosts,
        historical_data: historicalMatches,
        bookmaker_odds: bookmakerOdds,
        chaos_config: boosts?.chaos_config
      };
      
      console.log(`Sending ${enableMultiEngine ? 'MULTI-ENGINE' : 'MONTE CARLO'} simulation request:`, requestData);
      console.log('Home team data:', homeTeam);
      console.log('Away team data:', awayTeam);
      console.log('Boosts:', boosts);
      console.log('Historical matches:', historicalMatches);
      console.log('Bookmaker odds:', bookmakerOdds);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('API response status:', response.status, response.statusText);

      if (!response.ok) {
        // Try to get the actual error message from the response
        let errorDetails = response.statusText || 'Unknown error';
        try {
          // First get the response text to see what we're dealing with
          const responseText = await response.text();
          console.log('API Response:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
          
          if (responseText.trim()) {
            try {
              const errorData = JSON.parse(responseText);
              errorDetails = errorData.error || errorData.message || response.statusText;
              
              // Only log detailed debug info in development
              if (process.env.NODE_ENV === 'development') {
                console.debug('Full Error Response:', errorData);
                if (errorData.debug) {
                  console.debug('Debug Info:', errorData.debug);
                }
                if (errorData.details) {
                  console.debug('Error Details:', errorData.details);
                }
              }
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
      setCurrentStep('Processing results...');
      await delay(300);

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
      setCurrentStep('Calculating value bets...');
      await delay(200);

      setProgress(100);
      setCurrentStep('Simulation complete!');

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
        setCurrentStep('');
      }, 500);

    } catch (error) {
      setIsRunning(false);
      setProgress(0);
      setCurrentStep('');
      
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

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getIterationRecommendation = () => {
    const recommended = iterationOptions.find(opt => opt.recommended);
    return recommended ? recommended.value : 50000;
  };

  return (
    <Card variant="pattern-discovery" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-card-foreground">
          {enableMultiEngine ? '🧠 Multi-Engine Analysis' : '🎯 Monte Carlo Simulation'}
        </h2>
        {enableMultiEngine && (
          <div className="flex items-center gap-2 text-sm bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <span className="text-primary">⚡</span>
            <span className="text-primary font-medium">3 Engines Active</span>
          </div>
        )}
      </div>
      
      {/* Configuration Summary */}
      <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
        <h3 className="font-semibold mb-2 text-card-foreground">Simulation Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Distribution:</span>
            <p className="font-medium capitalize">{distribution?.replace('_', ' ') || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Iterations:</span>
            <p className="font-medium">{iterations?.toLocaleString() || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Est. Time:</span>
            <p className="font-medium">
              {iterationOptions.find(opt => opt.value === iterations)?.time || '~15s'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Accuracy:</span>
            <p className="font-medium">
              {iterationOptions.find(opt => opt.value === iterations)?.accuracy || 'Good'}
            </p>
          </div>
        </div>
      </div>

      {/* Iteration Selection */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Simulation Iterations</h3>
        <div className="grid grid-cols-8 gap-1">
          {iterationOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                // This would update the config iterations
                // Note: iterations are set via DistributionSelector component
              }}
              disabled={isRunning}
              className={`p-3 border rounded-lg text-center transition-all ${
                iterations === option.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-accent-foreground text-card-foreground'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                option.recommended ? 'ring-2 ring-success/20' : ''
              }`}
            >
              <div className="font-semibold">{option.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{option.time}</div>
              <div className="text-xs mt-1">
                <span className={`px-2 py-1 rounded ${
                  option.accuracy === 'Maximum' ? 'bg-purple-subtle' : ''} ${
                  option.accuracy === 'Maximum' ? 'text-purple-high-contrast' :
                  option.accuracy === 'Excellent' ? 'bg-green-100 text-green-700' :
                  option.accuracy === 'Very Good' ? 'bg-blue-100 text-blue-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {option.accuracy}
                </span>
              </div>
              {option.recommended && (
                <div className="text-xs text-green-600 font-medium mt-1">Recommended</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Indicator */}
      {isRunning && (
        <div className="mb-6">
          <ProgressIndicator
            progress={progress}
            currentStep={currentStep}
            estimatedTime={estimatedTime}
            isRunning={isRunning}
          />
        </div>
      )}

      {/* Simulation Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
              isRunning
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary hover:opacity-90 text-primary-foreground'
            }`}
          >
            {isRunning ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Running...
              </div>
            ) : (
              'Run Simulation'
            )}
          </button>

          {isRunning && (
            <button
              onClick={() => {
                // This would cancel the simulation
                setIsRunning(false);
                setProgress(0);
                setCurrentStep('');
              }}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {!isRunning && (
            <>
              Ready to simulate {iterations.toLocaleString()} iterations using{' '}
              {distribution.replace('_', ' ')} distribution
            </>
          )}
        </div>
      </div>

      {/* Simulation Tips */}
      <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <h4 className="font-medium text-primary mb-2">💡 {enableMultiEngine ? 'Multi-Engine Tips' : 'Simulation Tips'}</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          {enableMultiEngine ? (
            <>
              <li>• <strong>Monte Carlo Engine</strong> uses physics-based simulation with adaptive learning</li>
              <li>• <strong>Pattern Engine</strong> makes independent predictions from historical patterns</li>
              <li>• <strong>Engine Comparison</strong> identifies value opportunities across all engines</li>
              <li>• <strong>Meta-Analysis</strong> recommends the best engine for this specific match</li>
              <li>• System learns from every prediction to improve future accuracy</li>
            </>
          ) : (
            <>
              <li>• <strong>1K-10K iterations</strong> show chaos effects more clearly (less convergence)</li>
              <li>• <strong>50K iterations</strong> provide good accuracy for most matches</li>
              <li>• <strong>Higher iterations</strong> increase accuracy but average out chaos impact</li>
              <li>• <strong>Negative Binomial</strong> is better for teams with inconsistent scoring</li>
              <li>• Results include value bet detection automatically</li>
            </>
          )}
        </ul>
      </div>
    </Card>
  );
};

export default SimulationRunner;