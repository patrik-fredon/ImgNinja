"use client";

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1, percentage of traffic
  config: Record<string, any>;
  isControl: boolean;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  targetMetric: string;
  variants: ABTestVariant[];
  trafficAllocation: number; // 0-1, percentage of total traffic
  segmentationRules?: Record<string, any>;
  minimumSampleSize: number;
  confidenceLevel: number; // 0.95 for 95%
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestAssignment {
  userId: string;
  testId: string;
  variantId: string;
  assignedAt: Date;
  sessionId: string;
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  metric: string;
  value: number;
  timestamp: Date;
  userId: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface ABTestStatistics {
  testId: string;
  variantId: string;
  sampleSize: number;
  conversionRate: number;
  averageValue: number;
  standardError: number;
  confidenceInterval: [number, number];
  pValue: number;
  isSignificant: boolean;
  uplift: number; // vs control
  upliftConfidenceInterval: [number, number];
}

export interface ABTestSummary {
  test: ABTest;
  statistics: ABTestStatistics[];
  winner?: string;
  recommendation: string;
  isComplete: boolean;
  daysRunning: number;
  totalParticipants: number;
}

class ABTestingFramework {
  private tests: Map<string, ABTest> = new Map();
  private assignments: Map<string, ABTestAssignment> = new Map();
  private results: ABTestResult[] = [];
  private currentUserId: string;
  private currentSessionId: string;

  constructor() {
    this.currentUserId = this.getUserId();
    this.currentSessionId = this.getSessionId();
    this.loadFromStorage();
  }

  private getUserId(): string {
    if (typeof window === "undefined") return "anonymous";

    let userId = localStorage.getItem("ab-test-user-id");
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem("ab-test-user-id", userId);
    }
    return userId;
  }

  private getSessionId(): string {
    if (typeof window === "undefined") return "anonymous";

    let sessionId = sessionStorage.getItem("ab-test-session-id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem("ab-test-session-id", sessionId);
    }
    return sessionId;
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const testsData = localStorage.getItem("ab-tests");
      const assignmentsData = localStorage.getItem("ab-test-assignments");
      const resultsData = localStorage.getItem("ab-test-results");

      if (testsData) {
        const tests = JSON.parse(testsData);
        Object.entries(tests).forEach(([key, value]) => {
          const test = value as any;
          this.tests.set(key, {
            ...test,
            startDate: new Date(test.startDate),
            endDate: test.endDate ? new Date(test.endDate) : undefined,
            createdAt: new Date(test.createdAt),
            updatedAt: new Date(test.updatedAt),
          });
        });
      }

      if (assignmentsData) {
        const assignments = JSON.parse(assignmentsData);
        Object.entries(assignments).forEach(([key, value]) => {
          const assignment = value as any;
          this.assignments.set(key, {
            ...assignment,
            assignedAt: new Date(assignment.assignedAt),
          });
        });
      }

      if (resultsData) {
        this.results = JSON.parse(resultsData).map((result: any) => ({
          ...result,
          timestamp: new Date(result.timestamp),
        }));
      }
    } catch (error) {
      console.error("Failed to load A/B testing data:", error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("ab-tests", JSON.stringify(Object.fromEntries(this.tests)));
      localStorage.setItem("ab-test-assignments", JSON.stringify(Object.fromEntries(this.assignments)));
      localStorage.setItem("ab-test-results", JSON.stringify(this.results));
    } catch (error) {
      console.error("Failed to save A/B testing data:", error);
    }
  }

  // Test Management
  createTest(testConfig: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>): string {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const test: ABTest = {
      ...testConfig,
      id: testId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate variants weights sum to 1
    const totalWeight = test.variants.reduce((sum, variant) => sum + variant.weight, 0);
    if (Math.abs(totalWeight - 1) > 0.001) {
      throw new Error("Variant weights must sum to 1.0");
    }

    // Ensure exactly one control variant
    const controlVariants = test.variants.filter(v => v.isControl);
    if (controlVariants.length !== 1) {
      throw new Error("Exactly one variant must be marked as control");
    }

    this.tests.set(testId, test);
    this.saveToStorage();

    return testId;
  }

  updateTest(testId: string, updates: Partial<ABTest>): void {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (test.status === 'running') {
      // Only allow certain updates while running
      const allowedUpdates = ['endDate', 'description'];
      const hasDisallowedUpdates = Object.keys(updates).some(key => !allowedUpdates.includes(key));
      if (hasDisallowedUpdates) {
        throw new Error("Cannot modify test configuration while running");
      }
    }

    const updatedTest = {
      ...test,
      ...updates,
      updatedAt: new Date(),
    };

    this.tests.set(testId, updatedTest);
    this.saveToStorage();
  }

  startTest(testId: string): void {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (test.status !== 'draft') {
      throw new Error("Only draft tests can be started");
    }

    this.updateTest(testId, {
      status: 'running',
      startDate: new Date(),
    });
  }

  pauseTest(testId: string): void {
    this.updateTest(testId, { status: 'paused' });
  }

  resumeTest(testId: string): void {
    this.updateTest(testId, { status: 'running' });
  }

  stopTest(testId: string): void {
    this.updateTest(testId, {
      status: 'completed',
      endDate: new Date(),
    });
  }

  // Variant Assignment
  getVariant(testId: string, userId?: string): ABTestVariant | null {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'running') {
      return null;
    }

    const effectiveUserId = userId || this.currentUserId;
    const assignmentKey = `${effectiveUserId}_${testId}`;

    // Check existing assignment
    const existingAssignment = this.assignments.get(assignmentKey);
    if (existingAssignment) {
      return test.variants.find(v => v.id === existingAssignment.variantId) || null;
    }

    // Check if user should be included in test
    if (!this.shouldIncludeUser(test, effectiveUserId)) {
      return null;
    }

    // Assign variant based on weights
    const variant = this.assignVariant(test, effectiveUserId);
    if (variant) {
      const assignment: ABTestAssignment = {
        userId: effectiveUserId,
        testId,
        variantId: variant.id,
        assignedAt: new Date(),
        sessionId: this.currentSessionId,
      };

      this.assignments.set(assignmentKey, assignment);
      this.saveToStorage();
    }

    return variant;
  }

  private shouldIncludeUser(test: ABTest, userId: string): boolean {
    // Traffic allocation check
    const hash = this.hashString(`${userId}_${test.id}`);
    const userBucket = hash % 100;

    if (userBucket >= test.trafficAllocation * 100) {
      return false;
    }

    // Segmentation rules check
    if (test.segmentationRules) {
      // Implement segmentation logic based on user properties
      // This is a placeholder - implement based on your segmentation needs
      return true;
    }

    return true;
  }

  private assignVariant(test: ABTest, userId: string): ABTestVariant | null {
    const hash = this.hashString(`${userId}_${test.id}_variant`);
    const random = (hash % 10000) / 10000; // 0-1

    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        return variant;
      }
    }

    // Fallback to control
    return test.variants.find(v => v.isControl) || null;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Result Tracking
  trackResult(testId: string, metric: string, value: number, metadata?: Record<string, any>): void {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'running') {
      return;
    }

    const assignmentKey = `${this.currentUserId}_${testId}`;
    const assignment = this.assignments.get(assignmentKey);
    if (!assignment) {
      return; // User not in test
    }

    const result: ABTestResult = {
      testId,
      variantId: assignment.variantId,
      metric,
      value,
      timestamp: new Date(),
      userId: this.currentUserId,
      sessionId: this.currentSessionId,
      metadata,
    };

    this.results.push(result);
    this.saveToStorage();
  }

  // Statistical Analysis
  calculateStatistics(testId: string): ABTestStatistics[] {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const testResults = this.results.filter(r => r.testId === testId);
    const statistics: ABTestStatistics[] = [];

    const controlVariant = test.variants.find(v => v.isControl);
    if (!controlVariant) {
      throw new Error("No control variant found");
    }

    for (const variant of test.variants) {
      const variantResults = testResults.filter(r => r.variantId === variant.id);
      const controlResults = testResults.filter(r => r.variantId === controlVariant.id);

      const stats = this.calculateVariantStatistics(
        variant.id,
        variantResults,
        controlResults,
        test.confidenceLevel
      );

      statistics.push({
        testId,
        ...stats,
      });
    }

    return statistics;
  }

  private calculateVariantStatistics(
    variantId: string,
    variantResults: ABTestResult[],
    controlResults: ABTestResult[],
    confidenceLevel: number
  ): Omit<ABTestStatistics, 'testId'> {
    const sampleSize = variantResults.length;
    const conversions = variantResults.filter(r => r.value > 0).length;
    const conversionRate = sampleSize > 0 ? conversions / sampleSize : 0;
    const averageValue = sampleSize > 0
      ? variantResults.reduce((sum, r) => sum + r.value, 0) / sampleSize
      : 0;

    // Standard error for conversion rate
    const standardError = Math.sqrt((conversionRate * (1 - conversionRate)) / sampleSize);

    // Confidence interval
    const zScore = this.getZScore(confidenceLevel);
    const margin = zScore * standardError;
    const confidenceInterval: [number, number] = [
      Math.max(0, conversionRate - margin),
      Math.min(1, conversionRate + margin)
    ];

    // Calculate uplift vs control
    const controlConversions = controlResults.filter(r => r.value > 0).length;
    const controlConversionRate = controlResults.length > 0
      ? controlConversions / controlResults.length
      : 0;

    const uplift = controlConversionRate > 0
      ? (conversionRate - controlConversionRate) / controlConversionRate
      : 0;

    // P-value calculation (simplified two-proportion z-test)
    const pValue = this.calculatePValue(
      conversions, sampleSize,
      controlConversions, controlResults.length
    );

    const isSignificant = pValue < (1 - confidenceLevel);

    // Uplift confidence interval (simplified)
    const upliftMargin = Math.abs(uplift) * 0.1; // Simplified calculation
    const upliftConfidenceInterval: [number, number] = [
      uplift - upliftMargin,
      uplift + upliftMargin
    ];

    return {
      variantId,
      sampleSize,
      conversionRate,
      averageValue,
      standardError,
      confidenceInterval,
      pValue,
      isSignificant,
      uplift,
      upliftConfidenceInterval,
    };
  }

  private getZScore(confidenceLevel: number): number {
    // Common z-scores for confidence levels
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    };

    return zScores[confidenceLevel] || 1.96;
  }

  private calculatePValue(
    conversions1: number,
    total1: number,
    conversions2: number,
    total2: number
  ): number {
    if (total1 === 0 || total2 === 0) return 1;

    const p1 = conversions1 / total1;
    const p2 = conversions2 / total2;
    const pooledP = (conversions1 + conversions2) / (total1 + total2);

    const standardError = Math.sqrt(pooledP * (1 - pooledP) * (1 / total1 + 1 / total2));
    const zScore = Math.abs(p1 - p2) / standardError;

    // Simplified p-value calculation (two-tailed)
    return 2 * (1 - this.normalCDF(zScore));
  }

  private normalCDF(x: number): number {
    // Approximation of normal cumulative distribution function
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  // Test Analysis
  getTestSummary(testId: string): ABTestSummary {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const statistics = this.calculateStatistics(testId);
    const assignments = Array.from(this.assignments.values()).filter(a => a.testId === testId);

    const daysRunning = Math.floor(
      (new Date().getTime() - test.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine winner
    const significantVariants = statistics.filter(s => s.isSignificant && s.uplift > 0);
    const winner = significantVariants.length > 0
      ? significantVariants.reduce((best, current) =>
        current.uplift > best.uplift ? current : best
      ).variantId
      : undefined;

    // Generate recommendation
    let recommendation = "Continue running test";
    if (statistics.every(s => s.sampleSize >= test.minimumSampleSize)) {
      if (winner) {
        const winnerStats = statistics.find(s => s.variantId === winner);
        recommendation = `Implement variant ${winner} (${(winnerStats!.uplift * 100).toFixed(1)}% uplift)`;
      } else {
        recommendation = "No significant difference found. Consider running longer or trying different variants.";
      }
    } else {
      const minSampleSize = Math.min(...statistics.map(s => s.sampleSize));
      const remaining = test.minimumSampleSize - minSampleSize;
      recommendation = `Need ${remaining} more samples to reach statistical significance`;
    }

    const isComplete = test.status === 'completed' ||
      (statistics.every(s => s.sampleSize >= test.minimumSampleSize) && winner !== undefined);

    return {
      test,
      statistics,
      winner,
      recommendation,
      isComplete,
      daysRunning,
      totalParticipants: assignments.length,
    };
  }

  // Public API
  getAllTests(): ABTest[] {
    return Array.from(this.tests.values());
  }

  getTest(testId: string): ABTest | null {
    return this.tests.get(testId) || null;
  }

  getActiveTests(): ABTest[] {
    return Array.from(this.tests.values()).filter(t => t.status === 'running');
  }

  getUserAssignments(userId?: string): ABTestAssignment[] {
    const effectiveUserId = userId || this.currentUserId;
    return Array.from(this.assignments.values()).filter(a => a.userId === effectiveUserId);
  }

  exportData(): {
    tests: ABTest[];
    assignments: ABTestAssignment[];
    results: ABTestResult[];
  } {
    return {
      tests: this.getAllTests(),
      assignments: Array.from(this.assignments.values()),
      results: this.results,
    };
  }

  clearData(): void {
    this.tests.clear();
    this.assignments.clear();
    this.results = [];

    if (typeof window !== "undefined") {
      localStorage.removeItem("ab-tests");
      localStorage.removeItem("ab-test-assignments");
      localStorage.removeItem("ab-test-results");
    }
  }
}

export const abTestingFramework = new ABTestingFramework();