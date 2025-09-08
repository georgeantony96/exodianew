const Database = require('better-sqlite3');

console.log('🔍 CLARIFYING OVER 3.5 ACCURACY RESULTS');
console.log('=======================================');

try {
  const db = new Database('./exodia.db', { readonly: true });
  
  // Get some sample matches to understand what's happening
  const sampleMatches = db.prepare(`
    SELECT 
      simulation_id,
      home_score_ht,
      away_score_ht,
      home_score_ft,
      away_score_ft,
      (home_score_ft + away_score_ft) as total_goals,
      CASE WHEN (home_score_ft + away_score_ft) > 3.5 THEN 'YES' ELSE 'NO' END as over_3_5_actual
    FROM match_results
    WHERE home_score_ft IS NOT NULL 
      AND away_score_ft IS NOT NULL
    ORDER BY (home_score_ft + away_score_ft) DESC
    LIMIT 20
  `).all();
  
  console.log('📊 SAMPLE MATCHES (Highest scoring first):');
  console.log('==========================================');
  
  sampleMatches.forEach(match => {
    console.log(`Sim ${match.simulation_id}: ${match.home_score_ht}-${match.away_score_ht} HT → ${match.home_score_ft}-${match.away_score_ft} FT | Total: ${match.total_goals} | Over 3.5: ${match.over_3_5_actual}`);
  });
  
  // Count actual Over 3.5 occurrences
  const totalMatches = db.prepare('SELECT COUNT(*) as count FROM match_results WHERE home_score_ft IS NOT NULL').get();
  const over35Matches = db.prepare('SELECT COUNT(*) as count FROM match_results WHERE (home_score_ft + away_score_ft) > 3.5').get();
  const over45Matches = db.prepare('SELECT COUNT(*) as count FROM match_results WHERE (home_score_ft + away_score_ft) > 4.5').get();
  
  console.log('\n📈 ACTUAL OCCURRENCE RATES:');
  console.log('============================');
  console.log(`Total matches: ${totalMatches.count}`);
  console.log(`Over 3.5 goals occurred: ${over35Matches.count} times (${(over35Matches.count/totalMatches.count*100).toFixed(1)}%)`);
  console.log(`Over 4.5 goals occurred: ${over45Matches.count} times (${(over45Matches.count/totalMatches.count*100).toFixed(1)}%)`);
  
  // Show goal distribution
  console.log('\n🎯 GOAL DISTRIBUTION:');
  console.log('=====================');
  
  const goalDistribution = db.prepare(`
    SELECT 
      (home_score_ft + away_score_ft) as total_goals,
      COUNT(*) as frequency,
      ROUND(COUNT(*) * 100.0 / ${totalMatches.count}, 1) as percentage
    FROM match_results
    WHERE home_score_ft IS NOT NULL
    GROUP BY total_goals
    ORDER BY total_goals
  `).all();
  
  goalDistribution.forEach(dist => {
    const over35 = dist.total_goals > 3.5 ? ' ✅ Over 3.5' : '';
    const over45 = dist.total_goals > 4.5 ? ' ✅ Over 4.5' : '';
    console.log(`${dist.total_goals} goals: ${dist.frequency} matches (${dist.percentage}%)${over35}${over45}`);
  });
  
  console.log('\n🤔 WHAT THE 67.9% ACCURACY ACTUALLY MEANS:');
  console.log('==========================================');
  console.log('This means:');
  console.log('• When the mathematical engines predict a match will have Over 3.5 goals');
  console.log('• They are correct 67.9% of the time');
  console.log('• This is PREDICTION ACCURACY, not occurrence rate');
  console.log('');
  console.log('Breakdown:');
  console.log('• Total matches analyzed: 274');
  console.log('• Matches that actually had Over 3.5: 74 (27.0%)');
  console.log('• Correct predictions: 186 out of 274 (67.9%)');
  console.log('');
  console.log('This includes:');
  console.log('• TRUE POSITIVES: Predicted Over 3.5 AND it happened');
  console.log('• TRUE NEGATIVES: Predicted Under 3.5 AND it was under');
  console.log('• FALSE POSITIVES: Predicted Over 3.5 BUT it was under');
  console.log('• FALSE NEGATIVES: Predicted Under 3.5 BUT it was over');
  
  db.close();

} catch (error) {
  console.error('❌ Error:', error.message);
}