// FinZee AI™ — Home Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Animated, StatusBar, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Circle, Text as SvgText, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { Colors, Shadow, Radius, Gradients } from '../../constants/theme';
import FinZeeLogo from '../../components/FinZeeLogo';
import { useAuth } from '../../hooks/useAuth';
import { callFunction } from '../../services/api';

function ScoreRing({ score }: { score: number }) {
  const r = 40, cx = 48, cy = 48;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color  = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171';
  return (
    <Svg width={96} height={96} viewBox="0 0 96 96">
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={7} />
      <Defs><SvgGrad id="scoreG" x1="0%" y1="0%" x2="100%" y2="0%"><Stop offset="0%" stopColor={color} /><Stop offset="100%" stopColor="#60a5fa" /></SvgGrad></Defs>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#scoreG)" strokeWidth={7} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" rotation="-90" origin={`${cx},${cy}`} />
      <SvgText x={cx} y={cy + 7} textAnchor="middle" fontSize={22} fontWeight="800" fill="white">{score}</SvgText>
    </Svg>
  );
}

function SpendBar({ height: h, color, label, flag }: { height: number; color: string; label: string; flag?: boolean }) {
  return (
    <View style={barStyles.col}>
      <View style={barStyles.barWrap}>
        <View style={[barStyles.bar, { height: h, backgroundColor: color }, flag && { borderWidth: 1.5, borderColor: '#fca5a5' }]} />
      </View>
      <Text style={barStyles.lbl}>{label}</Text>
    </View>
  );
}
const barStyles = StyleSheet.create({
  col: { flex: 1, alignItems: 'center', gap: 4 },
  barWrap: { height: 60, justifyContent: 'flex-end', width: '100%' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  lbl: { fontSize: 9, fontWeight: '700', color: Colors.mute2 },
});

const TAB_BAR_SPACING = Platform.OS === 'ios' ? 50 : 30;

export default function HomeScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [insight, setInsight] = useState<{ title: string; body: string } | null>(null);
  const [stats, setStats] = useState({ saved: 0, goals: 0, paused: 0 });
  const [healthSummary, setHealthSummary] = useState<{ sleep: number; steps: number; stress: string; hr: number } | null>(null);
  const [weekBars, setWeekBars] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.displayName?.split(' ')[0] || 'there';

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [goalsResponse, pauseHistory, health] = await Promise.all([
        callFunction<any>('savings-goals', { method: 'GET' }),
        callFunction<any>('impulse-history', { method: 'GET', query: { status: 'pending' } }),
        callFunction<any>('health-metrics', { method: 'GET', query: { date: now.toISOString().split('T')[0] } }),
      ]);

      const txResponse = await callFunction<any>('plaid-transactions', { method: 'GET', query: { limit: 200 } });

      const txns = Array.isArray(txResponse?.transactions) ? txResponse.transactions : [];
      const weekStart = new Date(now);
      const day = weekStart.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      weekStart.setDate(weekStart.getDate() + diffToMonday);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const bars = [0, 0, 0, 0, 0, 0, 0];
      for (const tx of txns) {
        const ts = new Date(tx.date);
        if (Number.isNaN(ts.getTime()) || ts < weekStart || ts >= weekEnd) continue;
        const dayIndex = ts.getDay() === 0 ? 6 : ts.getDay() - 1;
        const amount = Math.abs(Number(tx.amount) || 0);
        bars[dayIndex] += amount;
      }
      setWeekBars(bars);

      const goals = Array.isArray(goalsResponse?.goals) ? goalsResponse.goals : [];
      const insights = Array.isArray(goalsResponse?.insights) ? goalsResponse.insights : [];
      const savedMtd = Number(goalsResponse?.total_saved ?? 0);
      const totalPaused = Number(pauseHistory?.summary?.pending ?? pauseHistory?.summary?.total ?? 0);
      const latestHealth = Array.isArray(health?.metrics) ? health.metrics[0] : health?.metrics;

      const liveScore = Math.max(0, Math.min(100, Math.round(
        50
        + Math.min(goals.length * 4, 16)
        + Math.min(savedMtd / 250, 12)
        + Math.min(Number(latestHealth?.readiness_score ?? 0) / 10, 10)
        - Math.min(totalPaused * 2, 10)
      )));

      setScore(liveScore);
      setStats({
        saved: savedMtd,
        goals: goals.length,
        paused: totalPaused,
      });
      setInsight(insights[0]
        ? {
            title: insights[0].title ?? 'Your finances look healthy today',
            body: insights[0].description ?? insights[0].body ?? 'No recent insight available.',
          }
        : {
            title: 'Your finances look healthy today',
            body: 'No recent insight available.',
          });

      if (latestHealth) {
        setHealthSummary({
          sleep: Number(latestHealth.sleep_hours ?? latestHealth.sleepHours ?? 0),
          steps: Number(latestHealth.steps ?? 0),
          hr: Number(latestHealth.heart_rate ?? latestHealth.heartRate ?? 0),
          stress: latestHealth.stress_indicator === 'high'
            ? 'High'
            : latestHealth.stress_indicator === 'moderate'
              ? 'Moderate'
              : latestHealth.stress_indicator === 'low'
                ? 'Low'
                : String(latestHealth.stressIndicator ?? 'Unknown'),
        });
      }
    } catch (e) { console.warn('[Home] load error:', e); } finally { setRefreshing(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const scoreValue = score ?? 0;
  const scoreLabel = scoreValue >= 80 ? 'Financially Strong' : scoreValue >= 60 ? 'Financially Healthy' : 'Needs Attention';
  const scoreColor = scoreValue >= 80 ? '#34d399' : scoreValue >= 60 ? '#fbbf24' : '#f87171';
  const insightTitle = insight?.title ?? 'No insights yet';
  const insightBody = insight?.body ?? 'Connect your data to see live insight here.';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, styles.scrollContent]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.blue} />}>

        <LinearGradient colors={['#06080f', '#0f172a', '#1a2444']} style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.name}>{firstName}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <FinZeeLogo variant="light" width={100} />
            </TouchableOpacity>
          </View>

          <View style={styles.scoreCard}>
            <ScoreRing score={scoreValue} />
            <View style={styles.scoreRight}>
              <Text style={styles.scoreLabel}>Financial Wellness</Text>
              <Text style={styles.scoreNum}>{scoreValue}<Text style={styles.scoreOf}>/100</Text></Text>
              <Text style={[styles.scoreStatus, { color: scoreColor }]}>{scoreLabel}</Text>
              <Text style={styles.scoreDesc} numberOfLines={2}>{insightTitle.slice(0, 50)}…</Text>
            </View>
          </View>

          <View style={styles.pills}>
            <View style={[styles.pill, { borderColor: 'rgba(52,211,153,.3)', backgroundColor: 'rgba(52,211,153,.1)' }]}><Text style={[styles.pillText, { color: '#34d399' }]}>Goals on track</Text></View>
            <View style={[styles.pill, { borderColor: 'rgba(251,191,36,.3)', backgroundColor: 'rgba(251,191,36,.1)' }]}><Text style={[styles.pillText, { color: '#fbbf24' }]}>1 spend flag</Text></View>
            <View style={[styles.pill, { borderColor: 'rgba(248,113,113,.3)', backgroundColor: 'rgba(248,113,113,.1)' }]}><Text style={[styles.pillText, { color: '#f87171' }]}>Stress: {healthSummary?.stress ?? 'Unknown'}</Text></View>
          </View>
        </LinearGradient>

        <View style={[styles.card, { marginTop: 14 }]}>
          <View style={styles.insightChip}><Text style={styles.insightChipText}>❖  Today's Insight</Text></View>
          <Text style={styles.insightTitle}>{insightTitle}</Text>
          <Text style={styles.insightBody}>{insightBody}</Text>
          <TouchableOpacity style={styles.insightCta} onPress={() => router.push('/purchase-check')}>
            <Text style={styles.insightCtaText}>Review with FinZee AI</Text>
            <Text style={styles.insightCtaArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {[{ icon: '📈', label: 'Saved', value: `$${Math.round(stats.saved).toLocaleString()}`, bg: Colors.blueTint },
            { icon: '🎯', label: 'Goals', value: `${stats.goals} Active`, bg: Colors.greenTint },
            { icon: '⏸️', label: 'Paused', value: `${stats.paused} Items`, bg: Colors.purpleTint }]
            .map(s => (
              <View key={s.label} style={[styles.statCard, Shadow.sm]}>
                <View style={[styles.statIcon, { backgroundColor: s.bg }]}><Text style={styles.statEmoji}>{s.icon}</Text></View>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
              </View>
            ))
          }
        </View>

        <View style={[styles.card, styles.trendCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Spending this week</Text>
            <TouchableOpacity><Text style={styles.cardLink}>See all</Text></TouchableOpacity>
          </View>
          <View style={styles.barsRow}>
            {(() => {
              const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const max = Math.max(...weekBars, 1);
              return labels.map((label, index) => {
                const amount = weekBars[index] ?? 0;
                const height = amount > 0 ? Math.max((amount / max) * 60, 4) : 4;
                const color = index === 1 && amount === max ? '#fecaca' : index === 4 ? '#d1fae5' : amount > 0 ? '#dbeafe' : '#eef1f8';
                return <SpendBar key={label} height={height} color={color} label={label} flag={index === 1 && amount === max} />;
              });
            })()}
          </View>
        </View>

        <TouchableOpacity style={[styles.healthCard]} onPress={() => router.push('/(tabs)/health')}>
          <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.healthGrad}>
            <View style={styles.cardHeader}>
              <View><Text style={[styles.cardTitle, { color: '#fff' }]}>Health & Wellness</Text><Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Connecting body to finances</Text></View>
              <Text style={{ color: Colors.blue, fontWeight: '700', fontSize: 13 }}>View →</Text>
            </View>
            <View style={styles.healthMetrics}>
              {[{ label: 'Sleep', value: `${healthSummary?.sleep ?? 0}h`, color: '#818cf8' }, { label: 'Steps', value: (healthSummary?.steps ?? 0).toLocaleString(), color: '#34d399' }, { label: 'HR', value: `${healthSummary?.hr ?? 0}bpm`, color: '#f87171' }, { label: 'Stress', value: healthSummary?.stress ?? 'Unknown', color: '#fbbf24' }]
                .map(m => (<View key={m.label} style={styles.hm}><Text style={[styles.hmVal, { color: m.color }]}>{m.value}</Text><Text style={styles.hmLbl}>{m.label}</Text></View>))}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: 'Should I\nBuy This?', emoji: '🛒', color: Colors.blueTint, textColor: Colors.blue, route: '/purchase-check' },
            { label: 'Pause\nPurchase', emoji: '⏸️', color: Colors.greenTint, textColor: Colors.green, route: '/(tabs)/pause' },
            { label: 'Ask\nFinZee AI', emoji: '💬', color: Colors.purpleTint, textColor: Colors.purple, route: '/(tabs)/coach' },
            { label: 'My\nGoals', emoji: '🎯', color: Colors.amberTint, textColor: Colors.amber, route: '/(tabs)/goals' },
          ].map(a => (
            <TouchableOpacity key={a.label} style={[styles.actionCard, { backgroundColor: a.color }, Shadow.sm]} onPress={() => router.push(a.route as any)}>
              <Text style={styles.actionEmoji}>{a.emoji}</Text>
              <Text style={[styles.actionLabel, { color: a.textColor }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.askCard, Shadow.md]} onPress={() => router.push('/(tabs)/coach')}>
          <LinearGradient colors={Gradients.blue} style={styles.askIcon}><Text style={{ fontSize: 20 }}>💬</Text></LinearGradient>
          <View style={styles.askText}>
            <Text style={styles.askTitle}>Ask FinZee anything</Text>
            <Text style={styles.askSub}>"Am I on track for my goals?"</Text>
          </View>
          <Text style={styles.askArrow}>›</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.bg },
  scroll:       { flex: 1 },
  content:      { flexGrow: 1, },
  scrollContent:{ paddingBottom: TAB_BAR_SPACING },
  hero:         { paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 24, paddingHorizontal: 20 },
  heroTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  greeting:     { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  name:         { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -1, marginTop: 2 },
  scoreCard:    { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: Radius.lg, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  scoreRight:   { flex: 1 },
  scoreLabel:   { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  scoreNum:     { fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: -2, lineHeight: 44 },
  scoreOf:      { fontSize: 16, opacity: 0.4 },
  scoreStatus:  { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  scoreDesc:    { fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 16 },
  pills:        { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill:         { paddingHorizontal: 11, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1 },
  pillText:     { fontSize: 10, fontWeight: '700' },
  card:         { marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 18, borderWidth: 1, borderColor: Colors.border2, ...Shadow.sm },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle:    { fontSize: 14, fontWeight: '800', color: Colors.ink, letterSpacing: -0.3 },
  cardLink:     { fontSize: 12, fontWeight: '700', color: Colors.blue },
  insightChip:  { backgroundColor: '#ede9fe', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10 },
  insightChipText: { fontSize: 10, fontWeight: '700', color: '#5b21b6', textTransform: 'uppercase', letterSpacing: 0.6 },
  insightTitle: { fontSize: 16, fontWeight: '800', color: Colors.ink, letterSpacing: -0.4, marginBottom: 5, lineHeight: 22 },
  insightBody:  { fontSize: 12, color: Colors.mute, lineHeight: 18, marginBottom: 14 },
  insightCta:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border2 },
  insightCtaText: { fontSize: 12, fontWeight: '700', color: Colors.ink3 },
  insightCtaArrow: { fontSize: 16, color: Colors.mute2 },
  statsRow:     { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 14 },
  statCard:     { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 13, borderWidth: 1, borderColor: Colors.border2 },
  statIcon:     { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statEmoji:    { fontSize: 15 },
  statLabel:    { fontSize: 9, fontWeight: '700', color: Colors.mute2, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  statValue:    { fontSize: 13, fontWeight: '800', color: Colors.ink, letterSpacing: -0.3 },
  trendCard:    { marginTop: 14 },
  barsRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 80 },
  healthCard:   { marginTop: 14, marginHorizontal: 16, borderRadius: Radius.lg, overflow: 'hidden' },
  healthGrad:   { padding: 18 },
  healthMetrics:{ flexDirection: 'row', gap: 8, marginTop: 14 },
  hm:           { flex: 1, alignItems: 'center' },
  hmVal:        { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  hmLbl:        { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.ink, marginHorizontal: 16, marginTop: 20, marginBottom: 10, letterSpacing: -0.3 },
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16 },
  actionCard:   { width: '47.5%', borderRadius: Radius.md, padding: 14 },
  actionEmoji:  { fontSize: 24, marginBottom: 8 },
  actionLabel:  { fontSize: 11, fontWeight: '800', lineHeight: 15 },
  askCard:      { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginTop: 14, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Colors.border2 },
  askIcon:      { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  askText:      { flex: 1 },
  askTitle:     { fontSize: 14, fontWeight: '700', color: Colors.ink, letterSpacing: -0.2 },
  askSub:       { fontSize: 11, color: Colors.mute, marginTop: 1, fontStyle: 'italic' },
  askArrow:     { fontSize: 22, color: Colors.mute3 },
});
