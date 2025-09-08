/**
 * Streak Pattern Analyzer for Monte Carlo Simulations
 * 
 * Analyzes 1M+ Monte Carlo iterations to determine:
 * - How many consecutive overs/unders occur naturally
 * - How many clean sheets happen in streaks
 * - H2H win/loss patterns and reversions
 * - Goalless attack streaks and reversion points
 * 
 * Purpose: Replace abstract 60% thresholds with empirical streak data
 */

class StreakPatternAnalyzer {
  
  constructor() {
    this.simulationResults = [];
    this.streakStats = {
      overUnderStreaks: [],
      cleanSheetStreaks: [],
      goallessStreaks: [],
      winStreaks: [],
      // NEW: Comprehensive streak types for empirical analysis
      pureWinStreaks: [],
      pureLoseStreaks: [],
      pureDrawStreaks: [],
      unbeatenStreaks: [],
      winlessStreaks: [],
      mixedFormStreaks: []
    };
  }

  /**
   * Run streak analysis on Monte Carlo simulation
   * @param {Object} simulationData - Standard EXODIA simulation input
   * @param {Object} historicalData - H2H and form data for pattern analysis
   * @param {number} iterations - Number of iterations (default 1,000,000)
   */
  async analyzeStreakPatterns(simulationData, historicalData = null, iterations = 1000000) {
    console.log(`🧮 STREAK PATTERN ANALYSIS: ${iterations.toLocaleString()} iterations`);
    console.log('🎯 Purpose: Determine empirical reversion thresholds');
    
    console.log('🔄 Running Monte Carlo simulations...');
    const startTime = Date.now();
    
    // Process in batches to avoid memory issues with 1M+ iterations
    const batchSize = 50000;
    const numBatches = Math.ceil(iterations / batchSize);
    
    // Track streak patterns directly instead of storing all outcomes
    let overStreaks = [];
    let underStreaks = [];
    let homeCleanSheetStreaks = [];
    let awayCleanSheetStreaks = [];
    let homeGoallessStreaks = [];
    let awayGoallessStreaks = [];
    
    let currentOverStreak = 0;
    let currentUnderStreak = 0;
    let homeCurrentCleanStreak = 0;
    let awayCurrentCleanStreak = 0;
    let homeCurrentGoallessStreak = 0;
    let awayCurrentGoallessStreak = 0;
    
    let maxOverStreak = 0;
    let maxUnderStreak = 0;
    let reversionAfterOverStreaks = {};
    let reversionAfterUnderStreaks = {};
    
    // Run simulations in batches
    for (let batch = 0; batch < numBatches; batch++) {
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, iterations);
      
      if (batch % 2 === 0 || batch === numBatches - 1) {
        const progress = (batchEnd / iterations * 100).toFixed(1);
        console.log(`  Progress: ${progress}% (${batchEnd.toLocaleString()} iterations)`);
      }
      
      for (let i = batchStart; i < batchEnd; i++) {
        // Simulate single game using same logic as Monte Carlo engine
        const outcome = this.simulateSingleGame(simulationData);
        
        // Track over/under streaks
        if (outcome.over_25) {
          currentOverStreak++;
          if (currentUnderStreak > 0) {
            underStreaks.push(currentUnderStreak);
            maxUnderStreak = Math.max(maxUnderStreak, currentUnderStreak);
            reversionAfterUnderStreaks[currentUnderStreak] = (reversionAfterUnderStreaks[currentUnderStreak] || 0) + 1;
          }
          currentUnderStreak = 0;
        } else {
          currentUnderStreak++;
          if (currentOverStreak > 0) {
            overStreaks.push(currentOverStreak);
            maxOverStreak = Math.max(maxOverStreak, currentOverStreak);
            reversionAfterOverStreaks[currentOverStreak] = (reversionAfterOverStreaks[currentOverStreak] || 0) + 1;
          }
          currentOverStreak = 0;
        }
        
        // Track clean sheet streaks
        const homeCleanSheet = outcome.away_score === 0;
        const awayCleanSheet = outcome.home_score === 0;
        
        if (homeCleanSheet) {
          homeCurrentCleanStreak++;
        } else {
          if (homeCurrentCleanStreak > 0) {
            homeCleanSheetStreaks.push(homeCurrentCleanStreak);
          }
          homeCurrentCleanStreak = 0;
        }
        
        if (awayCleanSheet) {
          awayCurrentCleanStreak++;
        } else {
          if (awayCurrentCleanStreak > 0) {
            awayCleanSheetStreaks.push(awayCurrentCleanStreak);
          }
          awayCurrentCleanStreak = 0;
        }
        
        // Track goalless streaks
        const homeGoalless = outcome.home_score === 0;
        const awayGoalless = outcome.away_score === 0;
        
        if (homeGoalless) {
          homeCurrentGoallessStreak++;
        } else {
          if (homeCurrentGoallessStreak > 0) {
            homeGoallessStreaks.push(homeCurrentGoallessStreak);
          }
          homeCurrentGoallessStreak = 0;
        }
        
        if (awayGoalless) {
          awayCurrentGoallessStreak++;
        } else {
          if (awayCurrentGoallessStreak > 0) {
            awayGoallessStreaks.push(awayCurrentGoallessStreak);
          }
          awayCurrentGoallessStreak = 0;
        }
      }
    }
    
    const endTime = Date.now();
    console.log(`✅ Simulation complete: ${((endTime - startTime) / 1000).toFixed(1)}s`);
    
    // Analyze streak patterns from already processed data
    console.log('\\n📊 ANALYZING STREAK PATTERNS:');
    
    const overUnderAnalysis = {
      overStreaks: this.calculateStreakFrequencies(overStreaks),
      underStreaks: this.calculateStreakFrequencies(underStreaks),
      maxOverStreak: maxOverStreak,
      maxUnderStreak: maxUnderStreak,
      totalOverStreaks: overStreaks.length,
      totalUnderStreaks: underStreaks.length
    };
    
    const homeCleanFreq = this.calculateStreakFrequencies(homeCleanSheetStreaks);
    const awayCleanFreq = this.calculateStreakFrequencies(awayCleanSheetStreaks);
    const cleanSheetAnalysis = {
      homeCleanSheets: homeCleanFreq,
      awayCleanSheets: awayCleanFreq,
      combinedPatterns: this.combineFrequencies(homeCleanFreq, awayCleanFreq)
    };
    
    const homeGoallessFreq = this.calculateStreakFrequencies(homeGoallessStreaks);
    const awayGoallessFreq = this.calculateStreakFrequencies(awayGoallessStreaks);
    const goallessAnalysis = {
      homeGoalless: homeGoallessFreq,
      awayGoalless: awayGoallessFreq,
      combinedPatterns: this.combineFrequencies(homeGoallessFreq, awayGoallessFreq)
    };
    
    const reversionPoints = {
      afterOverStreaks: reversionAfterOverStreaks,
      afterUnderStreaks: reversionAfterUnderStreaks,
      afterGoallessStreaks: {}
    };
    
    console.log(`  🔍 Over/Under Streaks: Max Over=${maxOverStreak}, Max Under=${maxUnderStreak}`);
    console.log(`  🛡️ Clean Sheet Streaks: Home=${homeCleanSheetStreaks.length}, Away=${awayCleanSheetStreaks.length}`);
    console.log(`  ⚽ Goalless Streaks: Home=${homeGoallessStreaks.length}, Away=${awayGoallessStreaks.length}`);
    
    // Analyze H2H historical patterns if data provided
    let h2hAnalysis = null;
    let formAnalysis = null;
    let comprehensiveFormAnalysis = null;
    if (historicalData) {
      h2hAnalysis = this.analyzeH2HStreaks(historicalData);
      formAnalysis = this.analyzeFormStreaks(historicalData);
      comprehensiveFormAnalysis = this.analyzeComprehensiveFormStreaks(historicalData);
    }
    
    return {
      iterations: iterations,
      timestamp: new Date().toISOString(),
      analysis: {
        simulation: {
          overUnder: overUnderAnalysis,
          cleanSheets: cleanSheetAnalysis,
          goalless: goallessAnalysis,
          reversion: reversionPoints
        },
        historical: {
          h2h: h2hAnalysis,
          form: formAnalysis,
          comprehensiveForm: comprehensiveFormAnalysis
        }
      },
      recommendations: this.generateComprehensiveThresholds(overUnderAnalysis, cleanSheetAnalysis, goallessAnalysis, reversionPoints, h2hAnalysis, formAnalysis, comprehensiveFormAnalysis)
    };
  }

  /**
   * Simulate single game outcome (simplified version of Monte Carlo logic)
   */
  simulateSingleGame(data) {
    // Use Poisson distribution approximation for goals
    const homeLambda = data.expected_home_goals || 1.4;
    const awayLambda = data.expected_away_goals || 1.1;
    
    const homeScore = this.poissonRandom(homeLambda);
    const awayScore = this.poissonRandom(awayLambda);
    
    return {
      home_score: homeScore,
      away_score: awayScore,
      total_goals: homeScore + awayScore,
      over_25: (homeScore + awayScore) > 2.5,
      under_25: (homeScore + awayScore) <= 2.5,
      home_win: homeScore > awayScore,
      draw: homeScore === awayScore,
      away_win: awayScore > homeScore
    };
  }

  /**
   * Analyze Over/Under 2.5 streak patterns
   */
  analyzeOverUnderStreaks(outcomes) {
    console.log('  🔍 Over/Under Streak Analysis...');
    
    const streaks = {
      over: [],
      under: [],
      currentOverStreak: 0,
      currentUnderStreak: 0,
      maxOverStreak: 0,
      maxUnderStreak: 0
    };
    
    outcomes.forEach(outcome => {
      if (outcome.over_25) {
        streaks.currentOverStreak++;
        streaks.currentUnderStreak = 0;
      } else {
        streaks.currentUnderStreak++;
        if (streaks.currentOverStreak > 0) {
          streaks.over.push(streaks.currentOverStreak);
          streaks.maxOverStreak = Math.max(streaks.maxOverStreak, streaks.currentOverStreak);
        }
        streaks.currentOverStreak = 0;
      }
      
      if (streaks.currentUnderStreak > 0 && outcome.over_25) {
        streaks.under.push(streaks.currentUnderStreak);
        streaks.maxUnderStreak = Math.max(streaks.maxUnderStreak, streaks.currentUnderStreak);
      }
    });
    
    // Calculate frequencies
    const overStreakFreq = this.calculateStreakFrequencies(streaks.over);
    const underStreakFreq = this.calculateStreakFrequencies(streaks.under);
    
    console.log(`    Over streaks: Max=${streaks.maxOverStreak}, Avg=${(streaks.over.reduce((a,b) => a+b, 0) / streaks.over.length).toFixed(1)}`);
    console.log(`    Under streaks: Max=${streaks.maxUnderStreak}, Avg=${(streaks.under.reduce((a,b) => a+b, 0) / streaks.under.length).toFixed(1)}`);
    
    return {
      overStreaks: overStreakFreq,
      underStreaks: underStreakFreq,
      maxOverStreak: streaks.maxOverStreak,
      maxUnderStreak: streaks.maxUnderStreak,
      totalOverStreaks: streaks.over.length,
      totalUnderStreaks: streaks.under.length
    };
  }

  /**
   * Analyze clean sheet streak patterns
   */
  analyzeCleanSheetStreaks(homeCleanSheets, awayCleanSheets) {
    console.log('  🛡️ Clean Sheet Streak Analysis...');
    
    const homeStreaks = this.findStreakLengths(homeCleanSheets);
    const awayStreaks = this.findStreakLengths(awayCleanSheets);
    
    const homeFreq = this.calculateStreakFrequencies(homeStreaks);
    const awayFreq = this.calculateStreakFrequencies(awayStreaks);
    
    console.log(`    Home clean sheet streaks: Max=${Math.max(...homeStreaks, 0)}, Count=${homeStreaks.length}`);
    console.log(`    Away clean sheet streaks: Max=${Math.max(...awayStreaks, 0)}, Count=${awayStreaks.length}`);
    
    return {
      homeCleanSheets: homeFreq,
      awayCleanSheets: awayFreq,
      combinedPatterns: this.combineFrequencies(homeFreq, awayFreq)
    };
  }

  /**
   * Analyze goalless streak patterns
   */
  analyzeGoallessStreaks(homeGoalless, awayGoalless) {
    console.log('  ⚽ Goalless Streak Analysis...');
    
    const homeStreaks = this.findStreakLengths(homeGoalless);
    const awayStreaks = this.findStreakLengths(awayGoalless);
    
    const homeFreq = this.calculateStreakFrequencies(homeStreaks);
    const awayFreq = this.calculateStreakFrequencies(awayStreaks);
    
    console.log(`    Home goalless streaks: Max=${Math.max(...homeStreaks, 0)}, Count=${homeStreaks.length}`);
    console.log(`    Away goalless streaks: Max=${Math.max(...awayStreaks, 0)}, Count=${awayStreaks.length}`);
    
    return {
      homeGoalless: homeFreq,
      awayGoalless: awayFreq,
      combinedPatterns: this.combineFrequencies(homeFreq, awayFreq)
    };
  }

  /**
   * Find natural reversion points in the simulation data
   */
  findReversionPoints(outcomes) {
    console.log('  🔄 Reversion Point Analysis...');
    
    const reversions = {
      afterOverStreaks: {},
      afterUnderStreaks: {},
      afterGoallessStreaks: {}
    };
    
    // Track when patterns break and revert to opposite
    let currentOverStreak = 0;
    let currentUnderStreak = 0;
    
    outcomes.forEach((outcome, i) => {
      if (outcome.over_25) {
        currentOverStreak++;
        if (currentUnderStreak > 0) {
          // Under streak just ended, record reversion
          reversions.afterUnderStreaks[currentUnderStreak] = (reversions.afterUnderStreaks[currentUnderStreak] || 0) + 1;
        }
        currentUnderStreak = 0;
      } else {
        currentUnderStreak++;
        if (currentOverStreak > 0) {
          // Over streak just ended, record reversion
          reversions.afterOverStreaks[currentOverStreak] = (reversions.afterOverStreaks[currentOverStreak] || 0) + 1;
        }
        currentOverStreak = 0;
      }
    });
    
    console.log('    Natural reversion points identified');
    return reversions;
  }

  /**
   * Find streak lengths in boolean array
   */
  findStreakLengths(booleanArray) {
    const streaks = [];
    let currentStreak = 0;
    
    booleanArray.forEach(value => {
      if (value) {
        currentStreak++;
      } else {
        if (currentStreak > 0) {
          streaks.push(currentStreak);
        }
        currentStreak = 0;
      }
    });
    
    return streaks;
  }

  /**
   * Calculate frequency distribution of streak lengths (optimized for large datasets)
   */
  calculateStreakFrequencies(streaks) {
    const frequencies = {};
    let sum = 0;
    
    // Use for loop instead of forEach for better performance
    for (let i = 0; i < streaks.length; i++) {
      const length = streaks[i];
      frequencies[length] = (frequencies[length] || 0) + 1;
      sum += length;
    }
    
    // Calculate percentages
    const total = streaks.length;
    const percentages = {};
    const keys = Object.keys(frequencies);
    
    for (let i = 0; i < keys.length; i++) {
      const length = keys[i];
      percentages[length] = {
        count: frequencies[length],
        percentage: (frequencies[length] / total * 100).toFixed(2)
      };
    }
    
    return {
      raw: frequencies,
      percentages: percentages,
      total: total,
      average: total > 0 ? (sum / total).toFixed(2) : 0
    };
  }

  /**
   * Combine two frequency distributions (optimized for large datasets)
   */
  combineFrequencies(freq1, freq2) {
    const combined = {};
    const keys1 = Object.keys(freq1.raw);
    const keys2 = Object.keys(freq2.raw);
    const allLengths = [...new Set([...keys1, ...keys2])];
    const totalCombined = freq1.total + freq2.total;
    
    for (let i = 0; i < allLengths.length; i++) {
      const length = allLengths[i];
      const count1 = freq1.raw[length] || 0;
      const count2 = freq2.raw[length] || 0;
      const totalCount = count1 + count2;
      
      combined[length] = {
        count: totalCount,
        percentage: ((totalCount / totalCombined) * 100).toFixed(2)
      };
    }
    
    return combined;
  }

  /**
   * Analyze H2H historical patterns for streak detection
   */
  analyzeH2HStreaks(historicalData) {
    console.log('  🤝 H2H Historical Streak Analysis...');
    
    const h2hMatches = historicalData.h2h || [];
    if (h2hMatches.length < 3) {
      console.log('    Insufficient H2H data for analysis');
      return null;
    }
    
    // Analyze H2H win patterns
    const homeTeam = historicalData.home_team || 'Home';
    let homeWins = [];
    let currentHomeWinStreak = 0;
    let maxHomeWinStreak = 0;
    
    // Analyze H2H over/under patterns
    let h2hOvers = [];
    let currentOverStreak = 0;
    let currentUnderStreak = 0;
    let maxOverStreak = 0;
    let maxUnderStreak = 0;
    
    h2hMatches.forEach((match, i) => {
      // Track home team wins
      const isHomeWin = (match.home_team === homeTeam && match.home_score_ft > match.away_score_ft) ||
                       (match.away_team === homeTeam && match.away_score_ft > match.home_score_ft);
      
      if (isHomeWin) {
        currentHomeWinStreak++;
      } else {
        if (currentHomeWinStreak > 0) {
          homeWins.push(currentHomeWinStreak);
          maxHomeWinStreak = Math.max(maxHomeWinStreak, currentHomeWinStreak);
        }
        currentHomeWinStreak = 0;
      }
      
      // Track over/under patterns
      const totalGoals = match.home_score_ft + match.away_score_ft;
      const isOver = totalGoals > 2.5;
      
      if (isOver) {
        currentOverStreak++;
        if (currentUnderStreak > 0) {
          maxUnderStreak = Math.max(maxUnderStreak, currentUnderStreak);
        }
        currentUnderStreak = 0;
      } else {
        currentUnderStreak++;
        if (currentOverStreak > 0) {
          maxOverStreak = Math.max(maxOverStreak, currentOverStreak);
        }
        currentOverStreak = 0;
      }
    });
    
    console.log(`    H2H Win streaks: Max=${maxHomeWinStreak}, Sample=${homeWins.length}`);
    console.log(`    H2H Over streaks: Max=${maxOverStreak}, Under Max=${maxUnderStreak}`);
    
    return {
      winStreaks: this.calculateStreakFrequencies(homeWins),
      maxWinStreak: maxHomeWinStreak,
      maxOverStreak: maxOverStreak,
      maxUnderStreak: maxUnderStreak,
      sampleSize: h2hMatches.length
    };
  }

  /**
   * Analyze team form patterns for streak detection
   */
  analyzeFormStreaks(historicalData) {
    console.log('  📈 Team Form Streak Analysis...');
    
    const homeFormMatches = historicalData.home_home || [];
    const awayFormMatches = historicalData.away_away || [];
    
    const homeFormAnalysis = this.analyzeTeamFormPattern(homeFormMatches, 'Home');
    const awayFormAnalysis = this.analyzeTeamFormPattern(awayFormMatches, 'Away');
    
    return {
      homeForm: homeFormAnalysis,
      awayForm: awayFormAnalysis
    };
  }

  /**
   * Analyze individual team form pattern
   */
  analyzeTeamFormPattern(matches, teamType) {
    if (matches.length < 3) {
      console.log(`    Insufficient ${teamType} form data`);
      return null;
    }
    
    let overStreaks = [];
    let underStreaks = [];
    let currentOverStreak = 0;
    let currentUnderStreak = 0;
    let maxOverStreak = 0;
    let maxUnderStreak = 0;
    
    matches.forEach(match => {
      const totalGoals = match.home_score_ft + match.away_score_ft;
      const isOver = totalGoals > 2.5;
      
      if (isOver) {
        currentOverStreak++;
        if (currentUnderStreak > 0) {
          underStreaks.push(currentUnderStreak);
          maxUnderStreak = Math.max(maxUnderStreak, currentUnderStreak);
        }
        currentUnderStreak = 0;
      } else {
        currentUnderStreak++;
        if (currentOverStreak > 0) {
          overStreaks.push(currentOverStreak);
          maxOverStreak = Math.max(maxOverStreak, currentOverStreak);
        }
        currentOverStreak = 0;
      }
    });
    
    console.log(`    ${teamType} form - Over max: ${maxOverStreak}, Under max: ${maxUnderStreak}`);
    
    return {
      overStreaks: this.calculateStreakFrequencies(overStreaks),
      underStreaks: this.calculateStreakFrequencies(underStreaks),
      maxOverStreak: maxOverStreak,
      maxUnderStreak: maxUnderStreak,
      sampleSize: matches.length
    };
  }

  /**
   * Analyze comprehensive team form streaks (WIN/LOSE/DRAW patterns)
   */
  analyzeComprehensiveFormStreaks(historicalData) {
    console.log('  🎯 COMPREHENSIVE FORM STREAK ANALYSIS...');
    
    const homeFormMatches = historicalData.home_home || [];
    const awayFormMatches = historicalData.away_away || [];
    
    const homeFormAnalysis = this.analyzeAllStreakTypes(homeFormMatches, 'Home');
    const awayFormAnalysis = this.analyzeAllStreakTypes(awayFormMatches, 'Away');
    
    return {
      homeForm: homeFormAnalysis,
      awayForm: awayFormAnalysis
    };
  }

  /**
   * Analyze all streak types for a team (PURE WIN/LOSE/DRAW + combinations)
   */
  analyzeAllStreakTypes(matches, teamType) {
    if (matches.length < 3) {
      console.log(`    Insufficient ${teamType} data for comprehensive streak analysis`);
      return null;
    }
    
    // Track all possible streak patterns
    const streakAnalysis = {
      pureWins: [],
      pureLosses: [],
      pureDraws: [],
      unbeaten: [], // Wins + Draws
      winless: [],  // Losses + Draws
      maxPureWinStreak: 0,
      maxPureLoseStreak: 0,
      maxPureDrawStreak: 0,
      maxUnbeatenStreak: 0,
      maxWinlessStreak: 0
    };
    
    // Current streak counters
    let currentPureWins = 0;
    let currentPureLosses = 0;
    let currentPureDraws = 0;
    let currentUnbeaten = 0; // Wins OR draws
    let currentWinless = 0;  // Losses OR draws
    
    console.log(`    Analyzing ${matches.length} matches for ${teamType} comprehensive streaks...`);
    
    matches.forEach((match, i) => {
      // Determine match result for the team
      const homeScore = match.home_score_ft;
      const awayScore = match.away_score_ft;
      
      // Assume we're analyzing home team form in home_home matches, away team form in away_away
      const isWin = (teamType === 'Home' && homeScore > awayScore) || (teamType === 'Away' && awayScore > homeScore);
      const isLoss = (teamType === 'Home' && homeScore < awayScore) || (teamType === 'Away' && awayScore < homeScore);
      const isDraw = homeScore === awayScore;
      
      // Track PURE WIN streaks
      if (isWin) {
        currentPureWins++;
        streakAnalysis.maxPureWinStreak = Math.max(streakAnalysis.maxPureWinStreak, currentPureWins);
        // Reset other counters
        if (currentPureLosses > 0) {
          streakAnalysis.pureLosses.push(currentPureLosses);
          currentPureLosses = 0;
        }
        if (currentPureDraws > 0) {
          streakAnalysis.pureDraws.push(currentPureDraws);
          currentPureDraws = 0;
        }
        if (currentWinless > 0) {
          streakAnalysis.winless.push(currentWinless);
          currentWinless = 0;
        }
      }
      
      // Track PURE LOSS streaks
      if (isLoss) {
        currentPureLosses++;
        streakAnalysis.maxPureLoseStreak = Math.max(streakAnalysis.maxPureLoseStreak, currentPureLosses);
        // Reset other counters
        if (currentPureWins > 0) {
          streakAnalysis.pureWins.push(currentPureWins);
          currentPureWins = 0;
        }
        if (currentPureDraws > 0) {
          streakAnalysis.pureDraws.push(currentPureDraws);
          currentPureDraws = 0;
        }
        if (currentUnbeaten > 0) {
          streakAnalysis.unbeaten.push(currentUnbeaten);
          currentUnbeaten = 0;
        }
      }
      
      // Track PURE DRAW streaks
      if (isDraw) {
        currentPureDraws++;
        streakAnalysis.maxPureDrawStreak = Math.max(streakAnalysis.maxPureDrawStreak, currentPureDraws);
        // Reset win/loss counters but not mixed counters
        if (currentPureWins > 0) {
          streakAnalysis.pureWins.push(currentPureWins);
          currentPureWins = 0;
        }
        if (currentPureLosses > 0) {
          streakAnalysis.pureLosses.push(currentPureLosses);
          currentPureLosses = 0;
        }
      }
      
      // Track UNBEATEN streaks (wins OR draws)
      if (isWin || isDraw) {
        currentUnbeaten++;
        streakAnalysis.maxUnbeatenStreak = Math.max(streakAnalysis.maxUnbeatenStreak, currentUnbeaten);
      } else {
        if (currentUnbeaten > 0) {
          streakAnalysis.unbeaten.push(currentUnbeaten);
          currentUnbeaten = 0;
        }
      }
      
      // Track WINLESS streaks (losses OR draws) 
      if (isLoss || isDraw) {
        currentWinless++;
        streakAnalysis.maxWinlessStreak = Math.max(streakAnalysis.maxWinlessStreak, currentWinless);
      } else {
        if (currentWinless > 0) {
          streakAnalysis.winless.push(currentWinless);
          currentWinless = 0;
        }
      }
    });
    
    // Log comprehensive results
    console.log(`    ${teamType} Streak Analysis:`);
    console.log(`      Pure Wins: Max=${streakAnalysis.maxPureWinStreak}, Count=${streakAnalysis.pureWins.length}`);
    console.log(`      Pure Losses: Max=${streakAnalysis.maxPureLoseStreak}, Count=${streakAnalysis.pureLosses.length}`);  
    console.log(`      Pure Draws: Max=${streakAnalysis.maxPureDrawStreak}, Count=${streakAnalysis.pureDraws.length}`);
    console.log(`      Unbeaten (W+D): Max=${streakAnalysis.maxUnbeatenStreak}, Count=${streakAnalysis.unbeaten.length}`);
    console.log(`      Winless (L+D): Max=${streakAnalysis.maxWinlessStreak}, Count=${streakAnalysis.winless.length}`);
    
    return {
      pureWinStreaks: this.calculateStreakFrequencies(streakAnalysis.pureWins),
      pureLossStreaks: this.calculateStreakFrequencies(streakAnalysis.pureLosses),
      pureDrawStreaks: this.calculateStreakFrequencies(streakAnalysis.pureDraws),
      unbeatenStreaks: this.calculateStreakFrequencies(streakAnalysis.unbeaten),
      winlessStreaks: this.calculateStreakFrequencies(streakAnalysis.winless),
      maxPureWinStreak: streakAnalysis.maxPureWinStreak,
      maxPureLoseStreak: streakAnalysis.maxPureLoseStreak,
      maxPureDrawStreak: streakAnalysis.maxPureDrawStreak,
      maxUnbeatenStreak: streakAnalysis.maxUnbeatenStreak,
      maxWinlessStreak: streakAnalysis.maxWinlessStreak,
      sampleSize: matches.length
    };
  }

  /**
   * Generate comprehensive empirical threshold recommendations
   */
  generateComprehensiveThresholds(overUnder, cleanSheets, goalless, reversion, h2hAnalysis, formAnalysis, comprehensiveFormAnalysis) {
    console.log('\\n🎯 GENERATING COMPREHENSIVE EMPIRICAL THRESHOLDS:');
    
    // Base simulation thresholds (keeping existing logic)
    const baseRecommendations = {
      // Simulation-based patterns
      simulationOverStreak: this.findOptimalThreshold(overUnder.overStreaks.percentages, 10),
      simulationUnderStreak: this.findOptimalThreshold(overUnder.underStreaks.percentages, 15),
      cleanSheetStreak: this.findOptimalThreshold(cleanSheets.combinedPatterns, 12),
      goallessStreak: this.findOptimalThreshold(goalless.combinedPatterns, 20),
      
      // Base penalties/boosts
      simulationOverPenalty: this.calculatePenaltyStrength(overUnder.overStreaks.percentages),
      simulationUnderBoost: this.calculateBoostStrength(overUnder.underStreaks.percentages),
      cleanSheetPenalty: this.calculatePenaltyStrength(cleanSheets.combinedPatterns),
      goallessBoost: this.calculateBoostStrength(goalless.combinedPatterns)
    };
    
    // NEW: Comprehensive team form streak thresholds
    if (comprehensiveFormAnalysis) {
      console.log('\\n🎯 ANALYZING COMPREHENSIVE TEAM FORM STREAKS:');
      
      // Home team comprehensive analysis
      if (comprehensiveFormAnalysis.homeForm) {
        const homeForm = comprehensiveFormAnalysis.homeForm;
        
        baseRecommendations.homePureWinStreak = Math.max(3, Math.ceil(homeForm.maxPureWinStreak * 0.7)) || 4;
        baseRecommendations.homePureLoseStreak = Math.max(2, Math.ceil(homeForm.maxPureLoseStreak * 0.6)) || 3;
        baseRecommendations.homePureDrawStreak = Math.max(2, Math.ceil(homeForm.maxPureDrawStreak * 0.8)) || 3;
        baseRecommendations.homeUnbeatenStreak = Math.max(4, Math.ceil(homeForm.maxUnbeatenStreak * 0.7)) || 5;
        baseRecommendations.homeWinlessStreak = Math.max(3, Math.ceil(homeForm.maxWinlessStreak * 0.6)) || 4;
        
        // Penalties/boosts based on empirical rarity
        baseRecommendations.homePureWinPenalty = -0.25;  // Strong penalty for rare pure win streaks
        baseRecommendations.homePureLoseBoost = 0.30;    // Strong boost for rare pure losing streaks
        baseRecommendations.homePureDrawAdjustment = 0.15; // Chaos factor for draw streaks
        baseRecommendations.homeUnbeatenPenalty = -0.20; // Moderate penalty for mixed unbeaten
        baseRecommendations.homeWinlessBoost = 0.25;     // Moderate boost for mixed winless
        
        console.log(`  🏠 HOME STREAK THRESHOLDS:`);
        console.log(`    Pure Win Streak: ${baseRecommendations.homePureWinStreak}+ → ${baseRecommendations.homePureWinPenalty} penalty`);
        console.log(`    Pure Lose Streak: ${baseRecommendations.homePureLoseStreak}+ → +${baseRecommendations.homePureLoseBoost} boost`);
        console.log(`    Pure Draw Streak: ${baseRecommendations.homePureDrawStreak}+ → +${baseRecommendations.homePureDrawAdjustment} chaos`);
        console.log(`    Unbeaten Streak: ${baseRecommendations.homeUnbeatenStreak}+ → ${baseRecommendations.homeUnbeatenPenalty} penalty`);
        console.log(`    Winless Streak: ${baseRecommendations.homeWinlessStreak}+ → +${baseRecommendations.homeWinlessBoost} boost`);
      }
      
      // Away team comprehensive analysis
      if (comprehensiveFormAnalysis.awayForm) {
        const awayForm = comprehensiveFormAnalysis.awayForm;
        
        baseRecommendations.awayPureWinStreak = Math.max(3, Math.ceil(awayForm.maxPureWinStreak * 0.7)) || 4;
        baseRecommendations.awayPureLoseStreak = Math.max(2, Math.ceil(awayForm.maxPureLoseStreak * 0.6)) || 3;
        baseRecommendations.awayPureDrawStreak = Math.max(2, Math.ceil(awayForm.maxPureDrawStreak * 0.8)) || 3;
        baseRecommendations.awayUnbeatenStreak = Math.max(4, Math.ceil(awayForm.maxUnbeatenStreak * 0.7)) || 5;
        baseRecommendations.awayWinlessStreak = Math.max(3, Math.ceil(awayForm.maxWinlessStreak * 0.6)) || 4;
        
        // Away teams typically need slightly different thresholds (more sensitive to form changes)
        baseRecommendations.awayPureWinPenalty = -0.22;  // Slightly lower penalty (away wins rarer)
        baseRecommendations.awayPureLoseBoost = 0.35;    // Higher boost (away losses more impactful)
        baseRecommendations.awayPureDrawAdjustment = 0.18; // Higher chaos for away draws
        baseRecommendations.awayUnbeatenPenalty = -0.18; // Lower penalty (away unbeaten impressive)
        baseRecommendations.awayWinlessBoost = 0.28;     // Higher boost (away winless concerning)
        
        console.log(`  ✈️ AWAY STREAK THRESHOLDS:`);
        console.log(`    Pure Win Streak: ${baseRecommendations.awayPureWinStreak}+ → ${baseRecommendations.awayPureWinPenalty} penalty`);
        console.log(`    Pure Lose Streak: ${baseRecommendations.awayPureLoseStreak}+ → +${baseRecommendations.awayPureLoseBoost} boost`);
        console.log(`    Pure Draw Streak: ${baseRecommendations.awayPureDrawStreak}+ → +${baseRecommendations.awayPureDrawAdjustment} chaos`);
        console.log(`    Unbeaten Streak: ${baseRecommendations.awayUnbeatenStreak}+ → ${baseRecommendations.awayUnbeatenPenalty} penalty`);
        console.log(`    Winless Streak: ${baseRecommendations.awayWinlessStreak}+ → +${baseRecommendations.awayWinlessBoost} boost`);
      }
    }
    
    // H2H-specific thresholds
    if (h2hAnalysis) {
      baseRecommendations.h2hWinStreak = Math.max(2, h2hAnalysis.maxWinStreak > 0 ? Math.ceil(h2hAnalysis.maxWinStreak * 0.6) : 3);
      baseRecommendations.h2hOverStreak = Math.max(2, h2hAnalysis.maxOverStreak > 0 ? Math.ceil(h2hAnalysis.maxOverStreak * 0.7) : 3);
      baseRecommendations.h2hUnderStreak = Math.max(2, h2hAnalysis.maxUnderStreak > 0 ? Math.ceil(h2hAnalysis.maxUnderStreak * 0.7) : 3);
      
      baseRecommendations.h2hWinPenalty = -0.15; // Stronger for H2H dominance
      baseRecommendations.h2hOverPenalty = -0.20; // Stronger for specific matchup patterns
      baseRecommendations.h2hUnderBoost = 0.18;
    }
    
    // Form-specific thresholds
    if (formAnalysis) {
      // Home form thresholds
      if (formAnalysis.homeForm) {
        baseRecommendations.homeFormOverStreak = Math.max(3, formAnalysis.homeForm.maxOverStreak > 0 ? Math.ceil(formAnalysis.homeForm.maxOverStreak * 0.7) : 4);
        baseRecommendations.homeFormUnderStreak = Math.max(2, formAnalysis.homeForm.maxUnderStreak > 0 ? Math.ceil(formAnalysis.homeForm.maxUnderStreak * 0.6) : 3);
      }
      
      // Away form thresholds
      if (formAnalysis.awayForm) {
        baseRecommendations.awayFormOverStreak = Math.max(3, formAnalysis.awayForm.maxOverStreak > 0 ? Math.ceil(formAnalysis.awayForm.maxOverStreak * 0.7) : 4);
        baseRecommendations.awayFormUnderStreak = Math.max(2, formAnalysis.awayForm.maxUnderStreak > 0 ? Math.ceil(formAnalysis.awayForm.maxUnderStreak * 0.6) : 3);
      }
      
      baseRecommendations.formOverPenalty = -0.18; // Moderate for form patterns
      baseRecommendations.formUnderBoost = 0.15;
    }
    
    console.log('\\n✅ COMPREHENSIVE EMPIRICAL THRESHOLDS:');
    console.log('🎯 SIMULATION-BASED:');
    console.log(`  Over streak reversion: ${baseRecommendations.simulationOverStreak}+ consecutive → ${baseRecommendations.simulationOverPenalty.toFixed(2)} penalty`);
    console.log(`  Clean sheet fatigue: ${baseRecommendations.cleanSheetStreak}+ consecutive → ${baseRecommendations.cleanSheetPenalty.toFixed(2)} penalty`);
    console.log(`  Goalless reversion: ${baseRecommendations.goallessStreak}+ consecutive → +${baseRecommendations.goallessBoost.toFixed(2)} boost`);
    
    if (h2hAnalysis) {
      console.log('\\n🤝 H2H-SPECIFIC:');
      console.log(`  H2H win dominance: ${baseRecommendations.h2hWinStreak}+ consecutive → ${baseRecommendations.h2hWinPenalty.toFixed(2)} penalty`);
      console.log(`  H2H over pattern: ${baseRecommendations.h2hOverStreak}+ consecutive → ${baseRecommendations.h2hOverPenalty.toFixed(2)} penalty`);
      console.log(`  H2H under pattern: ${baseRecommendations.h2hUnderStreak}+ consecutive → +${baseRecommendations.h2hUnderBoost.toFixed(2)} boost`);
    }
    
    if (formAnalysis) {
      console.log('\\n📈 FORM-SPECIFIC:');
      if (formAnalysis.homeForm) {
        console.log(`  Home form over: ${baseRecommendations.homeFormOverStreak}+ consecutive → ${baseRecommendations.formOverPenalty.toFixed(2)} penalty`);
        console.log(`  Home form under: ${baseRecommendations.homeFormUnderStreak}+ consecutive → +${baseRecommendations.formUnderBoost.toFixed(2)} boost`);
      }
      if (formAnalysis.awayForm) {
        console.log(`  Away form over: ${baseRecommendations.awayFormOverStreak}+ consecutive → ${baseRecommendations.formOverPenalty.toFixed(2)} penalty`);
        console.log(`  Away form under: ${baseRecommendations.awayFormUnderStreak}+ consecutive → +${baseRecommendations.formUnderBoost.toFixed(2)} boost`);
      }
    }
    
    return baseRecommendations;
  }

  /**
   * Find threshold that captures top X% of rare events
   */
  findOptimalThreshold(frequencies, targetPercentile) {
    const lengths = Object.keys(frequencies).map(Number).sort((a, b) => b - a);
    let cumulativePercent = 0;
    
    for (const length of lengths) {
      cumulativePercent += parseFloat(frequencies[length].percentage);
      if (cumulativePercent >= targetPercentile) {
        return length;
      }
    }
    
    return lengths[lengths.length - 1] || 3; // Fallback
  }

  /**
   * Calculate penalty/boost strength based on pattern rarity
   */
  calculatePenaltyStrength(frequencies) {
    const totalEvents = Object.values(frequencies).reduce((sum, freq) => sum + freq.count, 0);
    const rarityFactor = Math.max(0.05, Math.min(0.35, totalEvents / 100000)); // Scale based on rarity
    return -0.15 - (rarityFactor * 0.5); // Stronger penalties for rarer patterns
  }

  /**
   * Calculate boost strength based on pattern rarity
   */
  calculateBoostStrength(frequencies) {
    const totalEvents = Object.values(frequencies).reduce((sum, freq) => sum + freq.count, 0);
    const rarityFactor = Math.max(0.05, Math.min(0.30, totalEvents / 100000));
    return 0.12 + (rarityFactor * 0.4); // Stronger boosts for rarer patterns
  }

  /**
   * Simple Poisson random generator
   */
  poissonRandom(lambda) {
    let k = 0;
    let p = 1.0;
    const l = Math.exp(-lambda);
    
    while (p > l) {
      k++;
      p *= Math.random();
    }
    
    return k - 1;
  }
}

// Export for use
module.exports = StreakPatternAnalyzer;

// Test function
async function testStreakAnalysis() {
  console.log('🧪 TESTING COMPREHENSIVE STREAK PATTERN ANALYZER\\n');
  
  const analyzer = new StreakPatternAnalyzer();
  
  // Mock simulation data (similar to EXODIA input)
  const testData = {
    expected_home_goals: 1.5,
    expected_away_goals: 1.2,
    home_team: 'Liverpool',
    away_team: 'Chelsea'
  };
  
  // Mock historical data with comprehensive streak patterns for testing
  const mockHistoricalData = {
    home_team: 'Liverpool',
    away_team: 'Chelsea',
    h2h: [
      { home_team: 'Liverpool', away_team: 'Chelsea', home_score_ft: 2, away_score_ft: 1 },
      { home_team: 'Chelsea', away_team: 'Liverpool', home_score_ft: 1, away_score_ft: 3 },
      { home_team: 'Liverpool', away_team: 'Chelsea', home_score_ft: 4, away_score_ft: 1 },
      { home_team: 'Chelsea', away_team: 'Liverpool', home_score_ft: 0, away_score_ft: 2 },
      { home_team: 'Liverpool', away_team: 'Chelsea', home_score_ft: 2, away_score_ft: 0 },
      { home_team: 'Chelsea', away_team: 'Liverpool', home_score_ft: 1, away_score_ft: 1 },
      { home_team: 'Liverpool', away_team: 'Chelsea', home_score_ft: 3, away_score_ft: 1 }
    ],
    // Liverpool home form - mix of wins, draws, losses for comprehensive streak testing
    home_home: [
      { home_team: 'Liverpool', away_team: 'Arsenal', home_score_ft: 3, away_score_ft: 1 },    // WIN
      { home_team: 'Liverpool', away_team: 'Man City', home_score_ft: 2, away_score_ft: 1 },   // WIN  
      { home_team: 'Liverpool', away_team: 'Tottenham', home_score_ft: 1, away_score_ft: 1 },  // DRAW
      { home_team: 'Liverpool', away_team: 'Brighton', home_score_ft: 0, away_score_ft: 1 },   // LOSS
      { home_team: 'Liverpool', away_team: 'Newcastle', home_score_ft: 0, away_score_ft: 2 },  // LOSS
      { home_team: 'Liverpool', away_team: 'Wolves', home_score_ft: 2, away_score_ft: 0 },     // WIN
      { home_team: 'Liverpool', away_team: 'Palace', home_score_ft: 1, away_score_ft: 1 },     // DRAW
      { home_team: 'Liverpool', away_team: 'Villa', home_score_ft: 3, away_score_ft: 0 }       // WIN
    ],
    // Chelsea away form - different patterns for comparison  
    away_away: [
      { home_team: 'Arsenal', away_team: 'Chelsea', home_score_ft: 1, away_score_ft: 2 },      // WIN
      { home_team: 'Man City', away_team: 'Chelsea', home_score_ft: 0, away_score_ft: 1 },     // WIN
      { home_team: 'Tottenham', away_team: 'Chelsea', home_score_ft: 2, away_score_ft: 2 },    // DRAW
      { home_team: 'Brighton', away_team: 'Chelsea', home_score_ft: 1, away_score_ft: 0 },     // LOSS
      { home_team: 'Newcastle', away_team: 'Chelsea', home_score_ft: 3, away_score_ft: 0 },    // LOSS
      { home_team: 'Wolves', away_team: 'Chelsea', home_score_ft: 1, away_score_ft: 0 },       // LOSS
      { home_team: 'Palace', away_team: 'Chelsea', home_score_ft: 2, away_score_ft: 2 },       // DRAW  
      { home_team: 'Villa', away_team: 'Chelsea', home_score_ft: 0, away_score_ft: 1 }         // WIN
    ]
  };
  
  // Run full 1M iteration test for statistical significance
  console.log('🚀 Running 1M iteration analysis for statistical validation...');
  const results = await analyzer.analyzeStreakPatterns(testData, mockHistoricalData, 1000000);
  
  console.log('\\n📋 COMPREHENSIVE ANALYSIS SUMMARY:');
  console.log('==========================================');
  console.log('RECOMMENDATIONS:', JSON.stringify(results.recommendations, null, 2));
}

// Run test if called directly
if (require.main === module) {
  testStreakAnalysis().catch(console.error);
}