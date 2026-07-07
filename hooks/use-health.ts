import { Platform } from 'react-native';
import { useAppleHealth } from './use-apple-health';
import { useGoogleHealth } from './use-google-health';

export type { HealthConnectionStatus, HealthSnapshot } from './use-apple-health';

export type HealthProvider = 'apple-health' | 'health-connect' | null;

/**
 * Cross-platform wearable/health hook — backs onto Apple HealthKit on iOS
 * and Google Health Connect on Android. Both are native modules that
 * require a custom dev/production build (not Expo Go).
 */
export function useHealth() {
  const apple = useAppleHealth();
  const google = useGoogleHealth();

  const active = Platform.OS === 'ios' ? apple : google;

  const provider: HealthProvider =
    Platform.OS === 'ios' ? 'apple-health' : Platform.OS === 'android' ? 'health-connect' : null;

  const providerName = provider === 'apple-health' ? 'Apple Health' : provider === 'health-connect' ? 'Health Connect' : 'Health';

  return {
    provider,
    providerName,
    ...active,
  };
}
