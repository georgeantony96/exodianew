/**
 * Performance Monitoring Utilities
 * Based on CLAUDE_TECHNICAL_REFERENCE_2025.md recommendations
 */
import React from 'react';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceTracker {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Start tracking a performance metric
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (this.isProduction && Math.random() > 0.1) {
      // Only track 10% of operations in production
      return;
    }

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
  }

  /**
   * End tracking and calculate duration
   */
  end(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" was not started`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log slow operations (>500ms)
    if (duration > 500) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metric.metadata);
    }

    // Log to console in development
    if (!this.isProduction) {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`, metric.metadata);
    }

    return duration;
  }

  /**
   * Track a database operation
   */
  trackDbOperation(operation: string, table: string) {
    return {
      start: () => this.start(`db:${operation}:${table}`, { operation, table }),
      end: () => this.end(`db:${operation}:${table}`)
    };
  }

  /**
   * Track an API call
   */
  trackApiCall(endpoint: string, method: string = 'GET') {
    return {
      start: () => this.start(`api:${method}:${endpoint}`, { endpoint, method }),
      end: () => this.end(`api:${method}:${endpoint}`)
    };
  }

  /**
   * Track a simulation run
   */
  trackSimulation(iterations: number, teams: { home: string; away: string }) {
    return {
      start: () => this.start('simulation:run', { iterations, teams }),
      end: () => this.end('simulation:run')
    };
  }

  /**
   * Get performance summary
   */
  getSummary(): { metric: string; duration: number; metadata?: any }[] {
    return Array.from(this.metrics.values())
      .filter(m => m.duration !== undefined)
      .map(m => ({
        metric: m.name,
        duration: m.duration!,
        metadata: m.metadata
      }))
      .sort((a, b) => b.duration - a.duration);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

// Singleton instance
export const perf = new PerformanceTracker();

/**
 * Decorator for tracking function performance
 */
export function trackPerformance(name?: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function(...args: any[]) {
      perf.start(metricName);
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        perf.end(metricName);
      }
    };

    return descriptor;
  };
}

/**
 * Hook for tracking React component render performance
 */
export function usePerformanceTracking(componentName: string) {
  const startTime = React.useRef<number>();

  React.useEffect(() => {
    startTime.current = performance.now();
    return () => {
      if (startTime.current) {
        const duration = performance.now() - startTime.current;
        if (duration > 100) { // Only log slow renders
          console.log(`🐌 Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
        }
      }
    };
  });
}