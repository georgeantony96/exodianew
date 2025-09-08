/**
 * ENGINE COMPARISON SYSTEM
 * 
 * Revolutionary three-way comparison system that identifies massive value opportunities
 * by comparing predictions from:
 * 1. Monte Carlo Engine (physics-based simulation)
 * 2. Pattern Intelligence Engine (historical similarity matching)
 * 3. Bookmaker Odds (market consensus)
 * 
 * Key Innovation: When all three disagree with bookmaker consensus = MASSIVE VALUE
 * 
 * Value Detection Examples:
 * - Pattern Engine: 83% Over 2.5 probability
 * - Monte Carlo: 71% Over 2.5 probability  
 * - Bookmaker implies: 56% probability (odds: 1.80)
 * - Result: STRONG BUY signal - massive market inefficiency detected
 */

import type { PatternPrediction } from './independent-pattern-engine';

export interface MonteCarloResult {
  // Standard Monte Carlo output format
  home_win_probability: number;
  draw_probability: number;
  away_win_probability: number;
  over_2_5_probability: number;
  under_2_5_probability: number;
  gg_probability: number;
  confidence: number;
  reasoning: string;
}

export interface BookmakerOdds {
  // Standard bookmaker odds format
  home_win: number;      // e.g., 1.85
  draw: number;          // e.g., 3.40  
  away_win: number;      // e.g., 4.20
  over_2_5: number;      // e.g., 1.80
  under_2_5: number;     // e.g., 2.05
  gg: number;            // e.g., 1.75
  ng: number;            // e.g., 2.10
}

export interface ImpliedProbabilities {
  home_win: number;
  draw: number;
  away_win: number;
  over_2_5: number;
  under_2_5: number;
  gg: number;
  ng: number;
  total_margin: number;  // Bookmaker's built-in profit margin
}

export interface MarketComparison {
  market: string;
  pattern_engine_prob: number;
  monte_carlo_prob: number;
  bookmaker_implied_prob: number;
  bookmaker_odds: number;
  
  // Value calculations
  pattern_edge: number;          // Pattern vs Bookmaker edge
  monte_carlo_edge: number;      // Monte Carlo vs Bookmaker edge
  consensus_confidence: number;  // How much engines agree
  
  // Opportunity assessment
  opportunity_level: 'MASSIVE' | 'STRONG' | 'MODERATE' | 'WEAK' | 'NONE';
  expected_value_pattern: number;
  expected_value_monte_carlo: number;
  
  // Decision support
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID' | 'STRONG_AVOID';
  reasoning: string;
}

export interface EngineComparison {
  // Individual engine predictions
  pattern_prediction: PatternPrediction;
  monte_carlo_prediction: MonteCarloResult;
  bookmaker_odds: BookmakerOdds;
  implied_probabilities: ImpliedProbabilities;
  
  // Market-by-market comparisons
  market_comparisons: MarketComparison[];
  
  // Overall assessment
  best_opportunities: MarketComparison[];
  engine_consensus: EngineConsensus;
  value_summary: ValueSummary;
}

export interface EngineConsensus {
  agreement_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'CONFLICT';
  primary_engine: 'PATTERN' | 'MONTE_CARLO' | 'HYBRID';
  confidence_boost: number;  // When engines agree, confidence increases
  conflict_areas: string[];  // Markets where engines strongly disagree
}

export interface ValueSummary {
  total_opportunities: number;
  massive_value_count: number;
  strong_value_count: number;
  total_expected_value: number;
  best_market: string;
  best_edge: number;
  recommended_action: string;
}

export class EngineComparisonSystem {
  
  /**
   * Main comparison method - analyzes all three prediction sources
   */
  compareAllEngines(
    patternPrediction: PatternPrediction,
    monteCarloResult: MonteCarloResult,
    bookmakerOdds: BookmakerOdds
  ): EngineComparison {
    
    console.log('⚖️ Engine Comparison: Analyzing three prediction sources...');
    
    // Convert bookmaker odds to implied probabilities
    const impliedProbs = this.calculateImpliedProbabilities(bookmakerOdds);
    
    // Compare each market across all three sources
    const marketComparisons = this.compareAllMarkets(
      patternPrediction,
      monteCarloResult,
      impliedProbs,
      bookmakerOdds
    );
    
    // Assess engine consensus
    const engineConsensus = this.analyzeEngineConsensus(marketComparisons);
    
    // Calculate value summary
    const valueSummary = this.calculateValueSummary(marketComparisons);
    
    // Find best opportunities
    const bestOpportunities = marketComparisons
      .filter(comp => comp.opportunity_level === 'MASSIVE' || comp.opportunity_level === 'STRONG')
      .sort((a, b) => Math.max(b.expected_value_pattern, b.expected_value_monte_carlo) - 
                      Math.max(a.expected_value_pattern, a.expected_value_monte_carlo))
      .slice(0, 5);
    
    const result: EngineComparison = {
      pattern_prediction: patternPrediction,
      monte_carlo_prediction: monteCarloResult,
      bookmaker_odds,
      implied_probabilities: impliedProbs,
      market_comparisons: marketComparisons,
      best_opportunities: bestOpportunities,
      engine_consensus: engineConsensus,
      value_summary: valueSummary
    };
    
    console.log(`✅ Engine Comparison complete: ${bestOpportunities.length} major opportunities found`);
    
    return result;
  }

  /**
   * Convert bookmaker odds to implied probabilities (removing margin)
   */
  private calculateImpliedProbabilities(odds: BookmakerOdds): ImpliedProbabilities {
    // Calculate raw implied probabilities
    const rawProbs = {
      home_win: 1 / odds.home_win,
      draw: 1 / odds.draw,
      away_win: 1 / odds.away_win,
      over_2_5: 1 / odds.over_2_5,
      under_2_5: 1 / odds.under_2_5,
      gg: 1 / odds.gg,
      ng: 1 / odds.ng
    };
    
    // Calculate bookmaker margin (overround)
    const matchResultMargin = rawProbs.home_win + rawProbs.draw + rawProbs.away_win - 1;
    const goalMargin = rawProbs.over_2_5 + rawProbs.under_2_5 - 1;
    const ggMargin = rawProbs.gg + rawProbs.ng - 1;
    const avgMargin = (matchResultMargin + goalMargin + ggMargin) / 3;
    
    // Remove margin to get true implied probabilities
    const marginFactor = 1 / (1 + avgMargin);
    
    return {
      home_win: rawProbs.home_win * marginFactor,
      draw: rawProbs.draw * marginFactor,
      away_win: rawProbs.away_win * marginFactor,
      over_2_5: rawProbs.over_2_5 * marginFactor,
      under_2_5: rawProbs.under_2_5 * marginFactor,
      gg: rawProbs.gg * marginFactor,
      ng: rawProbs.ng * marginFactor,
      total_margin: avgMargin
    };
  }

  /**
   * Compare all markets across the three prediction sources
   */
  private compareAllMarkets(
    pattern: PatternPrediction,
    monteCarlo: MonteCarloResult,
    implied: ImpliedProbabilities,
    odds: BookmakerOdds
  ): MarketComparison[] {
    
    const comparisons: MarketComparison[] = [];
    
    // Market definitions with corresponding predictions
    const markets = [
      {
        name: 'Home Win',
        pattern_prob: pattern.home_win_probability,
        mc_prob: monteCarlo.home_win_probability,
        bookmaker_prob: implied.home_win,
        bookmaker_odds: odds.home_win
      },
      {
        name: 'Draw',
        pattern_prob: pattern.draw_probability,
        mc_prob: monteCarlo.draw_probability,
        bookmaker_prob: implied.draw,
        bookmaker_odds: odds.draw
      },
      {
        name: 'Away Win',
        pattern_prob: pattern.away_win_probability,
        mc_prob: monteCarlo.away_win_probability,
        bookmaker_prob: implied.away_win,
        bookmaker_odds: odds.away_win
      },
      {
        name: 'Over 2.5 Goals',
        pattern_prob: pattern.over_2_5_probability,
        mc_prob: monteCarlo.over_2_5_probability,
        bookmaker_prob: implied.over_2_5,
        bookmaker_odds: odds.over_2_5
      },
      {
        name: 'Under 2.5 Goals',
        pattern_prob: pattern.under_2_5_probability,
        mc_prob: monteCarlo.under_2_5_probability,
        bookmaker_prob: implied.under_2_5,
        bookmaker_odds: odds.under_2_5
      },
      {
        name: 'Both Teams Score',
        pattern_prob: pattern.gg_probability,
        mc_prob: monteCarlo.gg_probability,
        bookmaker_prob: implied.gg,
        bookmaker_odds: odds.gg
      }
    ];
    
    markets.forEach(market => {
      const comparison = this.analyzeMarket(market);
      comparisons.push(comparison);
    });
    
    return comparisons;
  }

  /**
   * Analyze a single market across all three sources
   */
  private analyzeMarket(market: any): MarketComparison {
    // Calculate edges (engine probability vs bookmaker probability)
    const patternEdge = market.pattern_prob - market.bookmaker_prob;
    const mcEdge = market.mc_prob - market.bookmaker_prob;
    
    // Calculate expected values
    const patternEV = this.calculateExpectedValue(market.pattern_prob, market.bookmaker_odds);
    const mcEV = this.calculateExpectedValue(market.mc_prob, market.bookmaker_odds);
    
    // Measure consensus between engines
    const engineAgreement = 1 - Math.abs(market.pattern_prob - market.mc_prob);
    
    // Determine opportunity level
    const opportunityLevel = this.determineOpportunityLevel(
      patternEdge, mcEdge, engineAgreement, Math.max(patternEV, mcEV)
    );
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(
      opportunityLevel, patternEV, mcEV, engineAgreement
    );
    
    // Create reasoning
    const reasoning = this.generateReasoning(
      market.name, patternEdge, mcEdge, engineAgreement, opportunityLevel
    );
    
    return {
      market: market.name,
      pattern_engine_prob: market.pattern_prob,
      monte_carlo_prob: market.mc_prob,
      bookmaker_implied_prob: market.bookmaker_prob,
      bookmaker_odds: market.bookmaker_odds,
      pattern_edge: patternEdge,
      monte_carlo_edge: mcEdge,
      consensus_confidence: engineAgreement,
      opportunity_level: opportunityLevel,
      expected_value_pattern: patternEV,
      expected_value_monte_carlo: mcEV,
      recommendation,
      reasoning
    };
  }

  /**
   * Calculate expected value for a bet
   */
  private calculateExpectedValue(trueProbability: number, bookmakerOdds: number): number {
    return (trueProbability * (bookmakerOdds - 1)) - (1 - trueProbability);
  }

  /**
   * Determine opportunity level based on edges and consensus
   */
  private determineOpportunityLevel(
    patternEdge: number,
    mcEdge: number,
    consensus: number,
    maxEV: number
  ): 'MASSIVE' | 'STRONG' | 'MODERATE' | 'WEAK' | 'NONE' {
    
    const avgEdge = (Math.abs(patternEdge) + Math.abs(mcEdge)) / 2;
    const bothPositive = patternEdge > 0 && mcEdge > 0;
    
    // MASSIVE: Both engines see big edge + high consensus + positive EV
    if (bothPositive && avgEdge > 0.15 && consensus > 0.8 && maxEV > 0.10) {
      return 'MASSIVE';
    }
    
    // STRONG: Both engines see good edge + reasonable consensus
    if (bothPositive && avgEdge > 0.10 && consensus > 0.6 && maxEV > 0.05) {
      return 'STRONG';
    }
    
    // MODERATE: One engine sees significant edge
    if (avgEdge > 0.08 && maxEV > 0.02) {
      return 'MODERATE';
    }
    
    // WEAK: Small edge detected
    if (avgEdge > 0.03 && maxEV > 0) {
      return 'WEAK';
    }
    
    return 'NONE';
  }

  /**
   * Generate betting recommendation
   */
  private generateRecommendation(
    opportunity: 'MASSIVE' | 'STRONG' | 'MODERATE' | 'WEAK' | 'NONE',
    patternEV: number,
    mcEV: number,
    consensus: number
  ): 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID' | 'STRONG_AVOID' {
    
    const maxEV = Math.max(patternEV, mcEV);
    const minEV = Math.min(patternEV, mcEV);
    
    if (opportunity === 'MASSIVE' && maxEV > 0.15) return 'STRONG_BUY';
    if (opportunity === 'STRONG' && maxEV > 0.08) return 'STRONG_BUY';
    if (opportunity === 'STRONG' || (opportunity === 'MODERATE' && maxEV > 0.05)) return 'BUY';
    if (opportunity === 'MODERATE' || opportunity === 'WEAK') return 'HOLD';
    if (maxEV < -0.05) return 'STRONG_AVOID';
    return 'AVOID';
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    market: string,
    patternEdge: number,
    mcEdge: number,
    consensus: number,
    opportunity: string
  ): string {
    const patternView = patternEdge > 0 ? 'underpriced' : 'overpriced';
    const mcView = mcEdge > 0 ? 'underpriced' : 'overpriced';
    const agree = Math.abs(patternEdge - mcEdge) < 0.05;
    
    if (opportunity === 'MASSIVE') {
      return `${market}: Both engines strongly agree market is ${patternView} (Pattern: ${(patternEdge * 100).toFixed(1)}%, MC: ${(mcEdge * 100).toFixed(1)}% edge)`;
    }
    
    if (opportunity === 'STRONG') {
      return `${market}: Strong consensus that market is ${patternView} (${(consensus * 100).toFixed(0)}% engine agreement)`;
    }
    
    if (!agree) {
      return `${market}: Engines disagree - Pattern sees ${patternView}, Monte Carlo sees ${mcView}`;
    }
    
    return `${market}: ${opportunity.toLowerCase()} opportunity - average edge: ${(((Math.abs(patternEdge) + Math.abs(mcEdge)) / 2) * 100).toFixed(1)}%`;
  }

  /**
   * Analyze overall consensus between engines
   */
  private analyzeEngineConsensus(comparisons: MarketComparison[]): EngineConsensus {
    const avgConsensus = comparisons.reduce((sum, comp) => sum + comp.consensus_confidence, 0) / comparisons.length;
    
    const conflicts = comparisons.filter(comp => comp.consensus_confidence < 0.6);
    const strongAgreements = comparisons.filter(comp => comp.consensus_confidence > 0.8);
    
    let agreementLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'CONFLICT';
    if (avgConsensus > 0.8) agreementLevel = 'HIGH';
    else if (avgConsensus > 0.6) agreementLevel = 'MEDIUM';
    else if (avgConsensus > 0.4) agreementLevel = 'LOW';
    else agreementLevel = 'CONFLICT';
    
    // Determine which engine to trust more
    const patternAdvantage = comparisons.filter(c => c.expected_value_pattern > c.expected_value_monte_carlo).length;
    const mcAdvantage = comparisons.length - patternAdvantage;
    
    let primaryEngine: 'PATTERN' | 'MONTE_CARLO' | 'HYBRID';
    if (patternAdvantage > mcAdvantage + 2) primaryEngine = 'PATTERN';
    else if (mcAdvantage > patternAdvantage + 2) primaryEngine = 'MONTE_CARLO';
    else primaryEngine = 'HYBRID';
    
    return {
      agreement_level: agreementLevel,
      primary_engine: primaryEngine,
      confidence_boost: strongAgreements.length / comparisons.length,
      conflict_areas: conflicts.map(c => c.market)
    };
  }

  /**
   * Calculate overall value summary
   */
  private calculateValueSummary(comparisons: MarketComparison[]): ValueSummary {
    const opportunities = comparisons.filter(c => c.opportunity_level !== 'NONE');
    const massiveOpportunities = comparisons.filter(c => c.opportunity_level === 'MASSIVE');
    const strongOpportunities = comparisons.filter(c => c.opportunity_level === 'STRONG');
    
    const totalEV = comparisons.reduce((sum, comp) => 
      sum + Math.max(comp.expected_value_pattern, comp.expected_value_monte_carlo), 0
    );
    
    const bestMarket = comparisons.reduce((best, current) => 
      Math.max(current.expected_value_pattern, current.expected_value_monte_carlo) > 
      Math.max(best.expected_value_pattern, best.expected_value_monte_carlo) ? current : best
    );
    
    const bestEdge = Math.max(bestMarket.expected_value_pattern, bestMarket.expected_value_monte_carlo);
    
    let recommendedAction = 'No clear opportunities';
    if (massiveOpportunities.length > 0) {
      recommendedAction = `Focus on ${massiveOpportunities[0].market} - massive value detected`;
    } else if (strongOpportunities.length > 0) {
      recommendedAction = `Consider ${strongOpportunities[0].market} - strong value opportunity`;
    } else if (opportunities.length > 0) {
      recommendedAction = `Small opportunities in ${opportunities.length} markets`;
    }
    
    return {
      total_opportunities: opportunities.length,
      massive_value_count: massiveOpportunities.length,
      strong_value_count: strongOpportunities.length,
      total_expected_value: totalEV,
      best_market: bestMarket.market,
      best_edge: bestEdge,
      recommended_action: recommendedAction
    };
  }

  /**
   * Generate detailed comparison report
   */
  generateComparisonReport(comparison: EngineComparison): string {
    let report = '🎯 ENGINE COMPARISON REPORT\n';
    report += '=' .repeat(50) + '\n\n';
    
    report += `📊 CONSENSUS ANALYSIS:\n`;
    report += `   Agreement Level: ${comparison.engine_consensus.agreement_level}\n`;
    report += `   Primary Engine: ${comparison.engine_consensus.primary_engine}\n`;
    report += `   Confidence Boost: ${(comparison.engine_consensus.confidence_boost * 100).toFixed(0)}%\n`;
    
    if (comparison.engine_consensus.conflict_areas.length > 0) {
      report += `   Conflicts: ${comparison.engine_consensus.conflict_areas.join(', ')}\n`;
    }
    
    report += `\n💰 VALUE SUMMARY:\n`;
    report += `   Total Opportunities: ${comparison.value_summary.total_opportunities}\n`;
    report += `   Massive Value: ${comparison.value_summary.massive_value_count}\n`;
    report += `   Strong Value: ${comparison.value_summary.strong_value_count}\n`;
    report += `   Best Market: ${comparison.value_summary.best_market}\n`;
    report += `   Best Edge: ${(comparison.value_summary.best_edge * 100).toFixed(1)}%\n`;
    report += `   Recommendation: ${comparison.value_summary.recommended_action}\n`;
    
    report += `\n🚀 TOP OPPORTUNITIES:\n`;
    comparison.best_opportunities.forEach((opp, index) => {
      report += `   ${index + 1}. ${opp.market}: ${opp.opportunity_level} (${(Math.max(opp.expected_value_pattern, opp.expected_value_monte_carlo) * 100).toFixed(1)}% EV)\n`;
    });
    
    return report;
  }
}

// Export singleton instance
export const engineComparisonSystem = new EngineComparisonSystem();

// Export types
export type {
  MonteCarloResult,
  BookmakerOdds,
  ImpliedProbabilities,
  MarketComparison,
  EngineComparison,
  EngineConsensus,
  ValueSummary
};