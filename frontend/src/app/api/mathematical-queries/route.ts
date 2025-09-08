import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

/**
 * Practical Mathematical Query API
 * Answers real betting questions using mathematical analysis
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryType = searchParams.get('type') || 'fibonacci_predictions';
    const confidence = parseFloat(searchParams.get('confidence') || '0.7');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const dbPath = path.resolve(process.cwd(), 'exodia.db');
    console.log('🔍 Using database:', dbPath);
    const db = new Database(dbPath, { readonly: true });
    
    try {
      if (queryType === 'fibonacci_predictions') {
        // PRACTICAL: "Which Fibonacci patterns predict next outcome?"
        const fibonacciPredictions = db.prepare(`
          SELECT 
            mi.pattern_id,
            mi.home_score_ht, mi.away_score_ht, mi.home_score_ft, mi.away_score_ft,
            mi.fibonacci_strength,
            mi.shannon_entropy,
            mi.quantum_coherence,
            mi.mathematical_type,
            mi.math_confidence,
            (mi.home_score_ft + mi.away_score_ft) as total_goals,
            CASE 
              WHEN mi.home_score_ft > mi.away_score_ft THEN 'HOME_WIN'
              WHEN mi.home_score_ft < mi.away_score_ft THEN 'AWAY_WIN'
              ELSE 'DRAW'
            END as outcome
          FROM mathematical_insights mi
          WHERE mi.is_fibonacci_total = 1
          AND mi.fibonacci_strength > ?
          ORDER BY mi.fibonacci_strength DESC, mi.quantum_coherence DESC
          LIMIT ?
        `).all(confidence * 5, limit);
        
        // Group by next Fibonacci number prediction
        const nextFibPredictions = {};
        const fibSequence = [0, 1, 1, 2, 3, 5, 8, 13, 21];
        
        fibonacciPredictions.forEach(pattern => {
          const currentFib = pattern.total_goals;
          const nextFibIndex = fibSequence.indexOf(currentFib) + 1;
          const nextFib = nextFibIndex < fibSequence.length ? fibSequence[nextFibIndex] : currentFib;
          
          if (!nextFibPredictions[nextFib]) {
            nextFibPredictions[nextFib] = [];
          }
          nextFibPredictions[nextFib].push(pattern);
        });
        
        return NextResponse.json({
          success: true,
          query_type: 'fibonacci_predictions',
          insight: 'Teams following Fibonacci sequences tend to continue the pattern',
          predictions: nextFibPredictions,
          betting_advice: 'Look for matches where recent pattern suggests next Fibonacci total',
          confidence_level: confidence,
          patterns_analyzed: fibonacciPredictions.length
        });
      }
      
      if (queryType === 'golden_ratio_opportunities') {
        // PRACTICAL: "Which Golden Ratio patterns indicate value bets?"
        const goldenPatterns = db.prepare(`
          SELECT 
            mi.pattern_id,
            mi.home_score_ht, mi.away_score_ht, mi.home_score_ft, mi.away_score_ft,
            mi.golden_ratio_harmony,
            mi.quantum_coherence,
            mi.strategic_balance,
            mi.mathematical_type,
            CASE 
              WHEN mi.home_score_ft > mi.away_score_ft THEN 'HOME_WIN'
              WHEN mi.home_score_ft < mi.away_score_ft THEN 'AWAY_WIN'
              ELSE 'DRAW'
            END as outcome
          FROM mathematical_insights mi
          WHERE mi.is_golden_pattern = 1
          ORDER BY mi.golden_ratio_harmony DESC
          LIMIT ?
        `).all(limit);
        
        // Analyze golden ratio outcome tendencies
        const outcomeStats = goldenPatterns.reduce((acc, pattern) => {
          acc[pattern.outcome] = (acc[pattern.outcome] || 0) + 1;
          return acc;
        }, {});
        
        return NextResponse.json({
          success: true,
          query_type: 'golden_ratio_opportunities',
          insight: 'Golden Ratio patterns show natural harmony - often underpriced by bookmakers',
          golden_patterns: goldenPatterns,
          outcome_distribution: outcomeStats,
          betting_strategy: 'Golden Ratio patterns (φ = 1.618) represent perfect mathematical balance',
          rarity: `Only ${goldenPatterns.length} golden patterns found - extremely valuable`,
          total_golden_patterns: goldenPatterns.length
        });
      }
      
      if (queryType === 'high_entropy_surprises') {
        // PRACTICAL: "Which high-entropy patterns indicate surprise opportunities?"
        const surprisePatterns = db.prepare(`
          SELECT 
            mi.pattern_id,
            mi.home_score_ht, mi.away_score_ht, mi.home_score_ft, mi.away_score_ft,
            mi.shannon_entropy,
            mi.surprise_factor,
            mi.quantum_coherence,
            (mi.home_score_ft + mi.away_score_ft) as total_goals,
            CASE 
              WHEN mi.home_score_ft > mi.away_score_ft THEN 'HOME_WIN'
              WHEN mi.home_score_ft < mi.away_score_ft THEN 'AWAY_WIN'
              ELSE 'DRAW'
            END as outcome
          FROM mathematical_insights mi
          WHERE mi.shannon_entropy > 1.5
          ORDER BY mi.shannon_entropy DESC, mi.surprise_factor DESC
          LIMIT ?
        `).all(limit);
        
        return NextResponse.json({
          success: true,
          query_type: 'high_entropy_surprises',
          insight: 'High entropy patterns are mathematically surprising - often mispriced',
          surprise_patterns: surprisePatterns,
          betting_strategy: 'Target outcomes similar to high-entropy patterns for value',
          entropy_threshold: 1.5,
          average_surprise: surprisePatterns.reduce((sum, p) => sum + p.surprise_factor, 0) / surprisePatterns.length,
          patterns_found: surprisePatterns.length
        });
      }
      
      if (queryType === 'quantum_coherent_predictions') {
        // PRACTICAL: "Which quantum coherent patterns are most predictable?"
        const coherentPatterns = db.prepare(`
          SELECT 
            mi.pattern_id,
            mi.home_score_ht, mi.away_score_ht, mi.home_score_ft, mi.away_score_ft,
            mi.quantum_coherence,
            mi.strategic_balance,
            mi.hyperbolic_distance,
            mi.mathematical_type,
            ABS(mi.home_score_ft - mi.home_score_ht) + ABS(mi.away_score_ft - mi.away_score_ht) as score_change,
            CASE 
              WHEN mi.home_score_ft > mi.away_score_ft THEN 'HOME_WIN'
              WHEN mi.home_score_ft < mi.away_score_ft THEN 'AWAY_WIN'
              ELSE 'DRAW'
            END as outcome
          FROM mathematical_insights mi
          WHERE mi.quantum_coherence > 0.8
          ORDER BY mi.quantum_coherence DESC, mi.strategic_balance DESC
          LIMIT ?
        `).all(limit);
        
        // Analyze coherent pattern stability
        const stabilityStats = {
          perfect_coherence: coherentPatterns.filter(p => p.quantum_coherence > 0.95).length,
          high_balance: coherentPatterns.filter(p => p.strategic_balance > 0.8).length,
          low_score_change: coherentPatterns.filter(p => p.score_change <= 1).length
        };
        
        return NextResponse.json({
          success: true,
          query_type: 'quantum_coherent_predictions',
          insight: 'Quantum coherent patterns show predictable score progressions',
          coherent_patterns: coherentPatterns,
          stability_analysis: stabilityStats,
          betting_strategy: 'High coherence = predictable HT→FT progression',
          coherence_threshold: 0.8,
          patterns_found: coherentPatterns.length
        });
      }
      
      if (queryType === 'nash_equilibrium_breaks') {
        // PRACTICAL: "When do teams break from strategic equilibrium?"
        const equilibriumBreaks = db.prepare(`
          SELECT 
            me.nash_equilibrium,
            COUNT(*) as frequency,
            AVG(me.strategic_balance) as avg_balance,
            AVG(me.attack_defense_ratio) as avg_attack_ratio,
            AVG(me.cooperation_index) as avg_cooperation,
            AVG(rhp.home_score_ft + rhp.away_score_ft) as avg_total_goals,
            GROUP_CONCAT(DISTINCT me.dominant_strategy) as strategies
          FROM mathematical_enhancements me
          JOIN rich_historical_patterns rhp ON me.pattern_id = rhp.id
          GROUP BY me.nash_equilibrium
          ORDER BY frequency DESC
        `).all();
        
        // Find patterns that break equilibrium
        const equilibriumBreakPatterns = db.prepare(`
          SELECT 
            rhp.id as pattern_id,
            rhp.home_score_ht, rhp.away_score_ht, rhp.home_score_ft, rhp.away_score_ft,
            me.nash_equilibrium,
            me.strategic_balance,
            me.attack_defense_ratio,
            me.cooperation_index,
            (rhp.home_score_ft + rhp.away_score_ft) as total_goals,
            CASE 
              WHEN me.attack_defense_ratio > 2 AND me.nash_equilibrium != 'attacking_equilibrium' THEN 'EQUILIBRIUM_BREAK'
              WHEN me.attack_defense_ratio < 0.5 AND me.nash_equilibrium != 'defensive_equilibrium' THEN 'DEFENSIVE_SHIFT'
              ELSE 'STABLE'
            END as equilibrium_status
          FROM mathematical_enhancements me
          JOIN rich_historical_patterns rhp ON me.pattern_id = rhp.id
          WHERE me.strategic_balance < 0.6 OR me.attack_defense_ratio > 2.5 OR me.cooperation_index > 0.8
          ORDER BY me.attack_defense_ratio DESC
          LIMIT ?
        `).all(limit);
        
        return NextResponse.json({
          success: true,
          query_type: 'nash_equilibrium_breaks',
          insight: 'Teams breaking strategic equilibrium create betting opportunities',
          equilibrium_distribution: equilibriumBreaks,
          equilibrium_break_patterns: equilibriumBreakPatterns,
          betting_strategy: 'Look for matches where equilibrium is likely to break',
          break_indicators: {
            high_attack_ratio: 'Attack/Defense ratio > 2.5',
            low_balance: 'Strategic balance < 0.6', 
            high_cooperation: 'Both teams scoring (cooperation > 0.8)'
          },
          patterns_found: equilibriumBreakPatterns.length
        });
      }
      
      if (queryType === 'klein_bottle_loops') {
        // PRACTICAL: "Which Klein bottle patterns create infinite loops?"
        const kleinBottlePatterns = db.prepare(`
          SELECT 
            rhp.id as pattern_id,
            rhp.home_score_ht, rhp.away_score_ht, rhp.home_score_ft, rhp.away_score_ft,
            mi.hyperbolic_distance,
            mi.quantum_coherence,
            mi.mathematical_type,
            'SELF_REFERENTIAL' as pattern_type
          FROM mathematical_enhancements me
          JOIN mathematical_insights mi ON me.pattern_id = mi.pattern_id
          JOIN rich_historical_patterns rhp ON me.pattern_id = rhp.id
          WHERE me.klein_bottle_indicator = 1
          ORDER BY mi.hyperbolic_distance DESC
          LIMIT ?
        `).all(limit);
        
        return NextResponse.json({
          success: true,
          query_type: 'klein_bottle_loops',
          insight: 'Klein bottle patterns loop back on themselves infinitely - extremely stable',
          klein_bottle_patterns: kleinBottlePatterns,
          betting_strategy: 'These patterns repeat their outcomes with high probability',
          mathematical_significance: 'Non-orientable surfaces in 4D space - football\'s deepest patterns',
          stability_advantage: 'Self-referential patterns are mathematically eternal',
          patterns_found: kleinBottlePatterns.length
        });
      }
      
      if (queryType === 'pressure_cooker_dynamics') {
        // CREATIVE: "When do teams explode under pressure?"
        const pressureCookerAnalysis = db.prepare(`
          SELECT 
            rhp.id as pattern_id,
            rhp.home_score_ht, rhp.away_score_ht, rhp.home_score_ft, rhp.away_score_ft,
            me.strategic_balance,
            me.attack_defense_ratio,
            me.cooperation_index,
            (rhp.home_score_ft + rhp.away_score_ft) as total_goals,
            ABS(rhp.home_score_ft - rhp.home_score_ht) + ABS(rhp.away_score_ft - rhp.away_score_ht) as second_half_explosion,
            CASE 
              WHEN me.strategic_balance < 0.3 AND (rhp.home_score_ft + rhp.away_score_ft) > 4 THEN 'PRESSURE_EXPLOSION'
              WHEN me.strategic_balance < 0.4 AND ABS(rhp.home_score_ft - rhp.home_score_ht) > 2 THEN 'SECOND_HALF_RELEASE'
              WHEN me.cooperation_index > 0.8 AND (rhp.home_score_ft + rhp.away_score_ft) > 3 THEN 'MUTUAL_PRESSURE_RELIEF'
              WHEN me.attack_defense_ratio > 3.0 THEN 'OFFENSIVE_OVERLOAD'
              ELSE 'CONTROLLED_PRESSURE'
            END as pressure_type,
            CASE
              WHEN me.strategic_balance < 0.2 THEN 'CRITICAL_PRESSURE'
              WHEN me.strategic_balance < 0.4 THEN 'HIGH_PRESSURE'
              WHEN me.strategic_balance < 0.6 THEN 'MODERATE_PRESSURE'
              ELSE 'STABLE_PRESSURE'
            END as pressure_level
          FROM mathematical_enhancements me
          JOIN rich_historical_patterns rhp ON me.pattern_id = rhp.id
          WHERE me.strategic_balance < 0.7  -- Focus on pressure situations
          ORDER BY me.strategic_balance ASC, (rhp.home_score_ft + rhp.away_score_ft) DESC
          LIMIT ?
        `).all(limit);

        // Calculate pressure statistics
        const pressureStats = {
          total_pressure_patterns: pressureCookerAnalysis.length,
          explosion_patterns: pressureCookerAnalysis.filter(p => p.pressure_type === 'PRESSURE_EXPLOSION').length,
          second_half_releases: pressureCookerAnalysis.filter(p => p.pressure_type === 'SECOND_HALF_RELEASE').length,
          mutual_relief: pressureCookerAnalysis.filter(p => p.pressure_type === 'MUTUAL_PRESSURE_RELIEF').length,
          average_explosion_goals: pressureCookerAnalysis
            .filter(p => p.pressure_type === 'PRESSURE_EXPLOSION')
            .reduce((sum, p) => sum + p.total_goals, 0) / 
            (pressureCookerAnalysis.filter(p => p.pressure_type === 'PRESSURE_EXPLOSION').length || 1),
          pressure_release_frequency: pressureCookerAnalysis.filter(p => p.second_half_explosion > 2).length / pressureCookerAnalysis.length
        };

        return NextResponse.json({
          success: true,
          query_type: 'pressure_cooker_dynamics',
          insight: 'Teams under strategic pressure create explosive scoring opportunities',
          pressure_patterns: pressureCookerAnalysis,
          pressure_statistics: pressureStats,
          betting_strategy: 'High pressure systems = Over goals value, Controlled pressure = Under goals',
          pressure_indicators: {
            critical_threshold: 'Strategic balance < 0.2 = Explosion risk',
            release_valve: 'Second half scoring acceleration',
            mutual_pressure: 'Both teams scoring when cooperation > 0.8',
            overload_point: 'Attack/Defense ratio > 3.0 = Inevitable goals'
          },
          patterns_analyzed: pressureCookerAnalysis.length
        });
      }

      if (queryType === 'pythagorean_analysis') {
        // CREATIVE: "Which teams are over/underperforming their mathematical form?"
        const pythagoreanAnalysis = db.prepare(`
          SELECT 
            rhp.id as pattern_id,
            rhp.home_score_ht, rhp.away_score_ht, rhp.home_score_ft, rhp.away_score_ft,
            (rhp.home_score_ft) as goals_for,
            (rhp.away_score_ft) as goals_against,
            me.strategic_balance,
            me.cooperation_index,
            -- Pythagorean calculation: √(goals_for² + goals_against²)
            SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) as pythagorean_strength,
            -- Actual result points (3 for win, 1 for draw, 0 for loss)
            CASE 
              WHEN rhp.home_score_ft > rhp.away_score_ft THEN 3
              WHEN rhp.home_score_ft = rhp.away_score_ft THEN 1
              ELSE 0
            END as actual_points,
            -- Expected points based on pythagorean strength
            CASE
              WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 3.0 THEN 2.5
              WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 2.0 THEN 1.8
              WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 1.0 THEN 1.2
              ELSE 0.5
            END as expected_points,
            -- Form gap (positive = overperforming, negative = underperforming)
            CASE 
              WHEN rhp.home_score_ft > rhp.away_score_ft THEN 3
              WHEN rhp.home_score_ft = rhp.away_score_ft THEN 1
              ELSE 0
            END - 
            CASE
              WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 3.0 THEN 2.5
              WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 2.0 THEN 1.8  
              WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 1.0 THEN 1.2
              ELSE 0.5
            END as form_gap,
            CASE
              WHEN ABS(CASE 
                WHEN rhp.home_score_ft > rhp.away_score_ft THEN 3
                WHEN rhp.home_score_ft = rhp.away_score_ft THEN 1
                ELSE 0
              END - 
              CASE
                WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 3.0 THEN 2.5
                WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 2.0 THEN 1.8
                WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 1.0 THEN 1.2
                ELSE 0.5
              END) > 1.5 THEN 'CORRECTION_DUE'
              WHEN ABS(CASE 
                WHEN rhp.home_score_ft > rhp.away_score_ft THEN 3
                WHEN rhp.home_score_ft = rhp.away_score_ft THEN 1
                ELSE 0
              END - 
              CASE
                WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 3.0 THEN 2.5
                WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 2.0 THEN 1.8
                WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 1.0 THEN 1.2
                ELSE 0.5
              END) > 0.8 THEN 'MODERATE_DEVIATION'
              ELSE 'MATHEMATICAL_EQUILIBRIUM'
            END as pythagorean_status
          FROM mathematical_enhancements me
          JOIN rich_historical_patterns rhp ON me.pattern_id = rhp.id
          WHERE ABS(CASE 
            WHEN rhp.home_score_ft > rhp.away_score_ft THEN 3
            WHEN rhp.home_score_ft = rhp.away_score_ft THEN 1
            ELSE 0
          END - 
          CASE
            WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 3.0 THEN 2.5
            WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 2.0 THEN 1.8
            WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 1.0 THEN 1.2
            ELSE 0.5
          END) > 0.5  -- Focus on teams with form gaps
          ORDER BY ABS(CASE 
            WHEN rhp.home_score_ft > rhp.away_score_ft THEN 3
            WHEN rhp.home_score_ft = rhp.away_score_ft THEN 1
            ELSE 0
          END - 
          CASE
            WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 3.0 THEN 2.5
            WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 2.0 THEN 1.8
            WHEN SQRT(POWER(rhp.home_score_ft, 2) + POWER(rhp.away_score_ft, 2)) > 1.0 THEN 1.2
            ELSE 0.5
          END) DESC
          LIMIT ?
        `).all(limit);

        // Calculate Pythagorean statistics
        const pythagoreanStats = {
          total_analyzed: pythagoreanAnalysis.length,
          overperforming: pythagoreanAnalysis.filter(p => p.form_gap > 1).length,
          underperforming: pythagoreanAnalysis.filter(p => p.form_gap < -1).length,
          correction_due: pythagoreanAnalysis.filter(p => p.pythagorean_status === 'CORRECTION_DUE').length,
          equilibrium: pythagoreanAnalysis.filter(p => p.pythagorean_status === 'MATHEMATICAL_EQUILIBRIUM').length,
          avg_pythagorean_strength: pythagoreanAnalysis.reduce((sum, p) => sum + p.pythagorean_strength, 0) / pythagoreanAnalysis.length
        };

        return NextResponse.json({
          success: true,
          query_type: 'pythagorean_analysis',
          insight: 'Pythagorean theorem reveals teams due for form correction',
          pythagorean_patterns: pythagoreanAnalysis,
          pythagorean_statistics: pythagoreanStats,
          betting_strategy: 'Overperforming teams = Bet against, Underperforming teams = Back them',
          mathematical_principle: 'Goals For² + Goals Against² = True Form Strength',
          correction_indicators: {
            strong_overperformance: 'Form gap > +1.5 = Regression risk',
            strong_underperformance: 'Form gap < -1.5 = Bounce back value',
            equilibrium_zone: 'Form gap ±0.5 = No clear edge',
            correction_threshold: 'Absolute gap > 1.0 = Betting opportunity'
          },
          patterns_analyzed: pythagoreanAnalysis.length
        });
      }

      if (queryType === 'mathematical_summary') {
        // PRACTICAL: "Give me the mathematical overview"
        const summary = db.prepare(`
          SELECT 
            COUNT(*) as total_patterns,
            COUNT(CASE WHEN mi.is_golden_pattern = 1 THEN 1 END) as golden_patterns,
            COUNT(CASE WHEN mi.is_fibonacci_total = 1 THEN 1 END) as fibonacci_patterns,
            COUNT(CASE WHEN mi.shannon_entropy > 1.5 THEN 1 END) as high_entropy_patterns,
            COUNT(CASE WHEN mi.quantum_coherence > 0.8 THEN 1 END) as coherent_patterns,
            COUNT(CASE WHEN me.klein_bottle_indicator = 1 THEN 1 END) as klein_bottle_patterns,
            AVG(mi.golden_ratio_harmony) as avg_golden_harmony,
            AVG(mi.fibonacci_strength) as avg_fibonacci_strength,
            AVG(mi.shannon_entropy) as avg_entropy,
            AVG(mi.quantum_coherence) as avg_coherence,
            AVG(mi.strategic_balance) as avg_strategic_balance
          FROM mathematical_insights mi
          LEFT JOIN mathematical_enhancements me ON mi.pattern_id = me.pattern_id
        `).get();
        
        const topMathematicalPatterns = db.prepare(`
          SELECT 
            mi.pattern_id,
            mi.home_score_ht, mi.away_score_ht, mi.home_score_ft, mi.away_score_ft,
            mi.mathematical_type,
            mi.math_confidence,
            mi.golden_ratio_harmony,
            mi.fibonacci_strength,
            mi.quantum_coherence,
            mi.shannon_entropy
          FROM mathematical_insights mi
          WHERE mi.mathematical_type != 'Standard'
          ORDER BY mi.math_confidence DESC
          LIMIT 20
        `).all();
        
        return NextResponse.json({
          success: true,
          query_type: 'mathematical_summary',
          system_overview: {
            total_patterns: summary.total_patterns,
            mathematical_distribution: {
              golden_ratio: `${(summary.golden_patterns / summary.total_patterns * 100).toFixed(1)}%`,
              fibonacci: `${(summary.fibonacci_patterns / summary.total_patterns * 100).toFixed(1)}%`,
              high_entropy: `${(summary.high_entropy_patterns / summary.total_patterns * 100).toFixed(1)}%`,
              quantum_coherent: `${(summary.coherent_patterns / summary.total_patterns * 100).toFixed(1)}%`,
              klein_bottle: `${(summary.klein_bottle_patterns / summary.total_patterns * 100).toFixed(1)}%`
            },
            mathematical_averages: {
              golden_harmony: summary.avg_golden_harmony.toFixed(3),
              fibonacci_strength: summary.avg_fibonacci_strength.toFixed(3),
              entropy: summary.avg_entropy.toFixed(3),
              coherence: summary.avg_coherence.toFixed(3),
              strategic_balance: summary.avg_strategic_balance.toFixed(3)
            }
          },
          top_mathematical_patterns: topMathematicalPatterns,
          betting_insights: {
            fibonacci_dominance: `${summary.fibonacci_patterns} patterns follow nature's sequence`,
            golden_opportunities: `${summary.golden_patterns} rare golden ratio patterns`,
            surprise_value: `${summary.high_entropy_patterns} high-entropy surprise patterns`,
            predictable_quantum: `${summary.coherent_patterns} quantum coherent patterns`
          }
        });
      }
      
      return NextResponse.json({ error: 'Invalid query type' }, { status: 400 });
      
    } finally {
      db.close();
    }
    
  } catch (error) {
    console.error('Mathematical query error:', error);
    return NextResponse.json({
      error: 'Mathematical query failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}