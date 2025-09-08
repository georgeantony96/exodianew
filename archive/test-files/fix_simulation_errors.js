const Database = require('./frontend/node_modules/better-sqlite3');
const path = require('path');

const dbPath = path.resolve('./frontend/exodia.db');
const db = new Database(dbPath);

console.log('🔧 FIXING SIMULATION ERRORS...\n');

// 1. Add missing results_data column to simulations table
try {
  db.exec(`
    ALTER TABLE simulations 
    ADD COLUMN results_data TEXT
  `);
  console.log('✅ Added results_data column to simulations table');
} catch (error) {
  console.log('ℹ️ results_data column already exists or error:', error.message);
}

// 2. Add missing columns for simulation tracking
try {
  db.exec(`
    ALTER TABLE simulations 
    ADD COLUMN engine_version TEXT
  `);
  console.log('✅ Added engine_version column to simulations table');
} catch (error) {
  console.log('ℹ️ engine_version column already exists or error:', error.message);
}

try {
  db.exec(`
    ALTER TABLE simulations 
    ADD COLUMN processing_time_ms INTEGER
  `);
  console.log('✅ Added processing_time_ms column to simulations table');
} catch (error) {
  console.log('ℹ️ processing_time_ms column already exists or error:', error.message);
}

try {
  db.exec(`
    ALTER TABLE simulations 
    ADD COLUMN completed_at TIMESTAMP
  `);
  console.log('✅ Added completed_at column to simulations table');
} catch (error) {
  console.log('ℹ️ completed_at column already exists or error:', error.message);
}

// 3. Check current simulations table structure
try {
  const simulationsSchema = db.prepare(`PRAGMA table_info(simulations)`).all();
  console.log('\n📊 SIMULATIONS TABLE STRUCTURE:');
  simulationsSchema.forEach(col => {
    console.log(`   ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'nullable'})`);
  });
} catch (error) {
  console.log('❌ Error checking simulations schema:', error.message);
}

// 4. Verify pattern_learning_outcomes table structure
try {
  const patternSchema = db.prepare(`PRAGMA table_info(pattern_learning_outcomes)`).all();
  console.log('\n📊 PATTERN_LEARNING_OUTCOMES TABLE STRUCTURE:');
  patternSchema.forEach(col => {
    console.log(`   ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'nullable'})`);
  });
} catch (error) {
  console.log('❌ Error checking pattern learning schema:', error.message);
}

db.close();
console.log('\n✅ Database fixes applied!');