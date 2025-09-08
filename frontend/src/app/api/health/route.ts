import { NextResponse } from 'next/server';
import { getHealthMonitor } from '@/utils/health-monitor';

// GET /api/health - Complete system health check
export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Complete system health check starting...');
    
    const healthMonitor = getHealthMonitor();
    const healthResult = await healthMonitor.runFullHealthCheck();
    
    // Add additional metadata
    const enhancedResult = {
      ...healthResult,
      api_endpoint: '/api/health',
      total_duration_ms: Date.now() - startTime,
      health_trends: healthMonitor.getHealthTrends(),
      uptime_analysis: healthMonitor.calculateUptime(),
      
      // System overview
      system_overview: {
        database_optimized: healthResult.checks.database?.status === 'healthy',
        simulation_operational: healthResult.checks.simulation_engine?.status === 'healthy',
        professional_grade: healthResult.checks.professional_compliance?.details?.professional_grade === 'PROFESSIONAL',
        overall_performance: healthResult.overall_status,
        
        // Performance improvements achieved
        optimizations_active: {
          better_sqlite3: true,
          wal_mode: healthResult.checks.database?.details?.journal_mode === 'wal',
          memory_mapping: healthResult.checks.database?.details?.cache_size_mb > 100,
          prepared_statements: true,
          transactions: true
        }
      },
      
      // Quick status indicators for dashboard
      dashboard_indicators: {
        database: {
          status: healthResult.checks.database?.status || 'unknown',
          response_time: healthResult.checks.database?.response_time || 0,
          grade: healthResult.checks.database?.details?.performance_grade || 'UNKNOWN'
        },
        simulation: {
          status: healthResult.checks.simulation_engine?.status || 'unknown',
          response_time: healthResult.checks.simulation_engine?.response_time || 0,
          rps_compliant: healthResult.checks.professional_compliance?.details?.rps_compliant || false
        },
        system: {
          status: healthResult.checks.system_resources?.status || 'unknown',
          memory_ok: !healthResult.checks.system_resources?.details?.memory_usage?.usage_percentage || 
                    healthResult.checks.system_resources.details.memory_usage.usage_percentage < 0.8
        }
      }
    };
    
    // Determine HTTP status code
    const httpStatus = healthResult.overall_status === 'healthy' ? 200 :
                      healthResult.overall_status === 'warning' ? 200 :
                      500;
    
    console.log(`✅ Complete system health check finished: ${healthResult.overall_status} (${Date.now() - startTime}ms)`);
    
    return NextResponse.json(enhancedResult, { status: httpStatus });
    
  } catch (error) {
    console.error('❌ Complete system health check failed:', error);
    
    const errorResponse = {
      timestamp: new Date(),
      overall_status: 'critical',
      total_duration_ms: Date.now() - startTime,
      error: error.message,
      checks: {
        system_error: {
          status: 'error',
          error: error.message,
          severity: 'critical',
          message: 'Health monitoring system failure'
        }
      },
      alerts: [{
        component: 'health_monitor',
        severity: 'critical' as const,
        message: 'Health monitoring system failure',
        timestamp: new Date()
      }],
      
      system_overview: {
        database_optimized: false,
        simulation_operational: false,
        professional_grade: false,
        overall_performance: 'critical'
      }
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/health - Trigger manual health check (optional)
export async function POST() {
  try {
    console.log('🔄 Manual health check triggered...');
    
    const healthMonitor = getHealthMonitor();
    const result = await healthMonitor.runFullHealthCheck();
    
    return NextResponse.json({
      message: 'Manual health check completed',
      triggered_at: new Date().toISOString(),
      ...result
    });
    
  } catch (error) {
    console.error('❌ Manual health check failed:', error);
    
    return NextResponse.json({
      error: 'Manual health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}