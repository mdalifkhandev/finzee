// FinZee AI™ — Tab Navigator
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Platform, AppState } from 'react-native';
import { useEffect, useRef } from 'react';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { syncHealthDataToSupabase } from '../../services/wearableService';

export default function TabLayout() {
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (user) syncHealthDataToSupabase(user.id);

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (user) syncHealthDataToSupabase(user.id);
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [user]);

  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.dark} translucent={false} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.blue,
          tabBarInactiveTintColor: Colors.mute2,
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: 'rgba(255,255,255,0.97)',
            borderTopColor: 'rgba(0,0,0,0.04)',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 84 : 64,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
            paddingTop: 4,
            elevation: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontSize: 9,
            fontWeight: '700',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="coach"
          options={{
            title: 'Ask AI',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="sparkles-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            title: 'Goals',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trophy-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="pause"
          options={{
            title: 'Pause',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pause-circle-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="health" options={{ href: null }} />
        <Tabs.Screen name="budgets" options={{ href: null }} />
        <Tabs.Screen name="transactions" options={{ href: null }} />
        <Tabs.Screen name="dashboard" options={{ href: null }} />
      </Tabs>
    </>
  );
}
