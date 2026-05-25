import logger from '../config/logger';

/**
 * Metrics collection utility for monitoring system performance
 * Tracks conversion metrics, API metrics, and system metrics
 */

export interface ConversionMetrics {
  started: number;
  completed: number;
  failed: number;
  averageTimeMs: number;
  totalSongsMatched: number;
  totalSongsUnmatched: number;
  matchingAccuracy: number;
}

export interface APIMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTimeMs: number;
  p95ResponseTimeMs: number;
  p99ResponseTimeMs: number;
  errorRate: number;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  dbConnectionPoolUtilization: number;
  redisMemoryUsage: number;
  queueDepth: number;
}

class MetricsCollector {
  private conversionMetrics: ConversionMetrics = {
    started: 0,
    completed: 0,
    failed: 0,
    averageTimeMs: 0,
    totalSongsMatched: 0,
    totalSongsUnmatched: 0,
    matchingAccuracy: 0,
  };

  private apiMetrics: APIMetrics = {
    requestCount: 0,
    errorCount: 0,
    averageResponseTimeMs: 0,
    p95ResponseTimeMs: 0,
    p99ResponseTimeMs: 0,
    errorRate: 0,
  };

  private responseTimes: number[] = [];
  private conversionTimes: number[] = [];

  /**
   * Record a conversion start
   */
  recordConversionStart(): void {
    this.conversionMetrics.started++;
    logger.debug('Conversion started', {
      totalStarted: this.conversionMetrics.started,
    });
  }

  /**
   * Record a successful conversion
   * @param durationMs - Duration of the conversion in milliseconds
   * @param songsMatched - Number of songs matched
   * @param songsUnmatched - Number of songs unmatched
   */
  recordConversionSuccess(
    durationMs: number,
    songsMatched: number,
    songsUnmatched: number
  ): void {
    this.conversionMetrics.completed++;
    this.conversionMetrics.totalSongsMatched += songsMatched;
    this.conversionMetrics.totalSongsUnmatched += songsUnmatched;

    this.conversionTimes.push(durationMs);
    this.updateConversionMetrics();

    logger.info('Conversion completed', {
      durationMs,
      songsMatched,
      songsUnmatched,
      totalCompleted: this.conversionMetrics.completed,
    });
  }

  /**
   * Record a failed conversion
   */
  recordConversionFailure(): void {
    this.conversionMetrics.failed++;
    logger.warn('Conversion failed', {
      totalFailed: this.conversionMetrics.failed,
    });
  }

  /**
   * Record an API request
   * @param durationMs - Duration of the API request in milliseconds
   * @param statusCode - HTTP status code
   */
  recordAPIRequest(durationMs: number, statusCode: number): void {
    this.apiMetrics.requestCount++;
    this.responseTimes.push(durationMs);

    if (statusCode >= 400) {
      this.apiMetrics.errorCount++;
    }

    this.updateAPIMetrics();
  }

  /**
   * Get current conversion metrics
   */
  getConversionMetrics(): ConversionMetrics {
    return { ...this.conversionMetrics };
  }

  /**
   * Get current API metrics
   */
  getAPIMetrics(): APIMetrics {
    return { ...this.apiMetrics };
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    return {
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      memoryUsage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      dbConnectionPoolUtilization: 0, // To be implemented with actual DB pool
      redisMemoryUsage: 0, // To be implemented with actual Redis
      queueDepth: 0, // To be implemented with actual queue
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): {
    conversion: ConversionMetrics;
    api: APIMetrics;
    system: SystemMetrics;
  } {
    return {
      conversion: this.getConversionMetrics(),
      api: this.getAPIMetrics(),
      system: this.getSystemMetrics(),
    };
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.conversionMetrics = {
      started: 0,
      completed: 0,
      failed: 0,
      averageTimeMs: 0,
      totalSongsMatched: 0,
      totalSongsUnmatched: 0,
      matchingAccuracy: 0,
    };
    this.apiMetrics = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTimeMs: 0,
      p95ResponseTimeMs: 0,
      p99ResponseTimeMs: 0,
      errorRate: 0,
    };
    this.responseTimes = [];
    this.conversionTimes = [];
  }

  /**
   * Log metrics to logger
   */
  logMetrics(): void {
    const metrics = this.getAllMetrics();
    logger.info('System metrics', {
      conversion: metrics.conversion,
      api: metrics.api,
      system: metrics.system,
    });
  }

  /**
   * Update conversion metrics calculations
   */
  private updateConversionMetrics(): void {
    if (this.conversionTimes.length > 0) {
      this.conversionMetrics.averageTimeMs =
        this.conversionTimes.reduce((a, b) => a + b, 0) /
        this.conversionTimes.length;
    }

    const totalSongs =
      this.conversionMetrics.totalSongsMatched +
      this.conversionMetrics.totalSongsUnmatched;
    if (totalSongs > 0) {
      this.conversionMetrics.matchingAccuracy =
        (this.conversionMetrics.totalSongsMatched / totalSongs) * 100;
    }
  }

  /**
   * Update API metrics calculations
   */
  private updateAPIMetrics(): void {
    if (this.responseTimes.length > 0) {
      // Calculate average
      this.apiMetrics.averageResponseTimeMs =
        this.responseTimes.reduce((a, b) => a + b, 0) /
        this.responseTimes.length;

      // Calculate percentiles
      const sorted = [...this.responseTimes].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p99Index = Math.floor(sorted.length * 0.99);

      this.apiMetrics.p95ResponseTimeMs = sorted[p95Index] || 0;
      this.apiMetrics.p99ResponseTimeMs = sorted[p99Index] || 0;
    }

    // Calculate error rate
    if (this.apiMetrics.requestCount > 0) {
      this.apiMetrics.errorRate =
        (this.apiMetrics.errorCount / this.apiMetrics.requestCount) * 100;
    }
  }
}

// Export singleton instance
export const metricsCollector = new MetricsCollector();

export default metricsCollector;
