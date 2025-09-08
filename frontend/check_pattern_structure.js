const Database = require('better-sqlite3');
const path = require('path');

function checkPatternStructure() {
  const frontendDbPath = path.resolve('exodia.db');
  console.log(`🔍 Checking Pattern Table Structure and Data...\n`);
  
  try {
    const db = new Database(frontendDbPath, { readonly: true });
    
    // Get table structure
    const tableInfo = db.prepare("PRAGMA table_info(rich_historical_patterns)").all();
    console.log(`📋 Table Structure:`);
    tableInfo.forEach(col => {
      console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Get count
    const patternCount = db.prepare('SELECT COUNT(*) as count FROM rich_historical_patterns').get();
    console.log(`\n📊 Total Patterns: ${patternCount.count} records`);
    
    if (patternCount.count > 0) {
      // Get sample data with actual column names
      const sampleData = db.prepare(`SELECT * FROM rich_historical_patterns ORDER BY id DESC LIMIT 5`).all();
      
      console.log(`\n📋 Recent Patterns (Last 5):`);
      sampleData.forEach((row, i) => {
        console.log(`${i+1}. Pattern ID ${row.id}:`);
        Object.keys(row).forEach(key => {
          if (key === 'fingerprint' && row[key] && row[key].length > 100) {
            console.log(`   ${key}: ${row[key].substring(0, 100)}...`);
          } else {
            console.log(`   ${key}: ${row[key]}`);
          }
        });
        console.log('');
      });
      
      // Check date range if created_at exists
      if (tableInfo.find(col => col.name === 'created_at')) {
        const dateRange = db.prepare("SELECT MIN(created_at) as oldest, MAX(created_at) as newest FROM rich_historical_patterns").get();
        console.log(`📅 Date Range: ${dateRange.oldest} to ${dateRange.newest}`);
      }
      
      // Check for valid fingerprints if fingerprint column exists
      if (tableInfo.find(col => col.name === 'fingerprint')) {
        const validPatterns = db.prepare("SELECT COUNT(*) as count FROM rich_historical_patterns WHERE fingerprint IS NOT NULL AND fingerprint != ''").get();
        console.log(`🔍 Valid fingerprints: ${validPatterns.count}/${patternCount.count}`);
      }
    }
    
    db.close();
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

checkPatternStructure();