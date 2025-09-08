const Database = require('better-sqlite3');
const path = require('path');

console.log('🚀 Adding sample data to test the complete workflow...\n');

const dbPath = path.join(__dirname, 'exodia.db');
const db = new Database(dbPath);

try {
  // Begin transaction for data integrity
  db.exec('BEGIN TRANSACTION');

  // Add sample leagues
  const insertLeague = db.prepare(`
    INSERT INTO leagues (name, country, season, intelligence_enabled, avg_efficiency_rating)
    VALUES (?, ?, ?, ?, ?)
  `);

  const leagues = [
    ['Premier League', 'England', '2024-25', 1, 0.88],
    ['Argentina Primera', 'Argentina', '2024', 1, 0.75],
    ['Bundesliga', 'Germany', '2024-25', 1, 0.90],
    ['La Liga', 'Spain', '2024-25', 1, 0.89],
    ['Serie A', 'Italy', '2024-25', 1, 0.87]
  ];

  leagues.forEach(league => {
    const result = insertLeague.run(...league);
    console.log(`✅ Added league: ${league[0]} (ID: ${result.lastInsertRowid})`);
  });

  console.log('💡 No sample teams added - users will add their own teams');

  // Add sample league intelligence data (Argentina O2.5 pattern)
  const insertIntelligence = db.prepare(`
    INSERT INTO league_market_intelligence 
    (league_id, market_type, avg_odds, opportunity_frequency, hit_rate, market_efficiency)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const intelligenceData = [
    // Argentina Primera - Known for O2.5 value
    [2, 'ou25', 2.85, 0.68, 0.72, 0.75], // The famous Argentina O2.5 pattern
    [2, '1x2', 2.20, 0.35, 0.58, 0.78],
    [2, 'btts', 1.95, 0.45, 0.62, 0.76],
    
    // Premier League - More efficient market
    [1, 'ou25', 1.95, 0.25, 0.55, 0.88],
    [1, '1x2', 2.80, 0.20, 0.52, 0.90],
    [1, 'btts', 1.85, 0.30, 0.58, 0.89]
  ];

  intelligenceData.forEach(intel => {
    const result = insertIntelligence.run(...intel);
    console.log(`✅ Added intelligence: League ${intel[0]}, ${intel[1]} market (ID: ${result.lastInsertRowid})`);
  });

  // Commit transaction
  db.exec('COMMIT');
  
  console.log('\n🎉 Sample data added successfully!');
  console.log('\n📊 Summary:');
  console.log(`   • ${leagues.length} leagues added`);
  console.log(`   • 0 teams added (users add their own)`);
  console.log(`   • ${intelligenceData.length} intelligence patterns added`);
  console.log('\n🌟 Notable patterns:');
  console.log('   • Argentina O2.5: 68% opportunity frequency (2.85 avg odds)');
  console.log('   • Premier League: More efficient market (25% opportunities)');
  
  console.log('\n✨ Ready to test! Users can now add their own teams!');

} catch (error) {
  console.error('❌ Error adding sample data:', error);
  db.exec('ROLLBACK');
} finally {
  db.close();
}