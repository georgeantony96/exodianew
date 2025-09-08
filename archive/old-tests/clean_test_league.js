const Database = require('better-sqlite3');
const path = require('path');

console.log('🧹 CLEANING TEST: Fresh league addition without conflicts\n');

const dbPath = path.join(__dirname, 'exodia.db');
const db = new Database(dbPath);

try {
  // Check current state
  console.log('📊 Current database state:');
  const leagues = db.prepare('SELECT * FROM leagues ORDER BY name').all();
  console.log(`Found ${leagues.length} leagues:`);
  leagues.forEach(league => {
    console.log(`  - ${league.name} (${league.country}) - ID: ${league.id}`);
  });

  // Test direct insertion with exact schema
  console.log('\n🧪 Testing direct league insertion...');
  
  const insertLeague = db.prepare(`
    INSERT INTO leagues (name, country, season, intelligence_enabled, avg_efficiency_rating)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Try with completely unique name
  const uniqueName = `Test League ${Date.now()}`;
  const result = insertLeague.run(uniqueName, 'Test Country', '2024-25', 1, 0.85);
  
  console.log('✅ Direct insertion successful:', result.lastInsertRowid);
  
  // Verify the insertion
  const inserted = db.prepare('SELECT * FROM leagues WHERE id = ?').get(result.lastInsertRowid);
  console.log('✅ Inserted league:', inserted);
  
  // Clean up the test
  db.prepare('DELETE FROM leagues WHERE id = ?').run(result.lastInsertRowid);
  console.log('🧹 Test cleanup completed');
  
  console.log('\n💡 CONCLUSION: Direct database insertion works!');
  console.log('   The issue is likely in the API prepared statement parameters');

} catch (error) {
  console.error('❌ Test failed:', error);
} finally {
  db.close();
}