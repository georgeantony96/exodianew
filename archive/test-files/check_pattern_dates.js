const Database = require('./frontend/node_modules/better-sqlite3');
const path = require('path');

const dbPath = path.resolve('./frontend/exodia.db');
const db = new Database(dbPath);

console.log('🔍 CHECKING PATTERN CREATION DATES...\n');

// Check pattern creation dates and simulation IDs
try {
  const patternStats = db.prepare(`
    SELECT 
      simulation_id,
      MIN(created_at) as first_pattern,
      MAX(created_at) as last_pattern,
      COUNT(*) as pattern_count
    FROM rich_historical_patterns 
    GROUP BY simulation_id
    ORDER BY simulation_id DESC
    LIMIT 10
  `).all();
  
  console.log('📊 RECENT SIMULATION PATTERNS:');
  patternStats.forEach((stat, index) => {
    console.log(`${index + 1}. Simulation ${stat.simulation_id}:`);
    console.log(`   Patterns: ${stat.pattern_count}`);
    console.log(`   Created: ${stat.first_pattern}`);
  });

  // Check current simulation records
  const simulations = db.prepare(`
    SELECT id, created_at, completed_at, engine_version
    FROM simulations 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();
  
  console.log('\n🎯 RECENT SIMULATIONS:');
  simulations.forEach((sim, index) => {
    console.log(`${index + 1}. ID: ${sim.id} - ${sim.created_at}`);
    console.log(`   Engine: ${sim.engine_version || 'unknown'}`);
    console.log(`   Status: ${sim.completed_at ? 'Completed' : 'Incomplete'}`);
  });

  // Check if patterns from today's simulation exist
  const todayPatterns = db.prepare(`
    SELECT COUNT(*) as count
    FROM rich_historical_patterns 
    WHERE simulation_id = 20
  `).get();
  
  console.log(`\n✅ Today's simulation (ID: 20) generated: ${todayPatterns.count} patterns`);

} catch (error) {
  console.log('❌ Error:', error.message);
}

db.close();
console.log('\n✅ Pattern date check complete!');