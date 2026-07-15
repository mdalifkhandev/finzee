// FinZee AI™ — Health & Biometrics Screen
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow, Radius, Gradients } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { getDailyMetrics } from '../../services/healthService';
import { getConnectedWearables } from '../../services/wearableService';
import type { HealthDailyMetric } from '../../types';

function WellnessRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = size * 0.4, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const s0 = score >= 80 ? '#34d399' : score >= 60 ? '#f59e0b' : '#f87171';
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={Colors.bg2} strokeWidth={7} />
      <Defs><SvgGrad id="wg" x1="0%" y1="0%" x2="100%" y2="0%"><Stop offset="0%" stopColor={s0} /><Stop offset="100%" stopColor="#60a5fa" /></SvgGrad></Defs>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#wg)" strokeWidth={7} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" rotation="-90" origin={`${cx},${cy}`} />
    </Svg>
  );
}

function MetricCard({ icon, label, value, unit, trend, trendColor, bgColor }: { icon: string; label: string; value: string; unit?: string; trend: string; trendColor: string; bgColor: string; iconColor: string }) {
  return (
    <View style={[mc.card, Shadow.sm]}>
      <View style={mc.top}><View style={[mc.iconBox, { backgroundColor: bgColor }]}><Ionicons name={icon as any} size={16} color={trendColor} /></View><Text style={[mc.trend, { color: trendColor }]}>{trend}</Text></View>
      <Text style={mc.label}>{label}</Text>
      <Text style={mc.value}>{value}{unit ? <Text style={mc.unit}> {unit}</Text> : null}</Text>
    </View>
  );
}
const mc = StyleSheet.create({
  card:    { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, borderWidth: 1, borderColor: Colors.border2 },
  top:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  iconBox: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 10, fontWeight: '700', color: Colors.mute2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  value:   { fontSize: 20, fontWeight: '800', color: Colors.ink, letterSpacing: -0.5 },
  unit:    { fontSize: 11, color: Colors.mute, fontWeight: '500' },
  trend:   { fontSize: 10, fontWeight: '700' },
});

function StressBar({ h, color, day }: { h: number; color: string; day: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <View style={{ height: 56, justifyContent: 'flex-end', width: '100%' }}>
        <View style={{ height: h, backgroundColor: color, borderRadius: 3, width: '100%', minHeight: 4 }} />
      </View>
      <Text style={{ fontSize: 8.5, fontWeight: '700', color: Colors.mute2 }}>{day}</Text>
    </View>
  );
}

const TAB_BAR_SPACING = Platform.OS === 'ios' ? 50 : 30;

export default function HealthScreen() {
  const { user } = useAuth();
  const [metrics, setMetrics]   = useState<HealthDailyMetric | null>(null);
  const [connected, setConnected] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);

  const wellnessScore = metrics && (metrics.steps || metrics.sleepHours || metrics.heartRate)
    ? Math.round((Math.min((metrics.sleepHours || 0) / 8, 1) * 30) + (Math.min((metrics.steps || 0) / 10000, 1) * 25) + (metrics.stressIndicator === 'low' ? 25 : metrics.stressIndicator === 'moderate' ? 15 : 5) + 20)
    : 0;

  useEffect(() => {
    (async () => {
      const status = await getConnectedWearables();
      setDeviceStatus(status);
      setConnected(status.appleHealth || status.oura || status.garmin || status.googleHealth);
      if (user) {
        const m = await getDailyMetrics(user.id, new Date().toISOString().split('T')[0]);
        setMetrics(m);
      }
    })();
  }, [user]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const status = await getConnectedWearables();
      setDeviceStatus(status);
      setConnected(status.appleHealth || status.oura || status.garmin || status.googleHealth);
      if (user) {
        const m = await getDailyMetrics(user.id, new Date().toISOString().split('T')[0]);
        setMetrics(m);
      }
    } finally {
      setRefreshing(false);
    }
  }

  const stressLabel = metrics?.stressIndicator === 'high' ? 'High' : metrics?.stressIndicator === 'moderate' ? 'Moderate' : 'Low';
  const stressColor = metrics?.stressIndicator === 'high' ? Colors.red : metrics?.stressIndicator === 'moderate' ? Colors.amber : Colors.green;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.blue} />}
      >
        <LinearGradient colors={['#0f172a', '#1e1b4b', '#4c1d95']} style={styles.hero}>
          <View style={styles.heroBar}>
            <View>
              <Text style={styles.heroEye}>FinZee AI™</Text>
              <Text style={styles.heroTitle}>Health & Biometrics</Text>
              <Text style={styles.heroSub}>Your body shapes your spending</Text>
            </View>
            <WellnessRing score={wellnessScore} size={72} />
          </View>
          <Text style={styles.wellnessScore}>{wellnessScore > 0 ? wellnessScore : '--'}<Text style={{ fontSize: 16, opacity: 0.5 }}>/100</Text></Text>
          <Text style={styles.wellnessLabel}>{wellnessScore === 0 ? 'No Data Available' : wellnessScore >= 80 ? 'Optimal Wellness' : wellnessScore >= 60 ? 'Moderate Wellness' : 'Low Wellness'}</Text>
          <Text style={styles.wellnessDesc}>{wellnessScore === 0 ? 'Sync a wearable to see your score.' : wellnessScore >= 80 ? 'Your body signals are strong. Low financial risk today.' : 'Sleep and stress indicators suggest elevated spending risk today.'}</Text>
        </LinearGradient>

        <View style={styles.body}>
          {!connected && (
            <TouchableOpacity style={styles.connectBanner} onPress={() => router.push('/connect-wearable')}>
              <LinearGradient colors={Gradients.blue} style={styles.connectGrad}>
                <Text style={styles.connectTitle}>Connect Health Data</Text>
                <Text style={styles.connectSub}>Connect a wearable device to unlock real-time biometric insights</Text>
                <Text style={styles.connectBtn}>Connect Now →</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>Today's Metrics</Text>
          <View style={styles.metricsGrid}>
            <MetricCard icon="heart-outline" label="Heart Rate" value={metrics?.heartRate ? String(metrics.heartRate) : '--'} unit="bpm" trend="Real-time" trendColor={Colors.amber} bgColor="#fff1f1" iconColor={Colors.red} />
            <MetricCard icon="moon-outline" label="Sleep" value={metrics?.sleepHours ? String(metrics.sleepHours) : '--'} unit="hrs" trend="Daily" trendColor={Colors.red} bgColor={Colors.blueTint} iconColor={Colors.blue} />
          </View>
          <View style={[styles.metricsGrid, { marginTop: 8 }]}>
            <MetricCard icon="walk-outline" label="Steps" value={metrics?.steps ? metrics.steps.toLocaleString() : '--'} unit="" trend="Daily" trendColor={Colors.green} bgColor={Colors.greenTint} iconColor={Colors.green} />
            <MetricCard icon="pulse-outline" label="Resting HR" value={metrics?.restingHeartRate ? String(metrics.restingHeartRate) : '--'} unit="bpm" trend="Average" trendColor={Colors.amber} bgColor={Colors.purpleTint} iconColor={Colors.purple} />
          </View>

          <View style={{ height: 24 }} />

          <Text style={styles.sectionTitle}>Connected Devices</Text>
          {deviceStatus?.appleHealth && (
            <View style={styles.deviceCard}>
              <View style={styles.deviceIcon}><Ionicons name="watch-outline" size={22} color={Colors.blue} /></View>
              <View style={{ flex: 1 }}><Text style={styles.deviceName}>Apple Health</Text><Text style={styles.deviceSub}>Steps, Sleep, HR</Text></View>
              <Ionicons name="checkmark-circle" size={20} color={Colors.green} />
            </View>
          )}
          {deviceStatus?.googleHealth && (
            <View style={styles.deviceCard}>
              <View style={styles.deviceIcon}><Ionicons name="bar-chart-outline" size={22} color={Colors.blue} /></View>
              <View style={{ flex: 1 }}><Text style={styles.deviceName}>Google Health Connect</Text><Text style={styles.deviceSub}>Steps, Sleep, HR</Text></View>
              <Ionicons name="checkmark-circle" size={20} color={Colors.green} />
            </View>
          )}
          {deviceStatus?.oura && (
            <View style={styles.deviceCard}>
              <View style={styles.deviceIcon}><Ionicons name="ellipse-outline" size={22} color={Colors.blue} /></View>
              <View style={{ flex: 1 }}><Text style={styles.deviceName}>Oura Ring</Text><Text style={styles.deviceSub}>Deep sleep + recovery</Text></View>
              <Ionicons name="checkmark-circle" size={20} color={Colors.green} />
            </View>
          )}
          {deviceStatus?.garmin && (
            <View style={styles.deviceCard}>
              <View style={styles.deviceIcon}><Ionicons name="fitness-outline" size={22} color={Colors.blue} /></View>
              <View style={{ flex: 1 }}><Text style={styles.deviceName}>Garmin</Text><Text style={styles.deviceSub}>HRV + stress tracking</Text></View>
              <Ionicons name="checkmark-circle" size={20} color={Colors.green} />
            </View>
          )}
          {!connected && (
            <Text style={{ color: Colors.mute, fontSize: 13, marginBottom: 16 }}>No devices connected.</Text>
          )}

          <TouchableOpacity style={styles.enableBtn} onPress={() => router.push('/connect-wearable')}>
            <LinearGradient colors={Gradients.blue} style={styles.enableBtnGrad}>
              <Text style={styles.enableBtnText}>Manage Devices →</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingBottom: TAB_BAR_SPACING },
  hero:          { paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 22, paddingHorizontal: 20 },
  heroBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroEye:       { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  heroTitle:     { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.8 },
  heroSub:       { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  wellnessScore: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: -2 },
  wellnessLabel: { fontSize: 13, fontWeight: '700', color: '#fff', marginTop: 2, marginBottom: 5 },
  wellnessDesc:  { fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 17 },
  body:          { padding: 16 },
  connectBanner: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: 16 },
  connectGrad:   { padding: 18 },
  connectTitle:  { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.4, marginBottom: 5 },
  connectSub:    { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 17, marginBottom: 14 },
  connectBtn:    { fontSize: 14, fontWeight: '700', color: '#fff' },
  sectionTitle:  { fontSize: 14, fontWeight: '800', color: Colors.ink, marginBottom: 10, letterSpacing: -0.3 },
  metricsGrid:   { flexDirection: 'row', gap: 8 },
  card:          { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Colors.border2, ...Shadow.sm },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle:     { fontSize: 14, fontWeight: '800', color: Colors.ink },
  stressBadge:   { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  stressBadgeText: { fontSize: 11, fontWeight: '700' },
  corrCard:      { borderRadius: Radius.lg, padding: 18, marginTop: 12, marginBottom: 4 },
  corrChip:      { backgroundColor: 'rgba(167,139,250,0.2)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)' },
  corrChipText:  { fontSize: 10, fontWeight: '700', color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: 0.6 },
  corrTitle:     { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.4, marginBottom: 5 },
  corrDesc:      { fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 17, marginBottom: 14 },
  corrRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, marginBottom: 6 },
  corrDot:       { width: 8, height: 8, borderRadius: 4, marginTop: 3, flexShrink: 0 },
  corrText:      { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 17, flex: 1 },
  deviceCard:    { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, borderWidth: 1, borderColor: Colors.border2, marginBottom: 8, ...Shadow.sm },
  deviceIcon:    { width: 44, height: 44, borderRadius: 13, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  deviceName:    { fontSize: 14, fontWeight: '700', color: Colors.ink },
  deviceSub:     { fontSize: 11, color: Colors.mute, marginTop: 1 },
  enableBtn:     { borderRadius: Radius.md, overflow: 'hidden', marginTop: 4 },
  enableBtnGrad: { padding: 15, alignItems: 'center' },
  enableBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
});

