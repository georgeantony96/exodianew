const Database = require('./frontend/node_modules/better-sqlite3');
const path = require('path');

const dbPath = path.resolve('./frontend/exodia.db');
const db = new Database(dbPath);

console.log('🔍 CHECKING TEAM IDs IN DATABASE...\n');

// Check all teams in database
try {
  const teams = db.prepare(`SELECT id, name FROM teams LIMIT 10`).all();
  console.log('📋 TEAMS IN DATABASE:');
  teams.forEach(team => {
    console.log(`   ID: ${team.id} - Name: "${team.name}"`);
  });
  
  const teamCount = db.prepare('SELECT COUNT(*) as count FROM teams').get();
  console.log(`\n✅ Total teams in database: ${teamCount.count}`);
  
} catch (error) {
  console.log('❌ Teams table error:', error.message);
}

// Look for specific teams that might be causing the issue
try {
  const deportes = db.prepare(`SELECT * FROM teams WHERE name LIKE '%Deportes%' OR name LIKE '%Temuko%'`).all();
  const saint = db.prepare(`SELECT * FROM teams WHERE name LIKE '%Saint%' OR name LIKE '%Luis%'`).all();
  
  console.log('\n🎯 SPECIFIC TEAM SEARCH:');
  console.log('Deportes/Temuko teams:', deportes.length > 0 ? deportes : 'Not found');
  console.log('Saint/Luis teams:', saint.length > 0 ? saint : 'Not found');
  
} catch (error) {
  console.log('\n❌ Specific team search error:', error.message);
}

// Check foreign key constraints on simulations table
try {
  const fkInfo = db.prepare(`PRAGMA foreign_key_list(simulations)`).all();
  console.log('\n🔗 FOREIGN KEY CONSTRAINTS:');
  fkInfo.forEach(fk => {
    console.log(`   ${fk.from} → ${fk.table}.${fk.to}`);
  });
  
} catch (error) {
  console.log('\n❌ Foreign key info error:', error.message);
}

db.close();
console.log('\n✅ Team ID check complete!');