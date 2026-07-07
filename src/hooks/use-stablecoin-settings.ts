import { useState, useEffect } from 'react';

export interface StablecoinSettings {
  enabled: boolean;
  walletConnected: boolean;
  walletAddress: string | null;
  walletType: 'metamask' | 'coinbase' | 'phantom' | null;
  payday: number; // day of month (1-31)
  billDay: number; // day of month (1-31)
  sweepPercentage: number; // percentage of paycheck to sweep
}

const STABLECOIN_STORAGE_KEY = 'finzee_stablecoin_settings';

const DEFAULT_SETTINGS: StablecoinSettings = {
  enabled: false,
  walletConnected: false,
  walletAddress: null,
  walletType: null,
  payday: 15,
  billDay: 1,
  sweepPercentage: 50,
};

export function useStablecoinSettings() {
  const [settings, setSettings] = useState<StablecoinSettings>(() => {
    const stored = localStorage.getItem(STABLECOIN_STORAGE_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STABLECOIN_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<StablecoinSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const toggleEnabled = () => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const connectWallet = (type: 'metamask' | 'coinbase' | 'phantom', address: string) => {
    setSettings(prev => ({
      ...prev,
      walletConnected: true,
      walletType: type,
      walletAddress: address,
    }));
  };

  const disconnectWallet = () => {
    setSettings(prev => ({
      ...prev,
      walletConnected: false,
      walletType: null,
      walletAddress: null,
    }));
  };

  return {
    settings,
    updateSettings,
    toggleEnabled,
    connectWallet,
    disconnectWallet,
  };
}
