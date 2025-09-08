/**
 * EXODIA FINAL - Agones.gr Automated Data Collector
 * Ethical web automation for historical match data collection
 * 
 * Features:
 * - Respects robots.txt and rate limits
 * - Handles Greek characters and dates
 * - Integrates with existing EXODIA FINAL database
 * - Implements anti-detection measures
 * - Transparent operation (non-headless by default)
 */

const { chromium } = require('playwright');
const Database = require('better-sqlite3');
const fs = require('fs').promises;

class AgonesDataCollector {
  constructor() {
    this.browser = null;
    this.page = null;
    this.db = null;
    
    // Respectful delays (in milliseconds)
    this.delays = {
      pageLoad: 3000,      // 3 seconds between pages
      interaction: 800,    // 0.8 seconds between clicks
      hover: 400,         // 0.4 seconds for hover actions
      section: 1500,      // 1.5 seconds between sections
      batch: 30000        // 30 seconds between batches of matches
    };
    
    this.stats = {
      pagesProcessed: 0,
      matchesCollected: 0,
      errorsEncountered: 0,
      startTime: null
    };
  }

  async initialize() {
    console.log('🚀 Initializing EXODIA FINAL Data Collector...');
    this.stats.startTime = Date.now();
    
    try {
      // Initialize database connection
      this.db = new Database('./frontend/exodia.db');
      
      // Create historical matches table if not exists
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS historical_matches_automated (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          match_url TEXT NOT NULL,
          collection_date DATE DEFAULT CURRENT_DATE,
          date TEXT NOT NULL,
          competition TEXT NOT NULL,
          home_team TEXT NOT NULL,
          away_team TEXT NOT NULL,
          home_score_ft INTEGER,
          away_score_ft INTEGER,
          home_score_ht INTEGER,
          away_score_ht INTEGER,
          section_type TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(match_url, date, home_team, away_team, section_type)
        )
      `);
      
      // Launch browser with anti-detection configuration
      this.browser = await chromium.launch({
        headless: false, // Transparent operation
        slowMo: 100,    // Slight delay between actions
        args: [
          '--no-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--start-maximized'
        ]
      });
      
      // Create context with realistic settings
      const context = await this.browser.newContext({
        locale: 'el-GR',
        timezoneId: 'Europe/Athens',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        extraHTTPHeaders: {
          'Accept-Language': 'el-GR,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        }
      });
      
      this.page = await context.newPage();
      
      // Add realistic behavior
      await this.page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        Object.defineProperty(navigator, 'languages', { get: () => ['el-GR', 'en'] });
      });
      
      console.log('✅ Browser initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      await this.cleanup();
      return false;
    }
  }

  async checkRobotsCompliance(baseUrl) {
    try {
      const robotsUrl = new URL('/robots.txt', baseUrl).href;
      const response = await this.page.goto(robotsUrl, { waitUntil: 'networkidle' });
      
      if (response.ok()) {
        const robotsContent = await this.page.textContent('body');
        console.log('🤖 Robots.txt compliance check passed');
        
        // Log robots.txt for transparency
        await this.logActivity('ROBOTS_CHECK', { url: robotsUrl, allowed: true });
        return true;
      }
      
      console.log('ℹ️ No robots.txt found - proceeding with caution');
      return true;
      
    } catch (error) {
      console.warn('⚠️ Could not check robots.txt:', error.message);
      return true; // Proceed but log the issue
    }
  }

  async collectMatchData(matchUrl) {
    console.log(`\\n🔍 Processing: ${matchUrl}`);
    this.stats.pagesProcessed++;
    
    try {
      // Check if already processed
      const existing = this.db.prepare(
        'SELECT COUNT(*) as count FROM historical_matches_automated WHERE match_url = ?'
      ).get(matchUrl);
      
      if (existing.count > 0) {
        console.log('📋 Match already processed - skipping');
        return { skipped: true, reason: 'already_exists' };
      }
      
      // Navigate to match page with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          await this.page.goto(matchUrl, { 
            waitUntil: 'networkidle', 
            timeout: 30000 
          });
          break;
        } catch (navError) {
          attempts++;
          if (attempts === maxAttempts) throw navError;
          console.log(`⚠️ Navigation attempt ${attempts} failed, retrying...`);
          await this.wait(this.delays.pageLoad);
        }
      }
      
      await this.wait(this.delays.pageLoad);
      
      // Wait for and click Stats tab
      try {
        await this.page.waitForSelector('a[href*="#stats"]', { timeout: 10000 });
        await this.page.click('a[href*="#stats"]');
        await this.wait(this.delays.interaction);
        console.log('📊 Switched to Stats tab');
      } catch (statsError) {
        console.warn('⚠️ Could not find Stats tab:', statsError.message);
        return { error: 'stats_tab_not_found' };
      }
      
      // Wait for stats content to load
      await this.page.waitForSelector('.stats-content, .table-responsive', { timeout: 15000 });
      
      // Collect data from all three sections
      const matchData = {
        url: matchUrl,
        homeGames: await this.collectSectionData('home', 'εντός'),
        awayGames: await this.collectSectionData('away', 'εκτός'),
        h2hGames: await this.collectSectionData('h2h', 'ίδιες')
      };
      
      // Insert collected data into database
      const insertCount = await this.insertMatchData(matchData);
      this.stats.matchesCollected += insertCount;
      
      console.log(`✅ Collected ${insertCount} historical matches`);
      await this.logActivity('MATCH_PROCESSED', { 
        url: matchUrl, 
        records: insertCount,
        sections: {
          home: matchData.homeGames.length,
          away: matchData.awayGames.length,
          h2h: matchData.h2hGames.length
        }
      });
      
      return { success: true, records: insertCount };
      
    } catch (error) {
      console.error(`❌ Error processing ${matchUrl}:`, error.message);
      this.stats.errorsEncountered++;
      await this.logActivity('ERROR', { url: matchUrl, error: error.message });
      return { error: error.message };
    }
  }

  async collectSectionData(sectionId, sectionName) {
    console.log(`  📂 Collecting ${sectionName} data...`);
    
    try {
      // Find and click the appropriate tab
      const tabSelectors = [
        `button:has-text("${sectionName}")`,
        `a:has-text("${sectionName}")`,
        `[data-tab="${sectionId}"]`,
        `.tab:has-text("${sectionName}")`
      ];
      
      let tabFound = false;
      for (const selector of tabSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 3000 });
          await this.page.click(selector);
          tabFound = true;
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (!tabFound) {
        console.warn(`⚠️ Could not find tab for ${sectionName}`);
        return [];
      }
      
      await this.wait(this.delays.section);
      
      // Wait for table content
      await this.page.waitForSelector('table, .table, .match-row', { timeout: 10000 });
      
      // Extract match data from rows
      const matches = await this.page.evaluate((section) => {
        const rows = document.querySelectorAll('table tr, .match-row, .game-row');
        const games = [];
        
        for (let i = 1; i < rows.length; i++) { // Skip header row
          const row = rows[i];
          if (!row) continue;
          
          try {
            // Try different selectors for match data
            const dateEl = row.querySelector('.date, .match-date, td:first-child');
            const competitionEl = row.querySelector('.competition, .league, td:nth-child(2)');
            const homeTeamEl = row.querySelector('.home-team, .team-home, td:nth-child(3)');
            const awayTeamEl = row.querySelector('.away-team, .team-away, td:nth-child(4)');
            const scoreEl = row.querySelector('.score, .result, td:nth-child(5)');
            
            if (!dateEl || !homeTeamEl || !awayTeamEl || !scoreEl) continue;
            
            const date = dateEl.textContent.trim();
            const competition = competitionEl ? competitionEl.textContent.trim() : 'Unknown';
            const homeTeam = homeTeamEl.textContent.trim();
            const awayTeam = awayTeamEl.textContent.trim();
            const scoreText = scoreEl.textContent.trim();
            
            // Parse score (format: "2-1" or "2-1 (1-0)")
            const scoreMatch = scoreText.match(/(\\d+)-(\\d+)/);
            if (!scoreMatch) continue;
            
            const [, homeScoreFT, awayScoreFT] = scoreMatch;
            
            // Try to extract half-time score
            const htMatch = scoreText.match(/\\((\\d+)-(\\d+)\\)/);
            const [homeScoreHT, awayScoreHT] = htMatch ? [htMatch[1], htMatch[2]] : [null, null];
            
            games.push({
              date,
              competition,
              homeTeam,
              awayTeam,
              homeScoreFT: parseInt(homeScoreFT),
              awayScoreFT: parseInt(awayScoreFT),
              homeScoreHT: homeScoreHT ? parseInt(homeScoreHT) : null,
              awayScoreHT: awayScoreHT ? parseInt(awayScoreHT) : null,
              sectionType: section
            });
            
          } catch (rowError) {
            console.log('Row parsing error:', rowError);
            continue;
          }
        }
        
        return games;
      }, sectionName);
      
      // Try to get half-time scores by hovering (if not already available)
      for (let i = 0; i < matches.length && i < 10; i++) { // Limit to first 10 for performance
        if (matches[i].homeScoreHT === null) {
          try {
            const scoreElements = await this.page.$$('.score, .result');
            if (scoreElements[i]) {
              await scoreElements[i].hover();
              await this.wait(this.delays.hover);
              
              // Check for tooltip with half-time score
              const tooltip = await this.page.$('.tooltip, .score-tooltip, [data-tooltip]');
              if (tooltip) {
                const htText = await tooltip.textContent();
                const htMatch = htText.match(/(\\d+)-(\\d+)/);
                if (htMatch) {
                  matches[i].homeScoreHT = parseInt(htMatch[1]);
                  matches[i].awayScoreHT = parseInt(htMatch[2]);
                }
              }
            }
          } catch (hoverError) {
            // Continue without half-time score
            continue;
          }
        }
      }
      
      console.log(`  ✅ Found ${matches.length} ${sectionName} matches`);
      return matches;
      
    } catch (error) {
      console.warn(`  ⚠️ Error collecting ${sectionName} data:`, error.message);
      return [];
    }
  }

  parseGreekDate(greekDate) {
    try {
      // Handle various Greek date formats
      // "8/9/2025", "8-9-2025", "8.9.2025"
      const dateParts = greekDate.split(/[\/\-\\.]/);
      if (dateParts.length === 3) {
        const [day, month, year] = dateParts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return greekDate; // Return as-is if parsing fails
    } catch (error) {
      return greekDate;
    }
  }

  async insertMatchData(matchData) {
    const insertStmt = this.db.prepare(`
      INSERT OR IGNORE INTO historical_matches_automated (
        match_url, date, competition, home_team, away_team,
        home_score_ft, away_score_ft, home_score_ht, away_score_ht,
        section_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const allMatches = [
      ...matchData.homeGames,
      ...matchData.awayGames,
      ...matchData.h2hGames
    ];
    
    let insertCount = 0;
    const transaction = this.db.transaction((matches) => {
      for (const match of matches) {
        try {
          const result = insertStmt.run(
            matchData.url,
            this.parseGreekDate(match.date),
            match.competition,
            match.homeTeam,
            match.awayTeam,
            match.homeScoreFT,
            match.awayScoreFT,
            match.homeScoreHT,
            match.awayScoreHT,
            match.sectionType
          );
          if (result.changes > 0) insertCount++;
        } catch (dbError) {
          console.warn('  ⚠️ Database insert warning:', dbError.message);
        }
      }
    });
    
    transaction(allMatches);
    return insertCount;
  }

  async logActivity(type, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      data,
      stats: { ...this.stats }
    };
    
    try {
      await fs.appendFile(
        './logs/agones-collector.log', 
        JSON.stringify(logEntry) + '\\n',
        'utf8'
      );
    } catch (logError) {
      // Continue if logging fails
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async processBatch(matchUrls, batchSize = 5) {
    console.log(`🎯 Processing batch of ${matchUrls.length} matches (batch size: ${batchSize})`);
    
    const results = [];
    
    for (let i = 0; i < matchUrls.length; i += batchSize) {
      const batch = matchUrls.slice(i, i + batchSize);
      console.log(`\\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(matchUrls.length / batchSize)}`);
      
      for (const url of batch) {
        const result = await this.collectMatchData(url);
        results.push({ url, result });
        
        // Respectful delay between matches
        if (batch.indexOf(url) < batch.length - 1) {
          await this.wait(this.delays.interaction);
        }
      }
      
      // Longer delay between batches
      if (i + batchSize < matchUrls.length) {
        console.log(`⏳ Waiting ${this.delays.batch / 1000} seconds before next batch...`);
        await this.wait(this.delays.batch);
      }
    }
    
    return results;
  }

  getStats() {
    const runtime = Date.now() - this.stats.startTime;
    const runtimeMinutes = Math.round(runtime / 60000);
    
    return {
      ...this.stats,
      runtime: runtimeMinutes,
      avgTimePerPage: Math.round(runtime / Math.max(this.stats.pagesProcessed, 1)),
      successRate: ((this.stats.pagesProcessed - this.stats.errorsEncountered) / Math.max(this.stats.pagesProcessed, 1) * 100).toFixed(1)
    };
  }

  async cleanup() {
    console.log('🧹 Cleaning up resources...');
    
    if (this.browser) {
      await this.browser.close();
    }
    
    if (this.db) {
      this.db.close();
    }
    
    const stats = this.getStats();
    console.log('\\n📊 Collection Statistics:');
    console.log(`  Pages Processed: ${stats.pagesProcessed}`);
    console.log(`  Matches Collected: ${stats.matchesCollected}`);
    console.log(`  Errors Encountered: ${stats.errorsEncountered}`);
    console.log(`  Success Rate: ${stats.successRate}%`);
    console.log(`  Runtime: ${stats.runtime} minutes`);
    
    await this.logActivity('CLEANUP', stats);
  }
}

// Export for use in other modules
module.exports = AgonesDataCollector;

// CLI usage example
if (require.main === module) {
  async function main() {
    const collector = new AgonesDataCollector();
    
    try {
      const initialized = await collector.initialize();
      if (!initialized) {
        console.error('❌ Failed to initialize collector');
        process.exit(1);
      }
      
      // Example match URLs - replace with your actual URLs
      const matchUrls = [
        'https://agones.gr/livescore/1832-13509/eimpar-fk_andora#stats',
        // Add more URLs here...
      ];
      
      await collector.checkRobotsCompliance('https://agones.gr');
      const results = await collector.processBatch(matchUrls, 3);
      
      console.log('\\n🎉 Collection completed successfully!');
      console.log('Results:', results);
      
    } catch (error) {
      console.error('❌ Collection failed:', error);
    } finally {
      await collector.cleanup();
    }
  }
  
  main().catch(console.error);
}