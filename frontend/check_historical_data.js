const Database = require('better-sqlite3');
const path = require('path');

function checkPatternGeneration() {
  const dbPath = path.resolve('..', 'database', 'exodia.db');
  console.log(`🔍 Checking Pattern Generation Status (Your Real Match Data)...\n`);
  
  try {
    const db = new Database(dbPath, { readonly: true });
    
    // Check rich_historical_patterns - this is where your patterns are stored
    const patternCount = db.prepare('SELECT COUNT(*) as count FROM rich_historical_patterns').get();
    console.log(`📊 Generated Patterns: ${patternCount.count} records`);
    
    if (patternCount.count > 0) {
      // Get recent patterns with details
      const recentPatterns = db.prepare(`
        SELECT id, home_team, away_team, fingerprint, created_at 
        FROM rich_historical_patterns 
        ORDER BY created_at DESC 
        LIMIT 15
      `).all();
      
      console.log(`\n📋 Recent Patterns (Last ${Math.min(15, patternCount.count)}):`);
      recentPatterns.forEach((row, i) => {
        const shortFingerprint = row.fingerprint.length > 100 ? row.fingerprint.substring(0, 100) + '...' : row.fingerprint;
        console.log(`${i+1}. ID ${row.id}: ${row.home_team} vs ${row.away_team}`);
        console.log(`   Fingerprint: ${shortFingerprint}`);
        console.log(`   Created: ${row.created_at}\n`);
      });
      
      // Check unique teams used
      const uniqueTeams = db.prepare(`
        SELECT home_team as team FROM rich_historical_patterns 
        UNION 
        SELECT away_team as team FROM rich_historical_patterns 
        WHERE team != '' AND team IS NOT NULL
        ORDER BY team
      `).all();
      
      console.log(`🔍 Data Quality Check:`);
      console.log(`   Unique teams in patterns: ${uniqueTeams.length}`);
      uniqueTeams.slice(0, 10).forEach((team, i) => {
        console.log(`     ${i+1}. ${team.team}`);
      });
      if (uniqueTeams.length > 10) {
        console.log(`     ... and ${uniqueTeams.length - 10} more teams`);
      }
      
      // Check date range
      const dateRange = db.prepare("SELECT MIN(created_at) as oldest, MAX(created_at) as newest FROM rich_historical_patterns").get();
      console.log(`\n   Pattern date range: ${dateRange.oldest} to ${dateRange.newest}`);
      
      // Check for valid fingerprints
      const validPatterns = db.prepare("SELECT COUNT(*) as count FROM rich_historical_patterns WHERE fingerprint IS NOT NULL AND fingerprint != ''").get();
      console.log(`   Valid fingerprints: ${validPatterns.count}/${patternCount.count}`);
      
    } else {
      console.log(`❌ No patterns found! This suggests data may not be saving to the main database.`);
      console.log(`   Let me check the frontend database as well...`);
      
      // Check frontend database
      const frontendDbPath = path.resolve('exodia.db');
      try {
        const frontendDb = new Database(frontendDbPath, { readonly: true });
        const frontendPatterns = frontendDb.prepare('SELECT COUNT(*) as count FROM rich_historical_patterns').get();
        console.log(`✅ Frontend DB patterns: ${frontendPatterns.count} records`);
        
        if (frontendPatterns.count > 0) {
          // Get recent patterns from frontend DB
          const recentPatterns = frontendDb.prepare(`
            SELECT id, home_team, away_team, fingerprint, created_at 
            FROM rich_historical_patterns 
            ORDER BY created_at DESC 
            LIMIT 10
          `).all();
          
          console.log(`\n📋 Recent Patterns from Frontend DB (Last 10):`);
          recentPatterns.forEach((row, i) => {
            const shortFingerprint = row.fingerprint.length > 80 ? row.fingerprint.substring(0, 80) + '...' : row.fingerprint;
            console.log(`${i+1}. ID ${row.id}: ${row.home_team} vs ${row.away_team}`);
            console.log(`   Fingerprint: ${shortFingerprint}`);
            console.log(`   Created: ${row.created_at}\n`);
          });
          
          // Check unique teams used
          const uniqueTeams = frontendDb.prepare(`
            SELECT home_team as team FROM rich_historical_patterns 
            UNION 
            SELECT away_team as team FROM rich_historical_patterns 
            WHERE team != '' AND team IS NOT NULL
            ORDER BY team
          `).all();
          
          console.log(`🔍 Pattern Data Summary:`);
          console.log(`   Total patterns: ${frontendPatterns.count}`);
          console.log(`   Unique teams: ${uniqueTeams.length}`);
          
          // Check date range
          const dateRange = frontendDb.prepare("SELECT MIN(created_at) as oldest, MAX(created_at) as newest FROM rich_historical_patterns").get();
          console.log(`   Date range: ${dateRange.oldest} to ${dateRange.newest}`);
          
          // Check for valid fingerprints
          const validPatterns = frontendDb.prepare("SELECT COUNT(*) as count FROM rich_historical_patterns WHERE fingerprint IS NOT NULL AND fingerprint != ''").get();
          console.log(`   Valid fingerprints: ${validPatterns.count}/${frontendPatterns.count}`);
        }
        
        frontendDb.close();
      } catch (err) {
        console.log(`   Frontend DB check failed: ${err.message}`);
      }
    }
    
    db.close();
    
  } catch (error) {
    console.log(`❌ Error accessing database: ${error.message}`);
  }
}

checkPatternGeneration();