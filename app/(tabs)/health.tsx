// FinZee AI™ — Health & Biometrics Screen
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { router } from 'expo-router';
import { Colors, Shadow, Radius, Gradients } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { getDailyMetrics, requestHealthPermissions } from '../../services/healthService';
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
      <View style={mc.top}><View style={[mc.iconBox, { backgroundColor: bgColor }]}><Text style={{ fontSize: 15 }}>{icon}</Text></View><Text style={[mc.trend, { color: trendColor }]}>{trend}</Text></View>
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

export default function HealthScreen() {
  const { user } = useAuth();
  const [metrics, setMetrics]   = useState<HealthDailyMetric | null>(null);
  const [permitted, setPermitted] = useState(false);

  const wellnessScore = metrics
    ? Math.round((Math.min(metrics.sleepHours / 8, 1) * 30) + (Math.min(metrics.steps / 10000, 1) * 25) + (metrics.stressIndicator === 'low' ? 25 : metrics.stressIndicator === 'moderate' ? 15 : 5) + 20)
    : 70;

  useEffect(() => {
    (async () => {
      const perm = await requestHealthPermissions();
      setPermitted(perm);
      if (user) {
        const m = await getDailyMetrics(user.id, new Date().toISOString().split('T')[0]);
        setMetrics(m);
      }
    })();
  }, [user]);

  const stressLabel = metrics?.stressIndicator === 'high' ? 'High' : metrics?.stressIndicator === 'moderate' ? 'Moderate' : 'Low';
  const stressColor = metrics?.stressIndicator === 'high' ? Colors.red : metrics?.stressIndicator === 'moderate' ? Colors.amber : Colors.green;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#0f172a', '#1e1b4b', '#4c1d95']} style={styles.hero}>
          <View style={styles.heroBar}>
            <View>
              <Text style={styles.heroEye}>FinZee AI™</Text>
              <Text style={styles.heroTitle}>Health & Biometrics</Text>
              <Text style={styles.heroSub}>Your body shapes your spending</Text>
            </View>
            <WellnessRing score={wellnessScore} size={72} />
          </View>
          <Text style={styles.wellnessScore}>{wellnessScore}<Text style={{ fontSize: 16, opacity: 0.5 }}>/100</Text></Text>
          <Text style={styles.wellnessLabel}>{wellnessScore >= 80 ? '🟢 Optimal Wellness' : wellnessScore >= 60 ? '🟡 Moderate Wellness' : '🔴 Low Wellness'}</Text>
          <Text style={styles.wellnessDesc}>{wellnessScore >= 80 ? 'Your body signals are strong. Low financial risk today.' : 'Sleep and stress indicators suggest elevated spending risk today.'}</Text>
        </LinearGradient>

        <View style={styles.body}>
          {!permitted && (
            <TouchableOpacity style={styles.connectBanner} onPress={requestHealthPermissions}>
              <LinearGradient colors={Gradients.blue} style={styles.connectGrad}>
                <Text style={styles.connectTitle}>Connect Health Data</Text>
                <Text style={styles.connectSub}>Enable Apple HealthKit to unlock real-time biometric insights</Text>
                <Text style={styles.connectBtn}>Enable Now →</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>Today's Metrics</Text>
          <View style={styles.metricsGrid}>
            <MetricCard icon="❤️" label="Heart Rate" value={String(metrics?.heartRate ?? 72)} unit="bpm" trend="→ Normal" trendColor={Colors.amber} bgColor="#fff1f1" iconColor={Colors.red} />
            <MetricCard icon="🌙" label="Sleep" value={String(metrics?.sleepHours ?? 6.2)} unit="hrs" trend="↓ Below target" trendColor={Colors.red} bgColor={Colors.blueTint} iconColor={Colors.blue} />
          </View>
          <View style={[styles.metricsGrid, { marginTop: 8 }]}>
            <MetricCard icon="💟" label="Steps" value={(metrics?.steps ?? 7420).toLocaleString()} unit="" trend="↑ On track" trendColor={Colors.green} bgColor={Colors.greenTint} iconColor={Colors.green} />
            <MetricCard icon="⚡" label="HRV" value={String(metrics?.restingHeartRate ?? 58)} unit="ms" trend="→ Average" trendColor={Colors.amber} bgColor={Colors.purpleTint} iconColor={Colors.purple} />
          </View>

          <View style={[styles.card, { marginTop: 16 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Stress This Week</Text>
              <View style={[styles.stressBadge, { backgroundColor: stressColor + '20' }]}><Text style={[styles.stressBadgeText, { color: stressColor }]}>{stressLabel} Today</Text></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 5, alignItems: 'flex-end' }}>
              <StressBar h={22} color={Colors.greenTint} day="Mon" />
              <StressBar h={52} color="#fecaca" day="Tue" />
              <StressBar h={18} color={Colors.greenTint} day="Wed" />
              <StressBar h={38} color="#fde68a" day="Thu" />
              <StressBar h={16} color={Colors.greenTint} day="Fri" />
              <StressBar h={30} color="#fde68a" day="Sat" />
              <StressBar h={8}  color={Colors.bg2} day="Sun" />
            </View>
          </View>

          <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.corrCard}>
            <View style={styles.corrChip}><Text style={styles.corrChipText}>🧠  FinZee Intelligence</Text></View>
            <Text style={styles.corrTitle}>Your body affects your spending</Text>
            <Text style={styles.corrDesc}>FinZee detected behavioral patterns linking your health signals to financial decisions.</Text>
            {[
              { dot: Colors.red,   text: 'You spent $149 on Nike.com on Tuesday — a high-stress day (HR: 78bpm).' },
              { dot: Colors.amber, text: 'Discretionary spend is 34% higher on nights with under 6 hrs of sleep.' },
              { dot: Colors.green, text: 'On days with 8k+ steps, your impulse purchases drop by 62%.' },
            ].map((c, i) => (
              <View key={i} style={styles.corrRow}>
                <View style={[styles.corrDot, { backgroundColor: c.dot }]} />
                <Text style={styles.corrText}>{c.text}</Text>
              </View>
            ))}
          </LinearGradient>

          <Text style={styles.sectionTitle}>Connected Devices</Text>
          {[{ name: 'Apple Watch', sub: 'Steps, HR, HRV, Sleep', icon: '⌚' }, { name: 'Oura Ring', sub: 'Deep sleep + recovery', icon: '💍' }, { name: 'Garmin', sub: 'HRV + stress tracking', icon: '🏃' }]
            .map(d => (
              <TouchableOpacity key={d.name} style={styles.deviceCard}>
                <View style={styles.deviceIcon}><Text style={{ fontSize: 22 }}>{d.icon}</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.deviceName}>{d.name}</Text><Text style={styles.deviceSub}>{d.sub}</Text></View>
                <Text style={{ color: Colors.mute2, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            ))
          }

          <TouchableOpacity style={styles.enableBtn} onPress={() => router.push('/connect-wearable')}>
            <LinearGradient colors={Gradients.blue} style={styles.enableBtnGrad}>
              <Text style={styles.enableBtnText}>Enable HealthKit Permissions →</Text>
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
