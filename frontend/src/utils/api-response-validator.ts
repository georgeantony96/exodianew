// API Response Validator and Normalizer
// Ensures consistent data flow between backend and frontend

import { SimulationApiResponse, SimulationResults, ValueBets, ValueOpportunity } from '@/types/simulation';

export class ApiResponseValidator {
  /**
   * Validate and normalize simulation API response
   * Handles inconsistencies between backend response formats
   */
  static validateSimulationResponse(rawResponse: any): {
    isValid: boolean;
    normalizedResponse?: SimulationApiResponse;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic response structure validation
    if (!rawResponse || typeof rawResponse !== 'object') {
      errors.push('Response is not a valid object');
      return { isValid: false, errors };
    }

    if (!rawResponse.hasOwnProperty('success')) {
      errors.push('Response missing "success" field');
      return { isValid: false, errors };
    }

    if (!rawResponse.success) {
      // Error response format
      return {
        isValid: true,
        normalizedResponse: rawResponse as SimulationApiResponse,
        errors: []
      };
    }

    // Success response validation
    if (!rawResponse.results) {
      errors.push('Missing "results" field in successful response');
    }

    // Normalize the response structure
    const normalizedResponse: SimulationApiResponse = {
      success: rawResponse.success,
      simulation_id: rawResponse.simulation_id,
      results: this.normalizeSimulationResults(rawResponse.results || {}),
      value_opportunities: rawResponse.value_opportunities || [],
      professional_benchmark: rawResponse.professional_benchmark || {
        target_rps: 0.2012,
        achieved_rps: 1,
        benchmark_met: false
      },
      calibration_optimized: rawResponse.calibration_optimized ?? false,
      engine_version: rawResponse.engine_version || 'unknown',
      kelly_criterion_enabled: rawResponse.kelly_criterion_enabled ?? false,
      total_execution_time: rawResponse.total_execution_time || 0,
      metadata: rawResponse.metadata || {
        iterations: 0,
        home_lambda: 1.5,
        away_lambda: 1.2,
        simulation_time_seconds: 0,
        iterations_per_second: 0,
        calibration_optimized: false,
        engine_version: 'unknown',
        expected_advantage: 'unknown'
      }
    };

    return { isValid: errors.length === 0, normalizedResponse, errors };
  }

  /**
   * Normalize simulation results structure
   * Ensures value_bets are in the correct location and format
   */
  private static normalizeSimulationResults(results: any): SimulationResults {
    // CRITICAL: Handle value_bets location inconsistency
    // The frontend expects results.value_bets, but backend might return it in different places
    let normalizedValueBets: ValueBets = {};
    
    if (results.value_bets && typeof results.value_bets === 'object') {
      normalizedValueBets = results.value_bets;
    } else if (results.value_opportunities && Array.isArray(results.value_opportunities)) {
      // Convert backend value opportunities to frontend format
      normalizedValueBets = this.convertValueOpportunitiesToBets(results.value_opportunities);
    }

    // Ensure required fields exist with defaults
    return {
      probabilities: results.probabilities || {
        match_outcomes: { home_win: 0.33, draw: 0.33, away_win: 0.33 },
        goal_markets: {
          over_1_5: 0.7, under_1_5: 0.3,
          over_2_5: 0.5, under_2_5: 0.5,
          over_3_5: 0.3, under_3_5: 0.7,
          over_4_5: 0.15, under_4_5: 0.85
        },
        btts: { yes: 0.5, no: 0.5 }
      },
      true_odds: results.true_odds || {
        match_outcomes: { home_win: 3.0, draw: 3.0, away_win: 3.0 },
        goal_markets: {},
        btts: { yes: 2.0, no: 2.0 }
      },
      calibration_factor: results.calibration_factor || 0.85,
      confidence_score: results.confidence_score || 0.75,
      rps_score: results.rps_score || 0.25,
      professional_grade: results.professional_grade ?? false,
      avg_home_goals: results.avg_home_goals || 1.5,
      avg_away_goals: results.avg_away_goals || 1.2,
      avg_total_goals: results.avg_total_goals || 2.7,
      professional_benchmark: results.professional_benchmark || {
        target_rps: 0.2012,
        achieved_rps: results.rps_score || 0.25,
        benchmark_met: (results.rps_score || 0.25) <= 0.2012,
        performance_vs_target: undefined
      },
      value_bets: normalizedValueBets,
      home_team: results.home_team,
      away_team: results.away_team,
      metadata: results.metadata || {
        iterations: 10000,
        home_lambda: 1.5,
        away_lambda: 1.2,
        simulation_time_seconds: 1.0,
        iterations_per_second: 10000,
        calibration_optimized: false,
        engine_version: 'unknown',
        expected_advantage: 'unknown'
      }
    };
  }

  /**
   * Convert backend ValueOpportunity[] to frontend ValueBets format
   */
  private static convertValueOpportunitiesToBets(opportunities: ValueOpportunity[]): ValueBets {
    const valueBets: ValueBets = {};

    opportunities.forEach(opp => {
      // Parse market name to extract category and outcome
      const marketParts = opp.market.split('_');
      let marketCategory = marketParts.slice(0, -1).join('_') || 'unknown';
      let outcome = marketParts[marketParts.length - 1] || 'main';

      // Handle special cases for market naming
      if (opp.market.includes('1x2')) {
        marketCategory = '1x2';
        outcome = marketParts[marketParts.length - 1];
      } else if (opp.market.includes('goals')) {
        marketCategory = 'goal_markets';
        outcome = marketParts.slice(1).join('_');
      } else if (opp.market.includes('btts')) {
        marketCategory = 'btts';
        outcome = marketParts[marketParts.length - 1];
      }

      // Initialize market category if not exists
      if (!valueBets[marketCategory]) {
        valueBets[marketCategory] = {};
      }

      // Convert to frontend format
      valueBets[marketCategory][outcome] = {
        edge: opp.edge_percentage,
        true_odds: 1 / opp.calibrated_probability,
        bookmaker_odds: opp.bookmaker_odds,
        true_probability: opp.calibrated_probability * 100, // Convert to percentage
        confidence: opp.edge_percentage > 10 ? 'High' : 
                   opp.edge_percentage > 5 ? 'Medium' : 'Low'
      };
    });

    return valueBets;
  }

  /**
   * Validate team data structure
   */
  static validateTeamData(teams: any[]): boolean {
    if (!Array.isArray(teams)) return false;
    
    return teams.every(team => 
      team && 
      typeof team.id === 'number' && 
      typeof team.name === 'string' && 
      team.name.length > 0
    );
  }

  /**
   * Validate league data structure  
   */
  static validateLeagueData(leagues: any[]): boolean {
    if (!Array.isArray(leagues)) return false;
    
    return leagues.every(league => 
      league && 
      typeof league.id === 'number' && 
      typeof league.name === 'string' && 
      typeof league.country === 'string' &&
      league.name.length > 0 &&
      league.country.length > 0
    );
  }

  /**
   * Sanitize bookmaker odds input - Simplified structure
   */
  static sanitizeBookmakerOdds(odds: any): any {
    if (!odds || typeof odds !== 'object') return {};

    const sanitized: any = {};

    // === FULL TIME MARKETS ===

    // Sanitize 1X2 FT odds
    if (odds['1x2_ft']) {
      sanitized['1x2_ft'] = {
        home: this.sanitizeOddsValue(odds['1x2_ft'].home),
        draw: this.sanitizeOddsValue(odds['1x2_ft'].draw),
        away: this.sanitizeOddsValue(odds['1x2_ft'].away)
      };
    }

    // Sanitize Over/Under 2.5 odds
    if (odds.over_under_25) {
      sanitized.over_under_25 = {
        over: this.sanitizeOddsValue(odds.over_under_25.over),
        under: this.sanitizeOddsValue(odds.over_under_25.under)
      };
    }

    // Sanitize Over/Under 3.0 odds
    if (odds.over_under_3) {
      sanitized.over_under_3 = {
        over: this.sanitizeOddsValue(odds.over_under_3.over),
        under: this.sanitizeOddsValue(odds.over_under_3.under)
      };
    }

    // Sanitize Over/Under 3.5 odds
    if (odds.over_under_35) {
      sanitized.over_under_35 = {
        over: this.sanitizeOddsValue(odds.over_under_35.over),
        under: this.sanitizeOddsValue(odds.over_under_35.under)
      };
    }

    // Sanitize GG/NG (Both Teams to Score) odds
    if (odds.gg_ng) {
      sanitized.gg_ng = {
        gg: this.sanitizeOddsValue(odds.gg_ng.gg),
        ng: this.sanitizeOddsValue(odds.gg_ng.ng)
      };
    }

    // Sanitize Double Chance odds
    if (odds.double_chance) {
      sanitized.double_chance = {
        '1x': this.sanitizeOddsValue(odds.double_chance['1x']),
        '12': this.sanitizeOddsValue(odds.double_chance['12']),
        '2x': this.sanitizeOddsValue(odds.double_chance['2x'])
      };
    }

    // Sanitize Asian Handicap +0 FT odds
    if (odds.asian_handicap_0) {
      sanitized.asian_handicap_0 = {
        home: this.sanitizeOddsValue(odds.asian_handicap_0.home),
        away: this.sanitizeOddsValue(odds.asian_handicap_0.away)
      };
    }

    // Sanitize Asian Handicap -1/+1 odds
    if (odds.asian_handicap_minus1_plus1) {
      sanitized.asian_handicap_minus1_plus1 = {
        home: this.sanitizeOddsValue(odds.asian_handicap_minus1_plus1.home),
        away: this.sanitizeOddsValue(odds.asian_handicap_minus1_plus1.away)
      };
    }

    // Sanitize Asian Handicap +1/-1 odds
    if (odds.asian_handicap_plus1_minus1) {
      sanitized.asian_handicap_plus1_minus1 = {
        home: this.sanitizeOddsValue(odds.asian_handicap_plus1_minus1.home),
        away: this.sanitizeOddsValue(odds.asian_handicap_plus1_minus1.away)
      };
    }

    // === HALF TIME MARKETS ===

    // Sanitize 1X2 HT odds
    if (odds['1x2_ht']) {
      sanitized['1x2_ht'] = {
        home: this.sanitizeOddsValue(odds['1x2_ht'].home),
        draw: this.sanitizeOddsValue(odds['1x2_ht'].draw),
        away: this.sanitizeOddsValue(odds['1x2_ht'].away)
      };
    }

    // Sanitize Asian Handicap +0 HT odds
    if (odds.asian_handicap_0_ht) {
      sanitized.asian_handicap_0_ht = {
        home: this.sanitizeOddsValue(odds.asian_handicap_0_ht.home),
        away: this.sanitizeOddsValue(odds.asian_handicap_0_ht.away)
      };
    }

    // Sanitize Over/Under 1.5 HT odds
    if (odds.over_under_15_ht) {
      sanitized.over_under_15_ht = {
        over: this.sanitizeOddsValue(odds.over_under_15_ht.over),
        under: this.sanitizeOddsValue(odds.over_under_15_ht.under)
      };
    }

    // === LEGACY MARKETS ===

    // Sanitize Goal Ranges odds
    if (odds.goal_ranges) {
      sanitized.goal_ranges = {
        range_0_1: this.sanitizeOddsValue(odds.goal_ranges.range_0_1),
        range_2_3: this.sanitizeOddsValue(odds.goal_ranges.range_2_3),
        range_4_6: this.sanitizeOddsValue(odds.goal_ranges.range_4_6),
        range_7_plus: this.sanitizeOddsValue(odds.goal_ranges.range_7_plus)
      };
    }

    return sanitized;
  }

  /**
   * Sanitize individual odds value
   */
  private static sanitizeOddsValue(value: any): number {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 1.01) return 2.0; // Default safe odds
    if (num > 1000) return 1000; // Cap at reasonable maximum
    return Math.round(num * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Log validation issues for debugging
   */
  static logValidationIssues(context: string, issues: string[]): void {
    if (issues.length > 0) {
      console.warn(`[API_VALIDATION] Issues in ${context}:`, issues);
    } else {
      console.log(`[API_VALIDATION] ✅ ${context} validation passed`);
    }
  }
}

// Convenience functions for common use cases
export const validateSimulationResponse = ApiResponseValidator.validateSimulationResponse.bind(ApiResponseValidator);
export const sanitizeBookmakerOdds = ApiResponseValidator.sanitizeBookmakerOdds.bind(ApiResponseValidator);
export const validateTeamData = ApiResponseValidator.validateTeamData.bind(ApiResponseValidator);
export const validateLeagueData = ApiResponseValidator.validateLeagueData.bind(ApiResponseValidator);