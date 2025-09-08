const Database = require('./frontend/node_modules/better-sqlite3');
const path = require('path');

const dbPath = path.resolve('./frontend/exodia.db');
const db = new Database(dbPath);

console.log('🔧 CREATING MISSING TABLES FOR MULTI-ENGINE SYSTEM...\n');

// Create rich_historical_patterns table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rich_historical_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      simulation_id INTEGER,
      team_type TEXT,
      game_position INTEGER,
      home_score_ft INTEGER NOT NULL,
      away_score_ft INTEGER NOT NULL,
      home_score_ht INTEGER,
      away_score_ht INTEGER,
      rich_fingerprint_ft TEXT,
      rich_fingerprint_ht TEXT,
      rich_fingerprint_combined TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Created rich_historical_patterns table');
} catch (error) {
  console.log('❌ Rich historical patterns table error:', error.message);
}

// Create pattern_learning_outcomes table (if not exists)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pattern_learning_outcomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern_fingerprint TEXT NOT NULL,
      market_type TEXT NOT NULL,
      predicted_outcome REAL NOT NULL,
      actual_outcome REAL,
      confidence_level REAL NOT NULL,
      simulation_id INTEGER,
      prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      result_date TIMESTAMP
    )
  `);
  console.log('✅ Created pattern_learning_outcomes table');
} catch (error) {
  console.log('❌ Pattern learning outcomes table error:', error.message);
}

// Create adaptive_thresholds table with initial data (if not exists)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS adaptive_thresholds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern_type TEXT UNIQUE NOT NULL,
      current_penalty REAL NOT NULL,
      original_penalty REAL NOT NULL,
      total_predictions INTEGER DEFAULT 0,
      successful_predictions INTEGER DEFAULT 0,
      total_error REAL DEFAULT 0.0,
      avg_error REAL DEFAULT 0.0,
      recent_avg_error REAL DEFAULT 0.0,
      last_adjustment REAL DEFAULT 0.0,
      last_adjusted_at TIMESTAMP,
      adjustment_count INTEGER DEFAULT 0,
      learning_rate REAL DEFAULT 0.05,
      confidence_threshold REAL DEFAULT 0.7,
      min_penalty REAL DEFAULT -0.5,
      max_penalty REAL DEFAULT 0.5,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Insert initial threshold data
  const thresholds = [
    ['home_over_dominance', -0.25, -0.25],
    ['away_over_dominance', -0.25, -0.25], 
    ['home_unbeaten_streak', -0.18, -0.18],
    ['away_unbeaten_streak', -0.18, -0.18],
    ['h2h_over_pattern', -0.30, -0.30],
    ['h2h_under_pattern', 0.20, 0.20]
  ];
  
  const insertThreshold = db.prepare(`
    INSERT OR IGNORE INTO adaptive_thresholds 
    (pattern_type, current_penalty, original_penalty)
    VALUES (?, ?, ?)
  `);
  
  thresholds.forEach(([pattern_type, current_penalty, original_penalty]) => {
    insertThreshold.run(pattern_type, current_penalty, original_penalty);
  });
  
  console.log('✅ Created adaptive_thresholds table with initial data');
} catch (error) {
  console.log('❌ Adaptive thresholds table error:', error.message);
}

// Verify tables exist
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name IN ('rich_historical_patterns', 'pattern_learning_outcomes', 'adaptive_thresholds')
`).all();

console.log('\n✅ VERIFICATION:');
tables.forEach(table => {
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
  console.log(`   ${table.name}: ${count.count} rows`);
});

db.close();
console.log('\n🎉 Missing tables created successfully!');