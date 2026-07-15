// FinZee AI™ — Connect Wearable Screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Alert, ActivityIndicator, Linking, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Colors, Shadow, Radius, Gradients } from '../constants/theme';
import FinZeeLogo from '../components/FinZeeLogo';
import { useAuth } from '../hooks/useAuth';
import { requestAppleHealthPermissions, requestAndroidHealthPermissions, getOuraAuthUrl, getGoogleHealthAuthUrl, initiateGarminAuth, getConnectedWearables, disconnectWearable, fetchBestAvailableMetrics, connectGoogleHealthNative } from '../services/wearableService';
import { CONFIG } from '../constants/config';

interface Wearable { id: 'apple_health' | 'oura' | 'garmin' | 'google_health' | 'google_fit'; name: string; brand: string; icon: string; description: string; features: string[]; available: boolean; comingSoon?: boolean; }

const WEARABLES: Wearable[] = [
  { id: 'apple_health', name: 'Apple Health', brand: 'Apple', icon: 'heart-outline', description: 'Connect Apple Watch and iPhone health data including steps, sleep, heart rate, and HRV.', features: ['Steps', 'Sleep analysis', 'Heart rate', 'HRV', 'Blood oxygen', 'Mindfulness'], available: Platform.OS === 'ios' },
  { id: 'oura', name: 'Oura Ring', brand: 'Oura', icon: 'ellipse-outline', description: 'The most accurate sleep and recovery tracker. Connects via Oura Cloud API.', features: ['Sleep score', 'Deep sleep', 'REM sleep', 'HRV', 'Readiness score', 'SPO₂'], available: true },
  { id: 'garmin', name: 'Garmin Connect', brand: 'Garmin', icon: 'watch-outline', description: 'Connect your Garmin device for stress tracking, Body Battery, and fitness data.', features: ['Body Battery', 'Stress score', 'Sleep', 'HRV', 'Steps', 'Active minutes'], available: true },
  { id: 'google_health', name: 'Google Health', brand: 'Google', icon: 'bar-chart-outline', description: 'Connect your Google Health data for sleep, activity, and heart rate insights.', features: ['Sleep', 'Heart rate', 'Steps', 'Active minutes', 'Health score'], available: true },
  { id: 'google_fit', name: 'Google Fit', brand: 'Google', icon: 'walk-outline', description: 'Android health data hub — steps, heart rate, and activity.', features: ['Steps', 'Heart rate', 'Active minutes', 'Calories'], available: Platform.OS === 'android', comingSoon: true },
];

function WearableCard({ wearable, connected, onConnect, onDisconnect, loading }: { wearable: Wearable; connected: boolean; onConnect: () => void; onDisconnect: () => void; loading: boolean }) {
  return (
    <View style={[styles.wCard, Shadow.sm, !wearable.available && { opacity: 0.5 }]}>
      <View style={styles.wCardTop}>
        <View style={styles.wIconWrap}><Ionicons name={wearable.icon as any} size={22} color={Colors.blue} /></View>
        <View style={styles.wInfo}>
          <View style={styles.wNameRow}>
            <Text style={styles.wName}>{wearable.name}</Text>
          {connected && <View style={styles.connectedBadge}><Ionicons name="checkmark-circle-outline" size={12} color="#065f46" /><Text style={styles.connectedBadgeText}>Connected</Text></View>}
            {wearable.comingSoon && <View style={styles.soonBadge}><Text style={styles.soonBadgeText}>Coming Soon</Text></View>}
          </View>
          <Text style={styles.wBrand}>{wearable.brand}</Text>
          <Text style={styles.wDesc}>{wearable.description}</Text>
        </View>
      </View>
      <View style={styles.featuresRow}>
        {wearable.features.map(f => <View key={f} style={styles.featureChip}><Text style={styles.featureText}>{f}</Text></View>)}
      </View>
      {!wearable.comingSoon && wearable.available && (
        <TouchableOpacity style={[styles.wActionBtn, connected && styles.wDisconnectBtn]} onPress={connected ? onDisconnect : onConnect} disabled={loading}>
          {loading ? <ActivityIndicator color={connected ? Colors.red : Colors.blue} size="small" /> : <Text style={[styles.wActionText, connected && { color: Colors.red }]}>{connected ? 'Disconnect' : 'Connect →'}</Text>}
        </TouchableOpacity>
      )}
      {!wearable.available && !wearable.comingSoon && <View style={styles.unavailableNote}><Text style={styles.unavailableText}>{Platform.OS === 'ios' ? 'Not available on iOS' : 'Not available on Android'}</Text></View>}
    </View>
  );
}

export default function ConnectWearableScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [loading, setLoading]     = useState<Record<string, boolean>>({});
  const [testData, setTestData]   = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else router.replace('/(tabs)/profile');
  };

  useEffect(() => { loadConnected(); }, []);

  async function loadConnected() {
    const status = await getConnectedWearables();
    setConnected({ apple_health: status.appleHealth, oura: status.oura, garmin: status.garmin, google_health: status.googleHealth });
  }

  function setLoad(id: string, val: boolean) { setLoading(prev => ({ ...prev, [id]: val })); }

  async function connectWearable(wearable: Wearable) {
    if (!user) return;
    setLoad(wearable.id, true);
    try {
      switch (wearable.id) {
        case 'apple_health': {
          const ok = Platform.OS === 'ios' ? await requestAppleHealthPermissions() : await requestAndroidHealthPermissions();
          if (ok) { setConnected(prev => ({ ...prev, apple_health: true })); Alert.alert('Apple Health Connected', 'FinZee AI can now read your health data.'); }
          else Alert.alert('EAS Build Required', 'HealthKit requires an EAS Development Build.\n\neas build --platform ios --profile development');
          break;
        }
        case 'oura': {
          if (CONFIG.DEV_MODE) { setConnected(prev => ({ ...prev, oura: true })); Alert.alert('Oura Ring Connected', '[DEV MODE] Simulated. Real OAuth requires EXPO_PUBLIC_OURA_CLIENT_ID.'); }
          else await Linking.openURL(getOuraAuthUrl('finzeeai://oura-callback'));
          break;
        }
        case 'garmin': {
          if (CONFIG.DEV_MODE) { setConnected(prev => ({ ...prev, garmin: true })); Alert.alert('Garmin Connected', '[DEV MODE] Simulated. Real flow requires backend Garmin OAuth1 setup.'); }
          else { const authUrl = await initiateGarminAuth(user.id); if (authUrl) await Linking.openURL(authUrl); }
          break;
        }
        case 'google_health': {
          if (Platform.OS === 'android') {
            try {
              const success = await connectGoogleHealthNative();
              if (success) {
                setConnected(prev => ({ ...prev, google_health: true }));
                Alert.alert('Google Health Connected', 'FinZee AI can now read your health data.');
              } else {
                Alert.alert('Permission Denied', 'Could not get permission for Health Connect.');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          } else {
            Alert.alert('Not Supported', 'Google Health Connect is only available on Android.');
          }
          break;
        }
      }
    } catch { Alert.alert('Connection failed', 'Please try again.'); }
    finally { setLoad(wearable.id, false); }
  }

  async function disconnectWearableById(wearable: Wearable) {
    Alert.alert(`Disconnect ${wearable.name}?`, 'FinZee will no longer receive health data from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: async () => {
        if (wearable.id !== 'apple_health' && wearable.id !== 'google_fit') await disconnectWearable(wearable.id as any);
        setConnected(prev => ({ ...prev, [wearable.id]: false }));
      }},
    ]);
  }

  async function testFetch() {
    if (!user) return;
    setLoad('test', true);
    const data = await fetchBestAvailableMetrics(user.id, new Date().toISOString().split('T')[0]);
    setTestData(data);
    setLoad('test', false);
  }

  const connectedCount = Object.values(connected).filter(Boolean).length;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadConnected();
      setTestData(null);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.blue} />}
      >
        <LinearGradient colors={['#0f172a', '#1e1b4b', '#4c1d95']} style={styles.hero}>
          <TouchableOpacity style={styles.back} onPress={goBack}><Ionicons name="arrow-back" size={16} color="rgba(255,255,255,0.85)" /><Text style={styles.backText}>Back</Text></TouchableOpacity>
          <FinZeeLogo variant="light" width={130} />
          <Text style={styles.heroTitle}>Connect your <Text style={styles.heroAccent}>wearable.</Text></Text>
          <Text style={styles.heroSub}>FinZee AI connects your body signals to your spending behavior. The smarter your data, the smarter your decisions.</Text>
          {connectedCount > 0 && <View style={styles.connectedPill}><Ionicons name="checkmark-circle-outline" size={12} color="#34d399" /><Text style={styles.connectedPillText}>{connectedCount} device{connectedCount > 1 ? 's' : ''} connected</Text></View>}
        </LinearGradient>

        <View style={styles.body}>
          <View style={[styles.whyCard, Shadow.sm]}>
            <Text style={styles.whyTitle}>Why connect a wearable?</Text>
            {[{ icon: 'alert-circle-outline', text: 'Detect stress spending before it happens' }, { icon: 'moon-outline', text: 'Link poor sleep nights to impulse purchases' }, { icon: 'trending-up-outline', text: 'Boost your financial wellness score with health data' }, { icon: 'sparkles-outline', text: 'Get AI insights that connect body signals to money habits' }]
              .map((w, i) => <View key={i} style={styles.whyRow}><Ionicons name={w.icon as any} size={16} color={Colors.blue} /><Text style={styles.whyText}>{w.text}</Text></View>)}
          </View>

          <Text style={styles.sectionTitle}>Choose your device</Text>
          {WEARABLES.map(w => <WearableCard key={w.id} wearable={w} connected={!!connected[w.id]} loading={!!loading[w.id]} onConnect={() => connectWearable(w)} onDisconnect={() => disconnectWearableById(w)} />)}

          {connectedCount > 0 && (
            <>
              <TouchableOpacity style={styles.testBtn} onPress={testFetch} disabled={!!loading['test']}>
                <Text style={styles.testBtnText}>{loading['test'] ? 'Fetching data…' : 'Test: Fetch Today\'s Metrics'}</Text>
              </TouchableOpacity>
              {testData && (
                <View style={[styles.testResult, Shadow.sm]}>
                  <Text style={styles.testResultTitle}>Live data from: {testData.source}</Text>
                  {[{ label: 'Steps', value: testData.steps?.toLocaleString() }, { label: 'Sleep', value: `${testData.sleepHours?.toFixed(1)}h` }, { label: 'Heart Rate', value: `${testData.heartRate} bpm` }, { label: 'HRV', value: testData.hrv ? `${testData.hrv} ms` : 'N/A' }, { label: 'Stress', value: testData.stressIndicator }, { label: 'Readiness', value: testData.readinessScore ? `${testData.readinessScore}/100` : 'N/A' }]
                    .map(r => <View key={r.label} style={styles.testRow}><Text style={styles.testLabel}>{r.label}</Text><Text style={styles.testValue}>{r.value}</Text></View>)}
                </View>
              )}
            </>
          )}

          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.blue} />
            <Text style={styles.privacyText}>FinZee stores only summarized daily metrics needed for insights. Raw biometric data is never sold or shared. You can disconnect any device and delete your data at any time.</Text>
          </View>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.bg },
  hero:           { paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingBottom: 32, paddingHorizontal: 22 },
  back:           { marginBottom: 16 },
  backText:       { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  heroTitle:      { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -1.5, lineHeight: 38, marginTop: 14, marginBottom: 8 },
  heroAccent:     { color: '#c4b5fd' },
  heroSub:        { fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 19 },
  connectedPill:  { alignSelf: 'flex-start', marginTop: 14, backgroundColor: 'rgba(52,211,153,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
  connectedPillText: { fontSize: 12, fontWeight: '700', color: '#34d399' },
  body:           { padding: 16 },
  whyCard:        { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: Colors.border2 },
  whyTitle:       { fontSize: 14, fontWeight: '800', color: Colors.ink, marginBottom: 12, letterSpacing: -0.3 },
  whyRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.bg2 },
  whyIcon:        { fontSize: 18, width: 24 },
  whyText:        { fontSize: 13, color: Colors.ink3, flex: 1 },
  sectionTitle:   { fontSize: 13, fontWeight: '800', color: Colors.ink, marginBottom: 10, letterSpacing: -0.2 },
  wCard:          { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 17, marginBottom: 10, borderWidth: 1, borderColor: Colors.border2 },
  wCardTop:       { flexDirection: 'row', gap: 13, marginBottom: 12 },
  wIconWrap:      { width: 50, height: 50, borderRadius: 14, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  wIcon:          { fontSize: 26 },
  wInfo:          { flex: 1 },
  wNameRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  wName:          { fontSize: 15, fontWeight: '800', color: Colors.ink, letterSpacing: -0.3 },
  connectedBadge: { backgroundColor: Colors.greenTint, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  connectedBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.green },
  soonBadge:      { backgroundColor: Colors.amberTint, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  soonBadgeText:  { fontSize: 10, fontWeight: '700', color: Colors.amber },
  wBrand:         { fontSize: 11, color: Colors.mute, fontWeight: '600', marginBottom: 4 },
  wDesc:          { fontSize: 12, color: Colors.mute, lineHeight: 17 },
  featuresRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 12 },
  featureChip:    { backgroundColor: Colors.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  featureText:    { fontSize: 11, fontWeight: '600', color: Colors.ink3 },
  wActionBtn:     { backgroundColor: Colors.blueTint, borderRadius: Radius.md, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(26,86,219,0.2)' },
  wDisconnectBtn: { backgroundColor: Colors.redTint, borderColor: 'rgba(220,38,38,0.2)' },
  wActionText:    { fontSize: 14, fontWeight: '700', color: Colors.blue },
  unavailableNote: { backgroundColor: Colors.bg2, borderRadius: 8, padding: 8, alignItems: 'center' },
  unavailableText: { fontSize: 12, color: Colors.mute },
  testBtn:        { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, marginBottom: 10 },
  testBtnText:    { fontSize: 14, fontWeight: '700', color: Colors.ink3 },
  testResult:     { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border2 },
  testResultTitle: { fontSize: 13, fontWeight: '800', color: Colors.green, marginBottom: 10 },
  testRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.bg2 },
  testLabel:      { fontSize: 12, color: Colors.mute, fontWeight: '600' },
  testValue:      { fontSize: 12, color: Colors.ink, fontWeight: '700' },
  privacyNote:    { flexDirection: 'row', gap: 10, backgroundColor: Colors.purpleTint, borderRadius: Radius.md, padding: 14, alignItems: 'flex-start', marginTop: 4 },
  privacyIcon:    { fontSize: 16, flexShrink: 0 },
  privacyText:    { fontSize: 11, color: Colors.purple, lineHeight: 17, flex: 1, fontWeight: '500' },
});



