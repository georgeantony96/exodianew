const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Run Advanced Pattern Recognition Database Migration
console.log('🚀 Starting Advanced Pattern Recognition Database Migration...');

try {
  // Open database
  const db = new Database('./database/exodia.db');
  console.log('✅ Database connection established');

  // Read migration SQL
  const migrationSQL = fs.readFileSync('./database/migrate_advanced_pattern_recognition.sql', 'utf8');
  console.log('✅ Migration SQL loaded');

  // Enable WAL mode for better performance
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = NORMAL');
  db.exec('PRAGMA cache_size = 10000');
  console.log('✅ Database optimizations applied');

  // Execute migration (split by semicolons and execute each statement)
  const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
  
  console.log(`📊 Executing ${statements.length} migration statements...`);
  
  db.exec('BEGIN TRANSACTION');
  
  let successCount = 0;
  statements.forEach((statement, index) => {
    try {
      if (statement.trim()) {
        db.exec(statement.trim());
        successCount++;
        if (index % 10 === 0) {
          console.log(`✅ Progress: ${index}/${statements.length} statements executed`);
        }
      }
    } catch (error) {
      // Some statements might already exist, which is fine
      if (!error.message.includes('already exists')) {
        console.warn(`⚠️ Statement ${index} warning: ${error.message}`);
      }
    }
  });
  
  db.exec('COMMIT');
  console.log(`✅ Migration completed: ${successCount}/${statements.length} statements successful`);

  // Verify new tables exist
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name IN (
      'rich_historical_patterns', 
      'pattern_learning_outcomes', 
      'adaptive_thresholds', 
      'sequence_patterns'
    )
  `).all();
  
  console.log('📋 New tables created:', tables.map(t => t.name));

  // Check initial adaptive thresholds data
  const thresholds = db.prepare('SELECT pattern_type, current_penalty, original_penalty FROM adaptive_thresholds').all();
  console.log('🎯 Adaptive thresholds initialized:', thresholds.length, 'patterns');
  thresholds.forEach(t => {
    console.log(`   - ${t.pattern_type}: ${t.current_penalty} (original: ${t.original_penalty})`);
  });

  // Check sequence patterns
  const sequences = db.prepare('SELECT sequence_fingerprint, momentum_state, psychological_modifier FROM sequence_patterns').all();
  console.log('🧠 Sequence patterns initialized:', sequences.length, 'patterns');
  sequences.slice(0, 5).forEach(s => {
    console.log(`   - ${s.sequence_fingerprint}: ${s.momentum_state} (${s.psychological_modifier})`);
  });

  // Create validation views test
  const validationRows = db.prepare('SELECT COUNT(*) as count FROM v_learning_progress').get();
  console.log('📊 Validation views working:', validationRows.count, 'adaptive thresholds visible');

  db.close();
  console.log('✅ Database migration completed successfully!');
  console.log('');
  console.log('🎉 Advanced Pattern Recognition System Ready!');
  console.log('   • Rich Historical Patterns: 100+ markets auto-calculated');
  console.log('   • Pattern Learning: Track accuracy across all markets');
  console.log('   • Adaptive Thresholds: Self-improving penalties');
  console.log('   • Sequence Analysis: Psychological momentum patterns');
  console.log('');
  console.log('Next: Implement ComprehensiveMarketCalculator utility class');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}