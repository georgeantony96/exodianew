import { NextResponse } from 'next/server';
import { getOptimizedDatabase } from '@/utils/optimized-database';

// GET /api/health/database - Database health check endpoint
export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Database health check starting...');
    
    const db = getOptimizedDatabase();
    const healthStatus = db.getHealthStatus();
    const checkDuration = Date.now() - startTime;
    
    // Enhanced health metrics
    const response = {
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      check_duration_ms: checkDuration,
      database_responsive: healthStatus.database_responsive,
      performance_grade: healthStatus.performance_grade,
      query_time_ms: healthStatus.query_time_ms,
      details: {
        wal_pages: healthStatus.wal_pages,
        cache_size_mb: healthStatus.cache_size_mb,
        cache_size_pages: healthStatus.cache_size_pages,
        journal_mode: healthStatus.journal_mode,
        mmap_size_mb: healthStatus.mmap_size_mb,
        table_count: healthStatus.table_count
      },
      optimization_applied: {
        wal_mode: healthStatus.journal_mode === 'wal',
        memory_mapping: healthStatus.mmap_size_mb > 0,
        cache_optimized: healthStatus.cache_size_mb > 100,
        better_sqlite3: true
      },
      performance_benchmark: {
        query_speed: healthStatus.query_time_ms < 10 ? 'EXCELLENT' : 
                    healthStatus.query_time_ms < 50 ? 'GOOD' : 
                    healthStatus.query_time_ms < 200 ? 'FAIR' : 'POOR',
        expected_improvement: '2-5x faster than sqlite3',
        current_response_time: checkDuration
      }
    };
    
    // Set appropriate HTTP status based on health
    const httpStatus = healthStatus.status === 'healthy' ? 200 : 500;
    
    console.log(`✅ Database health check completed: ${healthStatus.status} (${checkDuration}ms)`);
    
    return NextResponse.json(response, { status: httpStatus });
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    
    const errorResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      check_duration_ms: Date.now() - startTime,
      database_responsive: false,
      performance_grade: 'CRITICAL',
      error: error.message,
      details: {
        error_type: error.constructor.name,
        database_connection: false,
        optimization_status: 'unknown'
      }
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}