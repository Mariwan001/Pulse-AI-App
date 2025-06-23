// Advanced Analytics System for AI Assistant
// Tracks user behavior, performance metrics, and business insights

export interface UserEvent {
  userId: string;
  eventType: string;
  eventData: any;
  timestamp: Date;
  sessionId: string;
  feature: string;
  responseTime?: number;
  error?: string;
}

export interface UserJourney {
  userId: string;
  sessionId: string;
  path: string[];
  duration: number;
  featuresUsed: string[];
  completionRate: number;
  dropoffPoint?: string;
}

export interface FeatureUsage {
  feature: string;
  usageCount: number;
  uniqueUsers: number;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  lastUsed: Date;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  errorRate: number;
  serverLoad: number;
  uptime: number;
  concurrentUsers: number;
  peakUsageTimes: string[];
}

export interface UserSegment {
  segmentId: string;
  name: string;
  criteria: any;
  userCount: number;
  averageSessionLength: number;
  favoriteFeatures: string[];
  retentionRate: number;
}

export interface ABTest {
  testId: string;
  name: string;
  variantA: any;
  variantB: any;
  participants: number;
  conversionRateA: number;
  conversionRateB: number;
  winner?: 'A' | 'B' | null;
  confidence: number;
}

export interface PredictiveAnalytics {
  predictedUsage: number;
  predictedRevenue: number;
  churnRisk: number;
  featureAdoptionPrediction: number;
  seasonalTrends: any;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  conversionRate: number;
  churnRate: number;
  lifetimeValue: number;
}

export interface AnalyticsAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export interface AnalyticsReport {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  data: any;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
}

class AdvancedAnalytics {
  private events: UserEvent[] = [];
  private userJourneys: UserJourney[] = [];
  private featureUsage: Map<string, FeatureUsage> = new Map();
  private performanceMetrics: PerformanceMetrics;
  private userSegments: UserSegment[] = [];
  private abTests: ABTest[] = [];
  private predictiveData: PredictiveAnalytics;
  private revenueData: RevenueAnalytics;
  private alerts: AnalyticsAlert[] = [];
  private reports: AnalyticsReport[] = [];
  private storageKey = 'ai_assistant_analytics';

  constructor() {
    this.performanceMetrics = {
      averageResponseTime: 0,
      errorRate: 0,
      serverLoad: 0,
      uptime: 99.9,
      concurrentUsers: 0,
      peakUsageTimes: []
    };

    this.predictiveData = {
      predictedUsage: 0,
      predictedRevenue: 0,
      churnRisk: 0,
      featureAdoptionPrediction: 0,
      seasonalTrends: {}
    };

    this.revenueData = {
      totalRevenue: 0,
      monthlyRecurringRevenue: 0,
      averageRevenuePerUser: 0,
      conversionRate: 0,
      churnRate: 0,
      lifetimeValue: 0
    };

    // Load persistent data on initialization
    this.loadPersistentData();
    
    // Set up auto-save every 5 minutes
    setInterval(() => this.savePersistentData(), 5 * 60 * 1000);
    
    // Set up real-time monitoring
    this.setupRealTimeMonitoring();
    
    // Generate daily reports
    this.scheduleReports();
  }

  // PERSISTENT STORAGE - Save analytics data to localStorage/database
  private savePersistentData() {
    try {
      const analyticsData = {
        events: this.events,
        userJourneys: this.userJourneys,
        featureUsage: Array.from(this.featureUsage.entries()),
        performanceMetrics: this.performanceMetrics,
        userSegments: this.userSegments,
        abTests: this.abTests,
        predictiveData: this.predictiveData,
        revenueData: this.revenueData,
        alerts: this.alerts,
        reports: this.reports,
        lastSaved: new Date()
      };

      // Save to localStorage (for demo purposes)
      // In production, this would be saved to a database
      localStorage.setItem(this.storageKey, JSON.stringify(analyticsData));
      
      console.log('Analytics data saved successfully');
    } catch (error) {
      console.error('Failed to save analytics data:', error);
      this.createAlert('error', 'Failed to save analytics data', 'high');
    }
  }

  private loadPersistentData() {
    try {
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        const analyticsData = JSON.parse(savedData);
        
        this.events = analyticsData.events || [];
        this.userJourneys = analyticsData.userJourneys || [];
        this.featureUsage = new Map(analyticsData.featureUsage || []);
        this.performanceMetrics = analyticsData.performanceMetrics || this.performanceMetrics;
        this.userSegments = analyticsData.userSegments || [];
        this.abTests = analyticsData.abTests || [];
        this.predictiveData = analyticsData.predictiveData || this.predictiveData;
        this.revenueData = analyticsData.revenueData || this.revenueData;
        this.alerts = analyticsData.alerts || [];
        this.reports = analyticsData.reports || [];
        
        console.log('Analytics data loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      this.createAlert('error', 'Failed to load analytics data', 'high');
    }
  }

  // REAL-TIME MONITORING - Set up automated monitoring and alerts
  private setupRealTimeMonitoring() {
    // Monitor performance every 30 seconds
    setInterval(() => {
      this.monitorPerformance();
    }, 30000);

    // Monitor error rates every minute
    setInterval(() => {
      this.monitorErrorRates();
    }, 60000);

    // Monitor user activity every 5 minutes
    setInterval(() => {
      this.monitorUserActivity();
    }, 5 * 60 * 1000);
  }

  private monitorPerformance() {
    if (this.performanceMetrics.averageResponseTime > 5000) {
      this.createAlert('warning', 'High response time detected', 'medium');
    }
    
    if (this.performanceMetrics.errorRate > 0.05) {
      this.createAlert('error', 'High error rate detected', 'high');
    }
    
    if (this.performanceMetrics.serverLoad > 80) {
      this.createAlert('warning', 'High server load detected', 'medium');
    }
  }

  private monitorErrorRates() {
    const recentErrors = this.events.filter(e => 
      e.error && e.timestamp > new Date(Date.now() - 60 * 60 * 1000)
    );
    
    if (recentErrors.length > 10) {
      this.createAlert('error', 'Multiple errors detected in the last hour', 'high');
    }
  }

  private monitorUserActivity() {
    const activeUsers = this.getConcurrentUsers();
    if (activeUsers === 0) {
      this.createAlert('warning', 'No active users detected', 'low');
    }
  }

  // AUTOMATED REPORTING - Generate and schedule reports
  private scheduleReports() {
    // Generate daily report at midnight
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = midnight.getTime() - now.getTime();
    
    setTimeout(() => {
      this.generateDailyReport();
      // Schedule next daily report
      setInterval(() => this.generateDailyReport(), 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    // Generate weekly report every Sunday
    const daysUntilSunday = (7 - now.getDay()) % 7;
    const nextSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSunday);
    const timeUntilSunday = nextSunday.getTime() - now.getTime();
    
    setTimeout(() => {
      this.generateWeeklyReport();
      // Schedule next weekly report
      setInterval(() => this.generateWeeklyReport(), 7 * 24 * 60 * 60 * 1000);
    }, timeUntilSunday);
  }

  private generateDailyReport() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const today = new Date();
    
    const dailyData = {
      totalEvents: this.events.filter(e => e.timestamp >= yesterday).length,
      uniqueUsers: new Set(this.events.filter(e => e.timestamp >= yesterday).map(e => e.userId)).size,
      featureUsage: this.getFeaturePopularityData(),
      performance: this.performanceMetrics,
      alerts: this.alerts.filter(a => a.timestamp >= yesterday),
      errors: this.events.filter(e => e.error && e.timestamp >= yesterday).length
    };

    const report: AnalyticsReport = {
      id: `daily_${Date.now()}`,
      type: 'daily',
      data: dailyData,
      generatedAt: new Date(),
      period: { start: yesterday, end: today }
    };

    this.reports.push(report);
    this.savePersistentData();
    
    // Send notification (in production, this would be email/Slack)
    console.log('Daily analytics report generated:', dailyData);
  }

  private generateWeeklyReport() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    const weeklyData = {
      totalEvents: this.events.filter(e => e.timestamp >= weekAgo).length,
      uniqueUsers: new Set(this.events.filter(e => e.timestamp >= weekAgo).map(e => e.userId)).size,
      featureUsage: this.getFeaturePopularityData(),
      userJourneys: this.getUserJourneyInsights(),
      performance: this.performanceMetrics,
      predictiveAnalytics: this.predictiveData,
      revenueAnalytics: this.revenueData,
      topAlerts: this.alerts.filter(a => a.timestamp >= weekAgo).slice(0, 10)
    };

    const report: AnalyticsReport = {
      id: `weekly_${Date.now()}`,
      type: 'weekly',
      data: weeklyData,
      generatedAt: new Date(),
      period: { start: weekAgo, end: now }
    };

    this.reports.push(report);
    this.savePersistentData();
    
    console.log('Weekly analytics report generated:', weeklyData);
  }

  // ALERT SYSTEM - Create and manage alerts
  private createAlert(type: 'error' | 'warning' | 'info' | 'success', message: string, severity: 'low' | 'medium' | 'high' | 'critical') {
    const alert: AnalyticsAlert = {
      id: `alert_${Date.now()}`,
      type,
      message,
      timestamp: new Date(),
      severity,
      resolved: false
    };

    this.alerts.push(alert);
    
    // Auto-resolve low severity alerts after 1 hour
    if (severity === 'low') {
      setTimeout(() => {
        alert.resolved = true;
      }, 60 * 60 * 1000);
    }
    
    // Send real-time notification (in production, this would be email/Slack/webhook)
    this.sendNotification(alert);
  }

  private sendNotification(alert: AnalyticsAlert) {
    // In production, this would send to email, Slack, Discord, etc.
    console.log(`ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
    
    // Example webhook call (uncomment when you have a webhook URL)
    // fetch('your-webhook-url', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(alert)
    // });
  }

  // Track user events for journey analysis
  trackEvent(userId: string, eventType: string, eventData: any, feature: string, responseTime?: number, error?: string) {
    const event: UserEvent = {
      userId,
      eventType,
      eventData,
      timestamp: new Date(),
      sessionId: this.getSessionId(userId),
      feature,
      responseTime,
      error
    };

    this.events.push(event);
    this.updateFeatureUsage(feature, responseTime, error);
    this.updateUserJourney(userId, feature, eventType);
    
    // Auto-save after each event
    this.savePersistentData();
  }

  // User Journey Analysis
  private updateUserJourney(userId: string, feature: string, eventType: string) {
    let journey = this.userJourneys.find(j => j.userId === userId && j.sessionId === this.getSessionId(userId));
    
    if (!journey) {
      journey = {
        userId,
        sessionId: this.getSessionId(userId),
        path: [],
        duration: 0,
        featuresUsed: [],
        completionRate: 0
      };
      this.userJourneys.push(journey);
    }

    if (!journey.path.includes(feature)) {
      journey.path.push(feature);
      journey.featuresUsed.push(feature);
    }

    // Calculate completion rate based on feature usage
    journey.completionRate = this.calculateCompletionRate(journey.featuresUsed);
  }

  // Feature Popularity Tracking
  private updateFeatureUsage(feature: string, responseTime?: number, error?: string) {
    let usage = this.featureUsage.get(feature);
    
    if (!usage) {
      usage = {
        feature,
        usageCount: 0,
        uniqueUsers: 0,
        successRate: 100,
        averageResponseTime: 0,
        errorRate: 0,
        lastUsed: new Date()
      };
    }

    usage.usageCount++;
    usage.lastUsed = new Date();
    
    if (responseTime) {
      usage.averageResponseTime = (usage.averageResponseTime + responseTime) / 2;
    }
    
    if (error) {
      usage.errorRate = (usage.errorRate * (usage.usageCount - 1) + 1) / usage.usageCount;
    }
    
    usage.successRate = 100 - usage.errorRate;
    this.featureUsage.set(feature, usage);
  }

  // Performance Metrics
  updatePerformanceMetrics(responseTime: number, error: boolean, serverLoad: number) {
    this.performanceMetrics.averageResponseTime = 
      (this.performanceMetrics.averageResponseTime + responseTime) / 2;
    
    if (error) {
      this.performanceMetrics.errorRate = 
        (this.performanceMetrics.errorRate + 1) / 2;
    }
    
    this.performanceMetrics.serverLoad = serverLoad;
    this.performanceMetrics.concurrentUsers = this.getConcurrentUsers();
  }

  // User Segmentation
  createUserSegment(name: string, criteria: any): UserSegment {
    const segment: UserSegment = {
      segmentId: `segment_${Date.now()}`,
      name,
      criteria,
      userCount: this.getUsersMatchingCriteria(criteria),
      averageSessionLength: this.calculateAverageSessionLength(criteria),
      favoriteFeatures: this.getFavoriteFeatures(criteria),
      retentionRate: this.calculateRetentionRate(criteria)
    };

    this.userSegments.push(segment);
    return segment;
  }

  // A/B Testing
  createABTest(name: string, variantA: any, variantB: any): ABTest {
    const test: ABTest = {
      testId: `ab_${Date.now()}`,
      name,
      variantA,
      variantB,
      participants: 0,
      conversionRateA: 0,
      conversionRateB: 0,
      winner: null,
      confidence: 0
    };

    this.abTests.push(test);
    return test;
  }

  recordABTestResult(testId: string, variant: 'A' | 'B', converted: boolean) {
    const test = this.abTests.find(t => t.testId === testId);
    if (!test) return;

    test.participants++;
    
    if (variant === 'A') {
      test.conversionRateA = (test.conversionRateA + (converted ? 1 : 0)) / 2;
    } else {
      test.conversionRateB = (test.conversionRateB + (converted ? 1 : 0)) / 2;
    }

    // Calculate winner and confidence
    if (test.participants > 100) {
      const difference = Math.abs(test.conversionRateA - test.conversionRateB);
      test.confidence = Math.min(95, difference * 100);
      
      if (test.confidence > 80) {
        test.winner = test.conversionRateA > test.conversionRateB ? 'A' : 'B';
      }
    }
  }

  // Predictive Analytics
  updatePredictiveAnalytics() {
    const usageTrend = this.calculateUsageTrend();
    const revenueTrend = this.calculateRevenueTrend();
    
    this.predictiveData = {
      predictedUsage: this.predictUsage(usageTrend),
      predictedRevenue: this.predictRevenue(revenueTrend),
      churnRisk: this.calculateChurnRisk(),
      featureAdoptionPrediction: this.predictFeatureAdoption(),
      seasonalTrends: this.analyzeSeasonalTrends()
    };
  }

  // Revenue Analytics
  updateRevenueAnalytics(revenue: number, userId: string) {
    this.revenueData.totalRevenue += revenue;
    this.revenueData.monthlyRecurringRevenue = this.calculateMRR();
    this.revenueData.averageRevenuePerUser = this.revenueData.totalRevenue / this.getTotalUsers();
    this.revenueData.conversionRate = this.calculateConversionRate();
    this.revenueData.churnRate = this.calculateChurnRate();
    this.revenueData.lifetimeValue = this.calculateLTV();
  }

  // Analytics Dashboard Data
  getAnalyticsDashboard() {
    return {
      userJourneys: this.getUserJourneyInsights(),
      featurePopularity: this.getFeaturePopularityData(),
      performanceMetrics: this.performanceMetrics,
      userSegments: this.userSegments,
      abTests: this.abTests,
      predictiveAnalytics: this.predictiveData,
      revenueAnalytics: this.revenueData,
      realTimeMetrics: this.getRealTimeMetrics(),
      alerts: this.alerts.filter(a => !a.resolved),
      reports: this.reports.slice(-5) // Last 5 reports
    };
  }

  // Get alerts
  getAlerts() {
    return this.alerts.filter(a => !a.resolved);
  }

  // Resolve alert
  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.savePersistentData();
    }
  }

  // Get reports
  getReports(type?: 'daily' | 'weekly' | 'monthly') {
    if (type) {
      return this.reports.filter(r => r.type === type);
    }
    return this.reports;
  }

  // Helper methods
  private getSessionId(userId: string): string {
    return `${userId}_${Date.now()}`;
  }

  private calculateCompletionRate(features: string[]): number {
    const totalFeatures = ['chat', 'pdf', 'summarize', 'translate', 'timezone'];
    return (features.length / totalFeatures.length) * 100;
  }

  private getConcurrentUsers(): number {
    const activeSessions = new Set(this.events
      .filter(e => e.timestamp > new Date(Date.now() - 30 * 60 * 1000)) // Last 30 minutes
      .map(e => e.sessionId));
    return activeSessions.size;
  }

  private getUsersMatchingCriteria(criteria: any): number {
    // Implementation for user filtering based on criteria
    return this.events.filter(e => this.matchesCriteria(e, criteria)).length;
  }

  private calculateAverageSessionLength(criteria: any): number {
    // Implementation for session length calculation
    return 15; // Placeholder
  }

  private getFavoriteFeatures(criteria: any): string[] {
    // Implementation for favorite features calculation
    return ['chat', 'pdf', 'summarize'];
  }

  private calculateRetentionRate(criteria: any): number {
    // Implementation for retention rate calculation
    return 78; // Placeholder
  }

  private matchesCriteria(event: UserEvent, criteria: any): boolean {
    // Implementation for criteria matching
    return true; // Placeholder
  }

  private calculateUsageTrend(): any {
    // Implementation for usage trend calculation
    return { trend: 'increasing', rate: 0.15 };
  }

  private calculateRevenueTrend(): any {
    // Implementation for revenue trend calculation
    return { trend: 'stable', rate: 0.05 };
  }

  private predictUsage(trend: any): number {
    // Implementation for usage prediction
    return 1000; // Placeholder
  }

  private predictRevenue(trend: any): number {
    // Implementation for revenue prediction
    return 5000; // Placeholder
  }

  private calculateChurnRisk(): number {
    // Implementation for churn risk calculation
    return 0.12; // Placeholder
  }

  private predictFeatureAdoption(): number {
    // Implementation for feature adoption prediction
    return 0.85; // Placeholder
  }

  private analyzeSeasonalTrends(): any {
    // Implementation for seasonal trend analysis
    return { peakHours: ['14:00', '20:00'], peakDays: ['Monday', 'Wednesday'] };
  }

  private calculateMRR(): number {
    // Implementation for Monthly Recurring Revenue calculation
    return this.revenueData.totalRevenue * 0.1; // Placeholder
  }

  private getTotalUsers(): number {
    return new Set(this.events.map(e => e.userId)).size;
  }

  private calculateConversionRate(): number {
    // Implementation for conversion rate calculation
    return 0.25; // Placeholder
  }

  private calculateChurnRate(): number {
    // Implementation for churn rate calculation
    return 0.08; // Placeholder
  }

  private calculateLTV(): number {
    // Implementation for Lifetime Value calculation
    return this.revenueData.averageRevenuePerUser * 12; // Placeholder
  }

  private getUserJourneyInsights(): any {
    return {
      averagePathLength: this.userJourneys.reduce((sum, j) => sum + j.path.length, 0) / this.userJourneys.length,
      commonDropoffPoints: this.analyzeDropoffPoints(),
      featureSequences: this.analyzeFeatureSequences(),
      completionRates: this.userJourneys.map(j => j.completionRate)
    };
  }

  private getFeaturePopularityData(): FeatureUsage[] {
    return Array.from(this.featureUsage.values()).sort((a, b) => b.usageCount - a.usageCount);
  }

  private getRealTimeMetrics(): any {
    return {
      activeUsers: this.getConcurrentUsers(),
      requestsPerMinute: this.events.filter(e => e.timestamp > new Date(Date.now() - 60 * 1000)).length,
      averageResponseTime: this.performanceMetrics.averageResponseTime,
      errorRate: this.performanceMetrics.errorRate
    };
  }

  private analyzeDropoffPoints(): string[] {
    // Implementation for dropoff point analysis
    return ['pdf_upload', 'summarization'];
  }

  private analyzeFeatureSequences(): any {
    // Implementation for feature sequence analysis
    return { commonSequences: [['chat', 'pdf'], ['pdf', 'summarize']] };
  }
}

// Export singleton instance
export const analytics = new AdvancedAnalytics();

// Export utility functions for easy tracking
export const trackUserEvent = (
  userId: string, 
  eventType: string, 
  eventData: any, 
  feature: string, 
  responseTime?: number, 
  error?: string
) => {
  analytics.trackEvent(userId, eventType, eventData, feature, responseTime, error);
};

export const trackPerformance = (responseTime: number, error: boolean, serverLoad: number) => {
  analytics.updatePerformanceMetrics(responseTime, error, serverLoad);
};

export const trackRevenue = (revenue: number, userId: string) => {
  analytics.updateRevenueAnalytics(revenue, userId);
};

export const getAnalytics = () => analytics.getAnalyticsDashboard();
export const getAlerts = () => analytics.getAlerts();
export const resolveAlert = (alertId: string) => analytics.resolveAlert(alertId);
export const getReports = (type?: 'daily' | 'weekly' | 'monthly') => analytics.getReports(type); 