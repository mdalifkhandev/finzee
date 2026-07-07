import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// `react-native-health` is a native module — it only works in a custom
// development/production build (not Expo Go), and only on iOS.
let AppleHealthKit: any = null;
if (Platform.OS === 'ios') {
  try {
    AppleHealthKit = require('react-native-health').default;
  } catch {
    AppleHealthKit = null;
  }
}

export type HealthConnectionStatus = 'unsupported' | 'disconnected' | 'connecting' | 'connected' | 'error';

export interface HealthSnapshot {
  steps: number;
  activeEnergyBurned: number; // kcal
  restingHeartRate: number | null; // bpm
  sleepHours: number | null;
  mindfulMinutes: number;
}

const PERMISSIONS = AppleHealthKit
  ? {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          AppleHealthKit.Constants.Permissions.RestingHeartRate,
          AppleHealthKit.Constants.Permissions.SleepAnalysis,
          AppleHealthKit.Constants.Permissions.MindfulSession,
        ],
        write: [],
      },
    }
  : null;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function fetchSteps(): Promise<number> {
  return new Promise((resolve) => {
    AppleHealthKit.getStepCount({ date: new Date().toISOString() }, (err: any, results: any) => {
      resolve(err || !results ? 0 : Math.round(results.value || 0));
    });
  });
}

function fetchActiveEnergy(): Promise<number> {
  return new Promise((resolve) => {
    AppleHealthKit.getActiveEnergyBurned(
      { startDate: startOfToday().toISOString(), endDate: new Date().toISOString() },
      (err: any, results: any) => {
        if (err || !results) return resolve(0);
        const total = results.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
        resolve(Math.round(total));
      }
    );
  });
}

function fetchRestingHeartRate(): Promise<number | null> {
  return new Promise((resolve) => {
    AppleHealthKit.getRestingHeartRateSamples(
      {
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        endDate: new Date().toISOString(),
      },
      (err: any, results: any) => {
        if (err || !results || results.length === 0) return resolve(null);
        resolve(Math.round(results[results.length - 1].value));
      }
    );
  });
}

function fetchSleep(): Promise<number | null> {
  return new Promise((resolve) => {
    AppleHealthKit.getSleepSamples(
      {
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        endDate: new Date().toISOString(),
      },
      (err: any, results: any) => {
        if (err || !results || results.length === 0) return resolve(null);
        const totalMs = results.reduce((sum: number, sample: any) => {
          const start = new Date(sample.startDate).getTime();
          const end = new Date(sample.endDate).getTime();
          return sum + Math.max(0, end - start);
        }, 0);
        resolve(Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10);
      }
    );
  });
}

function fetchMindfulMinutes(): Promise<number> {
  return new Promise((resolve) => {
    AppleHealthKit.getMindfulSession(
      {
        startDate: startOfToday().toISOString(),
        endDate: new Date().toISOString(),
      },
      (err: any, results: any) => {
        if (err || !results) return resolve(0);
        const totalMs = results.reduce((sum: number, sample: any) => {
          const start = new Date(sample.startDate).getTime();
          const end = new Date(sample.endDate).getTime();
          return sum + Math.max(0, end - start);
        }, 0);
        resolve(Math.round(totalMs / (1000 * 60)));
      }
    );
  });
}

export function useAppleHealth() {
  const [status, setStatus] = useState<HealthConnectionStatus>(
    Platform.OS === 'ios' && AppleHealthKit ? 'disconnected' : 'unsupported'
  );
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!AppleHealthKit) return;

    const [steps, activeEnergyBurned, restingHeartRate, sleepHours, mindfulMinutes] = await Promise.all([
      fetchSteps(),
      fetchActiveEnergy(),
      fetchRestingHeartRate(),
      fetchSleep(),
      fetchMindfulMinutes(),
    ]);

    setSnapshot({ steps, activeEnergyBurned, restingHeartRate, sleepHours, mindfulMinutes });
  }, []);

  const connect = useCallback(() => {
    if (!AppleHealthKit || !PERMISSIONS) {
      setStatus('unsupported');
      return;
    }

    setStatus('connecting');
    setError(null);

    AppleHealthKit.initHealthKit(PERMISSIONS, (err: string) => {
      if (err) {
        setStatus('error');
        setError(err);
        return;
      }

      setStatus('connected');
      refresh();
    });
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
    isSupported: Platform.OS === 'ios' && !!AppleHealthKit,
    status,
    snapshot,
    error,
    connect,
    disconnect,
    refresh,
  };
}
