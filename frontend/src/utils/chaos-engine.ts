/**
 * Mathematical Chaos Engine for Football Prediction Unpredictability
 * Implements Levy Flights, Fractal Variance Theory, and Stochastic Shock Theory
 * Pure mathematical approach - no external data required
 */

export class ChaosEngine {
  
  /**
   * LEVY FLIGHT DISTRIBUTIONS
   * Generates heavy-tailed random numbers for rare but impactful events
   * Simulates unexpected moments of brilliance, momentum shifts, individual genius
   */
  static generateLevyFlight(alpha: number = 1.7): number {
    // Alpha controls tail heaviness (1 < alpha < 2 for heavy tails)
    // Lower alpha = more extreme rare events
    const u1 = Math.random();
    const u2 = Math.random();
    
    // Box-Muller transformation with Levy modification
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const levy = Math.pow(Math.abs(normal), -1/alpha) * Math.sign(normal);
    
    // Bound for football context (prevents extreme outliers)
    return Math.max(-0.8, Math.min(0.8, levy));
  }

  /**
   * Apply Levy flights to goal generation
   * Captures rare events like individual brilliance, unexpected shots, momentum cascades
   */
  static applyLevyFlightToGoals(baseGoals: number, intensity: number = 0.08): number {
    if (intensity <= 0) return baseGoals;
    
    const levyShock = this.generateLevyFlight(1.7);
    
    // Scale the adjustment to be more impactful for integer goals
    // Use threshold-based application for more realistic rare events
    const threshold = Math.abs(levyShock) * intensity;
    
    if (threshold > 0.005) { // Apply when Levy shock has meaningful impact (0.5% threshold)
      const adjustment = levyShock * intensity * 3; // Amplify for noticeable impact
      return Math.max(0, baseGoals + adjustment);
    }
    
    return baseGoals; // No change for very small adjustments
  }

  /**
   * FRACTAL VARIANCE THEORY
   * Self-similar unpredictability patterns at different time scales
   * Simulates natural match rhythms that repeat at 90min, 15min, and 5min cycles
   */
  static generateFractalNoise(
    simulationSeed: number,    // Random seed (0-1) for this simulation
    intensity: number = 0.12   // How much chaos to introduce
  ): number {
    if (intensity <= 0) return 0;
    
    // Self-similar patterns at different temporal scales
    const matchScale = Math.sin(simulationSeed * Math.PI * 2) * 0.5;      // 90-minute rhythm
    const periodScale = Math.sin(simulationSeed * Math.PI * 8) * 0.3;     // 15-minute tactical phases
    const momentScale = Math.sin(simulationSeed * Math.PI * 16) * 0.2;    // 5-minute attacking sequences
    
    // Combine scales with decreasing influence
    const fractalNoise = matchScale + periodScale + momentScale;
    
    return fractalNoise * intensity;
  }

  /**
   * STOCHASTIC SHOCK THEORY
   * Random discrete events that cause sudden changes in match dynamics
   * Red cards, penalties, injuries, momentum shifts - discrete events with lasting impact
   */
  static applyStochasticShocks(
    homeLambda: number, 
    awayLambda: number,
    shockConfig = { redCard: 0.12, penalty: 0.25, momentum: 0.4 }
  ): { homeLambda: number; awayLambda: number } {
    
    let adjustedHome = homeLambda;
    let adjustedAway = awayLambda;
    
    // RED CARD SHOCKS (12% chance per match - realistic football statistic)
    const redCardChance = shockConfig.redCard / 2; // Split between teams
    if (Math.random() < redCardChance) {
      adjustedHome *= 0.65; // Home red card reduces scoring by 35%
      adjustedAway *= 1.15;  // Away team gets 15% boost
    } else if (Math.random() < redCardChance) {
      adjustedAway *= 0.65;  // Away red card
      adjustedHome *= 1.15;  // Home team gets boost
    }
    
    // PENALTY SHOCKS (25% chance per match - realistic statistic)
    const penaltyChance = shockConfig.penalty / 2; // Split between teams
    if (Math.random() < penaltyChance) {
      adjustedHome *= 1.6;   // Home penalty - major scoring boost
      adjustedAway *= 0.95;  // Slight psychological impact on opponent
    } else if (Math.random() < penaltyChance) {
      adjustedAway *= 1.6;   // Away penalty
      adjustedHome *= 0.95;  // Slight impact
    }
    
    // MOMENTUM SHIFT SHOCKS (40% chance - psychological/tactical changes)
    if (Math.random() < shockConfig.momentum * 0.5) {
      // Home momentum surge
      adjustedHome *= 1.2;
      adjustedAway *= 0.85;
    } else if (Math.random() < shockConfig.momentum * 0.5) {
      // Away momentum surge  
      adjustedAway *= 1.2;
      adjustedHome *= 0.85;
    }
    
    return { 
      homeLambda: Math.max(0.1, adjustedHome), // Prevent lambda going to zero
      awayLambda: Math.max(0.1, adjustedAway)
    };
  }

  /**
   * COMBINED CHAOS APPLICATION
   * Applies all three chaos theories in optimal sequence
   */
  static applyCombinedChaos(
    homeLambda: number,
    awayLambda: number,
    chaosConfig: {
      levyFlights: { intensity: number; alpha: number };
      fractalVariance: { intensity: number };
      stochasticShocks: { redCard: number; penalty: number; momentum: number };
    }
  ): {
    homeLambda: number;
    awayLambda: number;
    homeGoals: number;
    awayGoals: number;
    poissonGenerator: (lambda: number) => number;
  } {
    
    // 1. STOCHASTIC SHOCKS (discrete events first)
    const { homeLambda: shockedHome, awayLambda: shockedAway } = 
      this.applyStochasticShocks(homeLambda, awayLambda, chaosConfig.stochasticShocks);
    
    // 2. FRACTAL VARIANCE (time-based patterns)
    const randomSeed = Math.random();
    const fractalNoise = this.generateFractalNoise(randomSeed, chaosConfig.fractalVariance.intensity);
    const fractalHome = shockedHome * (1 + fractalNoise);
    const fractalAway = shockedAway * (1 + fractalNoise);
    
    return {
      homeLambda: fractalHome,
      awayLambda: fractalAway,
      homeGoals: 0, // Will be set by caller
      awayGoals: 0, // Will be set by caller
      poissonGenerator: this.poissonRandom.bind(this)
    };
  }

  /**
   * Poisson distribution random number generator
   * Used for goal generation after chaos application
   */
  static poissonRandom(lambda: number): number {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    
    return k - 1;
  }

  /**
   * VALIDATION HELPERS
   * Ensure chaos doesn't break mathematical bounds
   */
  static validateChaosResults(
    homeLambda: number, 
    awayLambda: number, 
    homeGoals: number, 
    awayGoals: number
  ): boolean {
    // Validate lambdas are reasonable
    if (homeLambda < 0.05 || homeLambda > 10) return false;
    if (awayLambda < 0.05 || awayLambda > 10) return false;
    
    // Validate goals are reasonable
    if (homeGoals < 0 || homeGoals > 15) return false;
    if (awayGoals < 0 || awayGoals > 15) return false;
    
    return true;
  }

  /**
   * DEBUG HELPERS
   * Log chaos impact for analysis
   */
  static logChaosImpact(
    originalHome: number,
    originalAway: number, 
    chaosHome: number,
    chaosAway: number
  ): void {
    const homeChange = ((chaosHome - originalHome) / originalHome * 100).toFixed(1);
    const awayChange = ((chaosAway - originalAway) / originalAway * 100).toFixed(1);
    
    console.log(`[CHAOS] Lambda changes: Home ${homeChange}%, Away ${awayChange}%`);
  }
}

// Export commonly used configurations
export const CHAOS_PRESETS = {
  CONSERVATIVE: {
    levyFlights: { intensity: 0.03, alpha: 1.8 },
    fractalVariance: { intensity: 0.08 },
    stochasticShocks: { redCard: 0.08, penalty: 0.15, momentum: 0.2 }
  },
  
  MODERATE: {
    levyFlights: { intensity: 0.08, alpha: 1.7 },
    fractalVariance: { intensity: 0.12 },
    stochasticShocks: { redCard: 0.12, penalty: 0.25, momentum: 0.4 }
  },
  
  AGGRESSIVE: {
    levyFlights: { intensity: 0.15, alpha: 1.5 },
    fractalVariance: { intensity: 0.20 },
    stochasticShocks: { redCard: 0.18, penalty: 0.35, momentum: 0.6 }
  },
  
  EXTREME: {
    levyFlights: { intensity: 0.35, alpha: 1.3 },
    fractalVariance: { intensity: 0.50 },
    stochasticShocks: { redCard: 0.30, penalty: 0.50, momentum: 0.80 }
  },
  
  MAXIMUM: {
    levyFlights: { intensity: 0.50, alpha: 1.1 },
    fractalVariance: { intensity: 1.0 },
    stochasticShocks: { redCard: 0.50, penalty: 1.0, momentum: 1.0 }
  }
};