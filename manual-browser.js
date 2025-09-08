/**
 * EXODIA FINAL - Manual Browser for Pattern Analysis
 * 
 * Opens browser and keeps it open so you can:
 * 1. Navigate to stats manually
 * 2. See the actual page structure  
 * 3. Identify the correct selectors
 * 4. Copy data manually if needed
 */

const { chromium } = require('playwright');

async function openBrowserForManualInspection() {
  console.log('🚀 EXODIA FINAL - Manual Browser Inspector');
  console.log('==========================================');
  console.log('This will:');
  console.log('1. Open a browser window');
  console.log('2. Navigate to your match URL');
  console.log('3. Keep it open for manual inspection');
  console.log('4. You can manually click tabs and inspect elements');
  console.log('5. Press Ctrl+C when done to close\\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000  // Slow down actions
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to your URL
    const url = 'https://agones.gr/livescore/2079-5075/zbaigken_kanazaba-osaka#stats';
    console.log('📍 Navigating to:', url);
    
    await page.goto(url);
    console.log('✅ Page loaded');
    
    await page.waitForTimeout(3000);
    
    console.log('\\n📋 MANUAL INSPECTION TASKS:');
    console.log('============================');
    console.log('1. Click on "Στατιστικά" (Stats) tab if not already active');
    console.log('2. Look for the three sections: ίδιες (H2H), εντός (Home), εκτός (Away)');
    console.log('3. Click each tab and observe the data structure');
    console.log('4. Note that FIRST ROW = actual result (to exclude)');
    console.log('5. ROWS 2+ = historical patterns (what we want)');
    
    console.log('\\n🔍 WHAT TO LOOK FOR:');
    console.log('=====================');
    console.log('- Tables with match scores (format: 2-1, 3-0, etc.)');
    console.log('- Half-time scores (usually in parentheses or on hover)');
    console.log('- Dates and competition names (we do not need these)');
    console.log('- Multiple rows of historical matches');
    
    console.log('\\n⏳ Browser will stay open for manual inspection...');
    console.log('Press Ctrl+C in terminal when done to close browser');
    
    // Keep the browser open until manually closed
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        console.log('\\n🧹 Closing browser...');
        resolve();
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('✅ Browser closed');
  }
}

// Add helper function to extract data manually
async function extractDataManually() {
  console.log('\\n📊 MANUAL DATA EXTRACTION HELPER:');
  console.log('==================================');
  console.log('If you can see the scores on the page, here is the format for EXODIA FINAL:');
  console.log('');
  console.log('🎯 H2H MATCHES (ίδιες - skip first row):');
  console.log('1. HT: ?-? | FT: X-Y | Goals: Z');
  console.log('2. HT: ?-? | FT: X-Y | Goals: Z');
  console.log('(continue for all visible rows except first)');
  console.log('');
  console.log('🏠 HOME MATCHES (εντός - skip first row):');
  console.log('1. HT: ?-? | FT: X-Y | Goals: Z');
  console.log('2. HT: ?-? | FT: X-Y | Goals: Z');
  console.log('');
  console.log('✈️ AWAY MATCHES (εκτός - skip first row):');
  console.log('1. HT: ?-? | FT: X-Y | Goals: Z');
  console.log('2. HT: ?-? | FT: X-Y | Goals: Z');
  console.log('');
  console.log('Then copy-paste this data into EXODIA FINAL manually!');
}

// Run the manual inspector
openBrowserForManualInspection().then(() => {
  extractDataManually();
});