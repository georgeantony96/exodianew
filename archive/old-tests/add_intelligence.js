const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'exodia.db');
const db = new Database(dbPath);

console.log('🧠 Adding AI intelligence patterns...\n');

try {
  db.exec('BEGIN TRANSACTION');

  const insertIntelligence = db.prepare(`
    INSERT OR REPLACE INTO league_market_intelligence 
    (league_id, market_type, avg_odds, opportunity_frequency, hit_rate, market_efficiency)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const intelligenceData = [
    // Primera División (ID: 1) - Argentina O2.5 famous pattern
    [1, 'ou25', 2.85, 0.68, 0.72, 0.75],
    [1, '1x2', 2.20, 0.35, 0.58, 0.78],
    [1, 'btts', 1.95, 0.45, 0.62, 0.76],
    
    // Premier League (ID: 5) - More efficient market
    [5, 'ou25', 1.95, 0.25, 0.55, 0.88],
    [5, '1x2', 2.80, 0.20, 0.52, 0.90],
    [5, 'btts', 1.85, 0.30, 0.58, 0.89],
    
    // Bundesliga (ID: 4) - High-scoring league
    [4, 'ou25', 1.75, 0.45, 0.65, 0.86],
    [4, '1x2', 2.50, 0.30, 0.55, 0.88],
    [4, 'btts', 1.70, 0.50, 0.68, 0.85],
    
    // La Liga (ID: 6) - Tactical, lower scoring
    [6, 'ou25', 2.10, 0.20, 0.48, 0.89],
    [6, '1x2', 2.90, 0.25, 0.50, 0.91],
    [6, 'btts', 1.90, 0.35, 0.55, 0.88]
  ];

  intelligenceData.forEach(intel => {
    const result = insertIntelligence.run(...intel);
    console.log(`✅ Added pattern: League ${intel[0]}, ${intel[1]} market - ${intel[2]} avg odds (${Math.round(intel[3]*100)}% opportunity)`);
  });

  db.exec('COMMIT');
  
  console.log('\n🎉 Intelligence patterns added successfully!');
  console.log('\n🌟 Notable patterns:');
  console.log('   • Argentina Primera O2.5: 68% opportunity frequency (2.85 avg odds)');
  console.log('   • Bundesliga BTTS: 50% opportunity frequency (1.70 avg odds)');
  console.log('   • Premier League: More efficient, lower opportunities');
  
  console.log('\n✨ Ready to test the full workflow at http://localhost:3000!');

} catch (error) {
  console.error('❌ Error adding intelligence:', error);
  db.exec('ROLLBACK');
} finally {
  db.close();
}