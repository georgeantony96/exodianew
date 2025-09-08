/**
 * Debug script to inspect the actual Over 3.0 vs Over 3.5 probability values
 */

// Simple test to simulate goal counting
function simulateGoals() {
  const results = [];
  const scenarios = [
    { total: 0, desc: '0 goals' },
    { total: 1, desc: '1 goal' },
    { total: 2, desc: '2 goals' },
    { total: 3, desc: '3 goals (CRITICAL - Asian 3.0 push)' },
    { total: 4, desc: '4 goals' },
    { total: 5, desc: '5 goals' }
  ];

  console.log('🧪 TESTING OVER/UNDER COUNTING LOGIC\n');
  
  scenarios.forEach(scenario => {
    const totalGoals = scenario.total;
    
    // Updated logic from Monte Carlo engine  
    const over30_current = totalGoals >= 3;     // Over 3.0: >=3 goals (3+)
    const over35_current = totalGoals > 3.5;    // Over 3.5: >3.5 goals (4+)
    const exactly30 = totalGoals === 3;         // Push scenario (informational)
    
    console.log(`${scenario.desc}:`);
    console.log(`  Over 3.0 (European): ${over30_current ? '✅ WIN' : '❌ LOSE'}`);
    console.log(`  Over 3.5 (European): ${over35_current ? '✅ WIN' : '❌ LOSE'}`);
    console.log(`  Exactly 3.0 (For Reference): ${exactly30 ? '🟡 THREE GOALS' : '⚫ NO'}`);
    console.log('');
    
    results.push({
      totalGoals,
      over30: over30_current,
      over35: over35_current,
      push: exactly30
    });
  });

  // Calculate probabilities
  console.log('📊 PROBABILITY CALCULATION TEST:');
  console.log('Assuming equal probability for each scenario (16.67% each)\n');
  
  const iterations = scenarios.length;
  let over30Count = 0, over35Count = 0, exactly30Count = 0;
  
  results.forEach(r => {
    if (r.over30) over30Count++;
    if (r.over35) over35Count++;
    if (r.push) exactly30Count++;
  });
  
  const over30Prob = over30Count / iterations;
  const over35Prob = over35Count / iterations;
  const under30Prob = (iterations - over30Count - exactly30Count) / iterations; // Asian Under excludes pushes
  const under35Prob = (iterations - over35Count) / iterations; // European Under includes all non-wins
  const pushProb = exactly30Count / iterations;
  
  console.log(`Over 3.0 Probability: ${(over30Prob * 100).toFixed(1)}% (${over30Count}/${iterations})`);
  console.log(`Under 3.0 Probability: ${(under30Prob * 100).toFixed(1)}% (excludes push)`);
  console.log(`Push 3.0 Probability: ${(pushProb * 100).toFixed(1)}%`);
  console.log('');
  console.log(`Over 3.5 Probability: ${(over35Prob * 100).toFixed(1)}% (${over35Count}/${iterations})`);
  console.log(`Under 3.5 Probability: ${(under35Prob * 100).toFixed(1)}%`);
  console.log('');
  
  if (over30Prob !== over35Prob) {
    console.log('✅ SUCCESS: Over 3.0 and Over 3.5 have DIFFERENT probabilities!');
    console.log(`   Difference: ${Math.abs(over30Prob - over35Prob) * 100}%`);
  } else {
    console.log('❌ ERROR: Over 3.0 and Over 3.5 have the SAME probability!');
  }
}

simulateGoals();