const Database = require('./frontend/node_modules/better-sqlite3');
const { comprehensiveMarketCalculator } = require('./frontend/src/utils/comprehensive-market-calculator.ts');
const path = require('path');
const fs = require('fs');

console.log('📥 IMPORTING REAL MATCH DATA FOR PATTERN RECOGNITION...\n');

const dbPath = path.resolve('./frontend/exodia.db');
const db = new Database(dbPath);

/**
 * Import matches from text file and generate rich fingerprints
 * Expected format in real_matches.txt:
 * 
 * Match 1:
 * Home Team vs Away Team
 * HT: 1-0, FT: 2-1
 * Date: 2024-01-15
 * 
 * Match 2:
 * ...
 */

function importMatchesFromFile(filePath) {
  try {
    console.log(`📖 Reading matches from: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = parseMatchData(content);
    
    console.log(`✅ Parsed ${matches.length} matches`);
    return matches;
  } catch (error) {
    console.error('❌ Error reading file:', error.message);
    return [];
  }
}

function parseMatchData(content) {
  const matches = [];
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  let currentMatch = {};
  
  for (const line of lines) {
    if (line.startsWith('Match ')) {
      // Start new match
      if (currentMatch.homeTeam) {
        matches.push(currentMatch);
      }
      currentMatch = {};
    } else if (line.includes(' vs ')) {
      // Team names
      const [homeTeam, awayTeam] = line.split(' vs ');
      currentMatch.homeTeam = homeTeam.trim();
      currentMatch.awayTeam = awayTeam.trim();
    } else if (line.startsWith('HT:') && line.includes('FT:')) {
      // Scores: HT: 1-0, FT: 2-1
      const htMatch = line.match(/HT:\s*(\d+)-(\d+)/);
      const ftMatch = line.match(/FT:\s*(\d+)-(\d+)/);
      
      if (htMatch && ftMatch) {
        currentMatch.home_score_ht = parseInt(htMatch[1]);
        currentMatch.away_score_ht = parseInt(htMatch[2]);
        currentMatch.home_score_ft = parseInt(ftMatch[1]);
        currentMatch.away_score_ft = parseInt(ftMatch[2]);
      }
    } else if (line.startsWith('Date:')) {
      // Date
      currentMatch.date = line.replace('Date:', '').trim();
    }
  }
  
  // Don't forget the last match
  if (currentMatch.homeTeam) {
    matches.push(currentMatch);
  }
  
  return matches.filter(match => 
    match.homeTeam && match.awayTeam && 
    typeof match.home_score_ft === 'number' && 
    typeof match.away_score_ft === 'number'
  );
}

function storeMatchesWithFingerprints(matches) {
  console.log('\n🔧 Generating rich fingerprints and storing matches...\n');
  
  // Clear existing patterns
  db.exec('DELETE FROM rich_historical_patterns');
  console.log('✅ Cleared existing patterns');
  
  let totalStored = 0;
  const simulationId = 999; // Special ID for core dataset
  
  matches.forEach((match, index) => {
    try {
      // Calculate comprehensive market data for fingerprint
      const marketData = comprehensiveMarketCalculator.calculateCompleteMarkets(
        match.home_score_ft,
        match.away_score_ft,
        match.home_score_ht || 0,
        match.away_score_ht || 0
      );
      
      // Store as H2H pattern (most important for pattern matching)
      db.prepare(`
        INSERT INTO rich_historical_patterns (
          simulation_id, team_type, game_position,
          home_score_ft, away_score_ft, home_score_ht, away_score_ht,
          rich_fingerprint_combined, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        simulationId,
        'h2h',
        index + 1,
        match.home_score_ft,
        match.away_score_ft,
        match.home_score_ht || 0,
        match.away_score_ht || 0,
        marketData.rich_fingerprint_combined,
        new Date().toISOString()
      );
      
      console.log(`${index + 1}. ${match.homeTeam} vs ${match.awayTeam}`);
      console.log(`   Score: ${match.home_score_ft}-${match.away_score_ft} (HT: ${match.home_score_ht || 0}-${match.away_score_ht || 0})`);
      console.log(`   Fingerprint: ${marketData.rich_fingerprint_combined}`);
      console.log(`   Date: ${match.date || 'Unknown'}\n`);
      
      totalStored++;
      
    } catch (error) {
      console.error(`❌ Error processing match ${index + 1}:`, error.message);
    }
  });
  
  return totalStored;
}

// Create sample file if it doesn't exist
function createSampleFile() {
  const samplePath = './real_matches.txt';
  
  if (!fs.existsSync(samplePath)) {
    const sampleContent = `Match 1:
Manchester City vs Liverpool
HT: 1-0, FT: 2-1
Date: 2024-01-15

Match 2:
Arsenal vs Chelsea
HT: 0-1, FT: 1-2
Date: 2024-01-20

Match 3:
Barcelona vs Real Madrid
HT: 2-1, FT: 3-2
Date: 2024-01-25

Match 4:
Bayern Munich vs Dortmund
HT: 0-0, FT: 1-1
Date: 2024-01-30

Match 5:
PSG vs Marseille
HT: 1-1, FT: 2-2
Date: 2024-02-05

[Add your real match data here following the same format]
`;
    
    fs.writeFileSync(samplePath, sampleContent);
    console.log(`📝 Created sample file: ${samplePath}`);
    console.log('📋 Please edit this file with your real match data and run the script again.\n');
    return false;
  }
  
  return true;
}

// Main execution
async function main() {
  // Check if file exists, create sample if not
  if (!createSampleFile()) {
    return;
  }
  
  // Import matches
  const matches = importMatchesFromFile('./real_matches.txt');
  
  if (matches.length === 0) {
    console.log('❌ No valid matches found in file');
    return;
  }
  
  // Store matches with fingerprints
  const storedCount = storeMatchesWithFingerprints(matches);
  
  // Verify storage
  const verifyCount = db.prepare('SELECT COUNT(*) as count FROM rich_historical_patterns').get();
  
  console.log('\n🎉 IMPORT COMPLETE!');
  console.log(`✅ Processed: ${matches.length} matches`);
  console.log(`✅ Stored: ${storedCount} rich patterns`);
  console.log(`✅ Database contains: ${verifyCount.count} total patterns`);
  console.log('\n🧠 Your pattern recognition system now has real historical data!');
  console.log('🎯 Run simulations to test pattern matching against this baseline.');
}

// Handle the comprehensive market calculator import issue
try {
  main();
} catch (error) {
  console.error('❌ Import error:', error.message);
  console.log('\n📝 Please provide your match data in the following format in real_matches.txt:');
  console.log(`
Match 1:
Team A vs Team B
HT: 1-0, FT: 2-1
Date: 2024-01-15

Match 2:
Team C vs Team D
HT: 0-0, FT: 1-1
Date: 2024-01-20
  `);
}

db.close();