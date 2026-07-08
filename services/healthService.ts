import type { HealthDailyMetric } from '../types';
import { CONFIG } from '../constants/config';
import { callFunction } from './api';

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
    const data = await callFunction<{ metrics: any }>('health-metrics', { query: { date } });
    const m = Array.isArray(data.metrics) ? data.metrics[0] : data.metrics;
    if (!m) return null;
    return {
      userId,
      date: m.date ?? date,
      sleepHours: Number(m.sleep_hours) || 0,
      steps: Number(m.steps) || 0,
      heartRate: Number(m.heart_rate) || 0,
      restingHeartRate: Number(m.resting_heart_rate) || 0,
      stressIndicator: (m.stress_indicator ?? 'moderate') as HealthDailyMetric['stressIndicator'],
      hrvMs: m.hrv_ms != null ? Number(m.hrv_ms) : undefined,
    };
  } catch {
    return null;
  }
}
