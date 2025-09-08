/**
 * Mathematical Analysis: Streak Boosts Applied to Goals vs Win Rate
 * Comparing current system (goal lambda adjustment) vs proposed system (win rate adjustment)
 */

// Poisson probability mass function
function poissonPMF(k, lambda) {
  return Math.pow(lambda, k) * Math.exp(-lambda) / factorial(k);
}

function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// Simulate match outcomes using Poisson distribution
function simulateMatch(homeLambda, awayLambda, iterations = 10000) {
  let homeWins = 0, draws = 0, awayWins = 0;
  let totalHomeGoals = 0, totalAwayGoals = 0;
  
  for (let i = 0; i < iterations; i++) {
    const homeGoals = poissonRandom(homeLambda);
    const awayGoals = poissonRandom(awayLambda);
    
    totalHomeGoals += homeGoals;
    totalAwayGoals += awayGoals;
    
    if (homeGoals > awayGoals) homeWins++;
    else if (homeGoals < awayGoals) awayWins++;
    else draws++;
  }
  
  return {
    homeWinProb: homeWins / iterations,
    drawProb: draws / iterations,
    awayWinProb: awayWins / iterations,
    avgHomeGoals: totalHomeGoals / iterations,
    avgAwayGoals: totalAwayGoals / iterations
  };
}

function poissonRandom(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  
  return k - 1;
}

// Apply win rate adjustment directly to probabilities
function adjustWinRates(probabilities, homeStreakAdjustment, awayStreakAdjustment) {
  let { homeWinProb, drawProb, awayWinProb } = probabilities;
  
  // Apply streak adjustments to win rates
  homeWinProb *= (1 + homeStreakAdjustment);
  awayWinProb *= (1 + awayStreakAdjustment);
  
  // Normalize probabilities to ensure they sum to 1
  const total = homeWinProb + drawProb + awayWinProb;
  
  return {
    homeWinProb: homeWinProb / total,
    drawProb: drawProb / total,
    awayWinProb: awayWinProb / total
  };
}

console.log('='.repeat(80));
console.log('STREAK BOOST ANALYSIS: Goals vs Win Rate Impact');
console.log('='.repeat(80));

// Example scenario: Arsenal (8-game unbeaten) vs Chelsea (6-game losing streak)
console.log('\n📋 EXAMPLE SCENARIO:');
console.log('Arsenal (Home): 8-game unbeaten streak');
console.log('Chelsea (Away): 6-game losing streak');

// Base lambdas without any boosts
const baseHomeLambda = 1.8;  // Arsenal's base scoring rate
const baseAwayLambda = 1.3;  // Chelsea's base scoring rate

console.log(`\nBase lambdas: Home=${baseHomeLambda}, Away=${baseAwayLambda}`);

// Current system: Apply boosts to goals (lambda)
const homeStreakPenalty = -(8 * 0.016);  // -0.128 goals (unbeaten penalty)
const awayStreakBoost = 6 * 0.024;       // +0.144 goals (losing streak boost)

const adjustedHomeLambda = baseHomeLambda + homeStreakPenalty;
const adjustedAwayLambda = baseAwayLambda + awayStreakBoost;

console.log('\n🎯 CURRENT SYSTEM (Apply to Goals):');
console.log(`Home penalty: ${homeStreakPenalty.toFixed(3)} goals`);
console.log(`Away boost: +${awayStreakBoost.toFixed(3)} goals`);
console.log(`Adjusted lambdas: Home=${adjustedHomeLambda.toFixed(3)}, Away=${adjustedAwayLambda.toFixed(3)}`);

// Simulate with current system
const currentSystemResults = simulateMatch(adjustedHomeLambda, adjustedAwayLambda);

console.log('\nCurrent System Results:');
console.log(`Home Win: ${(currentSystemResults.homeWinProb * 100).toFixed(1)}%`);
console.log(`Draw: ${(currentSystemResults.drawProb * 100).toFixed(1)}%`);
console.log(`Away Win: ${(currentSystemResults.awayWinProb * 100).toFixed(1)}%`);
console.log(`Avg Goals: Home=${currentSystemResults.avgHomeGoals.toFixed(2)}, Away=${currentSystemResults.avgAwayGoals.toFixed(2)}`);

// Proposed system: Apply boosts to win rates
console.log('\n🎯 PROPOSED SYSTEM (Apply to Win Rates):');

// First simulate with base lambdas to get base probabilities
const baseResults = simulateMatch(baseHomeLambda, baseAwayLambda);

// Convert goal penalties to win rate adjustments (example conversion)
const homeWinRateAdjustment = homeStreakPenalty * 0.05;  // -0.128 * 0.05 = -6.4% win rate penalty
const awayWinRateAdjustment = awayStreakBoost * 0.05;    // +0.144 * 0.05 = +7.2% win rate boost

console.log(`Home win rate penalty: ${(homeWinRateAdjustment * 100).toFixed(1)}%`);
console.log(`Away win rate boost: +${(awayWinRateAdjustment * 100).toFixed(1)}%`);

// Apply win rate adjustments
const proposedSystemResults = adjustWinRates(baseResults, homeWinRateAdjustment, awayWinRateAdjustment);

console.log('\nProposed System Results:');
console.log(`Home Win: ${(proposedSystemResults.homeWinProb * 100).toFixed(1)}%`);
console.log(`Draw: ${(proposedSystemResults.drawProb * 100).toFixed(1)}%`);
console.log(`Away Win: ${(proposedSystemResults.awayWinProb * 100).toFixed(1)}%`);
console.log(`Avg Goals: Home=${baseResults.avgHomeGoals.toFixed(2)}, Away=${baseResults.avgAwayGoals.toFixed(2)} (unchanged)`);

// Comparison
console.log('\n📊 COMPARISON:');
console.log('Metric                | Current System | Proposed System | Difference');
console.log('-'.repeat(70));
console.log(`Home Win %            | ${(currentSystemResults.homeWinProb * 100).toFixed(1)}%          | ${(proposedSystemResults.homeWinProb * 100).toFixed(1)}%           | ${((proposedSystemResults.homeWinProb - currentSystemResults.homeWinProb) * 100).toFixed(1)}%`);
console.log(`Draw %                | ${(currentSystemResults.drawProb * 100).toFixed(1)}%          | ${(proposedSystemResults.drawProb * 100).toFixed(1)}%           | ${((proposedSystemResults.drawProb - currentSystemResults.drawProb) * 100).toFixed(1)}%`);
console.log(`Away Win %            | ${(currentSystemResults.awayWinProb * 100).toFixed(1)}%          | ${(proposedSystemResults.awayWinProb * 100).toFixed(1)}%           | ${((proposedSystemResults.awayWinProb - currentSystemResults.awayWinProb) * 100).toFixed(1)}%`);
console.log(`Avg Home Goals        | ${currentSystemResults.avgHomeGoals.toFixed(2)}         | ${baseResults.avgHomeGoals.toFixed(2)}          | ${(baseResults.avgHomeGoals - currentSystemResults.avgHomeGoals).toFixed(2)}`);
console.log(`Avg Away Goals        | ${currentSystemResults.avgAwayGoals.toFixed(2)}         | ${baseResults.avgAwayGoals.toFixed(2)}          | ${(baseResults.avgAwayGoals - currentSystemResults.avgAwayGoals).toFixed(2)}`);
console.log(`Total Goals           | ${(currentSystemResults.avgHomeGoals + currentSystemResults.avgAwayGoals).toFixed(2)}         | ${(baseResults.avgHomeGoals + baseResults.avgAwayGoals).toFixed(2)}          | ${((baseResults.avgHomeGoals + baseResults.avgAwayGoals) - (currentSystemResults.avgHomeGoals + currentSystemResults.avgAwayGoals)).toFixed(2)}`);

// Impact on Over/Under markets
const currentOver25 = simulateOverUnder(adjustedHomeLambda, adjustedAwayLambda, 2.5);
const proposedOver25 = simulateOverUnder(baseHomeLambda, baseAwayLambda, 2.5);

console.log('\n⚽ IMPACT ON GOAL MARKETS:');
console.log(`Over 2.5 Goals       | ${(currentOver25 * 100).toFixed(1)}%          | ${(proposedOver25 * 100).toFixed(1)}%           | ${((proposedOver25 - currentOver25) * 100).toFixed(1)}%`);

function simulateOverUnder(homeLambda, awayLambda, line, iterations = 10000) {
  let overCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    const homeGoals = poissonRandom(homeLambda);
    const awayGoals = poissonRandom(awayLambda);
    
    if ((homeGoals + awayGoals) > line) {
      overCount++;
    }
  }
  
  return overCount / iterations;
}

console.log('\n🎯 KEY DIFFERENCES:');
console.log('1. GOAL MARKETS: Current system affects O/U, BTTS. Proposed system does NOT.');
console.log('2. WIN RATES: Proposed system gives more direct control over 1X2 probabilities.');
console.log('3. REALISM: Proposed system maintains realistic goal averages.');
console.log('4. SIMPLICITY: Win rate adjustments are more intuitive to understand.');

console.log('\n💡 RECOMMENDATION:');
if (Math.abs((proposedSystemResults.homeWinProb - currentSystemResults.homeWinProb) * 100) > 2) {
  console.log('SIGNIFICANT DIFFERENCE detected. The proposed system will notably change outcomes.');
} else {
  console.log('MINOR DIFFERENCE detected. Both systems produce similar results.');
}

console.log('\n='.repeat(80));