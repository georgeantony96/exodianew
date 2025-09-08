/**
 * Chaos Engine Configuration System
 * Defines interfaces and default settings for mathematical unpredictability
 */

export interface ChaosConfig {
  enabled: boolean;
  
  levyFlights: {
    enabled: boolean;
    intensity: number;  // 0.0 to 0.2 - how often rare events occur
    alpha: number;      // 1.3 to 1.9 - tail heaviness (lower = more extreme)
  };
  
  fractalVariance: {
    enabled: boolean;
    intensity: number;  // 0.0 to 0.3 - strength of rhythmic patterns
  };
  
  stochasticShocks: {
    enabled: boolean;
    redCard: number;    // 0.0 to 0.3 - probability of red card per match
    penalty: number;    // 0.0 to 0.4 - probability of penalty per match  
    momentum: number;   // 0.0 to 0.8 - probability of momentum shifts
  };
}

// Default configuration - Moderate chaos approach
export const DEFAULT_CHAOS_CONFIG: ChaosConfig = {
  enabled: true,
  
  levyFlights: {
    enabled: true,
    intensity: 0.08,    // Moderate rare event frequency
    alpha: 1.7          // Balanced tail heaviness
  },
  
  fractalVariance: {
    enabled: true,
    intensity: 0.12     // Moderate rhythmic unpredictability
  },
  
  stochasticShocks: {
    enabled: true,
    redCard: 0.12,      // 12% chance - realistic football statistic
    penalty: 0.25,      // 25% chance - realistic football statistic
    momentum: 0.4       // 40% chance - psychological shifts
  }
};

// Conservative chaos - Subtle unpredictability
export const CONSERVATIVE_CHAOS_CONFIG: ChaosConfig = {
  enabled: true,
  
  levyFlights: {
    enabled: true,
    intensity: 0.03,    // Low rare event frequency
    alpha: 1.8          // Less extreme tails
  },
  
  fractalVariance: {
    enabled: true,
    intensity: 0.08     // Subtle rhythmic patterns
  },
  
  stochasticShocks: {
    enabled: true,
    redCard: 0.08,      // Reduced shock probabilities
    penalty: 0.15,
    momentum: 0.2
  }
};

// Aggressive chaos - High unpredictability
export const AGGRESSIVE_CHAOS_CONFIG: ChaosConfig = {
  enabled: true,
  
  levyFlights: {
    enabled: true,
    intensity: 0.15,    // High rare event frequency
    alpha: 1.5          // More extreme tails
  },
  
  fractalVariance: {
    enabled: true,
    intensity: 0.20     // Strong rhythmic variance
  },
  
  stochasticShocks: {
    enabled: true,
    redCard: 0.18,      // Increased shock probabilities
    penalty: 0.35,
    momentum: 0.6
  }
};

// Extreme chaos - Maximum unpredictability for testing dramatic differences
export const EXTREME_CHAOS_CONFIG: ChaosConfig = {
  enabled: true,
  
  levyFlights: {
    enabled: true,
    intensity: 0.35,    // Very high rare event frequency
    alpha: 1.3          // Maximum extreme tails
  },
  
  fractalVariance: {
    enabled: true,
    intensity: 0.50     // Maximum rhythmic variance
  },
  
  stochasticShocks: {
    enabled: true,
    redCard: 0.30,      // Maximum realistic shock probabilities
    penalty: 0.50,
    momentum: 0.80
  }
};

// Maximum chaos - 100% chaos intensity (experimental)
export const MAXIMUM_CHAOS_CONFIG: ChaosConfig = {
  enabled: true,
  
  levyFlights: {
    enabled: true,
    intensity: 0.50,    // Maximum possible intensity
    alpha: 1.1          // Most extreme tails possible
  },
  
  fractalVariance: {
    enabled: true,
    intensity: 1.0      // 100% fractal variance
  },
  
  stochasticShocks: {
    enabled: true,
    redCard: 0.50,      // 50% chance of red cards
    penalty: 1.0,       // 100% chance of penalties
    momentum: 1.0       // 100% chance of momentum shifts
  }
};

// Disabled chaos - Pure H2H/form analysis
export const DISABLED_CHAOS_CONFIG: ChaosConfig = {
  enabled: false,
  
  levyFlights: {
    enabled: false,
    intensity: 0.0,
    alpha: 1.7
  },
  
  fractalVariance: {
    enabled: false,
    intensity: 0.0
  },
  
  stochasticShocks: {
    enabled: false,
    redCard: 0.0,
    penalty: 0.0,
    momentum: 0.0
  }
};

/**
 * Validation functions for chaos configuration
 */
export class ChaosConfigValidator {
  
  static validateConfig(config: ChaosConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate Levy Flights
    if (config.levyFlights.intensity < 0 || config.levyFlights.intensity > 0.5) {
      errors.push('Levy flight intensity must be between 0.0 and 0.5');
    }
    
    if (config.levyFlights.alpha < 1.1 || config.levyFlights.alpha > 2.0) {
      errors.push('Levy flight alpha must be between 1.1 and 2.0');
    }
    
    // Validate Fractal Variance
    if (config.fractalVariance.intensity < 0 || config.fractalVariance.intensity > 0.5) {
      errors.push('Fractal variance intensity must be between 0.0 and 0.5');
    }
    
    // Validate Stochastic Shocks
    if (config.stochasticShocks.redCard < 0 || config.stochasticShocks.redCard > 0.5) {
      errors.push('Red card probability must be between 0.0 and 0.5');
    }
    
    if (config.stochasticShocks.penalty < 0 || config.stochasticShocks.penalty > 0.6) {
      errors.push('Penalty probability must be between 0.0 and 0.6');
    }
    
    if (config.stochasticShocks.momentum < 0 || config.stochasticShocks.momentum > 1.0) {
      errors.push('Momentum probability must be between 0.0 and 1.0');
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  static sanitizeConfig(config: Partial<ChaosConfig>): ChaosConfig {
    return {
      enabled: config.enabled ?? true,
      
      levyFlights: {
        enabled: config.levyFlights?.enabled ?? true,
        intensity: Math.max(0, Math.min(0.5, config.levyFlights?.intensity ?? 0.08)),
        alpha: Math.max(1.1, Math.min(2.0, config.levyFlights?.alpha ?? 1.7))
      },
      
      fractalVariance: {
        enabled: config.fractalVariance?.enabled ?? true,
        intensity: Math.max(0, Math.min(0.5, config.fractalVariance?.intensity ?? 0.12))
      },
      
      stochasticShocks: {
        enabled: config.stochasticShocks?.enabled ?? true,
        redCard: Math.max(0, Math.min(0.5, config.stochasticShocks?.redCard ?? 0.12)),
        penalty: Math.max(0, Math.min(0.6, config.stochasticShocks?.penalty ?? 0.25)),
        momentum: Math.max(0, Math.min(1.0, config.stochasticShocks?.momentum ?? 0.4))
      }
    };
  }
}

/**
 * Helper functions for chaos configuration
 */
export class ChaosConfigUtils {
  
  static getConfigDescription(config: ChaosConfig): string {
    if (!config.enabled) return "Pure H2H Analysis (No Chaos)";
    
    const intensity = this.calculateOverallIntensity(config);
    
    if (intensity < 0.3) return "Conservative Chaos (Subtle Unpredictability)";
    if (intensity < 0.6) return "Moderate Chaos (Balanced Unpredictability)";
    return "Aggressive Chaos (High Unpredictability)";
  }
  
  static calculateOverallIntensity(config: ChaosConfig): number {
    if (!config.enabled) return 0;
    
    const levyIntensity = config.levyFlights.enabled ? config.levyFlights.intensity : 0;
    const fractalIntensity = config.fractalVariance.enabled ? config.fractalVariance.intensity : 0;
    const shockIntensity = config.stochasticShocks.enabled ? 
      (config.stochasticShocks.redCard + config.stochasticShocks.penalty + config.stochasticShocks.momentum) / 3 : 0;
    
    return (levyIntensity + fractalIntensity + shockIntensity) / 3;
  }
  
  static createCustomConfig(
    levyIntensity: number,
    fractalIntensity: number, 
    redCardProb: number,
    penaltyProb: number,
    momentumProb: number
  ): ChaosConfig {
    return ChaosConfigValidator.sanitizeConfig({
      enabled: true,
      levyFlights: { enabled: true, intensity: levyIntensity, alpha: 1.7 },
      fractalVariance: { enabled: true, intensity: fractalIntensity },
      stochasticShocks: { 
        enabled: true, 
        redCard: redCardProb, 
        penalty: penaltyProb, 
        momentum: momentumProb 
      }
    });
  }
}

// Export preset configurations for easy access
export const CHAOS_PRESETS = {
  DISABLED: DISABLED_CHAOS_CONFIG,
  CONSERVATIVE: CONSERVATIVE_CHAOS_CONFIG,
  MODERATE: DEFAULT_CHAOS_CONFIG,
  AGGRESSIVE: AGGRESSIVE_CHAOS_CONFIG,
  EXTREME: EXTREME_CHAOS_CONFIG,
  MAXIMUM: MAXIMUM_CHAOS_CONFIG
} as const;

export type ChaosPresetName = keyof typeof CHAOS_PRESETS;