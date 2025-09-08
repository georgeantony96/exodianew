const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'exodia.db');
const db = new Database(dbPath);

console.log('📊 CURRENT DATABASE DATA\n');

// Check leagues
const leagues = db.prepare('SELECT * FROM leagues').all();
console.log(`🏆 LEAGUES (${leagues.length}):`);
leagues.forEach(league => {
  console.log(`  ${league.id}. ${league.name} (${league.country}) - Intelligence: ${league.intelligence_enabled ? '✅' : '❌'}`);
});

// Check teams
const teams = db.prepare(`
  SELECT t.*, l.name as league_name 
  FROM teams t 
  JOIN leagues l ON t.league_id = l.id 
  ORDER BY t.league_id, t.name
`).all();
console.log(`\n👥 TEAMS (${teams.length}):`);
teams.forEach(team => {
  console.log(`  ${team.id}. ${team.name} (${team.league_name}) - Priority: ${team.auto_suggest_priority}`);
});

// Check intelligence data
const intelligence = db.prepare(`
  SELECT lmi.*, l.name as league_name 
  FROM league_market_intelligence lmi 
  JOIN leagues l ON lmi.league_id = l.id
`).all();
console.log(`\n🧠 INTELLIGENCE DATA (${intelligence.length}):`);
intelligence.forEach(intel => {
  console.log(`  ${intel.league_name} ${intel.market_type}: Avg odds ${intel.avg_odds}, Frequency ${intel.opportunity_frequency}, Hit rate ${intel.hit_rate}`);
});

console.log('\n🎯 READY STATUS:');
console.log(`   Leagues: ${leagues.length > 0 ? '✅' : '❌'} ${leagues.length} available`);
console.log(`   Teams: ${teams.length > 0 ? '✅' : '❌'} ${teams.length} available`);
console.log(`   Intelligence: ${intelligence.length > 0 ? '✅' : '❌'} ${intelligence.length} patterns`);

if (leagues.length > 0 && teams.length > 0) {
  console.log('\n🚀 SYSTEM READY! Go to http://localhost:3000');
} else {
  console.log('\n⚠️  Missing data - need to add leagues/teams first');
}

db.close();