/**
 * EXODIA FINAL - Simplified Universal Pattern Data Collector
 * 
 * Matches your actual workflow:
 * 1. Select League -> Universal Pattern
 * 2. Teams: Just Home/Away (team-agnostic) 
 * 3. Input match data: H2H, Home, Away historical results
 * 4. Focus on PATTERNS not specific team/league details
 * 5. SKIPS FIRST ROW (actual result) from all 3 tables
 */

const { chromium } = require('playwright');

class UniversalPatternCollector {
  constructor() {
    this.browser = null;
    this.page = null;
    
    // Respectful delays
    this.delays = {
      pageLoad: 2500,
      interaction: 600,
      hover: 300,
      section: 1000
    };
    
    this.collectedPatterns = {
      h2h: [],
      home: [],
      away: []
    };
  }

  async initialize() {
    console.log('🚀 Initializing Universal Pattern Collector...');
    
    this.browser = await chromium.launch({
      headless: false, // Transparent operation
      args: [
        '--no-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    const context = await this.browser.newContext({
      locale: 'el-GR',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      extraHTTPHeaders: {
        'Accept-Language': 'el-GR,en;q=0.9'
      }
    });
    
    this.page = await context.newPage();
    console.log('✅ Browser ready');
    return true;
  }

  async collectUniversalPatterns(matchUrl) {
    console.log(`\\n🎯 Collecting universal patterns from: ${matchUrl}`);
    
    try {
      await this.page.goto(matchUrl, { waitUntil: 'networkidle' });
      await this.wait(this.delays.pageLoad);
      
      // Click Stats tab with multiple strategies
      const statsSelectors = [
        '#nav-stats-tab',
        'a[href="#stats"]', 
        'a[data-tabname="stats"]',
        'a[aria-controls="stats"]',
        'text=Στατιστικά'
      ];
      
      let statsTabFound = false;
      for (const selector of statsSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 3000 });
          // Use evaluate to click to avoid interception
          await this.page.evaluate((sel) => {
            const element = document.querySelector(sel);
            if (element) element.click();
          }, selector);
          statsTabFound = true;
          console.log('📊 Switched to Stats tab');
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (!statsTabFound) {
        console.warn('⚠️ Could not find Stats tab - trying to continue anyway');
      }
      
      await this.wait(this.delays.interaction);
      
      // Collect the three pattern types your system uses
      const h2hData = await this.collectPatternSection('h2h', 'ίδιες');      // Head-to-head
      const homeData = await this.collectPatternSection('home', 'εντός');    // Home patterns  
      const awayData = await this.collectPatternSection('away', 'εκτός');    // Away patterns
      
      const patterns = {
        h2h: h2hData.historicalPatterns || [],
        home: homeData.historicalPatterns || [],
        away: awayData.historicalPatterns || []
      };
      
      // Capture actual match results from all sections
      const actualResults = {
        h2h: h2hData.actualResult,
        home: homeData.actualResult, 
        away: awayData.actualResult
      };
      
      return this.formatForExodiaFinal(patterns, actualResults);
      
    } catch (error) {
      console.error('❌ Error collecting patterns:', error.message);
      return null;
    }
  }

  async collectPatternSection(sectionType, greekLabel) {
    console.log(`  📊 Collecting ${sectionType} patterns (${greekLabel})...`);
    
    try {
      // Find and click the tab
      const tabSelectors = [
        `button:has-text("${greekLabel}")`,
        `a:has-text("${greekLabel}")`,
        `.tab:contains("${greekLabel}")`,
        `[data-section="${sectionType}"]`
      ];
      
      let tabClicked = false;
      for (const selector of tabSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2000 });
          await this.page.click(selector);
          tabClicked = true;
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (!tabClicked) {
        console.warn(`  ⚠️ Could not find ${greekLabel} tab`);
        return [];
      }
      
      await this.wait(this.delays.section);
      
      // Extract pattern data - SKIP FIRST ROW (actual match result)
      const patterns = await this.page.evaluate((sectionName) => {
        const rows = document.querySelectorAll('table tr, .match-row, .game-row');
        const matchPatterns = [];
        let actualMatchResult = null;
        
        // First, capture the actual match result (row 1) separately
        if (rows.length > 1) {
          const resultRow = rows[1]; // First data row = actual result
          try {
            const scoreEl = resultRow.querySelector('.score, .result, td:nth-child(5), .match-score');
            if (scoreEl) {
              const scoreText = scoreEl.textContent.trim();
              const ftMatch = scoreText.match(/(\\d+)-(\\d+)/);
              const htMatch = scoreText.match(/\\((\\d+)-(\\d+)\\)/);
              
              if (ftMatch) {
                actualMatchResult = {
                  homeScoreFT: parseInt(ftMatch[1]),
                  awayScoreFT: parseInt(ftMatch[2]),
                  homeScoreHT: htMatch ? parseInt(htMatch[1]) : null,
                  awayScoreHT: htMatch ? parseInt(htMatch[2]) : null,
                  section: sectionName
                };
              }
            }
          } catch (e) {
            console.log('Could not extract actual result from first row');
          }
        }
        
        // Then collect historical patterns (SKIP row 1 - start from row 2)
        for (let i = 2; i < Math.min(rows.length, 22); i++) { // Start from row 2, max 20 historical matches
          const row = rows[i];
          if (!row) continue;
          
          try {
            // Find score element
            const scoreEl = row.querySelector('.score, .result, td:nth-child(5), .match-score');
            if (!scoreEl) continue;
            
            const scoreText = scoreEl.textContent.trim();
            
            // Extract scores - format: "2-1" or "2-1 (1-0)" 
            const ftMatch = scoreText.match(/(\\d+)-(\\d+)/);
            if (!ftMatch) continue;
            
            const homeScoreFT = parseInt(ftMatch[1]);
            const awayScoreFT = parseInt(ftMatch[2]);
            
            // Try to extract half-time score
            const htMatch = scoreText.match(/\\((\\d+)-(\\d+)\\)/);
            const homeScoreHT = htMatch ? parseInt(htMatch[1]) : null;
            const awayScoreHT = htMatch ? parseInt(htMatch[2]) : null;
            
            // Create universal pattern (no team/league specifics)
            matchPatterns.push({
              homeScoreFT,
              awayScoreFT,
              homeScoreHT,
              awayScoreHT,
              // Derived pattern indicators
              totalGoals: homeScoreFT + awayScoreFT,
              over15: (homeScoreFT + awayScoreFT) > 1.5,
              over25: (homeScoreFT + awayScoreFT) > 2.5,
              over35: (homeScoreFT + awayScoreFT) > 3.5,
              btts: homeScoreFT > 0 && awayScoreFT > 0,
              homeWin: homeScoreFT > awayScoreFT,
              draw: homeScoreFT === awayScoreFT,
              awayWin: awayScoreFT > homeScoreFT
            });
            
          } catch (rowError) {
            continue;
          }
        }
        
        return { 
          actualResult: actualMatchResult,
          historicalPatterns: matchPatterns 
        };
      });
      
      // Try to get half-time scores by hovering (skip first element - that's the actual result)
      for (let i = 0; i < Math.min(patterns.historicalPatterns.length, 10); i++) {
        if (patterns.historicalPatterns[i].homeScoreHT === null) {
          try {
            const scoreElements = await this.page.$$('.score, .result');
            // Skip first score element (actual result) - start from index 1
            if (scoreElements[i + 1]) {
              await scoreElements[i + 1].hover();
              await this.wait(this.delays.hover);
              
              const tooltip = await this.page.$('.tooltip, .score-tooltip');
              if (tooltip) {
                const htText = await tooltip.textContent();
                const htMatch = htText.match(/(\\d+)-(\\d+)/);
                if (htMatch) {
                  patterns.historicalPatterns[i].homeScoreHT = parseInt(htMatch[1]);
                  patterns.historicalPatterns[i].awayScoreHT = parseInt(htMatch[2]);
                  patterns.historicalPatterns[i].htTotalGoals = patterns.historicalPatterns[i].homeScoreHT + patterns.historicalPatterns[i].awayScoreHT;
                  patterns.historicalPatterns[i].over05HT = patterns.historicalPatterns[i].htTotalGoals > 0.5;
                  patterns.historicalPatterns[i].over15HT = patterns.historicalPatterns[i].htTotalGoals > 1.5;
                }
              }
            }
          } catch (hoverError) {
            continue;
          }
        }
      }
      
      console.log(`  ✅ Collected ${patterns.historicalPatterns.length} historical ${sectionType} patterns`);
      if (patterns.actualResult) {
        console.log(`  📊 Captured actual result: ${patterns.actualResult.homeScoreFT}-${patterns.actualResult.awayScoreFT}`);
      }
      
      return { 
        historicalPatterns: patterns.historicalPatterns, 
        actualResult: patterns.actualResult 
      };
      
    } catch (error) {
      console.warn(`  ⚠️ Error in ${sectionType} section:`, error.message);
      return { historicalPatterns: [], actualResult: null };
    }
  }

  formatForExodiaFinal(rawPatterns, actualResults) {
    // Format data to match your EXODIA FINAL input structure
    const formatted = {
      matchUrl: this.page.url(),
      collectionTimestamp: new Date().toISOString(),
      
      // ACTUAL MATCH RESULT (excluded from patterns)
      actualMatchResult: {
        h2h: actualResults?.h2h || null,
        home: actualResults?.home || null,
        away: actualResults?.away || null,
        // Use H2H result as primary (most relevant)
        primary: actualResults?.h2h || actualResults?.home || actualResults?.away || null
      },
      
      patternSummary: {
        h2hCount: rawPatterns.h2h.length,
        homeCount: rawPatterns.home.length, 
        awayCount: rawPatterns.away.length,
        totalPatterns: rawPatterns.h2h.length + rawPatterns.home.length + rawPatterns.away.length
      },
      
      // HISTORICAL PATTERNS (for analysis - excludes actual result)
      patterns: {
        h2h: rawPatterns.h2h,
        home_home: rawPatterns.home,  // Matches your frontend structure
        away_away: rawPatterns.away   // Matches your frontend structure
      },
      
      // Statistical summary for your pattern analysis
      statistics: this.calculateUniversalStats(rawPatterns)
    };
    
    return formatted;
  }

  calculateUniversalStats(patterns) {
    const allPatterns = [...patterns.h2h, ...patterns.home, ...patterns.away];
    
    if (allPatterns.length === 0) return {};
    
    return {
      totalMatches: allPatterns.length,
      avgGoalsPerMatch: (allPatterns.reduce((sum, p) => sum + p.totalGoals, 0) / allPatterns.length).toFixed(2),
      over25Percentage: ((allPatterns.filter(p => p.over25).length / allPatterns.length) * 100).toFixed(1),
      over35Percentage: ((allPatterns.filter(p => p.over35).length / allPatterns.length) * 100).toFixed(1),
      bttsPercentage: ((allPatterns.filter(p => p.btts).length / allPatterns.length) * 100).toFixed(1),
      homeWinPercentage: ((allPatterns.filter(p => p.homeWin).length / allPatterns.length) * 100).toFixed(1),
      drawPercentage: ((allPatterns.filter(p => p.draw).length / allPatterns.length) * 100).toFixed(1),
      awayWinPercentage: ((allPatterns.filter(p => p.awayWin).length / allPatterns.length) * 100).toFixed(1)
    };
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Export patterns in format ready for your manual input process
  exportForManualInput(formattedData) {
    console.log('\\n📋 EXPORT FOR EXODIA FINAL MANUAL INPUT:');
    console.log('==========================================');
    
    const { patterns, statistics, actualMatchResult } = formattedData;
    
    // Show actual match result first (for verification)
    if (actualMatchResult.primary) {
      const result = actualMatchResult.primary;
      console.log('\\n🎯 ACTUAL MATCH RESULT (excluded from patterns):');
      console.log(`   HT: ${result.homeScoreHT || '?'}-${result.awayScoreHT || '?'} | FT: ${result.homeScoreFT}-${result.awayScoreFT}`);
      console.log('   ↳ This was the actual result - NOT included in historical patterns below');
    }
    
    console.log('\\n📊 HISTORICAL PATTERNS (for analysis):');
    
    console.log('\\n🎯 H2H MATCHES (Head-to-Head):');
    patterns.h2h.forEach((match, i) => {
      console.log(`${i + 1}. HT: ${match.homeScoreHT || '?'}-${match.awayScoreHT || '?'} | FT: ${match.homeScoreFT}-${match.awayScoreFT} | Goals: ${match.totalGoals}`);
    });
    
    console.log('\\n🏠 HOME MATCHES:');
    patterns.home_home.forEach((match, i) => {
      console.log(`${i + 1}. HT: ${match.homeScoreHT || '?'}-${match.awayScoreHT || '?'} | FT: ${match.homeScoreFT}-${match.awayScoreFT} | Goals: ${match.totalGoals}`);
    });
    
    console.log('\\n✈️ AWAY MATCHES:');
    patterns.away_away.forEach((match, i) => {
      console.log(`${i + 1}. HT: ${match.homeScoreHT || '?'}-${match.awayScoreHT || '?'} | FT: ${match.homeScoreFT}-${match.awayScoreFT} | Goals: ${match.totalGoals}`);
    });
    
    console.log('\\n📊 PATTERN STATISTICS:');
    console.log(`Total Patterns: ${statistics.totalMatches}`);
    console.log(`Avg Goals: ${statistics.avgGoalsPerMatch}`);
    console.log(`Over 2.5: ${statistics.over25Percentage}%`);
    console.log(`Over 3.5: ${statistics.over35Percentage}%`);
    console.log(`BTTS: ${statistics.bttsPercentage}%`);
    
    return formattedData;
  }

  // Process multiple matches efficiently
  async processBatch(matchUrls) {
    console.log(`\\n🎯 Processing ${matchUrls.length} matches for universal patterns...`);
    
    const results = [];
    
    for (let i = 0; i < matchUrls.length; i++) {
      const url = matchUrls[i];
      console.log(`\\n📍 Match ${i + 1}/${matchUrls.length}`);
      
      try {
        const patterns = await this.collectUniversalPatterns(url);
        if (patterns) {
          const exported = this.exportForManualInput(patterns);
          results.push(exported);
          
          // Save to file for later manual input
          await this.saveToFile(exported, `patterns-${i + 1}.json`);
        }
      } catch (error) {
        console.error(`❌ Failed to process ${url}:`, error.message);
      }
      
      // Respectful delay between matches
      if (i < matchUrls.length - 1) {
        console.log('⏳ Waiting before next match...');
        await this.wait(3000);
      }
    }
    
    return results;
  }

  async saveToFile(data, filename) {
    try {
      const fs = require('fs').promises;
      await fs.mkdir('./collected-patterns', { recursive: true });
      await fs.writeFile(
        `./collected-patterns/${filename}`, 
        JSON.stringify(data, null, 2),
        'utf8'
      );
      console.log(`💾 Saved patterns to: collected-patterns/${filename}`);
    } catch (error) {
      console.warn('⚠️ Could not save file:', error.message);
    }
  }

  async cleanup() {
    console.log('\\n🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
    console.log('✅ Collection complete!');
  }
}

// Export for integration
module.exports = UniversalPatternCollector;

// CLI usage
if (require.main === module) {
  async function main() {
    const collector = new UniversalPatternCollector();
    
    try {
      await collector.initialize();
      
      // Example: Single match collection
      const singleMatchUrl = 'https://agones.gr/livescore/1832-13509/eimpar-fk_andora#stats';
      const patterns = await collector.collectUniversalPatterns(singleMatchUrl);
      
      if (patterns) {
        collector.exportForManualInput(patterns);
        
        console.log('\\n🎯 READY FOR MANUAL INPUT IN EXODIA FINAL:');
        console.log('1. Open your EXODIA FINAL app');
        console.log('2. Select League -> Universal Pattern');  
        console.log('3. Input ONLY the historical patterns shown above');
        console.log('4. The actual match result is excluded (as it should be)');
        console.log('5. Let your mathematical engines analyze the patterns!');
      }
      
    } catch (error) {
      console.error('❌ Collection failed:', error.message);
    } finally {
      await collector.cleanup();
    }
  }
  
  main();
}