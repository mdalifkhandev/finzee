// FinZee AI™ — Tab Navigator
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Colors } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.blue,
        tabBarInactiveTintColor: Colors.mute2,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.97)',
          borderTopColor: 'rgba(0,0,0,0.04)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 4,
          position: 'absolute',
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
      <Tabs.Screen name="home"    options={{ title: 'Home',    tabBarIcon: () => null }} />
      <Tabs.Screen name="health"  options={{ title: 'Health',  tabBarIcon: () => null }} />
      <Tabs.Screen name="coach"   options={{ title: 'Ask AI',  tabBarIcon: () => null }} />
      <Tabs.Screen name="goals"   options={{ title: 'Goals',   tabBarIcon: () => null }} />
      <Tabs.Screen name="pause"   options={{ title: 'Pause',   tabBarIcon: () => null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: () => null }} />
    </Tabs>
  );
}
