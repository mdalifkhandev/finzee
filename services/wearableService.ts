import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '../constants/config';
import type { HealthDailyMetric } from '../types';

export interface WearableMetrics {
  source:              'apple_health' | 'oura' | 'garmin' | 'fitbit' | 'google_fit' | 'mock';
  date:                string;
  steps:               number;
  sleepHours:          number;
  sleepScore?:         number;
  deepSleepHours?:     number;
  remSleepHours?:      number;
  heartRate:           number;
  restingHeartRate:    number;
  hrv?:                number;
  respiratoryRate?:    number;
  spo2?:               number;
  caloriesBurned?:     number;
  activeMinutes?:      number;
  stressScore?:        number;
  readinessScore?:     number;
  stressIndicator:     'low' | 'moderate' | 'high';
  rawData?:            Record<string, any>;
}

const KEYS = { oura: 'finzee_oura_token', garmin: 'finzee_garmin_token', fitbit: 'finzee_fitbit_token' };

async function saveToken(key: string, token: string) { await SecureStore.setItemAsync(key, token); }
async function getToken(key: string): Promise<string | null> { return SecureStore.getItemAsync(key); }

function inferStress(metrics: Partial<WearableMetrics>): 'low' | 'moderate' | 'high' {
  let score = 0;
  if (metrics.sleepHours !== undefined) { if (metrics.sleepHours < 5.5) score += 3; else if (metrics.sleepHours < 7) score += 1; }
  if (metrics.hrv !== undefined) { if (metrics.hrv < 40) score += 3; else if (metrics.hrv < 55) score += 1; }
  if (metrics.heartRate !== undefined && metrics.restingHeartRate !== undefined) { const elev = metrics.heartRate - metrics.restingHeartRate; if (elev > 20) score += 3; else if (elev > 10) score += 1; }
  if (metrics.stressScore !== undefined) { if (metrics.stressScore > 70) score += 3; else if (metrics.stressScore > 40) score += 1; }
  if (metrics.readinessScore !== undefined) { if (metrics.readinessScore < 50) score += 2; else if (metrics.readinessScore < 70) score += 1; }
  if (score >= 5) return 'high';
  if (score >= 2) return 'moderate';
  return 'low';
}

export async function requestAppleHealthPermissions(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  console.warn('[HealthKit] EAS build required. Run: eas build --platform ios');
  return false;
}

export async function requestAndroidHealthPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  console.warn('[HealthConnect] EAS build required for Android.');
  return false;
}

const OURA_BASE = 'https://api.ouraring.com/v2';
const OURA_AUTH = 'https://cloud.ouraring.com/oauth/authorize';

export function getOuraAuthUrl(redirectUri: string): string {
  const clientId = process.env.EXPO_PUBLIC_OURA_CLIENT_ID || '';
  const params = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri, scope: 'personal daily heartrate workout tag session spo2', state: Math.random().toString(36).slice(2) });
  return `${OURA_AUTH}?${params.toString()}`;
}

export async function exchangeOuraCode(code: string, redirectUri: string): Promise<boolean> {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/wearables/oura/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, redirectUri }) });
    const data = await res.json();
    if (data.access_token) { await saveToken(KEYS.oura, data.access_token); return true; }
    return false;
  } catch (e) { console.error('[Oura] Token exchange error:', e); return false; }
}

export async function fetchOuraMetrics(date: string): Promise<WearableMetrics | null> {
  const token = await getToken(KEYS.oura);
  if (!token) return null;
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const [sleepRes, activityRes, readinessRes, spo2Res] = await Promise.all([
      fetch(`${OURA_BASE}/usercollection/daily_sleep?start_date=${date}&end_date=${date}`, { headers }),
      fetch(`${OURA_BASE}/usercollection/daily_activity?start_date=${date}&end_date=${date}`, { headers }),
      fetch(`${OURA_BASE}/usercollection/daily_readiness?start_date=${date}&end_date=${date}`, { headers }),
      fetch(`${OURA_BASE}/usercollection/daily_spo2?start_date=${date}&end_date=${date}`, { headers }),
    ]);
    const [sleepData, activityData, readinessData, spo2Data] = await Promise.all([sleepRes.json(), activityRes.json(), readinessRes.json(), spo2Res.json()]);
    const sleep = sleepData.data?.[0], activity = activityData.data?.[0], readiness = readinessData.data?.[0], spo2 = spo2Data.data?.[0];
    if (!sleep) return getMockMetrics(date, 'oura');
    const m: WearableMetrics = {
      source: 'oura', date, steps: activity?.steps ?? 0, sleepHours: (sleep?.total_sleep_duration ?? 0) / 3600,
      sleepScore: sleep?.score ?? 0, deepSleepHours: (sleep?.deep_sleep_duration ?? 0) / 3600, remSleepHours: (sleep?.rem_sleep_duration ?? 0) / 3600,
      heartRate: sleep?.average_heart_rate ?? 70, restingHeartRate: sleep?.lowest_heart_rate ?? 60, hrv: sleep?.average_hrv ?? 50,
      spo2: spo2?.spo2_percentage?.average ?? 98, caloriesBurned: activity?.total_calories ?? 0,
      readinessScore: readiness?.score ?? 0, stressIndicator: 'low', rawData: { sleep, activity, readiness },
    };
    m.stressIndicator = inferStress(m); return m;
  } catch (e) { console.error('[Oura] Fetch error:', e); return null; }
}

export async function initiateGarminAuth(userId: string): Promise<string | null> {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/wearables/garmin/auth-url`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
    const data = await res.json();
    return data.authUrl ?? null;
  } catch (e) { console.error('[Garmin] Auth URL error:', e); return null; }
}

export async function fetchGarminMetrics(userId: string, date: string): Promise<WearableMetrics | null> {
  if (!CONFIG.API_BASE_URL) return getMockMetrics(date, 'garmin');
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/wearables/garmin/metrics?userId=${userId}&date=${date}`);
    const data = await res.json();
    if (!data.metrics) return null;
    const m = data.metrics;
    const metrics: WearableMetrics = { source: 'garmin', date, steps: m.steps ?? 0, sleepHours: (m.sleepTimeSeconds ?? 0) / 3600, heartRate: m.averageHeartRate ?? 70, restingHeartRate: m.restingHeartRate ?? 60, hrv: m.lastNight5MinHighHRV ?? 50, caloriesBurned: m.totalKilocalories ?? 0, activeMinutes: m.highlyActiveSeconds ? Math.round(m.highlyActiveSeconds / 60) : 0, stressScore: m.averageStressLevel ?? 30, stressIndicator: 'low' };
    metrics.stressIndicator = inferStress(metrics); return metrics;
  } catch (e) { console.error('[Garmin] Fetch error:', e); return null; }
}

export async function fetchFitbitMetrics(userId: string, date: string): Promise<WearableMetrics | null> {
  if (!CONFIG.API_BASE_URL) return getMockMetrics(date, 'fitbit');
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/wearables/fitbit/metrics?userId=${userId}&date=${date}`);
    const data = await res.json();
    if (!data) return null;
    const metrics: WearableMetrics = { source: 'fitbit', date, steps: data.activities?.steps?.[0]?.value ?? 0, sleepHours: (data.sleep?.[0]?.minutesAsleep ?? 0) / 60, heartRate: data.activities?.heart?.[0]?.value?.restingHeartRate ?? 70, restingHeartRate: data.activities?.heart?.[0]?.value?.restingHeartRate ?? 60, caloriesBurned: data.activities?.calories?.[0]?.value ?? 0, activeMinutes: data.activities?.minutesFairlyActive?.[0]?.value ?? 0, stressIndicator: 'low' };
    metrics.stressIndicator = inferStress(metrics); return metrics;
  } catch (e) { console.error('[Fitbit] Fetch error:', e); return null; }
}

export async function fetchBestAvailableMetrics(userId: string, date: string): Promise<WearableMetrics> {
  const ouraToken = await getToken(KEYS.oura);
  if (ouraToken) { const m = await fetchOuraMetrics(date); if (m) return m; }
  const garminToken = await getToken(KEYS.garmin);
  if (garminToken) { const m = await fetchGarminMetrics(userId, date); if (m) return m; }
  const fitbitToken = await getToken(KEYS.fitbit);
  if (fitbitToken) { const m = await fetchFitbitMetrics(userId, date); if (m) return m; }
  return getMockMetrics(date, 'mock');
}

export function toHealthMetric(userId: string, w: WearableMetrics): HealthDailyMetric {
  return { userId, date: w.date, steps: w.steps, sleepHours: w.sleepHours, heartRate: w.heartRate, restingHeartRate: w.restingHeartRate, stressIndicator: w.stressIndicator };
}

function getMockMetrics(date: string, source: WearableMetrics['source']): WearableMetrics {
  return { source, date, steps: 7420, sleepHours: 6.2, sleepScore: 72, deepSleepHours: 1.1, remSleepHours: 1.4, heartRate: 72, restingHeartRate: 58, hrv: 52, respiratoryRate: 16, spo2: 98, caloriesBurned: 1840, activeMinutes: 34, stressScore: 42, readinessScore: 70, stressIndicator: 'moderate' };
}

export async function getConnectedWearables() {
  const [oura, garmin, fitbit] = await Promise.all([getToken(KEYS.oura), getToken(KEYS.garmin), getToken(KEYS.fitbit)]);
  return { appleHealth: Platform.OS === 'ios', oura: !!oura, garmin: !!garmin, fitbit: !!fitbit };
}

export async function disconnectWearable(source: 'oura' | 'garmin' | 'fitbit'): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS[source]);
}
