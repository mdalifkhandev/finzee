import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from './useAuth';
import {
  configurePushNotifications,
  getPushReminderConsent,
  syncPushTokenForUser,
} from '../services/pushNotifications';

export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;

    let cancelled = false;
    configurePushNotifications();

    const received = Notifications.addNotificationReceivedListener(() => {
      // Foreground notifications are handled by the configured notification handler.
    });
    const response = Notifications.addNotificationResponseReceivedListener(() => {
      // App navigation can be wired here later if we add deep links for alerts.
    });

    void (async () => {
      try {
        const consentEnabled = await getPushReminderConsent(user.id);
        if (cancelled) return;

        if (!consentEnabled) {
          await syncPushTokenForUser(user.id, false);
          return;
        }

        await syncPushTokenForUser(user.id, true);
      } catch (error) {
        console.warn('[PushNotifications] sync failed:', error);
      }
    })();

    return () => {
      cancelled = true;
      received.remove();
      response.remove();
    };
  }, [user?.id]);
}

