// RESEARCH-BASED: Professional Health Monitoring System (2025)
// Target: 99.5% uptime with 65% MTTR reduction

export class SystemHealthMonitor {
  private alertThresholds = {
    responseTime: 1000,    // ms - Warning above 1 second
    errorRate: 0.05,       // 5% error rate threshold
    memoryUsage: 0.8,      // 80% memory usage threshold
    rpsScore: 0.2012,      // Professional RPS benchmark
    dbQueryTime: 200       // ms - Database query warning threshold
  };

  private healthHistory: HealthCheck[] = [];
  private maxHistorySize = 100;

  async runFullHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const results: HealthCheckResult = {
      timestamp: new Date(),
      overall_status: 'healthy',
      checks: {},
      duration_ms: 0,
      alerts: []
    };

    try {
      console.log('🔍 Starting comprehensive health check...');

      // Run all health checks in parallel for speed
      const [
        databaseHealth,
        simulationHealth,
        systemHealth,
        professionalCompliance
      ] = await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.checkSimulationEngine(),
        this.checkSystemResources(),
        this.checkProfessionalCompliance()
      ]);

      // Process results
      results.checks.database = this.processPromiseResult(databaseHealth);
      results.checks.simulation_engine = this.processPromiseResult(simulationHealth);
      results.checks.system_resources = this.processPromiseResult(systemHealth);
      results.checks.professional_compliance = this.processPromiseResult(professionalCompliance);

      // Determine overall status and generate alerts
      results.overall_status = this.determineOverallStatus(results.checks);
      results.alerts = this.generateAlerts(results.checks);
      results.duration_ms = Date.now() - startTime;

      // Store in history for trend analysis
      this.addToHistory(results);

      console.log(`✅ Health check completed in ${results.duration_ms}ms - Status: ${results.overall_status}`);

    } catch (error) {
      console.error('❌ Health check failed:', error);
      results.overall_status = 'critical';
      results.checks.system_error = {
        status: 'error',
        error: error.message,
        severity: 'critical',
        response_time: Date.now() - startTime
      };
    }

    return results;
  }

  private async checkDatabaseHealth(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      // Test database connectivity and performance
      const response = await fetch('/api/health/database', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      const data = await response.json();
      const responseTime = Date.now() - start;

      const status = response.ok && data.status === 'healthy' ? 'healthy' : 'error';
      const severity = this.getSeverityLevel(responseTime, this.alertThresholds.dbQueryTime);

      return {
        status,
        response_time: responseTime,
        details: {
          database_responsive: data.database_responsive,
          performance_grade: data.performance_grade,
          cache_size_mb: data.cache_size_mb,
          journal_mode: data.journal_mode,
          table_count: data.table_count
        },
        severity,
        message: status === 'healthy' ? 
          `Database responsive (${data.performance_grade})` : 
          'Database connection issues'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        severity: 'critical',
        response_time: Date.now() - start,
        message: 'Database health check failed'
      };
    }
  }

  private async checkSimulationEngine(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      // Test simulation engine with lightweight parameters
      const testParams = {
        home_lambda: 1.5,
        away_lambda: 1.2,
        iterations: 1000,
        distribution_type: 'poisson'
      };

      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          home_team_id: 1,
          away_team_id: 2,
          league_id: 1,
          match_date: new Date().toISOString(),
          distribution_type: 'poisson',
          iterations: 1000,
          boost_settings: {
            home_advantage: 0.1,
            custom_home_boost: 0,
            custom_away_boost: 0,
            enable_streak_analysis: false,
            enable_form_weighting: false
          },
          historical_data: { h2h: [], home_home: [], away_away: [] },
          bookmaker_odds: { 'home': 2.0, 'draw': 3.5, 'away': 3.0 }
        })
      });

      const result = await response.json();
      const responseTime = Date.now() - start;

      const status = response.ok && result.success ? 'healthy' : 'error';
      const severity = this.getSeverityLevel(responseTime, this.alertThresholds.responseTime);

      return {
        status,
        response_time: responseTime,
        details: {
          simulation_successful: result.success,
          rps_score: result.professional_benchmark?.rps_score,
          professional_grade: result.professional_benchmark?.professional_grade,
          calibration_optimized: result.calibration_optimized
        },
        severity,
        message: status === 'healthy' ? 
          'Simulation engine operational' : 
          'Simulation engine issues detected'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        severity: 'critical',
        response_time: Date.now() - start,
        message: 'Simulation engine health check failed'
      };
    }
  }

  private async checkSystemResources(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      const memoryInfo = this.getMemoryUsage();
      const performanceInfo = this.getPerformanceMetrics();
      
      // Check memory usage
      const memoryWarning = memoryInfo && memoryInfo.usage_percentage > this.alertThresholds.memoryUsage;
      
      return {
        status: memoryWarning ? 'warning' : 'healthy',
        response_time: Date.now() - start,
        details: {
          memory_usage: memoryInfo,
          performance_timing: performanceInfo,
          browser_info: this.getBrowserInfo()
        },
        severity: memoryWarning ? 'warning' : 'info',
        message: memoryWarning ? 
          'High memory usage detected' : 
          'System resources normal'
      };
    } catch (error) {
      return {
        status: 'warning',
        error: error.message,
        severity: 'warning',
        response_time: Date.now() - start,
        message: 'System resource check partially failed'
      };
    }
  }

  private async checkProfessionalCompliance(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      // Check if system meets professional standards
      const response = await fetch('/api/health/professional-metrics', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        throw new Error('Professional metrics endpoint unavailable');
      }
      
      const data = await response.json();
      const responseTime = Date.now() - start;
      
      const rpsCompliant = data.rps_average <= this.alertThresholds.rpsScore;
      const uptimeGood = data.uptime_percentage >= 99.0;
      
      const status = rpsCompliant && uptimeGood ? 'healthy' : 'warning';
      
      return {
        status,
        response_time: responseTime,
        details: {
          rps_average: data.rps_average,
          rps_target: this.alertThresholds.rpsScore,
          rps_compliant: rpsCompliant,
          uptime_percentage: data.uptime_percentage,
          uptime_target: 99.5,
          professional_grade: rpsCompliant ? 'PROFESSIONAL' : 'NEEDS_IMPROVEMENT'
        },
        severity: status === 'healthy' ? 'info' : 'warning',
        message: rpsCompliant ? 
          'Professional benchmark compliance achieved' : 
          `RPS score ${data.rps_average} exceeds target ${this.alertThresholds.rpsScore}`
      };
    } catch (error) {
      return {
        status: 'unknown',
        error: error.message,
        severity: 'info',
        response_time: Date.now() - start,
        message: 'Professional compliance check unavailable'
      };
    }
  }

  private processPromiseResult(result: PromiseSettledResult<HealthCheck>): HealthCheck {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'error',
        error: result.reason?.message || 'Unknown error',
        severity: 'critical',
        response_time: 0,
        message: 'Health check promise rejected'
      };
    }
  }

  private determineOverallStatus(checks: Record<string, HealthCheck>): HealthStatus {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('error')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'healthy';
  }

  private generateAlerts(checks: Record<string, HealthCheck>): HealthAlert[] {
    const alerts: HealthAlert[] = [];
    
    Object.entries(checks).forEach(([component, check]) => {
      if (check.severity === 'critical' || check.severity === 'warning') {
        alerts.push({
          component,
          severity: check.severity,
          message: check.message || check.error || 'Issue detected',
          response_time: check.response_time,
          timestamp: new Date()
        });
      }
    });
    
    return alerts;
  }

  private getSeverityLevel(responseTime: number, threshold: number): 'info' | 'warning' | 'critical' {
    if (responseTime > threshold * 3) return 'critical';
    if (responseTime > threshold) return 'warning';
    return 'info';
  }

  private getMemoryUsage() {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used_mb: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
        total_mb: Math.round(memory.totalJSHeapSize / (1024 * 1024)),
        limit_mb: Math.round(memory.jsHeapSizeLimit / (1024 * 1024)),
        usage_percentage: memory.usedJSHeapSize / memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  private getPerformanceMetrics() {
    if (typeof window !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        return {
          page_load_time: Math.round(navigation.loadEventEnd - navigation.fetchStart),
          dom_content_loaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
          time_to_interactive: Math.round(navigation.loadEventEnd - navigation.fetchStart)
        };
      }
    }
    return null;
  }

  private getBrowserInfo() {
    if (typeof window !== 'undefined') {
      return {
        user_agent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookie_enabled: navigator.cookieEnabled,
        online: navigator.onLine
      };
    }
    return null;
  }

  private addToHistory(result: HealthCheckResult) {
    this.healthHistory.push(result as HealthCheck);
    
    // Keep only recent history
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
    }
  }

  // Public method to get health trends
  getHealthTrends() {
    if (this.healthHistory.length < 2) {
      return { trend: 'insufficient_data', message: 'Need more data points' };
    }

    const recent = this.healthHistory.slice(-10);
    const healthy = recent.filter(h => h.status === 'healthy').length;
    const warning = recent.filter(h => h.status === 'warning').length;
    const critical = recent.filter(h => h.status === 'error').length;

    const healthyPercentage = (healthy / recent.length) * 100;

    if (healthyPercentage >= 90) {
      return { trend: 'excellent', message: 'System consistently healthy' };
    } else if (healthyPercentage >= 75) {
      return { trend: 'good', message: 'System mostly stable' };
    } else if (healthyPercentage >= 50) {
      return { trend: 'concerning', message: 'Frequent issues detected' };
    } else {
      return { trend: 'critical', message: 'System instability detected' };
    }
  }

  // Method to check if system meets 99.5% uptime target
  calculateUptime() {
    if (this.healthHistory.length < 10) {
      return { uptime: 100, message: 'Insufficient data', target_met: true };
    }

    const recent = this.healthHistory.slice(-50); // Last 50 checks
    const healthy = recent.filter(h => h.status === 'healthy').length;
    const uptime = (healthy / recent.length) * 100;
    const target = 99.5;

    return {
      uptime: Math.round(uptime * 100) / 100,
      target: target,
      target_met: uptime >= target,
      message: uptime >= target ? 
        'Meeting 99.5% uptime target' : 
        `Below target: ${uptime.toFixed(2)}% vs ${target}%`
    };
  }
}

// Type definitions
export interface HealthCheck {
  status: HealthStatus;
  response_time?: number;
  details?: any;
  error?: string;
  severity?: 'info' | 'warning' | 'critical';
  message?: string;
}

export interface HealthCheckResult extends HealthCheck {
  timestamp: Date;
  overall_status: HealthStatus;
  checks: Record<string, HealthCheck>;
  duration_ms: number;
  alerts: HealthAlert[];
}

export interface HealthAlert {
  component: string;
  severity: 'warning' | 'critical';
  message: string;
  response_time?: number;
  timestamp: Date;
}

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

// Singleton pattern for global health monitoring
let healthMonitorInstance: SystemHealthMonitor | null = null;

export function getHealthMonitor(): SystemHealthMonitor {
  if (!healthMonitorInstance) {
    healthMonitorInstance = new SystemHealthMonitor();
  }
  return healthMonitorInstance;
}

// React hook for health monitoring
export function useHealthMonitor() {
  const monitor = getHealthMonitor();
  return {
    runHealthCheck: () => monitor.runFullHealthCheck(),
    getHealthTrends: () => monitor.getHealthTrends(),
    calculateUptime: () => monitor.calculateUptime()
  };
}