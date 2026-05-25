import metricsCollector from './metrics';

describe('Metrics Collector', () => {
  beforeEach(() => {
    metricsCollector.resetMetrics();
  });

  describe('Conversion Metrics', () => {
    it('should initialize with zero metrics', () => {
      const metrics = metricsCollector.getConversionMetrics();

      expect(metrics.started).toBe(0);
      expect(metrics.completed).toBe(0);
      expect(metrics.failed).toBe(0);
      expect(metrics.averageTimeMs).toBe(0);
      expect(metrics.totalSongsMatched).toBe(0);
      expect(metrics.totalSongsUnmatched).toBe(0);
      expect(metrics.matchingAccuracy).toBe(0);
    });

    it('should record conversion start', () => {
      metricsCollector.recordConversionStart();
      const metrics = metricsCollector.getConversionMetrics();

      expect(metrics.started).toBe(1);
    });

    it('should record multiple conversion starts', () => {
      metricsCollector.recordConversionStart();
      metricsCollector.recordConversionStart();
      metricsCollector.recordConversionStart();

      const metrics = metricsCollector.getConversionMetrics();
      expect(metrics.started).toBe(3);
    });

    it('should record successful conversion', () => {
      metricsCollector.recordConversionSuccess(5000, 50, 5);
      const metrics = metricsCollector.getConversionMetrics();

      expect(metrics.completed).toBe(1);
      expect(metrics.totalSongsMatched).toBe(50);
      expect(metrics.totalSongsUnmatched).toBe(5);
      expect(metrics.averageTimeMs).toBe(5000);
    });

    it('should calculate average conversion time', () => {
      metricsCollector.recordConversionSuccess(1000, 10, 2);
      metricsCollector.recordConversionSuccess(3000, 15, 3);
      metricsCollector.recordConversionSuccess(2000, 12, 2);

      const metrics = metricsCollector.getConversionMetrics();

      expect(metrics.completed).toBe(3);
      expect(metrics.averageTimeMs).toBe(2000); // (1000 + 3000 + 2000) / 3
    });

    it('should calculate matching accuracy', () => {
      metricsCollector.recordConversionSuccess(1000, 90, 10);
      const metrics = metricsCollector.getConversionMetrics();

      expect(metrics.matchingAccuracy).toBe(90); // 90 / (90 + 10) * 100
    });

    it('should record failed conversion', () => {
      metricsCollector.recordConversionFailure();
      const metrics = metricsCollector.getConversionMetrics();

      expect(metrics.failed).toBe(1);
    });

    it('should accumulate song counts across conversions', () => {
      metricsCollector.recordConversionSuccess(1000, 50, 5);
      metricsCollector.recordConversionSuccess(2000, 75, 10);

      const metrics = metricsCollector.getConversionMetrics();

      expect(metrics.totalSongsMatched).toBe(125);
      expect(metrics.totalSongsUnmatched).toBe(15);
    });
  });

  describe('API Metrics', () => {
    it('should initialize with zero API metrics', () => {
      const metrics = metricsCollector.getAPIMetrics();

      expect(metrics.requestCount).toBe(0);
      expect(metrics.errorCount).toBe(0);
      expect(metrics.averageResponseTimeMs).toBe(0);
      expect(metrics.p95ResponseTimeMs).toBe(0);
      expect(metrics.p99ResponseTimeMs).toBe(0);
      expect(metrics.errorRate).toBe(0);
    });

    it('should record successful API request', () => {
      metricsCollector.recordAPIRequest(100, 200);
      const metrics = metricsCollector.getAPIMetrics();

      expect(metrics.requestCount).toBe(1);
      expect(metrics.errorCount).toBe(0);
      expect(metrics.averageResponseTimeMs).toBe(100);
    });

    it('should record failed API request', () => {
      metricsCollector.recordAPIRequest(500, 500);
      const metrics = metricsCollector.getAPIMetrics();

      expect(metrics.requestCount).toBe(1);
      expect(metrics.errorCount).toBe(1);
    });

    it('should calculate average response time', () => {
      metricsCollector.recordAPIRequest(100, 200);
      metricsCollector.recordAPIRequest(200, 200);
      metricsCollector.recordAPIRequest(300, 200);

      const metrics = metricsCollector.getAPIMetrics();

      expect(metrics.averageResponseTimeMs).toBe(200); // (100 + 200 + 300) / 3
    });

    it('should calculate error rate', () => {
      metricsCollector.recordAPIRequest(100, 200);
      metricsCollector.recordAPIRequest(200, 200);
      metricsCollector.recordAPIRequest(300, 500);
      metricsCollector.recordAPIRequest(400, 500);

      const metrics = metricsCollector.getAPIMetrics();

      expect(metrics.errorRate).toBe(50); // 2 errors out of 4 requests
    });

    it('should calculate p95 response time', () => {
      // Create 100 requests with varying response times
      for (let i = 1; i <= 100; i++) {
        metricsCollector.recordAPIRequest(i * 10, 200);
      }

      const metrics = metricsCollector.getAPIMetrics();

      // p95 should be around 950ms (95th percentile)
      expect(metrics.p95ResponseTimeMs).toBeGreaterThan(900);
      expect(metrics.p95ResponseTimeMs).toBeLessThanOrEqual(1000);
    });

    it('should calculate p99 response time', () => {
      // Create 100 requests with varying response times
      for (let i = 1; i <= 100; i++) {
        metricsCollector.recordAPIRequest(i * 10, 200);
      }

      const metrics = metricsCollector.getAPIMetrics();

      // p99 should be around 990ms (99th percentile)
      expect(metrics.p99ResponseTimeMs).toBeGreaterThan(950);
      expect(metrics.p99ResponseTimeMs).toBeLessThanOrEqual(1000);
    });

    it('should handle different HTTP status codes', () => {
      metricsCollector.recordAPIRequest(100, 200); // Success
      metricsCollector.recordAPIRequest(200, 201); // Created
      metricsCollector.recordAPIRequest(300, 400); // Bad Request
      metricsCollector.recordAPIRequest(400, 401); // Unauthorized
      metricsCollector.recordAPIRequest(500, 500); // Server Error

      const metrics = metricsCollector.getAPIMetrics();

      expect(metrics.requestCount).toBe(5);
      expect(metrics.errorCount).toBe(3); // 400, 401, 500
      expect(metrics.errorRate).toBe(60);
    });
  });

  describe('System Metrics', () => {
    it('should return system metrics', () => {
      const metrics = metricsCollector.getSystemMetrics();

      expect(metrics).toHaveProperty('cpuUsage');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('dbConnectionPoolUtilization');
      expect(metrics).toHaveProperty('redisMemoryUsage');
      expect(metrics).toHaveProperty('queueDepth');
    });

    it('should have valid memory usage percentage', () => {
      const metrics = metricsCollector.getSystemMetrics();

      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeLessThanOrEqual(100);
    });

    it('should have non-negative CPU usage', () => {
      const metrics = metricsCollector.getSystemMetrics();

      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getAllMetrics', () => {
    it('should return all metrics', () => {
      metricsCollector.recordConversionStart();
      metricsCollector.recordConversionSuccess(1000, 50, 5);
      metricsCollector.recordAPIRequest(100, 200);

      const allMetrics = metricsCollector.getAllMetrics();

      expect(allMetrics).toHaveProperty('conversion');
      expect(allMetrics).toHaveProperty('api');
      expect(allMetrics).toHaveProperty('system');

      expect(allMetrics.conversion.completed).toBe(1);
      expect(allMetrics.api.requestCount).toBe(1);
    });
  });

  describe('resetMetrics', () => {
    it('should reset all metrics to zero', () => {
      metricsCollector.recordConversionStart();
      metricsCollector.recordConversionSuccess(1000, 50, 5);
      metricsCollector.recordAPIRequest(100, 200);

      metricsCollector.resetMetrics();

      const allMetrics = metricsCollector.getAllMetrics();

      expect(allMetrics.conversion.started).toBe(0);
      expect(allMetrics.conversion.completed).toBe(0);
      expect(allMetrics.api.requestCount).toBe(0);
    });
  });

  describe('logMetrics', () => {
    it('should log metrics without errors', () => {
      metricsCollector.recordConversionSuccess(1000, 50, 5);
      metricsCollector.recordAPIRequest(100, 200);

      // Should not throw
      expect(() => metricsCollector.logMetrics()).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle zero songs in conversion', () => {
      metricsCollector.recordConversionSuccess(1000, 0, 0);
      const metrics = metricsCollector.getConversionMetrics();

      expect(metrics.matchingAccuracy).toBe(0);
    });

    it('should handle single request for percentiles', () => {
      metricsCollector.recordAPIRequest(100, 200);
      const metrics = metricsCollector.getAPIMetrics();

      expect(metrics.p95ResponseTimeMs).toBe(100);
      expect(metrics.p99ResponseTimeMs).toBe(100);
    });

    it('should handle multiple conversions with varying durations', () => {
      metricsCollector.recordConversionSuccess(100, 10, 1);
      metricsCollector.recordConversionSuccess(5000, 50, 5);
      metricsCollector.recordConversionSuccess(1000, 20, 2);

      const metrics = metricsCollector.getConversionMetrics();

      expect(metrics.completed).toBe(3);
      expect(metrics.averageTimeMs).toBeCloseTo(2033.33, 1);
    });
  });
});
