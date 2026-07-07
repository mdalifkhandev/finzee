import type { HealthDailyMetric } from '../types';
import { CONFIG } from '../constants/config';

const DEV_METRIC: HealthDailyMetric = {
  userId: 'dev',
  date: new Date().toISOString().split('T')[0],
  sleepHours: 6.2,
  steps: 7420,
  heartRate: 72,
  restingHeartRate: 58,
  stressIndicator: 'moderate',
  hrvMs: 42,
};

export async function requestHealthPermissions(): Promise<boolean> {
  return CONFIG.DEV_MODE;
}

export async function getDailyMetrics(userId: string, date: string): Promise<HealthDailyMetric | null> {
  if (CONFIG.DEV_MODE) {
    await new Promise(r => setTimeout(r, 200));
    return { ...DEV_METRIC, userId, date };
  }
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/health/metrics?userId=${userId}&date=${date}`);
    return res.json();
  } catch {
    return null;
  }
}
