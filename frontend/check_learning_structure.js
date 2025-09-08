const Database = require('better-sqlite3');
const path = require('path');

function checkLearningStructure() {
  const frontendDbPath = path.resolve('exodia.db');
  console.log(`📊 Checking Learning Outcomes Structure...\n`);
  
  try {
    const db = new Database(frontendDbPath, { readonly: true });
    
    // Get structure of pattern_learning_outcomes table
    const tableInfo = db.prepare("PRAGMA table_info(pattern_learning_outcomes)").all();
    console.log(`📋 Pattern Learning Outcomes Structure:`);
    tableInfo.forEach(col => {
      console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`);
    });
    
    // Get sample data
    const sampleData = db.prepare(`SELECT * FROM pattern_learning_outcomes ORDER BY id DESC LIMIT 5`).all();
    console.log(`\n📋 Sample Learning Outcomes:`);
    sampleData.forEach((row, i) => {
      console.log(`${i+1}. Learning Outcome ID ${row.id}:`);
      Object.keys(row).forEach(key => {
        console.log(`   ${key}: ${row[key]}`);
      });
      console.log('');
    });
    
    // Check total count and basic stats
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM pattern_learning_outcomes').get();
    console.log(`📊 Total Learning Outcomes: ${totalCount.count}`);
    
    // Check if there's any accuracy tracking
    if (tableInfo.find(col => col.name.includes('correct') || col.name.includes('accuracy'))) {
      console.log(`✅ Accuracy tracking columns found`);
    } else {
      console.log(`ℹ️  No explicit accuracy columns found`);
    }
    
    db.close();
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

checkLearningStructure();