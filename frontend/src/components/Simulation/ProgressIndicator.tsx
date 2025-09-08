import React, { useState, useEffect } from 'react';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  currentStep: string;
  estimatedTime?: number; // in seconds
  isRunning: boolean;
  onCancel?: () => void;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  currentStep,
  estimatedTime = 0,
  isRunning,
  onCancel
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(estimatedTime);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        
        // Calculate remaining time based on progress
        if (progress > 0) {
          const totalEstimated = (elapsedTime * 100) / progress;
          const remaining = Math.max(0, totalEstimated - elapsedTime);
          setRemainingTime(Math.round(remaining));
        }
      }, 1000);
    } else {
      setElapsedTime(0);
      setRemainingTime(estimatedTime);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, progress, elapsedTime, estimatedTime]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
  };

  const getProgressColor = () => {
    if (progress < 25) return 'bg-red-500';
    if (progress < 50) return 'bg-yellow-500';
    if (progress < 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStepIcon = () => {
    if (currentStep.includes('Initializing')) return '🔧';
    if (currentStep.includes('Analyzing')) return '📊';
    if (currentStep.includes('Calculating')) return '🧮';
    if (currentStep.includes('Running')) return '⚡';
    if (currentStep.includes('Processing')) return '🔄';
    if (currentStep.includes('complete')) return '✅';
    return '🎲';
  };

  const simulationSteps = [
    { name: 'Initialize', progress: 0, icon: '🔧' },
    { name: 'Analyze Data', progress: 20, icon: '📊' },
    { name: 'Calculate Parameters', progress: 30, icon: '🧮' },
    { name: 'Run Monte Carlo', progress: 70, icon: '⚡' },
    { name: 'Process Results', progress: 90, icon: '🔄' },
    { name: 'Complete', progress: 100, icon: '✅' }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Simulation Progress</h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Elapsed: {formatTime(elapsedTime)}</span>
          {remainingTime > 0 && (
            <span>Remaining: ~{formatTime(remainingTime)}</span>
          )}
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {getStepIcon()} {currentStep}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {Math.round(progress)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-out ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          >
            <div className="h-full bg-gradient-to-r from-transparent to-white opacity-30 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          {simulationSteps.map((step, index) => {
            const isCompleted = progress >= step.progress;
            const isCurrent = progress >= step.progress && 
                             (index === simulationSteps.length - 1 || progress < simulationSteps[index + 1].progress);
            
            return (
              <div key={step.name} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.icon}
                </div>
                <span className={`text-xs mt-1 ${
                  isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-lg font-bold text-gray-900">
            {progress >= 70 ? '⚡' : '⏳'}
          </div>
          <div className="text-xs text-gray-600">Status</div>
          <div className="text-sm font-medium">
            {progress >= 100 ? 'Complete' : progress >= 70 ? 'Computing' : 'Preparing'}
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-lg font-bold text-blue-600">
            {progress >= 40 ? Math.round((progress - 40) * 1666) : 0}K
          </div>
          <div className="text-xs text-gray-600">Iterations</div>
          <div className="text-sm font-medium">Processed</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-lg font-bold text-green-600">
            {elapsedTime > 0 ? Math.round(progress / elapsedTime * 10) / 10 : 0}%/s
          </div>
          <div className="text-xs text-gray-600">Speed</div>
          <div className="text-sm font-medium">Progress Rate</div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {isRunning && (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Monte Carlo simulation in progress...</span>
            </>
          )}
        </div>
        
        {onCancel && isRunning && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            Cancel Simulation
          </button>
        )}
      </div>

      {/* Technical Details (collapsed by default) */}
      <details className="mt-4">
        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
          Technical Details
        </summary>
        <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 space-y-1">
          <p>• Monte Carlo method using statistical distributions</p>
          <p>• Goal-based simulation with team-specific parameters</p>
          <p>• Automatic boost factor application and streak analysis</p>
          <p>• Real-time probability calculation across all betting markets</p>
          <p>• Edge detection comparing true odds vs bookmaker prices</p>
        </div>
      </details>
    </div>
  );
};

export default ProgressIndicator;