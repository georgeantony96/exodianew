// Edge calculation and value bet detection utilities

export interface ValueBet {
  edge: number;
  true_odds: number;
  bookmaker_odds: number;
  true_probability: number;
  confidence: 'High' | 'Medium' | 'Low' | 'None';
  expected_value: number;
  market: string;
  outcome: string;
}

export interface TrueOdds {
  '1x2': {
    home: number;
    draw: number;
    away: number;
  };
  over_under: {
    over_25: number;
    under_25: number;
    over_35: number;
    under_35: number;
    over_45: number;
    under_45: number;
    over_55: number;
    under_55: number;
  };
  both_teams_score: {
    yes: number;
    no: number;
  };
  first_half_gg?: {
    yes: number;
    no: number;
  };
}

export interface BookmakerOdds {
  '1x2': {
    home: number;
    draw: number;
    away: number;
  };
  over_under: {
    ou25: { over: number; under: number };
    ou35: { over: number; under: number };
    ou45: { over: number; under: number };
    ou55: { over: number; under: number };
  };
  both_teams_score: {
    yes: number;
    no: number;
  };
  first_half_gg?: {
    yes: number;
    no: number;
  };
}

// Calculate edge: (True Probability × Bookmaker Odds) - 1
export function calculateEdge(trueProbability: number, bookmakerOdds: number): number {
  if (!bookmakerOdds || bookmakerOdds <= 0) return 0;
  return (trueProbability * bookmakerOdds - 1) * 100;
}

// Calculate implied probability from odds
export function oddsToImpliedProbability(odds: number): number {
  if (odds <= 0) return 0;
  return (1 / odds) * 100;
}

// Calculate true probability from odds
export function oddsToTrueProbability(odds: number): number {
  if (odds <= 0) return 0;
  return (1 / odds) * 100;
}

// Calculate expected value for a given stake
export function calculateExpectedValue(stake: number, edge: number): number {
  return stake * (edge / 100);
}

// Determine confidence level based on edge percentage
export function getConfidenceLevel(edge: number): 'High' | 'Medium' | 'Low' | 'None' {
  if (edge >= 10) return 'High';
  if (edge >= 5) return 'Medium';
  if (edge >= 2) return 'Low';
  return 'None';
}

// Calculate Kelly Criterion for optimal stake sizing
export function calculateKellyStake(bankroll: number, trueProbability: number, bookmakerOdds: number): number {
  if (bookmakerOdds <= 1 || trueProbability <= 0 || trueProbability >= 1) return 0;
  
  const b = bookmakerOdds - 1; // Net odds received
  const p = trueProbability; // Probability of winning
  const q = 1 - p; // Probability of losing
  
  const kellyFraction = (b * p - q) / b;
  return Math.max(0, kellyFraction * bankroll);
}

// Detect all value bets from true odds vs bookmaker odds
export function detectValueBets(trueOdds: TrueOdds, bookmakerOdds: BookmakerOdds, minEdge = 2): ValueBet[] {
  const valueBets: ValueBet[] = [];

  // 1X2 Market
  if (trueOdds['1x2'] && bookmakerOdds['1x2']) {
    const outcomes = [
      { key: 'home', true: trueOdds['1x2'].home, bookmaker: bookmakerOdds['1x2'].home },
      { key: 'draw', true: trueOdds['1x2'].draw, bookmaker: bookmakerOdds['1x2'].draw },
      { key: 'away', true: trueOdds['1x2'].away, bookmaker: bookmakerOdds['1x2'].away }
    ];

    outcomes.forEach(outcome => {
      if (outcome.bookmaker > 0 && outcome.true > 0) {
        const trueProbability = oddsToTrueProbability(outcome.true);
        const edge = calculateEdge(trueProbability / 100, outcome.bookmaker);
        
        if (edge >= minEdge) {
          valueBets.push({
            edge,
            true_odds: outcome.true,
            bookmaker_odds: outcome.bookmaker,
            true_probability: trueProbability,
            confidence: getConfidenceLevel(edge),
            expected_value: calculateExpectedValue(100, edge), // Example with $100 stake
            market: '1x2',
            outcome: outcome.key
          });
        }
      }
    });
  }

  // Over/Under Markets
  if (trueOdds.over_under && bookmakerOdds.over_under) {
    const ouMarkets = [
      { key: 'ou25', trueOver: 'over_25', trueUnder: 'under_25' },
      { key: 'ou35', trueOver: 'over_35', trueUnder: 'under_35' },
      { key: 'ou45', trueOver: 'over_45', trueUnder: 'under_45' },
      { key: 'ou55', trueOver: 'over_55', trueUnder: 'under_55' }
    ];

    ouMarkets.forEach(market => {
      const bookmakerMarket = bookmakerOdds.over_under[market.key as keyof typeof bookmakerOdds.over_under];
      if (bookmakerMarket) {
        // Over bet
        const trueOverOdds = trueOdds.over_under[market.trueOver as keyof typeof trueOdds.over_under];
        if (trueOverOdds && bookmakerMarket.over > 0) {
          const trueProbability = oddsToTrueProbability(trueOverOdds);
          const edge = calculateEdge(trueProbability / 100, bookmakerMarket.over);
          
          if (edge >= minEdge) {
            valueBets.push({
              edge,
              true_odds: trueOverOdds,
              bookmaker_odds: bookmakerMarket.over,
              true_probability: trueProbability,
              confidence: getConfidenceLevel(edge),
              expected_value: calculateExpectedValue(100, edge),
              market: 'over_under',
              outcome: market.trueOver
            });
          }
        }

        // Under bet
        const trueUnderOdds = trueOdds.over_under[market.trueUnder as keyof typeof trueOdds.over_under];
        if (trueUnderOdds && bookmakerMarket.under > 0) {
          const trueProbability = oddsToTrueProbability(trueUnderOdds);
          const edge = calculateEdge(trueProbability / 100, bookmakerMarket.under);
          
          if (edge >= minEdge) {
            valueBets.push({
              edge,
              true_odds: trueUnderOdds,
              bookmaker_odds: bookmakerMarket.under,
              true_probability: trueProbability,
              confidence: getConfidenceLevel(edge),
              expected_value: calculateExpectedValue(100, edge),
              market: 'over_under',
              outcome: market.trueUnder
            });
          }
        }
      }
    });
  }

  // Both Teams Score
  if (trueOdds.both_teams_score && bookmakerOdds.both_teams_score) {
    const outcomes = [
      { key: 'yes', true: trueOdds.both_teams_score.yes, bookmaker: bookmakerOdds.both_teams_score.yes },
      { key: 'no', true: trueOdds.both_teams_score.no, bookmaker: bookmakerOdds.both_teams_score.no }
    ];

    outcomes.forEach(outcome => {
      if (outcome.bookmaker > 0 && outcome.true > 0) {
        const trueProbability = oddsToTrueProbability(outcome.true);
        const edge = calculateEdge(trueProbability / 100, outcome.bookmaker);
        
        if (edge >= minEdge) {
          valueBets.push({
            edge,
            true_odds: outcome.true,
            bookmaker_odds: outcome.bookmaker,
            true_probability: trueProbability,
            confidence: getConfidenceLevel(edge),
            expected_value: calculateExpectedValue(100, edge),
            market: 'both_teams_score',
            outcome: outcome.key
          });
        }
      }
    });
  }

  return valueBets.sort((a, b) => b.edge - a.edge); // Sort by highest edge first
}

// Calculate bookmaker margin for a market
export function calculateMargin(odds: number[]): number {
  const validOdds = odds.filter(odd => odd > 0);
  if (validOdds.length === 0) return 0;
  
  const impliedProbabilities = validOdds.map(odd => 1 / odd);
  const totalProbability = impliedProbabilities.reduce((sum, prob) => sum + prob, 0);
  return (totalProbability - 1) * 100;
}

// Analyze market efficiency
export function analyzeMarketEfficiency(bookmakerOdds: BookmakerOdds) {
  const analysis = {
    '1x2': { margin: 0, efficiency: 'Unknown' as 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Unknown' },
    over_under: {} as { [key: string]: { margin: number; efficiency: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Unknown' } },
    both_teams_score: { margin: 0, efficiency: 'Unknown' as 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Unknown' }
  };

  // 1X2 Analysis
  if (bookmakerOdds['1x2']) {
    const odds1x2 = [bookmakerOdds['1x2'].home, bookmakerOdds['1x2'].draw, bookmakerOdds['1x2'].away];
    analysis['1x2'].margin = calculateMargin(odds1x2);
    analysis['1x2'].efficiency = getEfficiencyRating(analysis['1x2'].margin, 5); // 5% threshold for 1x2
  }

  // Over/Under Analysis
  Object.entries(bookmakerOdds.over_under || {}).forEach(([key, odds]) => {
    if (odds.over && odds.under) {
      const ouOdds = [odds.over, odds.under];
      const margin = calculateMargin(ouOdds);
      analysis.over_under[key] = {
        margin,
        efficiency: getEfficiencyRating(margin, 4) // 4% threshold for O/U
      };
    }
  });

  // BTTS Analysis
  if (bookmakerOdds.both_teams_score?.yes && bookmakerOdds.both_teams_score?.no) {
    const bttsOdds = [bookmakerOdds.both_teams_score.yes, bookmakerOdds.both_teams_score.no];
    analysis.both_teams_score.margin = calculateMargin(bttsOdds);
    analysis.both_teams_score.efficiency = getEfficiencyRating(analysis.both_teams_score.margin, 6); // 6% threshold for BTTS
  }

  return analysis;
}

// Get efficiency rating based on margin
function getEfficiencyRating(margin: number, threshold: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  if (margin < threshold * 0.6) return 'Excellent';
  if (margin < threshold) return 'Good';
  if (margin < threshold * 1.6) return 'Fair';
  return 'Poor';
}

// Calculate potential profit for a given stake and odds
export function calculatePotentialProfit(stake: number, odds: number): number {
  return stake * odds - stake;
}

// Calculate return on investment percentage
export function calculateROI(profit: number, stake: number): number {
  if (stake <= 0) return 0;
  return (profit / stake) * 100;
}

// Streak analysis for boost calculations
export interface StreakAnalysis {
  unbeatenStreak: number;
  losingStreak: number;
  homeWinStreak: number;
  awayWinStreak: number;
  recommendedBoost: {
    home: number;
    away: number;
    reasoning: string;
  };
}

export function analyzeFormStreaks(recentMatches: Array<{
  home_score_ft: number;
  away_score_ft: number;
  is_home_game: boolean;
}>): StreakAnalysis {
  let unbeatenStreak = 0;
  let losingStreak = 0;
  let homeWinStreak = 0;
  let awayWinStreak = 0;

  // Analyze recent form
  for (const match of recentMatches) {
    const isWin = match.is_home_game 
      ? match.home_score_ft > match.away_score_ft
      : match.away_score_ft > match.home_score_ft;
    const isLoss = match.is_home_game
      ? match.home_score_ft < match.away_score_ft
      : match.away_score_ft < match.home_score_ft;

    if (isWin || (!isLoss)) { // Win or Draw
      unbeatenStreak++;
      losingStreak = 0;
      if (isWin) {
        if (match.is_home_game) homeWinStreak++;
        else awayWinStreak++;
      }
    } else {
      losingStreak++;
      unbeatenStreak = 0;
      homeWinStreak = 0;
      awayWinStreak = 0;
      break;
    }
  }

  // Calculate recommended boosts
  let homeBoost = 0;
  let awayBoost = 0;
  let reasoning = 'Standard form analysis';

  if (unbeatenStreak >= 5) {
    const boost = Math.min(0.15, unbeatenStreak * 0.02); // Max 0.15 boost
    homeBoost = boost;
    awayBoost = boost;
    reasoning = `${unbeatenStreak}-game unbeaten streak detected. Applying confidence boost with regression consideration.`;
  } else if (losingStreak >= 3) {
    const boost = Math.min(0.12, losingStreak * 0.03); // Max 0.12 boost
    homeBoost = boost;
    awayBoost = boost;
    reasoning = `${losingStreak}-game losing streak detected. Applying regression-to-mean boost.`;
  }

  return {
    unbeatenStreak,
    losingStreak,
    homeWinStreak,
    awayWinStreak,
    recommendedBoost: {
      home: homeBoost,
      away: awayBoost,
      reasoning
    }
  };
}

// Portfolio optimization utilities
export interface PortfolioAnalysis {
  totalStake: number;
  expectedReturn: number;
  expectedProfit: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  diversificationScore: number;
  recommendations: string[];
}

export function analyzePortfolio(selectedBets: ValueBet[], totalBankroll: number): PortfolioAnalysis {
  const totalStake = selectedBets.reduce((sum, bet) => sum + 100, 0); // Assume $100 per bet
  const expectedReturn = selectedBets.reduce((sum, bet) => sum + bet.expected_value, 0);
  const expectedProfit = expectedReturn - totalStake;
  
  // Calculate risk level
  const highConfidenceBets = selectedBets.filter(bet => bet.confidence === 'High').length;
  const avgEdge = selectedBets.reduce((sum, bet) => sum + bet.edge, 0) / selectedBets.length;
  
  let riskLevel: 'Low' | 'Medium' | 'High' = 'Medium';
  if (highConfidenceBets >= selectedBets.length * 0.7 && avgEdge >= 8) {
    riskLevel = 'Low';
  } else if (highConfidenceBets <= selectedBets.length * 0.3 || avgEdge < 4) {
    riskLevel = 'High';
  }

  // Calculate diversification score
  const markets = new Set(selectedBets.map(bet => bet.market));
  const diversificationScore = Math.min(100, (markets.size / 3) * 100); // Max 3 main markets

  // Generate recommendations
  const recommendations: string[] = [];
  if (totalStake > totalBankroll * 0.1) {
    recommendations.push('Consider reducing total stake to <10% of bankroll');
  }
  if (diversificationScore < 50) {
    recommendations.push('Consider diversifying across more markets');
  }
  if (riskLevel === 'High') {
    recommendations.push('Portfolio has high risk - consider focusing on higher confidence bets');
  }
  if (avgEdge < 5) {
    recommendations.push('Average edge is low - be more selective with value bets');
  }

  return {
    totalStake,
    expectedReturn,
    expectedProfit,
    riskLevel,
    diversificationScore,
    recommendations
  };
}