export interface User {
  id: string;
  email: string;
  displayName?: string;
  connectedServices?: {
    plaid?: boolean;
    healthKit?: boolean;
  };
}

export interface HealthDailyMetric {
  userId: string;
  date: string;
  sleepHours: number;
  steps: number;
  heartRate: number;
  restingHeartRate: number;
  stressIndicator: 'low' | 'moderate' | 'high';
  hrvMs?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  merchant: string;
  category: string;
  date: string;
  isDiscretionary: boolean;
}

export interface Insight {
  id: string;
  title: string;
  body: string;
  type: 'stress_spend' | 'budget_alert' | 'goal_update' | 'health_correlation';
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  emoji: string;
  color: string;
}

export interface PauseItem {
  id: string;
  userId: string;
  name: string;
  price: number;
  pausedAt: string;
  expiresAt: string;
  notes?: string;
}

export interface PauseListItem {
  id: string;
  userId: string;
  itemName: string;
  price: number;
  category: string;
  sourceUrl: string;
  reason: string;
  createdAt: string;
  reminderDueAt: string;
  status: 'pending' | 'bought' | 'skipped';
}

export interface AICoachResponse {
  coachingResponse: string;
  actionItems?: string[];
}

export interface PurchaseCheckResult {
  score: number;
  recommendation: 'buy' | 'pause' | 'skip';
  reasoning: string;
  budgetImpact: string;
  alternatives?: string[];
}
