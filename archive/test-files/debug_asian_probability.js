/**
 * Debug Asian Over 3.0 vs European Over 3.5 true probability calculation
 */

function calculateCorrectProbabilities() {
  console.log('🧮 ASIAN vs EUROPEAN MARKET TRUE PROBABILITY ANALYSIS\n');
  
  // Test scenarios with realistic goal distribution
  const scenarios = [
    { goals: 0, probability: 0.10 },  // 10%
    { goals: 1, probability: 0.25 },  // 25% 
    { goals: 2, probability: 0.30 },  // 30%
    { goals: 3, probability: 0.20 },  // 20% ← KEY: Push for Asian 3.0
    { goals: 4, probability: 0.10 },  // 10%
    { goals: 5, probability: 0.05 }   // 5%
  ];
  
  console.log('📊 REALISTIC GOAL DISTRIBUTION:');
  scenarios.forEach(s => {
    console.log(`  ${s.goals} goals: ${(s.probability * 100).toFixed(1)}%`);
  });
  console.log('');
  
  // Calculate outcomes for each market
  let asianOver30_wins = 0;
  let asianOver30_pushes = 0;
  let asianOver30_losses = 0;
  
  let europeanOver35_wins = 0;
  let europeanOver35_losses = 0;
  
  scenarios.forEach(scenario => {
    const { goals, probability } = scenario;
    
    // Asian Over 3.0
    if (goals > 3) {
      asianOver30_wins += probability;
    } else if (goals === 3) {
      asianOver30_pushes += probability;
    } else {
      asianOver30_losses += probability;
    }
    
    // European Over 3.5
    if (goals > 3.5) {
      europeanOver35_wins += probability;
    } else {
      europeanOver35_losses += probability;
    }
  });
  
  console.log('🎯 MARKET OUTCOMES:');
  console.log('\n📍 ASIAN OVER 3.0:');
  console.log(`  Win (4+ goals): ${(asianOver30_wins * 100).toFixed(1)}%`);
  console.log(`  Push (3 goals): ${(asianOver30_pushes * 100).toFixed(1)}%`);
  console.log(`  Lose (0-2 goals): ${(asianOver30_losses * 100).toFixed(1)}%`);
  
  console.log('\n📍 EUROPEAN OVER 3.5:');
  console.log(`  Win (4+ goals): ${(europeanOver35_wins * 100).toFixed(1)}%`);
  console.log(`  Lose (0-3 goals): ${(europeanOver35_losses * 100).toFixed(1)}%`);
  
  // Calculate TRUE PROBABILITIES for betting purposes
  console.log('\n🎲 TRUE PROBABILITY CALCULATIONS:');
  
  // Method 1: Simple win probability
  const asianWinProb = asianOver30_wins;
  const europeanWinProb = europeanOver35_wins;
  
  console.log('\nMethod 1 - Simple Win Probability:');
  console.log(`  Asian Over 3.0: ${(asianWinProb * 100).toFixed(1)}%`);
  console.log(`  European Over 3.5: ${(europeanWinProb * 100).toFixed(1)}%`);
  
  // Method 2: Effective probability (including push as partial win)
  // Asian markets are safer due to push protection
  const asianEffectiveProb = asianOver30_wins + (asianOver30_pushes * 0.5); // Push = 50% value
  const europeanEffectiveProb = europeanOver35_wins;
  
  console.log('\nMethod 2 - Effective Probability (Push = 50% value):');
  console.log(`  Asian Over 3.0: ${(asianEffectiveProb * 100).toFixed(1)}%`);
  console.log(`  European Over 3.5: ${(europeanEffectiveProb * 100).toFixed(1)}%`);
  
  // Method 3: Expected return-based probability
  // What probability would give same expected return as push-protected Asian bet?
  const asianExpectedReturn = asianOver30_wins * 1 + asianOver30_pushes * 0 + asianOver30_losses * (-1);
  const europeanExpectedReturn = europeanOver35_wins * 1 + europeanOver35_losses * (-1);
  
  console.log('\nMethod 3 - Expected Return Analysis:');
  console.log(`  Asian Over 3.0 Expected Return: ${asianExpectedReturn.toFixed(3)}`);
  console.log(`  European Over 3.5 Expected Return: ${europeanExpectedReturn.toFixed(3)}`);
  
  // Convert expected return to equivalent probability
  // For a fair bet: P * (+1) + (1-P) * (-1) = 0 → P = 0.5
  // For Asian: P_equivalent * 1 + (1-P_equivalent) * (-1) = asianExpectedReturn
  // → P_equivalent = (asianExpectedReturn + 1) / 2
  const asianEquivalentProb = (asianExpectedReturn + 1) / 2;
  const europeanEquivalentProb = (europeanExpectedReturn + 1) / 2;
  
  console.log('\nMethod 4 - Equivalent Fair Probability:');
  console.log(`  Asian Over 3.0 Equivalent: ${(asianEquivalentProb * 100).toFixed(1)}%`);
  console.log(`  European Over 3.5 Equivalent: ${(europeanEquivalentProb * 100).toFixed(1)}%`);
  
  console.log('\n🏆 CONCLUSION:');
  if (asianEquivalentProb > europeanEquivalentProb) {
    console.log('✅ Asian Over 3.0 should have HIGHER true probability due to push protection');
    console.log(`   Difference: ${((asianEquivalentProb - europeanEquivalentProb) * 100).toFixed(1)} percentage points`);
  } else {
    console.log('❌ Something is wrong with the calculation');
  }
}

calculateCorrectProbabilities();