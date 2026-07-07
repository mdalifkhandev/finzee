import { useState, useEffect } from 'react';

interface SkimSettings {
  enabled: boolean;
  percentage: number;
  targetGoalKind: string;
  lastProcessedTransactionId: string | null;
}

const SKIM_STORAGE_KEY = 'finzee_skim_settings';

const DEFAULT_SETTINGS: SkimSettings = {
  enabled: false,
  percentage: 5,
  targetGoalKind: 'emergency',
  lastProcessedTransactionId: null,
};

export function useSkimSettings() {
  const [settings, setSettings] = useState<SkimSettings>(() => {
    const stored = localStorage.getItem(SKIM_STORAGE_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(SKIM_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<SkimSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const toggleEnabled = () => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  return {
    settings,
    updateSettings,
    toggleEnabled,
  };
}
