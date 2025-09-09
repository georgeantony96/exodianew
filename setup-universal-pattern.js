/**
 * EXODIA FINAL - Universal Pattern Setup Script
 * Creates the Universal Pattern league with default Home/Away teams for fast input
 */

const Database = require('better-sqlite3');
const path = require('path');

async function setupUniversalPattern() {
  console.log('🚀 Setting up Universal Pattern league for fast data input...');
  
  const dbPath = path.join(__dirname, 'database', 'exodia.db');
  const db = new Database(dbPath);
  
  try {
    // Enable foreign keys
    db.exec('PRAGMA foreign_keys = ON');
    
    // 1. Create Universal Pattern League
    console.log('📊 Creating Universal Pattern league...');
    const insertLeague = db.prepare(`
      INSERT OR REPLACE INTO leagues (
        name, country, season, intelligence_enabled, avg_goals_home, avg_goals_away,
        over25_frequency, market_efficiency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const leagueResult = insertLeague.run(
      'Universal Pattern',
      'Global',
      '2025-26',
      1, // intelligence_enabled = true
      1.5, // avg_goals_home
      1.2, // avg_goals_away
      0.55, // over25_frequency (55% baseline)
      0.85 // market_efficiency (universal patterns)
    );
    
    const universalLeagueId = leagueResult.lastInsertRowid;
    console.log(`✅ Created Universal Pattern league with ID: ${universalLeagueId}`);
    
    // 2. Create Default Teams
    console.log('⚽ Creating default Home/Away teams...');
    const insertTeam = db.prepare(`
      INSERT OR REPLACE INTO teams (name, league_id) VALUES (?, ?)
    `);
    
    const homeTeamResult = insertTeam.run('Home Team', universalLeagueId);
    const awayTeamResult = insertTeam.run('Away Team', universalLeagueId);
    
    const homeTeamId = homeTeamResult.lastInsertRowid;
    const awayTeamId = awayTeamResult.lastInsertRowid;
    
    console.log(`✅ Created Home Team with ID: ${homeTeamId}`);
    console.log(`✅ Created Away Team with ID: ${awayTeamId}`);
    
    // 3. Initialize team performance records
    console.log('📈 Initializing team performance records...');
    const insertHomePerf = db.prepare(`
      INSERT OR REPLACE INTO team_home_performance (
        team_id, goals_for_avg, goals_against_avg, matches_played,
        last_6_form, streak_type, streak_length
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertAwayPerf = db.prepare(`
      INSERT OR REPLACE INTO team_away_performance (
        team_id, goals_for_avg, goals_against_avg, matches_played,
        last_6_form, streak_type, streak_length
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Initialize with neutral starting values
    insertHomePerf.run(homeTeamId, 1.5, 1.2, 0, '', null, 0);
    insertAwayPerf.run(awayTeamId, 1.2, 1.5, 0, '', null, 0);
    
    console.log('✅ Initialized performance records');
    
    // 4. Create quick access view for pattern input
    console.log('🎯 Creating pattern input helper view...');
    db.exec(`
      CREATE VIEW IF NOT EXISTS universal_pattern_setup AS
      SELECT 
        l.id as league_id,
        l.name as league_name,
        h.id as home_team_id,
        h.name as home_team_name,
        a.id as away_team_id,
        a.name as away_team_name
      FROM leagues l
      CROSS JOIN teams h ON h.name = 'Home Team' AND h.league_id = l.id
      CROSS JOIN teams a ON a.name = 'Away Team' AND a.league_id = l.id
      WHERE l.name = 'Universal Pattern'
    `);
    
    // 5. Verify setup
    console.log('🔍 Verifying setup...');
    const verification = db.prepare(`
      SELECT * FROM universal_pattern_setup
    `).get();
    
    if (verification) {
      console.log('✅ Universal Pattern setup verified:');
      console.log(`   League: ${verification.league_name} (ID: ${verification.league_id})`);
      console.log(`   Home Team: ${verification.home_team_name} (ID: ${verification.home_team_id})`);
      console.log(`   Away Team: ${verification.away_team_name} (ID: ${verification.away_team_id})`);
    } else {
      throw new Error('Setup verification failed');
    }
    
    console.log('\n🎉 Universal Pattern league setup complete!');
    console.log('💡 Ready for lightning-fast pattern input:');
    console.log('   1. League: Auto-selected "Universal Pattern"');
    console.log('   2. Teams: Pre-filled "Home Team" vs "Away Team"');
    console.log('   3. Input: Only FT scores needed (2-1, 0-0, 3-2, etc.)');
    console.log('   4. Speed: 5-10 seconds per match vs 30 seconds automation\n');
    
  } catch (error) {
    console.error('❌ Error setting up Universal Pattern:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupUniversalPattern()
    .then(() => {
      console.log('🚀 Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupUniversalPattern };