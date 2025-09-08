const Database = require('./frontend/node_modules/better-sqlite3');
const path = require('path');

const dbPath = path.resolve('./database/exodia.db');
const db = new Database(dbPath);

console.log('🔍 DEBUGGING DATABASE SCHEMA AND DATA...\n');

// Check if tables exist
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
`).all();

console.log('📋 EXISTING TABLES:');
tables.forEach(table => {
  console.log(`   - ${table.name}`);
});

// Check simulations table schema
try {
  const simulationsSchema = db.prepare(`PRAGMA table_info(simulations)`).all();
  console.log('\n🏗️ SIMULATIONS TABLE SCHEMA:');
  simulationsSchema.forEach(col => {
    console.log(`   ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'nullable'})`);
  });
} catch (error) {
  console.log('❌ Simulations table schema error:', error.message);
}

// Check rich_historical_patterns table
try {
  const richPatternsSchema = db.prepare(`PRAGMA table_info(rich_historical_patterns)`).all();
  console.log('\n📊 RICH_HISTORICAL_PATTERNS TABLE SCHEMA:');
  richPatternsSchema.forEach(col => {
    console.log(`   ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'nullable'})`);
  });
  
  const patternCount = db.prepare('SELECT COUNT(*) as count FROM rich_historical_patterns').get();
  console.log(`\n✅ Rich Historical Patterns: ${patternCount.count} records found`);
  
} catch (error) {
  console.log('\n❌ Rich historical patterns error:', error.message);
}

// Check simulations table data with correct column names
try {
  const recentSims = db.prepare(`
    SELECT * FROM simulations 
    ORDER BY created_at DESC 
    LIMIT 3
  `).all();
  
  console.log('\n🎯 RECENT SIMULATIONS:');
  recentSims.forEach((sim, index) => {
    console.log(`${index + 1}. Simulation Details:`, {
      id: sim.id,
      columns: Object.keys(sim),
      created_at: sim.created_at
    });
  });
} catch (error) {
  console.log('\n❌ Recent simulations error:', error.message);
}

// Check if we have any historical data being processed
try {
  const allTables = ['simulations', 'rich_historical_patterns', 'adaptive_thresholds', 'pattern_learning_outcomes'];
  
  console.log('\n📈 TABLE ROW COUNTS:');
  allTables.forEach(tableName => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`   ${tableName}: ${count.count} rows`);
    } catch (err) {
      console.log(`   ${tableName}: ERROR - ${err.message}`);
    }
  });
  
} catch (error) {
  console.log('\n❌ Table counts error:', error.message);
}

db.close();
console.log('\n✅ Database debug complete!');