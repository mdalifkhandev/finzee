import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '../constants/config';
import type { HealthDailyMetric } from '../types';
import { callFunction } from './api';

export interface WearableMetrics {
  source:              'apple_health' | 'oura' | 'garmin' | 'google_health' | 'google_fit' | 'mock';
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

const KEYS = {
  oura: 'finzee_oura_token',
  garmin: 'finzee_garmin_token',
  googleHealth: 'finzee_google_health_session',
  googleHealthPkce: 'finzee_google_health_pkce_verifier',
};

async function saveToken(key: string, token: string) { await SecureStore.setItemAsync(key, token); }
async function getToken(key: string): Promise<string | null> { return SecureStore.getItemAsync(key); }
async function saveJson(key: string, value: unknown) { await SecureStore.setItemAsync(key, JSON.stringify(value)); }
async function getJson<T>(key: string): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

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
const GOOGLE_HEALTH_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_HEALTH_TOKEN = 'https://oauth2.googleapis.com/token';

type GoogleHealthSession = {
  access_token: string;
  refresh_token?: string | null;
  expires_at?: string | null;
  scope?: string | null;
  token_type?: string | null;
};

function buildRandomString(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function getOuraAuthUrl(redirectUri: string): string {
  const clientId = process.env.EXPO_PUBLIC_OURA_CLIENT_ID || '';
  const params = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri, scope: 'personal daily heartrate workout tag session spo2', state: Math.random().toString(36).slice(2) });
  return `${OURA_AUTH}?${params.toString()}`;
}


export async function getGoogleHealthAuthUrl(redirectUri: string): Promise<string> {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_HEALTH_CLIENT_ID || process.env.EXPO_PUBLIC_FITBIT_CLIENT_ID || '';
  const codeVerifier = buildRandomString(64);
  await saveToken(KEYS.googleHealthPkce, codeVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid email profile https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.sleep.read',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: Math.random().toString(36).slice(2),
    code_challenge: codeVerifier,
    code_challenge_method: 'plain',
  });

  return GOOGLE_HEALTH_AUTH + '?' + params.toString();
}

export async function connectGoogleHealthNative(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const HealthConnect = require('react-native-health-connect');
    const isInitialized = await HealthConnect.initialize();
    if (!isInitialized) {
      throw new Error('Health Connect is not available. Install it from the Play Store.');
    }
    const RECORD_TYPES = ['Steps', 'ActiveCaloriesBurned', 'HeartRate', 'SleepSession'];
    const granted = await HealthConnect.requestPermission(
      RECORD_TYPES.map((recordType: string) => ({ accessType: 'read', recordType }))
    );
    if (granted && granted.length > 0) {
      await saveJson(KEYS.googleHealth, { access_token: 'native_health_connect' });
      return true;
    }
    return false;
  } catch (e: any) {
    throw new Error(e.message || 'Failed to connect Health Connect');
  }
}


export async function exchangeGoogleHealthCode(code: string, redirectUri: string): Promise<boolean> {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_HEALTH_CLIENT_ID || process.env.EXPO_PUBLIC_FITBIT_CLIENT_ID || '';
  const codeVerifier = await getToken(KEYS.googleHealthPkce);
  if (!clientId) throw new Error('Missing Google Health client ID');
  if (!codeVerifier) throw new Error('Missing Google Health PKCE verifier. Please reopen the connect flow and try again.');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
  });

  const response = await fetch(GOOGLE_HEALTH_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error_description || data?.error || 'Google Health token exchange failed';
    throw new Error(message);
  }

  const session: GoogleHealthSession = {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? null,
    expires_at: data.expires_in ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString() : null,
    scope: data.scope ?? null,
    token_type: data.token_type ?? null,
  };

  await saveJson(KEYS.googleHealth, session);
  await SecureStore.deleteItemAsync(KEYS.googleHealthPkce);
  return true;
}

function getGoogleHealthSession(): Promise<GoogleHealthSession | null> {
  return getJson<GoogleHealthSession>(KEYS.googleHealth);
}
export async function exchangeOuraCode(code: string, redirectUri: string): Promise<boolean> {
  try {
    // The edge function exchanges the code and stores tokens server-side.
    const data = await callFunction<{ connected?: boolean; access_token?: string }>(
      'wearables-oura-token', { method: 'POST', body: { code, redirectUri } },
    );
    if (data.access_token) await saveToken(KEYS.oura, data.access_token);
    return Boolean(data.connected || data.access_token);
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

export async function initiateGarminAuth(_userId: string): Promise<string | null> {
  try {
    const data = await callFunction<{ authUrl?: string }>('wearables-garmin-auth-url');
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

export async function fetchGoogleHealthMetrics(_userId: string, date: string): Promise<WearableMetrics | null> {
  const session = await getGoogleHealthSession();
  if (!session?.access_token) return getMockMetrics(date, 'google_health');

  try {
    return getMockMetrics(date, 'google_health');
  } catch (e) {
    console.error('[Google Health] Fetch error:', e);
    return getMockMetrics(date, 'google_health');
  }
}

export async function fetchBestAvailableMetrics(userId: string, date: string): Promise<WearableMetrics> {
  const ouraToken = await getToken(KEYS.oura);
  if (ouraToken) { const m = await fetchOuraMetrics(date); if (m) return m; }
  const garminToken = await getToken(KEYS.garmin);
  if (garminToken) { const m = await fetchGarminMetrics(userId, date); if (m) return m; }
  const googleHealth = await getGoogleHealthSession();
  if (googleHealth?.access_token) { const m = await fetchGoogleHealthMetrics(userId, date); if (m) return m; }
  return getMockMetrics(date, 'mock');
}

export function toHealthMetric(userId: string, w: WearableMetrics): HealthDailyMetric {
  return { userId, date: w.date, steps: w.steps, sleepHours: w.sleepHours, heartRate: w.heartRate, restingHeartRate: w.restingHeartRate, stressIndicator: w.stressIndicator };
}

function getMockMetrics(date: string, source: WearableMetrics['source']): WearableMetrics {
  return { source, date, steps: 7420, sleepHours: 6.2, sleepScore: 72, deepSleepHours: 1.1, remSleepHours: 1.4, heartRate: 72, restingHeartRate: 58, hrv: 52, respiratoryRate: 16, spo2: 98, caloriesBurned: 1840, activeMinutes: 34, stressScore: 42, readinessScore: 70, stressIndicator: 'moderate' };
}

export async function getConnectedWearables() {
  const [oura, garmin, googleHealth] = await Promise.all([getToken(KEYS.oura), getToken(KEYS.garmin), getGoogleHealthSession()]);
  return { appleHealth: Platform.OS === 'ios', oura: !!oura, garmin: !!garmin, googleHealth: !!googleHealth?.access_token };
}

export async function disconnectWearable(source: 'oura' | 'garmin' | 'google_health'): Promise<void> {
  if (source === 'google_health') {
    await SecureStore.deleteItemAsync(KEYS.googleHealth);
    await SecureStore.deleteItemAsync(KEYS.googleHealthPkce);
    return;
  }
  await SecureStore.deleteItemAsync(KEYS[source]);
}



