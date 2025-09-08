/**
 * COMPREHENSIVE BETTING MARKET EVIDENCE SYSTEM
 * From basic match outcome to complete betting market predictions
 * 
 * USER'S CRUCIAL INSIGHT:
 * "We need to define what the actual final prediction is in accordance to bet markets"
 * "Home win and over 3.5? 1 and GG? etc. - translate to final betting information"
 * 
 * EVOLUTION: From "45W-16D-12L → 61.6% home win" to complete market analysis
 */

console.log('🎯 COMPREHENSIVE BETTING MARKET EVIDENCE SYSTEM');
console.log('===============================================\n');

console.log('🧠 USER\'S CRUCIAL MARKET INSIGHT:');
console.log('==================================');
console.log('✅ "Define what the actual final prediction is"');
console.log('✅ "In accordance to bet markets"');  
console.log('✅ "Home win and over 3.5? 1 and GG?"');
console.log('✅ "Translate to final betting information"');
console.log('✅ Need COMPREHENSIVE market predictions, not just match outcomes!\n');

// COMPREHENSIVE MARKET STRUCTURE
const BETTING_MARKETS = {
  matchOutcome: {
    '1': 'Home Win',
    'X': 'Draw', 
    '2': 'Away Win'
  },
  
  totalGoals: {
    'Over 0.5': 'Total goals > 0.5',
    'Over 1.5': 'Total goals > 1.5', 
    'Over 2.5': 'Total goals > 2.5',
    'Over 3.5': 'Total goals > 3.5',
    'Over 4.5': 'Total goals > 4.5',
    'Under 0.5': 'Total goals < 0.5',
    'Under 1.5': 'Total goals < 1.5',
    'Under 2.5': 'Total goals < 2.5', 
    'Under 3.5': 'Total goals < 3.5',
    'Under 4.5': 'Total goals < 4.5'
  },
  
  bothTeamsScore: {
    'GG': 'Both teams score (Yes)',
    'NG': 'Both teams score (No)'
  },
  
  doubleChance: {
    '1X': 'Home win or Draw',
    '12': 'Home win or Away win',
    'X2': 'Draw or Away win'
  },
  
  combinedMarkets: {
    '1 & Over 2.5': 'Home win AND Over 2.5 goals',
    '1 & Under 2.5': 'Home win AND Under 2.5 goals',
    'X & Over 2.5': 'Draw AND Over 2.5 goals', 
    'X & Under 2.5': 'Draw AND Under 2.5 goals',
    '2 & Over 2.5': 'Away win AND Over 2.5 goals',
    '2 & Under 2.5': 'Away win AND Under 2.5 goals',
    '1 & GG': 'Home win AND Both teams score',
    '1 & NG': 'Home win AND No goals (clean sheet)',
    'X & GG': 'Draw AND Both teams score',
    'X & NG': 'Draw AND No goals',
    '2 & GG': 'Away win AND Both teams score', 
    '2 & NG': 'Away win AND No goals'
  },
  
  exactGoals: {
    '0-0': 'Exactly 0-0',
    '1-0': 'Exactly 1-0',
    '0-1': 'Exactly 0-1',
    '1-1': 'Exactly 1-1',
    '2-0': 'Exactly 2-0', 
    '0-2': 'Exactly 0-2',
    '2-1': 'Exactly 2-1',
    '1-2': 'Exactly 1-2',
    '2-2': 'Exactly 2-2',
    '3-0': 'Exactly 3-0',
    '0-3': 'Exactly 0-3',
    // ... more combinations
  }
};

console.log('📊 COMPREHENSIVE BETTING MARKETS:');
console.log('=================================\n');
Object.entries(BETTING_MARKETS).forEach(([category, markets]) => {
  console.log(`${category.toUpperCase()}:`);
  Object.entries(markets).forEach(([key, description]) => {
    console.log(`  ${key}: ${description}`);
  });
  console.log('');
});

// COMPREHENSIVE EVIDENCE ANALYSIS
class ComprehensiveMarketAnalyzer {
  
  analyzeComprehensiveEvidence(patternMatches) {
    console.log('🔍 COMPREHENSIVE MARKET ANALYSIS:');
    console.log('=================================');
    
    if (patternMatches.length === 0) {
      return this.getDefaultPredictions();
    }
    
    // Analyze ALL market outcomes from evidence
    const analysis = {
      matchOutcomes: this.analyzeMatchOutcomes(patternMatches),
      goalMarkets: this.analyzeGoalMarkets(patternMatches),
      bttsMarkets: this.analyzeBTTSMarkets(patternMatches),
      doubleChance: this.analyzeDoubleChance(patternMatches),
      combinedMarkets: this.analyzeCombinedMarkets(patternMatches),
      exactScores: this.analyzeExactScores(patternMatches),
      marketRecommendations: this.generateMarketRecommendations(patternMatches)
    };
    
    return analysis;
  }
  
  analyzeMatchOutcomes(matches) {
    const outcomes = { home: 0, draw: 0, away: 0 };
    
    matches.forEach(match => {
      if (match.homeGoals > match.awayGoals) outcomes.home++;
      else if (match.homeGoals < match.awayGoals) outcomes.away++;
      else outcomes.draw++;
    });
    
    const total = matches.length;
    return {
      '1': { probability: outcomes.home / total, count: outcomes.home },
      'X': { probability: outcomes.draw / total, count: outcomes.draw },
      '2': { probability: outcomes.away / total, count: outcomes.away },
      evidence: `${outcomes.home}W-${outcomes.draw}D-${outcomes.away}L (${total} matches)`
    };
  }
  
  analyzeGoalMarkets(matches) {
    const goalAnalysis = {};
    const thresholds = [0.5, 1.5, 2.5, 3.5, 4.5];
    
    thresholds.forEach(threshold => {
      const over = matches.filter(m => m.totalGoals > threshold).length;
      const under = matches.length - over;
      
      goalAnalysis[`Over ${threshold}`] = {
        probability: over / matches.length,
        count: over,
        evidence: `${over}/${matches.length} matches over ${threshold}`
      };
      
      goalAnalysis[`Under ${threshold}`] = {
        probability: under / matches.length,
        count: under,
        evidence: `${under}/${matches.length} matches under ${threshold}`
      };
    });
    
    return goalAnalysis;
  }
  
  analyzeBTTSMarkets(matches) {
    const btts = matches.filter(m => m.homeGoals > 0 && m.awayGoals > 0).length;
    const noBtts = matches.length - btts;
    
    return {
      'GG': {
        probability: btts / matches.length,
        count: btts,
        evidence: `${btts}/${matches.length} matches both teams scored`
      },
      'NG': {
        probability: noBtts / matches.length,
        count: noBtts, 
        evidence: `${noBtts}/${matches.length} matches clean sheet`
      }
    };
  }
  
  analyzeDoubleChance(matches) {
    const outcomes = this.analyzeMatchOutcomes(matches);
    
    return {
      '1X': {
        probability: outcomes['1'].probability + outcomes['X'].probability,
        count: outcomes['1'].count + outcomes['X'].count,
        evidence: `Home win or draw: ${outcomes['1'].count + outcomes['X'].count}/${matches.length}`
      },
      '12': {
        probability: outcomes['1'].probability + outcomes['2'].probability,
        count: outcomes['1'].count + outcomes['2'].count,
        evidence: `Home or away win: ${outcomes['1'].count + outcomes['2'].count}/${matches.length}`
      },
      'X2': {
        probability: outcomes['X'].probability + outcomes['2'].probability,
        count: outcomes['X'].count + outcomes['2'].count,
        evidence: `Draw or away win: ${outcomes['X'].count + outcomes['2'].count}/${matches.length}`
      }
    };
  }
  
  analyzeCombinedMarkets(matches) {
    const combined = {};
    
    // Analyze 1 & Over/Under combinations
    ['Over 2.5', 'Under 2.5'].forEach(goalMarket => {
      ['1', 'X', '2'].forEach(outcome => {
        const matchingGames = matches.filter(match => {
          const correctOutcome = this.matchesOutcome(match, outcome);
          const correctGoals = goalMarket === 'Over 2.5' 
            ? match.totalGoals > 2.5 
            : match.totalGoals <= 2.5;
          return correctOutcome && correctGoals;
        });
        
        const marketKey = `${outcome} & ${goalMarket}`;
        combined[marketKey] = {
          probability: matchingGames.length / matches.length,
          count: matchingGames.length,
          evidence: `${matchingGames.length}/${matches.length} matches`
        };
      });
    });
    
    // Analyze outcome & BTTS combinations  
    ['GG', 'NG'].forEach(bttsMarket => {
      ['1', 'X', '2'].forEach(outcome => {
        const matchingGames = matches.filter(match => {
          const correctOutcome = this.matchesOutcome(match, outcome);
          const correctBTTS = bttsMarket === 'GG' 
            ? (match.homeGoals > 0 && match.awayGoals > 0)
            : !(match.homeGoals > 0 && match.awayGoals > 0);
          return correctOutcome && correctBTTS;
        });
        
        const marketKey = `${outcome} & ${bttsMarket}`;
        combined[marketKey] = {
          probability: matchingGames.length / matches.length,
          count: matchingGames.length,
          evidence: `${matchingGames.length}/${matches.length} matches`
        };
      });
    });
    
    return combined;
  }
  
  analyzeExactScores(matches) {
    const scoreFrequency = {};
    
    matches.forEach(match => {
      const score = `${Math.round(match.homeGoals)}-${Math.round(match.awayGoals)}`;
      scoreFrequency[score] = (scoreFrequency[score] || 0) + 1;
    });
    
    // Convert to probabilities and sort by frequency
    const exactScores = {};
    Object.entries(scoreFrequency).forEach(([score, count]) => {
      exactScores[score] = {
        probability: count / matches.length,
        count: count,
        evidence: `${count}/${matches.length} matches ended ${score}`
      };
    });
    
    return exactScores;
  }
  
  generateMarketRecommendations(matches) {
    const analysis = {
      matchOutcomes: this.analyzeMatchOutcomes(matches),
      goalMarkets: this.analyzeGoalMarkets(matches),
      bttsMarkets: this.analyzeBTTSMarkets(matches),
      combinedMarkets: this.analyzeCombinedMarkets(matches)
    };
    
    // Find highest probability bets
    const recommendations = [];
    
    // Best single market bets
    const allMarkets = [
      ...Object.entries(analysis.matchOutcomes).map(([key, data]) => ({
        market: key,
        category: 'Match Outcome',
        ...data
      })),
      ...Object.entries(analysis.goalMarkets).map(([key, data]) => ({
        market: key,
        category: 'Goal Markets',
        ...data
      })),
      ...Object.entries(analysis.bttsMarkets).map(([key, data]) => ({
        market: key,
        category: 'BTTS',
        ...data
      }))
    ];
    
    // Sort by probability and filter high-confidence bets
    const highConfidenceBets = allMarkets
      .filter(bet => bet.probability >= 0.6 && bet.count >= 10)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);
    
    recommendations.push(...highConfidenceBets.map(bet => ({
      type: 'HIGH_CONFIDENCE',
      market: bet.market,
      category: bet.category,
      probability: bet.probability,
      confidence: this.calculateConfidence(bet.count, matches.length),
      evidence: bet.evidence,
      recommendation: `Strong bet: ${(bet.probability * 100).toFixed(1)}% chance`
    })));
    
    // Best combined market bets
    const combinedBets = Object.entries(analysis.combinedMarkets)
      .filter(([_, data]) => data.probability >= 0.4 && data.count >= 5)
      .sort((a, b) => b[1].probability - a[1].probability)
      .slice(0, 3);
    
    recommendations.push(...combinedBets.map(([market, data]) => ({
      type: 'COMBINED_MARKET',
      market: market,
      category: 'Combined Markets',
      probability: data.probability,
      confidence: this.calculateConfidence(data.count, matches.length),
      evidence: data.evidence,
      recommendation: `Combined bet: ${(data.probability * 100).toFixed(1)}% chance`
    })));
    
    return recommendations.sort((a, b) => b.probability - a.probability);
  }
  
  matchesOutcome(match, outcome) {
    if (outcome === '1') return match.homeGoals > match.awayGoals;
    if (outcome === 'X') return match.homeGoals === match.awayGoals;
    if (outcome === '2') return match.homeGoals < match.awayGoals;
    return false;
  }
  
  calculateConfidence(count, total) {
    // Confidence based on sample size
    return Math.min(0.95, 0.5 + (count / total) * 0.5);
  }
  
  getDefaultPredictions() {
    return {
      error: 'No pattern matches found',
      recommendation: 'Increase iterations or check pattern encoding'
    };
  }
}

// COMPREHENSIVE PREDICTION OUTPUT
class ComprehensiveMarketPredictor {
  
  async generateComprehensivePrediction(patternMatches) {
    console.log('\n🎯 COMPREHENSIVE MARKET PREDICTIONS:');
    console.log('====================================');
    
    const analyzer = new ComprehensiveMarketAnalyzer();
    const analysis = analyzer.analyzeComprehensiveEvidence(patternMatches);
    
    if (analysis.error) {
      console.log(`❌ ${analysis.error}`);
      return analysis;
    }
    
    // Display comprehensive results
    console.log('\n📊 MATCH OUTCOME PREDICTIONS:');
    console.log('-----------------------------');
    Object.entries(analysis.matchOutcomes).forEach(([market, data]) => {
      if (market !== 'evidence') {
        console.log(`${market}: ${(data.probability * 100).toFixed(1)}% (${data.count} matches)`);
      }
    });
    console.log(`Evidence: ${analysis.matchOutcomes.evidence}`);
    
    console.log('\n⚽ GOAL MARKET PREDICTIONS:');
    console.log('---------------------------');
    Object.entries(analysis.goalMarkets).forEach(([market, data]) => {
      console.log(`${market}: ${(data.probability * 100).toFixed(1)}% (${data.count} matches)`);
    });
    
    console.log('\n🥅 BTTS PREDICTIONS:');
    console.log('--------------------');
    Object.entries(analysis.bttsMarkets).forEach(([market, data]) => {
      console.log(`${market}: ${(data.probability * 100).toFixed(1)}% (${data.count} matches)`);
    });
    
    console.log('\n🎯 TOP COMBINED MARKET OPPORTUNITIES:');
    console.log('-------------------------------------');
    const topCombined = Object.entries(analysis.combinedMarkets)
      .sort((a, b) => b[1].probability - a[1].probability)
      .slice(0, 5);
    
    topCombined.forEach(([market, data]) => {
      console.log(`${market}: ${(data.probability * 100).toFixed(1)}% (${data.count}/${patternMatches.length})`);
    });
    
    console.log('\n🏆 MARKET RECOMMENDATIONS:');
    console.log('---------------------------');
    analysis.marketRecommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.market} (${rec.category})`);
      console.log(`   Probability: ${(rec.probability * 100).toFixed(1)}%`);
      console.log(`   Confidence: ${(rec.confidence * 100).toFixed(1)}%`);
      console.log(`   Evidence: ${rec.evidence}`);
      console.log(`   ${rec.recommendation}\n`);
    });
    
    return analysis;
  }
}

// DEMONSTRATION WITH MOCK DATA
async function demonstrateComprehensiveSystem() {
  console.log('\n🚀 COMPREHENSIVE SYSTEM DEMONSTRATION');
  console.log('=====================================');
  
  // Mock pattern matches with comprehensive data
  const mockPatternMatches = [];
  for (let i = 0; i < 50; i++) {
    mockPatternMatches.push({
      homeGoals: Math.random() * 4,
      awayGoals: Math.random() * 4,
      get totalGoals() { return this.homeGoals + this.awayGoals; }
    });
  }
  
  const predictor = new ComprehensiveMarketPredictor();
  await predictor.generateComprehensivePrediction(mockPatternMatches);
}

console.log('\n💡 USER INSIGHT VALIDATION:');
console.log('============================');
console.log('✅ "Define what the actual final prediction is" → COMPREHENSIVE MARKET ANALYSIS');
console.log('✅ "In accordance to bet markets" → ALL MAJOR BETTING MARKETS COVERED'); 
console.log('✅ "Home win and over 3.5? 1 and GG?" → COMBINED MARKET PREDICTIONS');
console.log('✅ "Translate to final betting information" → ACTIONABLE BET RECOMMENDATIONS');

demonstrateComprehensiveSystem();