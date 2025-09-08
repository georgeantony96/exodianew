const Database = require('better-sqlite3');
const path = require('path');

function checkDatabase(dbPath) {
  console.log(`\n🔍 Checking database: ${dbPath}`);
  
  try {
    const db = new Database(dbPath);
    
    // Check if database file exists and is accessible
    console.log('✅ Database file accessible');
    
    // Get all table names
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    console.log('📋 Current tables:');
    tables.forEach(table => console.log(`  - ${table.name}`));
    
    // Check for critical v2.0 tables
    const requiredTables = [
      'leagues',
      'teams', 
      'league_market_intelligence',
      'simulations',
      'historical_matches'
    ];
    
    console.log('\n🎯 Required tables check:');
    const missingTables = [];
    requiredTables.forEach(tableName => {
      const exists = tables.some(t => t.name === tableName);
      if (exists) {
        console.log(`✅ ${tableName} - EXISTS`);
      } else {
        console.log(`❌ ${tableName} - MISSING`);
        missingTables.push(tableName);
      }
    });
    
    // If league_market_intelligence exists, check its schema
    if (tables.some(t => t.name === 'league_market_intelligence')) {
      console.log('\n🔬 Checking league_market_intelligence schema:');
      const columns = db.prepare("PRAGMA table_info(league_market_intelligence)").all();
      console.log('Columns:');
      columns.forEach(col => console.log(`  - ${col.name} (${col.type})`));
      
      // Check for odds_avg column specifically
      const hasOddsAvg = columns.some(col => col.name === 'odds_avg');
      console.log(`odds_avg column: ${hasOddsAvg ? '✅ EXISTS' : '❌ MISSING'}`);
    }
    
    db.close();
    
    return {
      accessible: true,
      tablesCount: tables.length,
      missingTables: missingTables
    };
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    return {
      accessible: false,
      error: error.message
    };
  }
}

// Check both database locations
console.log('🚀 DATABASE SCHEMA VALIDATION');
console.log('=====================================');

const frontendDbPath = path.join(__dirname, 'exodia.db');
const databaseDbPath = path.join(__dirname, '..', 'database', 'exodia.db');

const frontendResult = checkDatabase(frontendDbPath);
const databaseResult = checkDatabase(databaseDbPath);

console.log('\n📊 SUMMARY:');
console.log('===========');
console.log(`Frontend DB: ${frontendResult.accessible ? '✅ OK' : '❌ FAILED'} (${frontendResult.tablesCount || 0} tables)`);
console.log(`Database DB: ${databaseResult.accessible ? '✅ OK' : '❌ FAILED'} (${databaseResult.tablesCount || 0} tables)`);

if (frontendResult.missingTables && frontendResult.missingTables.length > 0) {
  console.log(`\n⚠️  Frontend DB missing tables: ${frontendResult.missingTables.join(', ')}`);
}
if (databaseResult.missingTables && databaseResult.missingTables.length > 0) {
  console.log(`⚠️  Database DB missing tables: ${databaseResult.missingTables.join(', ')}`);
}