const Database = require('better-sqlite3');
const path = require('path');

function checkSim107Patterns() {
  const frontendDbPath = path.resolve('exodia.db');
  console.log(`🔍 Checking Patterns for Simulation 107...\n`);
  
  try {
    const db = new Database(frontendDbPath, { readonly: true });
    
    // Get all patterns for simulation 107
    const patterns = db.prepare(`
      SELECT 
        id,
        team_type,
        game_position,
        home_score_ft,
        away_score_ft,
        home_score_ht,
        away_score_ht,
        rich_fingerprint_combined,
        created_at
      FROM rich_historical_patterns 
      WHERE simulation_id = 107
      ORDER BY game_position, team_type
    `).all();
    
    if (patterns.length > 0) {
      console.log(`📊 Found ${patterns.length} patterns for Simulation 107:`);
      console.log(`Created: ${patterns[0].created_at}\n`);
      
      // Group by team type
      const homePatterns = patterns.filter(p => p.team_type === 'home');
      const awayPatterns = patterns.filter(p => p.team_type === 'away');
      
      console.log(`🏠 HOME TEAM PATTERNS (${homePatterns.length}):`);
      homePatterns.forEach(pattern => {
        console.log(`   Game ${pattern.game_position}: HT ${pattern.home_score_ht}-${pattern.away_score_ht} → FT ${pattern.home_score_ft}-${pattern.away_score_ft}`);
        console.log(`   Pattern: ${pattern.rich_fingerprint_combined}`);
        console.log('');
      });
      
      console.log(`✈️ AWAY TEAM PATTERNS (${awayPatterns.length}):`);
      awayPatterns.forEach(pattern => {
        console.log(`   Game ${pattern.game_position}: HT ${pattern.home_score_ht}-${pattern.away_score_ht} → FT ${pattern.home_score_ft}-${pattern.away_score_ft}`);
        console.log(`   Pattern: ${pattern.rich_fingerprint_combined}`);
        console.log('');
      });
      
      console.log(`ℹ️  Status: Historical data input completed, but prediction step not triggered yet.`);
      console.log(`💡 To see predictions, you need to run the pattern analysis step in the UI.`);
      
    } else {
      console.log(`❌ No patterns found for Simulation 107`);
    }
    
    db.close();
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

checkSim107Patterns();