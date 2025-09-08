/**
 * Phase 2: Create Mathematical Enhancement Database Tables
 * Adds permanent mathematical analysis storage to your existing system
 */

const Database = require('better-sqlite3');
const path = require('path');

function createMathematicalTables() {
  console.log('🚀 PHASE 2: MATHEMATICAL ENHANCEMENT DATABASE SETUP');
  console.log('=' .repeat(60));
  
  try {
    const dbPath = path.resolve('exodia.db');
    const db = new Database(dbPath);
    
    console.log('📊 Database Connection: ✅ Connected');
    
    // Create mathematical enhancements table
    console.log('\n🧬 Creating mathematical_enhancements table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS mathematical_enhancements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_id INTEGER NOT NULL,
        
        -- Golden Ratio Analysis
        golden_ratio_score REAL DEFAULT 0,
        golden_ratio_harmony REAL DEFAULT 0,
        is_golden_pattern BOOLEAN DEFAULT FALSE,
        phi_deviation REAL DEFAULT 0,
        
        -- Fibonacci Analysis  
        fibonacci_index INTEGER DEFAULT 0,
        fibonacci_strength REAL DEFAULT 0,
        is_fibonacci_total BOOLEAN DEFAULT FALSE,
        spiral_coherence REAL DEFAULT 0,
        
        -- Information Theory
        shannon_entropy REAL DEFAULT 0,
        information_content REAL DEFAULT 0,
        surprise_factor REAL DEFAULT 0,
        predictability_index REAL DEFAULT 0,
        pattern_rarity REAL DEFAULT 0,
        compression_ratio REAL DEFAULT 0,
        
        -- Quantum Analysis
        quantum_coherence REAL DEFAULT 0,
        quantum_entanglement REAL DEFAULT 0,
        superposition_state TEXT DEFAULT 'collapsed_unknown',
        wave_function_amplitude TEXT, -- JSON array
        collapse_entropy REAL DEFAULT 0,
        quantum_tunneling BOOLEAN DEFAULT FALSE,
        
        -- Game Theory
        nash_equilibrium TEXT DEFAULT 'unknown',
        strategic_balance REAL DEFAULT 0,
        attack_defense_ratio REAL DEFAULT 0,
        cooperation_index REAL DEFAULT 0,
        dominant_strategy TEXT DEFAULT 'balanced',
        payoff_matrix TEXT, -- JSON 2D array
        
        -- Topology
        manifold_position TEXT, -- JSON coordinates
        hyperbolic_distance REAL DEFAULT 0,
        curvature_measure REAL DEFAULT 0,
        topological_stability REAL DEFAULT 0,
        pattern_neighbors TEXT, -- JSON array
        klein_bottle_indicator BOOLEAN DEFAULT FALSE,
        
        -- Metadata
        analysis_version TEXT DEFAULT '1.0.0',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (pattern_id) REFERENCES rich_historical_patterns(id)
      );
    `);
    
    // Create indexes for performance
    console.log('📈 Creating performance indexes...');
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_math_pattern_id ON mathematical_enhancements(pattern_id);
      CREATE INDEX IF NOT EXISTS idx_math_golden_ratio ON mathematical_enhancements(golden_ratio_harmony);
      CREATE INDEX IF NOT EXISTS idx_math_fibonacci ON mathematical_enhancements(fibonacci_strength);
      CREATE INDEX IF NOT EXISTS idx_math_entropy ON mathematical_enhancements(shannon_entropy);
      CREATE INDEX IF NOT EXISTS idx_math_coherence ON mathematical_enhancements(quantum_coherence);
      CREATE INDEX IF NOT EXISTS idx_math_equilibrium ON mathematical_enhancements(nash_equilibrium);
      CREATE INDEX IF NOT EXISTS idx_math_created ON mathematical_enhancements(created_at);
    `);
    
    // Create mathematical insights view
    console.log('🔍 Creating mathematical insights view...');
    db.exec(`
      CREATE VIEW IF NOT EXISTS mathematical_insights AS
      SELECT 
        rhp.id as pattern_id,
        rhp.home_score_ht,
        rhp.away_score_ht,
        rhp.home_score_ft,
        rhp.away_score_ft,
        rhp.rich_fingerprint_combined,
        rhp.created_at as pattern_created,
        
        me.golden_ratio_harmony,
        me.is_golden_pattern,
        me.fibonacci_strength,
        me.is_fibonacci_total,
        me.shannon_entropy,
        me.surprise_factor,
        me.quantum_coherence,
        me.nash_equilibrium,
        me.strategic_balance,
        me.hyperbolic_distance,
        
        -- Mathematical classification
        CASE 
          WHEN me.golden_ratio_harmony > 5 THEN 'Golden'
          WHEN me.fibonacci_strength > 5 THEN 'Fibonacci'  
          WHEN me.quantum_coherence > 0.8 THEN 'Coherent'
          WHEN me.shannon_entropy > 1.5 THEN 'Chaotic'
          ELSE 'Standard'
        END as mathematical_type,
        
        -- Prediction confidence based on mathematical properties
        (me.golden_ratio_harmony * 0.2 + 
         me.fibonacci_strength * 0.2 + 
         me.quantum_coherence * 0.3 + 
         (2.0 - me.shannon_entropy) * 0.3) as math_confidence
        
      FROM rich_historical_patterns rhp
      LEFT JOIN mathematical_enhancements me ON rhp.id = me.pattern_id;
    `);
    
    // Create practical query functions
    console.log('🎯 Creating practical query functions...');
    
    // Function to find similar mathematical patterns
    db.exec(`
      CREATE VIEW IF NOT EXISTS similar_mathematical_patterns AS
      SELECT 
        p1.pattern_id as pattern_1,
        p2.pattern_id as pattern_2,
        p1.mathematical_type as type_1,
        p2.mathematical_type as type_2,
        ABS(p1.golden_ratio_harmony - p2.golden_ratio_harmony) as golden_similarity,
        ABS(p1.fibonacci_strength - p2.fibonacci_strength) as fib_similarity,
        ABS(p1.quantum_coherence - p2.quantum_coherence) as quantum_similarity,
        ABS(p1.shannon_entropy - p2.shannon_entropy) as entropy_similarity
      FROM mathematical_insights p1
      CROSS JOIN mathematical_insights p2
      WHERE p1.pattern_id < p2.pattern_id
      AND p1.mathematical_type = p2.mathematical_type;
    `);
    
    // Check current pattern count
    const patternCount = db.prepare('SELECT COUNT(*) as count FROM rich_historical_patterns').get();
    console.log(`\n📊 Current Patterns: ${patternCount.count.toLocaleString()}`);
    
    // Check if any patterns already have mathematical analysis
    const enhancementCount = db.prepare('SELECT COUNT(*) as count FROM mathematical_enhancements').get();
    console.log(`🧬 Mathematical Enhancements: ${enhancementCount.count.toLocaleString()}`);
    
    console.log('\n✅ MATHEMATICAL DATABASE STRUCTURE CREATED');
    console.log('=' .repeat(60));
    console.log('🌟 Tables Created:');
    console.log('   📊 mathematical_enhancements - Core mathematical analysis storage');
    console.log('   🔍 mathematical_insights - Practical analysis view');
    console.log('   🎯 similar_mathematical_patterns - Pattern similarity detection');
    console.log('\n🚀 Indexes Created for Performance:');
    console.log('   📈 Golden Ratio, Fibonacci, Entropy, Coherence, Equilibrium indexes');
    console.log('\n💾 Database Enhancement: COMPLETE');
    
    db.close();
    
    return {
      success: true,
      tables_created: ['mathematical_enhancements', 'mathematical_insights', 'similar_mathematical_patterns'],
      indexes_created: 7,
      patterns_ready_for_analysis: patternCount.count,
      existing_enhancements: enhancementCount.count
    };
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the setup
if (require.main === module) {
  const result = createMathematicalTables();
  
  if (result.success) {
    console.log(`\n🎉 SUCCESS: Mathematical database ready for ${result.patterns_ready_for_analysis.toLocaleString()} patterns!`);
    console.log('🚀 Next: Run pattern enhancement to analyze your existing patterns with mathematics');
  } else {
    console.log('\n💥 FAILED: ' + result.error);
  }
}

module.exports = { createMathematicalTables };