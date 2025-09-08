/**
 * Comprehensive test of ALL Over/Under market calculations
 */

function testAllMarkets() {
  console.log('🧪 COMPREHENSIVE OVER/UNDER MARKET TEST\n');
  
  const scenarios = [
    { total: 0, desc: '0-0' },
    { total: 1, desc: '1-0' },
    { total: 2, desc: '1-1' },
    { total: 3, desc: '2-1 (CRITICAL - Asian 3.0 push)' },
    { total: 4, desc: '2-2' },
    { total: 5, desc: '3-2' },
    { total: 6, desc: '4-2' }
  ];

  console.log('🎯 EXPECTED MARKET DEFINITIONS:');
  console.log('Over 1.5: 2+ goals | Under 1.5: 0-1 goals');
  console.log('Over 2.5: 3+ goals | Under 2.5: 0-2 goals');
  console.log('Over 3.0: 4+ goals (Asian - Push on 3) | Under 3.0: 0-2 goals');
  console.log('Over 3.5: 4+ goals | Under 3.5: 0-3 goals');
  console.log('Over 4.5: 5+ goals | Under 4.5: 0-4 goals');
  console.log('\n📊 TESTING EACH SCENARIO:\n');

  const results = [];
  
  scenarios.forEach(scenario => {
    const totalGoals = scenario.total;
    
    // Current CORRECT logic
    const over15 = totalGoals > 1.5;  // 2+ goals
    const over25 = totalGoals > 2.5;  // 3+ goals
    const over30 = totalGoals > 3;    // 4+ goals (Asian - excludes 3)
    const over35 = totalGoals > 3.5;  // 4+ goals
    const over45 = totalGoals > 4.5;  // 5+ goals
    const exactly3 = totalGoals === 3; // Push for Asian 3.0
    
    console.log(`${scenario.desc}:`);
    console.log(`  Over 1.5: ${over15 ? '✅ WIN' : '❌ LOSE'}`);
    console.log(`  Over 2.5: ${over25 ? '✅ WIN' : '❌ LOSE'}`);
    console.log(`  Over 3.0: ${over30 ? '✅ WIN' : exactly3 ? '🟡 PUSH' : '❌ LOSE'}`);
    console.log(`  Over 3.5: ${over35 ? '✅ WIN' : '❌ LOSE'}`);
    console.log(`  Over 4.5: ${over45 ? '✅ WIN' : '❌ LOSE'}`);
    console.log('');
    
    results.push({
      totalGoals,
      over15, over25, over30, over35, over45, exactly3
    });
  });

  // Calculate probabilities (assuming equal probability for each scenario)
  console.log('📊 PROBABILITY CALCULATIONS:\n');
  const iterations = scenarios.length;
  
  let over15Count = 0, over25Count = 0, over30Count = 0, over35Count = 0, over45Count = 0, exactly3Count = 0;
  
  results.forEach(r => {
    if (r.over15) over15Count++;
    if (r.over25) over25Count++;
    if (r.over30) over30Count++;
    if (r.over35) over35Count++;
    if (r.over45) over45Count++;
    if (r.exactly3) exactly3Count++;
  });
  
  const probabilities = {
    over15: (over15Count / iterations * 100).toFixed(1),
    over25: (over25Count / iterations * 100).toFixed(1),
    over30: (over30Count / iterations * 100).toFixed(1),
    over35: (over35Count / iterations * 100).toFixed(1),
    over45: (over45Count / iterations * 100).toFixed(1),
    push30: (exactly3Count / iterations * 100).toFixed(1)
  };
  
  console.log(`Over 1.5: ${probabilities.over15}% (${over15Count}/${iterations})`);
  console.log(`Over 2.5: ${probabilities.over25}% (${over25Count}/${iterations})`);
  console.log(`Over 3.0: ${probabilities.over30}% (${over30Count}/${iterations}) + ${probabilities.push30}% push`);
  console.log(`Over 3.5: ${probabilities.over35}% (${over35Count}/${iterations})`);
  console.log(`Over 4.5: ${probabilities.over45}% (${over45Count}/${iterations})`);
  
  // Verify they're all different
  console.log('\n🔍 VERIFICATION:');
  const uniqueProbs = new Set([probabilities.over15, probabilities.over25, probabilities.over30, probabilities.over35, probabilities.over45]);
  
  if (uniqueProbs.size === 5) {
    console.log('✅ SUCCESS: All markets have DIFFERENT probabilities!');
    console.log('✅ Over 3.0 is now DIFFERENT from Over 2.5');
    console.log('✅ Asian 3.0 push logic working correctly');
  } else {
    console.log('❌ ERROR: Some markets have identical probabilities!');
    console.log('Unique probabilities found:', Array.from(uniqueProbs));
  }
  
  // Check specific issues
  if (probabilities.over30 === probabilities.over25) {
    console.log('❌ CRITICAL: Over 3.0 still matches Over 2.5!');
  } else {
    console.log('✅ FIXED: Over 3.0 is now different from Over 2.5');
  }
  
  if (probabilities.over30 === probabilities.over35) {
    console.log('❌ ERROR: Over 3.0 matches Over 3.5 (should be same since both need 4+ goals)');
    console.log('ℹ️  NOTE: This is actually correct - both need 4+ goals to win');
  }
}

testAllMarkets();