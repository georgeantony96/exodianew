const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/exodia.db');
const db = new sqlite3.Database(dbPath);

const popularLeagues = [
  { name: 'Premier League', country: 'England', season: '2024-25', efficiency: 0.95 },
  { name: 'La Liga', country: 'Spain', season: '2024-25', efficiency: 0.92 },
  { name: 'Serie A', country: 'Italy', season: '2024-25', efficiency: 0.90 },
  { name: 'Bundesliga', country: 'Germany', season: '2024-25', efficiency: 0.88 },
  { name: 'Ligue 1', country: 'France', season: '2024-25', efficiency: 0.85 },
  { name: 'Championship', country: 'England', season: '2024-25', efficiency: 0.75 },
  { name: 'Primera División', country: 'Argentina', season: '2024', efficiency: 0.65 },
  { name: 'Brasileirão', country: 'Brazil', season: '2024', efficiency: 0.70 },
  { name: 'Eredivisie', country: 'Netherlands', season: '2024-25', efficiency: 0.80 },
  { name: 'Primeira Liga', country: 'Portugal', season: '2024-25', efficiency: 0.78 }
];

const markets = ['1x2', 'ou25', 'btts', 'ou35'];

function insertLeagues() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      let completed = 0;
      const total = popularLeagues.length;
      
      popularLeagues.forEach((league, index) => {
        // Insert league
        db.run(`
          INSERT OR IGNORE INTO leagues (
            name, country, avg_goals_home, avg_goals_away, over25_frequency,
            market_efficiency, home_advantage_factor, created_at, last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          league.name,
          league.country,
          1.5, // Default home goals
          1.2, // Default away goals
          league.efficiency < 0.8 ? 0.75 : 0.55, // Higher O2.5 frequency for less efficient leagues
          league.efficiency,
          0.20 // Default home advantage
        ], function(err) {
          if (err) {
            console.error('Error inserting league:', err);
            return;
          }
          
          const leagueId = this.lastID;
          if (leagueId) {
            // Insert market intelligence for this league
            let marketCompleted = 0;
            const totalMarkets = markets.length;
            
            markets.forEach(market => {
              const marketOptions = market === '1x2' ? ['home', 'draw', 'away'] : 
                                   market.startsWith('ou') ? ['over', 'under'] :
                                   market === 'btts' ? ['yes', 'no'] : ['yes', 'no'];
              
              marketOptions.forEach(option => {
                // Calculate opportunity frequency based on league efficiency
                const baseOpportunity = league.efficiency > 0.9 ? 0.15 : 
                                       league.efficiency > 0.8 ? 0.25 : 0.35;
                
                // Argentina gets special treatment for O2.5
                const opportunityFreq = league.name === 'Primera División' && market === 'ou25' && option === 'over' ? 
                                       0.73 : baseOpportunity;
                
                const avgOdds = market === '1x2' ? (option === 'home' ? 2.5 : option === 'draw' ? 3.2 : 2.8) :
                               market === 'ou25' ? (option === 'over' ? 1.9 : 1.9) :
                               market === 'btts' ? (option === 'yes' ? 1.8 : 2.0) :
                               2.0;
                
                db.run(`
                  INSERT OR IGNORE INTO league_market_intelligence (
                    league_id, market_type, market_option,
                    odds_count, odds_sum, odds_avg, odds_min, odds_max,
                    value_opportunities, avg_edge_when_value, hit_rate,
                    market_efficiency, opportunity_frequency, seasonal_pattern,
                    trend_direction, first_seen, last_updated
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                `, [
                  leagueId, market, option,
                  Math.floor(Math.random() * 50) + 10, // Random count 10-60
                  avgOdds * (Math.floor(Math.random() * 50) + 10), // Sum for average
                  avgOdds,
                  avgOdds * 0.8, // Min odds
                  avgOdds * 1.3, // Max odds
                  Math.floor(opportunityFreq * 20), // Value opportunities
                  opportunityFreq > 0.5 ? 0.12 : 0.08, // Avg edge when value
                  0.55 + (Math.random() * 0.2), // Hit rate 55-75%
                  league.efficiency,
                  opportunityFreq,
                  'unknown',
                  'stable'
                ]);
              });
              
              marketCompleted++;
              if (marketCompleted === totalMarkets) {
                completed++;
                console.log(`✅ Added ${league.name} (${league.country}) with market intelligence`);
                
                if (completed === total) {
                  db.run('COMMIT', (err) => {
                    if (err) {
                      console.error('Error committing transaction:', err);
                      reject(err);
                    } else {
                      console.log(`\n🎉 Successfully populated ${total} leagues with market intelligence!`);
                      resolve();
                    }
                  });
                }
              }
            });
          } else {
            console.log(`ℹ️ League ${league.name} already exists`);
            completed++;
            if (completed === total) {
              db.run('COMMIT', () => {
                console.log('\n✅ Database population completed!');
                resolve();
              });
            }
          }
        });
      });
    });
  });
}

// Run the population
insertLeagues()
  .then(() => {
    console.log('\n📊 Database Statistics:');
    
    db.get('SELECT COUNT(*) as count FROM leagues', (err, row) => {
      if (!err) {
        console.log(`   Leagues: ${row.count}`);
      }
    });
    
    db.get('SELECT COUNT(*) as count FROM league_market_intelligence', (err, row) => {
      if (!err) {
        console.log(`   Market Intelligence Records: ${row.count}`);
      }
    });
    
    console.log('\n🚀 Your EXODIA FINAL app is now ready with league data!');
    console.log('   You can now select leagues and proceed with simulations.');
    
    db.close();
  })
  .catch((err) => {
    console.error('❌ Error populating database:', err);
    db.close();
  });