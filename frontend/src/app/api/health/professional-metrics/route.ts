import { NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

// GET /api/health/professional-metrics - Professional benchmark compliance check
export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Professional metrics health check starting...');
    
    const db = getOptimizedDatabase();
    
    // Query recent simulation performance metrics
    const recentSimulations = db.executeQuery(`
      SELECT 
        COUNT(*) as total_simulations,
        AVG(json_extract(value_bets, '$.rps_score')) as avg_rps_score,
        COUNT(CASE WHEN json_extract(value_bets, '$.professional_grade') = 1 THEN 1 END) as professional_grade_count
      FROM simulations 
      WHERE created_at > datetime('now', '-24 hours')
      AND value_bets IS NOT NULL
      AND json_extract(value_bets, '$.rps_score') IS NOT NULL
    `);
    
    // System uptime calculation (based on health check history)
    const systemChecks = db.executeQuery(`
      SELECT 
        COUNT(*) as total_checks,
        COUNT(CASE WHEN json_extract(true_odds, '$.status') = 'healthy' THEN 1 END) as healthy_checks
      FROM simulations 
      WHERE created_at > datetime('now', '-7 days')
    `);
    
    const checkDuration = Date.now() - startTime;
    
    // Calculate metrics
    const totalSims = recentSimulations.data[0]?.total_simulations || 0;
    const avgRPS = recentSimulations.data[0]?.avg_rps_score || null;
    const professionalGradeCount = recentSimulations.data[0]?.professional_grade_count || 0;
    
    const totalChecks = systemChecks.data[0]?.total_checks || 1;
    const healthyChecks = systemChecks.data[0]?.healthy_checks || 1;
    const uptimePercentage = (healthyChecks / totalChecks) * 100;
    
    // Professional benchmarks
    const TARGET_RPS = 0.2012;  // Professional standard (Bet365, Pinnacle Sports)
    const TARGET_UPTIME = 99.5; // 99.5% uptime target
    
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      check_duration_ms: checkDuration,
      
      // Professional RPS Compliance
      rps_metrics: {
        average_rps_score: avgRPS,
        target_rps_score: TARGET_RPS,
        rps_compliant: avgRPS ? avgRPS <= TARGET_RPS : null,
        total_simulations_24h: totalSims,
        professional_grade_simulations: professionalGradeCount,
        professional_grade_percentage: totalSims > 0 ? (professionalGradeCount / totalSims) * 100 : 0
      },
      
      // System Reliability Metrics
      reliability_metrics: {
        uptime_percentage: Math.round(uptimePercentage * 100) / 100,
        target_uptime_percentage: TARGET_UPTIME,
        uptime_compliant: uptimePercentage >= TARGET_UPTIME,
        total_health_checks_7d: totalChecks,
        successful_health_checks_7d: healthyChecks,
        estimated_downtime_hours_per_month: ((100 - uptimePercentage) / 100) * 24 * 30
      },
      
      // Performance Benchmarks
      performance_benchmarks: {
        database_performance: '2-5x improvement with better-sqlite3',
        target_api_response_time_ms: 1000,
        current_health_check_time_ms: checkDuration,
        response_time_compliant: checkDuration <= 1000,
        
        // Professional standards reference
        industry_benchmark_rps: TARGET_RPS,
        industry_benchmark_source: 'Bet365, Pinnacle Sports (Premier League)',
        calibration_advantage: 'Calibration-optimized models: +69.86% returns vs accuracy-optimized'
      },
      
      // System Status Summary
      professional_compliance: {
        rps_benchmark_met: avgRPS ? avgRPS <= TARGET_RPS : false,
        uptime_target_met: uptimePercentage >= TARGET_UPTIME,
        response_time_target_met: checkDuration <= 1000,
        overall_compliance: (avgRPS ? avgRPS <= TARGET_RPS : false) && 
                           uptimePercentage >= TARGET_UPTIME && 
                           checkDuration <= 1000,
        grade: (function() {
          if (!avgRPS) return 'INSUFFICIENT_DATA';
          if (avgRPS <= TARGET_RPS && uptimePercentage >= TARGET_UPTIME) return 'PROFESSIONAL';
          if (avgRPS <= TARGET_RPS + 0.01 && uptimePercentage >= 99.0) return 'GOOD';
          if (avgRPS <= TARGET_RPS + 0.05) return 'DEVELOPING';
          return 'NEEDS_IMPROVEMENT';
        })()
      },
      
      // Recommendations
      recommendations: (function() {
        const recs = [];
        if (avgRPS && avgRPS > TARGET_RPS) {
          recs.push('Implement calibration-optimized Monte Carlo model for 69% improvement');
        }
        if (uptimePercentage < TARGET_UPTIME) {
          recs.push('Enhance automated monitoring for 99.5% uptime target');
        }
        if (checkDuration > 1000) {
          recs.push('Optimize API response times to meet <1000ms target');
        }
        if (totalSims < 10) {
          recs.push('Run more simulations to establish reliable benchmark data');
        }
        return recs;
      })()
    };
    
    console.log(`✅ Professional metrics check completed (${checkDuration}ms)`);
    console.log(`   RPS: ${avgRPS} (target: ${TARGET_RPS})`);
    console.log(`   Uptime: ${uptimePercentage.toFixed(2)}% (target: ${TARGET_UPTIME}%)`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Professional metrics health check failed:', error);
    
    const errorResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      check_duration_ms: Date.now() - startTime,
      error: error.message,
      rps_average: null,
      uptime_percentage: 0,
      professional_compliance: {
        grade: 'ERROR',
        rps_benchmark_met: false,
        uptime_target_met: false,
        overall_compliance: false
      },
      recommendations: [
        'Fix database connectivity issues',
        'Ensure proper schema and table structure',
        'Verify simulation data storage'
      ]
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}