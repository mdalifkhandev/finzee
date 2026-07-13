import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

let configured = false;

export function configurePushNotifications() {
  if (configured) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3b82f6',
    });
  }

  configured = true;
}

async function getProjectId() {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    undefined
  );
}

export async function requestExpoPushToken() {
  if (Platform.OS === 'web') {
    return { token: null as string | null, granted: false };
  }

  if (Platform.OS === 'android' && !Constants.expoConfig?.android?.googleServicesFile) {
    console.warn('[PushNotifications] Android push token skipped: googleServicesFile is not configured.');
    return { token: null as string | null, granted: false };
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    return { token: null as string | null, granted: false };
  }

  const projectId = await getProjectId();
  const tokenResult = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return { token: tokenResult.data, granted: true };
}

export async function savePushToken(userId: string, expoPushToken: string) {
  const { error } = await supabase.from('push_tokens').upsert({
    user_id: userId,
    expo_push_token: expoPushToken,
    platform: Platform.OS,
    enabled: true,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'expo_push_token',
  });

  if (error) {
    throw error;
  }
}

export async function disablePushTokens(userId: string) {
  const { error } = await supabase
    .from('push_tokens')
    .update({
      enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

export async function syncPushTokenForUser(userId: string, pushEnabled: boolean) {
  configurePushNotifications();

  if (!pushEnabled) {
    await disablePushTokens(userId);
    return { enabled: false, token: null as string | null };
  }

  const { token, granted } = await requestExpoPushToken();
  if (!granted || !token) {
    return { enabled: false, token: null as string | null };
  }

  await savePushToken(userId, token);
  return { enabled: true, token };
}

export async function getPushReminderConsent(userId: string) {
  const { data, error } = await supabase
    .from('consent_logs')
    .select('push_reminders')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.push_reminders === true;
}
