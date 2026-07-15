import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import type { HealthConnectionStatus, HealthSnapshot } from './use-apple-health';

// `react-native-health-connect` wraps Android's Health Connect APIs — it
// only works in a custom development/production build (not Expo Go), and
// only on Android (API 26+, with the Health Connect app installed).
let HealthConnect: any = null;
if (Platform.OS === 'android') {
  try {
    HealthConnect = require('react-native-health-connect');
  } catch {
    HealthConnect = null;
  }
}

const RECORD_TYPES = ['Steps', 'ActiveCaloriesBurned', 'HeartRate', 'SleepSession'];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function readAggregatedSteps(): Promise<number> {
  const result = await HealthConnect.aggregateRecord({
    recordType: 'Steps',
    timeRangeFilter: {
      operator: 'between',
      startTime: startOfToday().toISOString(),
      endTime: new Date().toISOString(),
    },
  });
  return Math.round(result?.COUNT_TOTAL || 0);
}

async function readActiveEnergy(): Promise<number> {
  const result = await HealthConnect.aggregateRecord({
    recordType: 'ActiveCaloriesBurned',
    timeRangeFilter: {
      operator: 'between',
      startTime: startOfToday().toISOString(),
      endTime: new Date().toISOString(),
    },
  });
  return Math.round(result?.ACTIVE_CALORIES_TOTAL?.inKilocalories || 0);
}

async function readRestingHeartRate(): Promise<number | null> {
  const { records } = await HealthConnect.readRecords('HeartRate', {
    timeRangeFilter: {
      operator: 'between',
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      endTime: new Date().toISOString(),
    },
  });

  if (!records || records.length === 0) return null;

  const samples = records.flatMap((r: any) => r.samples || []);
  if (samples.length === 0) return null;

  const lowest = samples.reduce((min: number, s: any) => Math.min(min, s.beatsPerMinute), samples[0].beatsPerMinute);
  return Math.round(lowest);
}

async function readSleep(): Promise<number | null> {
  const { records } = await HealthConnect.readRecords('SleepSession', {
    timeRangeFilter: {
      operator: 'between',
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      endTime: new Date().toISOString(),
    },
  });

  if (!records || records.length === 0) return null;

  const totalMs = records.reduce((sum: number, record: any) => {
    const start = new Date(record.startTime).getTime();
    const end = new Date(record.endTime).getTime();
    return sum + Math.max(0, end - start);
  }, 0);

  return Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;
}



export function useGoogleHealth() {
  const [status, setStatus] = useState<HealthConnectionStatus>(
    Platform.OS === 'android' && HealthConnect ? 'disconnected' : 'unsupported'
  );
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!HealthConnect) return;

    try {
      const [steps, activeEnergyBurned, restingHeartRate, sleepHours] = await Promise.all([
        readAggregatedSteps(),
        readActiveEnergy(),
        readRestingHeartRate(),
        readSleep(),
      ]);

      setSnapshot({ steps, activeEnergyBurned, restingHeartRate, sleepHours, mindfulMinutes: 0 });
    } catch (e: any) {
      setError(e?.message || 'Failed to read Health Connect data');
    }
  }, []);

  const connect = useCallback(async () => {
    if (!HealthConnect) {
      setStatus('unsupported');
      return;
    }

    setStatus('connecting');
    setError(null);

    try {
      const isInitialized = await HealthConnect.initialize();
      if (!isInitialized) {
        setStatus('error');
        setError('Health Connect is not available on this device. Install it from the Play Store.');
        return;
      }

      const granted = await HealthConnect.requestPermission(
        RECORD_TYPES.map((recordType) => ({ accessType: 'read', recordType }))
      );

      if (!granted || granted.length === 0) {
        setStatus('error');
        setError('Permission to read Health Connect data was not granted.');
        return;
      }

      setStatus('connected');
      refresh();
    } catch (e: any) {
      setStatus('error');
      setError(e?.message || 'Failed to connect to Health Connect');
    }
  }, [refresh]);

  const disconnect = useCallback(() => {
    setStatus('disconnected');
    setSnapshot(null);
  }, []);

  useEffect(() => {
    if (status === 'connected') {
      refresh();
    }
  }, [status, refresh]);

  return {
    isSupported: Platform.OS === 'android' && !!HealthConnect,
    status,
    snapshot,
    error,
    connect,
    disconnect,
    refresh,
  };
}
