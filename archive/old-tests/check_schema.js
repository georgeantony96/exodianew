const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'exodia.db');
const db = new Database(dbPath);

console.log('🔍 CHECKING ACTUAL DATABASE SCHEMA\n');

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();

tables.forEach(table => {
  console.log(`\n📋 TABLE: ${table.name}`);
  console.log('=' .repeat(40));
  
  const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
  columns.forEach(col => {
    const nullable = col.notnull ? 'NOT NULL' : 'NULLABLE';
    const defaultVal = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
    const pk = col.pk ? ' [PRIMARY KEY]' : '';
    console.log(`  ${col.name} (${col.type}) ${nullable}${defaultVal}${pk}`);
  });
});

db.close();