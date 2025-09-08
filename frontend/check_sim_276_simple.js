const Database = require('better-sqlite3');

console.log('🔮 CHECKING SIMULATION 276 PATTERN DATA');
console.log('=======================================');

try {
  const db = new Database('./exodia.db', { readonly: true });
  
  // Check what simulation 276 looks like
  const simulation = db.prepare(`SELECT * FROM simulations WHERE id = 276`).get();
  
  if (simulation) {
    console.log('✅ Simulation 276 found!');
    console.log('Simulation data:', JSON.stringify(simulation, null, 2));
  } else {
    console.log('❌ Simulation 276 not found');
  }

  // Check historical matches table structure
  console.log('\n📊 Historical matches table structure:');
  const tableInfo = db.prepare("PRAGMA table_info(historical_matches)").all();
  tableInfo.forEach(col => console.log(`  ${col.name} (${col.type})`));
  
  // Check for any historical matches around simulation 276
  console.log('\n🔍 Looking for recent historical matches...');
  const recentMatches = db.prepare(`
    SELECT * FROM historical_matches 
    ORDER BY id DESC 
    LIMIT 10
  `).all();
  
  console.log(`Found ${recentMatches.length} recent matches:`);
  recentMatches.forEach(match => {
    console.log(`  ID ${match.id}: ${match.home_score_ht}-${match.away_score_ht} HT → ${match.home_score_ft}-${match.away_score_ft} FT`);
  });

  // Check if there are any patterns containing "276" or recent patterns
  const patternMatches = db.prepare(`
    SELECT * FROM rich_historical_patterns 
    ORDER BY id DESC 
    LIMIT 5
  `).all();
  
  console.log(`\n🧬 Recent patterns:`);
  patternMatches.forEach(pattern => {
    console.log(`  Pattern ID ${pattern.id}: ${pattern.rich_fingerprint_combined?.substring(0, 50)}...`);
  });

  db.close();

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}