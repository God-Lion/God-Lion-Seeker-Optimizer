// System Health Types
export interface SystemHealthData {
  uptime: number;
  apiResponseTime: number;
  cpuUsage: number;
  dbResponseTime: number;
  overallStatus: 'healthy' | 'warning' | 'critical';
  scrapingStats?: {
    successRate: number;
    failureRate: number;
  };
}

// User Analytics Types
export interface UserAnalyticsData {
  activeUsers: number;
  activeUsersChange: number;
  newRegistrations: number;
  newRegistrationsChange: number;
  retentionRate: number;
  retentionChange: number;
  totalUsers: number;
  totalUsersChange: number;
  userGrowth: {
    labels: string[];
    activeUsers: number[];
    newUsers: number[];
  };
  featureUsage: Array<{
    name: string;
    percentage: number;
  }>;
}

// Job Market Trends Types
export interface JobMarketTrendsData {
  topSkills: Array<{
    name: string;
    count: number;
  }>;
  hotLocations: Array<{
    city: string;
    jobCount: number;
    growth: number;
  }>;
  salaryTrends: Array<{
    role: string;
    averageSalary: number;
    changePercentage: number;
  }>;
  industryGrowth: Array<{
    name: string;
    growthRate: number;
    jobCount: number;
  }>;
}

// User Funnel Types
export interface UserFunnelData {
  overallConversionRate: number;
  stages: Array<{
    name: string;
    count: number;
    percentage: number;
    dropOff: number;
    color: string;
  }>;
  insights: string[];
}

// Recommendation Performance Types
export interface RecommendationPerformanceData {
  clickThroughRate: number;
  clickThroughTrend: number;
  applicationRate: number;
  applicationTrend: number;
  satisfactionScore: number;
  satisfactionTrend: number;
  viewRate: number;
  ignoreRate: number;
  topRecommendations: Array<{
    jobTitle: string;
    company: string;
    location: string;
    successRate: number;
    applications: number;
  }>;
}

// User Management Types
export type UserStatus = 'active' | 'suspended' | 'pending' | 'deleted';
export type UserRole = 'admin' | 'user' | 'guest';

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  registeredAt: Date | string;
  lastActive: Date | string;
  jobsScraped: number;
}

export interface UsersListData {
  totalUsers: number;
  users: User[];
}

// Security Log Types
export type SecurityEventType = 
  | 'failed_login'
  | 'suspicious_activity'
  | 'unauthorized_access'
  | 'password_reset'
  | 'account_locked';

export type SecuritySeverity = 'info' | 'warning' | 'error' | 'critical';

export interface SecurityLog {
  id: string | number;
  timestamp: Date | string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  user: string;
  ipAddress: string;
  location: string;
  details: string;
  userAgent?: string;
}

// Content Moderation Types
export type ContentStatus = 'pending' | 'approved' | 'rejected';
export type ContentType = 'job' | 'company' | 'user_report';

export interface FlaggedContent {
  id: string | number;
  type: ContentType;
  title: string;
  company?: string;
  reason: string;
  reportedBy: number;
  reportedAt: Date | string;
  status: ContentStatus;
  details?: string;
}

// Analytics Types
export interface AnalyticsOverview {
  totalUsers: number;
  totalJobs: number;
  totalCompanies: number;
  engagementRate: number;
  growthMetrics: {
    users: number;
    jobs: number;
    companies: number;
    engagement: number;
  };
}
