const Database = require('better-sqlite3');
const path = require('path');

function checkHistoricalMatches() {
  const dbPath = path.resolve('database/exodia.db');
  console.log(`🔍 Checking Historical Matches Data Input Status...\n`);
  
  try {
    const db = new Database(dbPath, { readonly: true });
    
    // Check historical_matches table
    const historicalCount = db.prepare('SELECT COUNT(*) as count FROM historical_matches').get();
    console.log(`📊 Historical Matches: ${historicalCount.count} records`);
    
    if (historicalCount.count > 0) {
      // Get recent historical matches
      const recentMatches = db.prepare(`
        SELECT id, home_team, away_team, home_score_ht, away_score_ht, 
               home_score_ft, away_score_ft, context_type, created_at 
        FROM historical_matches 
        ORDER BY created_at DESC 
        LIMIT 10
      `).all();
      
      console.log(`\n📋 Recent Historical Matches (Last ${Math.min(10, historicalCount.count)}):`);
      recentMatches.forEach((row, i) => {
        console.log(`${i+1}. ID ${row.id}: ${row.home_team} vs ${row.away_team}`);
        console.log(`   HT: ${row.home_score_ht}-${row.away_score_ht} | FT: ${row.home_score_ft}-${row.away_score_ft}`);
        console.log(`   Context: ${row.context_type} | Created: ${row.created_at}\n`);
      });
      
      // Check context types breakdown
      const contextBreakdown = db.prepare(`
        SELECT context_type, COUNT(*) as count 
        FROM historical_matches 
        GROUP BY context_type 
        ORDER BY count DESC
      `).all();
      
      console.log(`🔍 Context Types Breakdown:`);
      contextBreakdown.forEach(ctx => {
        console.log(`   ${ctx.context_type}: ${ctx.count} matches`);
      });
      
      // Check teams in historical matches
      const teamsUsed = db.prepare(`
        SELECT home_team as team FROM historical_matches 
        UNION 
        SELECT away_team as team FROM historical_matches 
        WHERE team != '' AND team IS NOT NULL
        ORDER BY team
      `).all();
      
      console.log(`\n📋 Teams Used in Historical Data: ${teamsUsed.length}`);
      teamsUsed.slice(0, 10).forEach((team, i) => {
        console.log(`   ${i+1}. ${team.team}`);
      });
      if (teamsUsed.length > 10) {
        console.log(`   ... and ${teamsUsed.length - 10} more teams`);
      }
    } else {
      console.log(`ℹ️  No historical matches found yet. This is normal if you're still inputting data.`);
    }
    
    // Also check rich_historical_patterns (Step 4 patterns)
    const patternCount = db.prepare('SELECT COUNT(*) as count FROM rich_historical_patterns').get();
    console.log(`\n📊 Rich Historical Patterns (Step 4): ${patternCount.count} records`);
    
    if (patternCount.count > 0) {
      console.log(`✅ Patterns have been generated! Step 4 completed for some matches.`);
    } else {
      console.log(`ℹ️  No patterns generated yet. Complete Step 4 after inputting historical data.`);
    }
    
    console.log(`\n📈 Progress Summary:`);
    console.log(`   Step 1-3: Historical Data Input - ${historicalCount.count} matches`);
    console.log(`   Step 4: Pattern Generation - ${patternCount.count} patterns`);
    
    db.close();
    
  } catch (error) {
    console.log(`❌ Error accessing database: ${error.message}`);
  }
}

checkHistoricalMatches();