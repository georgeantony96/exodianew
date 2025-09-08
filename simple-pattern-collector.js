/**
 * EXODIA FINAL - Simple Pattern Data Collector
 * 
 * Super simple version that works with any agones.gr structure
 * Just extracts visible scores from the page after navigating to stats
 */

const { chromium } = require('playwright');

async function collectPatterns() {
  console.log('🚀 EXODIA FINAL - Simple Pattern Collector');
  console.log('==========================================');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to your test URL
    const url = 'https://agones.gr/livescore/2079-5075/zbaigken_kanazaba-osaka#stats';
    console.log('📍 Navigating to:', url);
    
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Try to click stats tab
    try {
      await page.click('#nav-stats-tab', { force: true });
      console.log('✅ Clicked Stats tab');
    } catch (e) {
      console.log('⚠️ Could not click stats tab, continuing...');
    }
    
    await page.waitForTimeout(2000);
    
    // Extract ALL visible scores from the page
    const allScores = await page.evaluate(() => {
      // Find all elements that might contain scores
      const scoreElements = [
        ...document.querySelectorAll('.score'),
        ...document.querySelectorAll('.result'), 
        ...document.querySelectorAll('td:nth-child(5)'),
        ...document.querySelectorAll('[class*="score"]'),
        ...document.querySelectorAll('[class*="result"]')
      ];
      
      const scores = [];
      
      scoreElements.forEach((el, index) => {
        const text = el.textContent.trim();
        // Look for score patterns like "2-1" or "2-1 (1-0)"
        const scoreMatch = text.match(/(\\d+)-(\\d+)/);
        if (scoreMatch) {
          const homeScore = parseInt(scoreMatch[1]);
          const awayScore = parseInt(scoreMatch[2]);
          
          // Try to extract half-time from parentheses
          const htMatch = text.match(/\\((\\d+)-(\\d+)\\)/);
          const homeHT = htMatch ? parseInt(htMatch[1]) : null;
          const awayHT = htMatch ? parseInt(htMatch[2]) : null;
          
          scores.push({
            index,
            fullText: text,
            homeScoreFT: homeScore,
            awayScoreFT: awayScore,
            homeScoreHT: homeHT,
            awayScoreHT: awayHT,
            totalGoals: homeScore + awayScore,
            element: el.className || el.tagName
          });
        }
      });
      
      return scores;
    });
    
    console.log('\\n📊 FOUND SCORES ON PAGE:');
    console.log('========================');
    
    if (allScores.length === 0) {
      console.log('❌ No scores found on page');
    } else {
      allScores.forEach((score, i) => {
        const ht = score.homeScoreHT !== null ? `HT: ${score.homeScoreHT}-${score.awayScoreHT} | ` : '';
        console.log(`${i + 1}. ${ht}FT: ${score.homeScoreFT}-${score.awayScoreFT} | Goals: ${score.totalGoals} | (${score.element})`);
      });
      
      console.log('\\n🎯 FOR EXODIA FINAL INPUT:');
      console.log('===========================');
      console.log('FIRST SCORE = Actual match result (exclude from patterns)');
      console.log('REMAINING SCORES = Historical patterns for analysis');
      
      if (allScores.length > 1) {
        console.log('\\n📋 HISTORICAL PATTERNS (skip first):');
        allScores.slice(1).forEach((score, i) => {
          const ht = score.homeScoreHT !== null ? `${score.homeScoreHT}-${score.awayScoreHT}` : '?-?';
          console.log(`${i + 1}. HT: ${ht} | FT: ${score.homeScoreFT}-${score.awayScoreFT} | Goals: ${score.totalGoals}`);
        });
        
        const historicalScores = allScores.slice(1);
        const avgGoals = (historicalScores.reduce((sum, s) => sum + s.totalGoals, 0) / historicalScores.length).toFixed(2);
        const over25 = ((historicalScores.filter(s => s.totalGoals > 2.5).length / historicalScores.length) * 100).toFixed(1);
        const over35 = ((historicalScores.filter(s => s.totalGoals > 3.5).length / historicalScores.length) * 100).toFixed(1);
        
        console.log('\\n📊 PATTERN STATS:');
        console.log(`Total Historical Matches: ${historicalScores.length}`);
        console.log(`Average Goals: ${avgGoals}`);
        console.log(`Over 2.5: ${over25}%`);
        console.log(`Over 3.5: ${over35}%`);
        
      } else {
        console.log('\\n⚠️ Only found actual result, no historical patterns');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\\n✅ Done! Copy the historical patterns into EXODIA FINAL');
  }
}

// Run it
collectPatterns();