// FinZee AI™ — Weekly Wins Report
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { callFunction } from '../services/api';

type WeeklyStats = {
  first_name?: string;
  week_start?: string;
  total_spent?: number;
  total_income?: number;
  transaction_count?: number;
  top_categories?: Array<{ category: string; amount: number }>;
  goals?: Array<{ name: string; percent: number }>;
  impulse_paused?: number;
  impulse_skipped?: number;
  saved_by_pausing?: number;
};

type WeeklyReportResponse = {
  report?: string;
  stats?: WeeklyStats;
};

const TAB_BAR_SPACING = Platform.OS === 'ios' ? 50 : 30;

function money(value: number | undefined) {
  return `$${Math.round(Number(value) || 0).toLocaleString()}`;
}

export default function WeeklyWinsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState('');
  const [stats, setStats] = useState<WeeklyStats>({});

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else router.replace('/(tabs)/home');
  };

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      const response = await callFunction<WeeklyReportResponse>('ai-weekly-report', { method: 'GET' });
      setReport(response?.report ?? '');
      setStats(response?.stats ?? {});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load weekly report';
      Alert.alert('Weekly report failed', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const topCategories = stats.top_categories ?? [];
  const goals = stats.goals ?? [];
  const paused = Number(stats.impulse_paused ?? 0);
  const skipped = Number(stats.impulse_skipped ?? 0);
  const saved = Number(stats.saved_by_pausing ?? 0);
  const spent = Number(stats.total_spent ?? 0);
  const income = Number(stats.total_income ?? 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#06080f" translucent={false} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={Colors.blue} />}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#06080f', '#0f172a', '#1e1b4b']} style={styles.hero}>
          <TouchableOpacity style={styles.backRow} onPress={goBack}>
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.9)" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.kicker}>FinZee AI™</Text>
          <Text style={styles.title}>Weekly Wins</Text>
          <Text style={styles.subtitle}>Your weekly money saved from impulse blocks, goal progress, and top spending categories.</Text>

          <View style={styles.heroCards}>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>This week spent</Text>
              <Text style={styles.heroValue}>{money(spent)}</Text>
            </View>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Saved by pausing</Text>
              <Text style={[styles.heroValue, { color: '#34d399' }]}>{money(saved)}</Text>
            </View>
          </View>

          <View style={styles.heroCards}>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Goals tracked</Text>
              <Text style={styles.heroValue}>{goals.length}</Text>
            </View>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Paused items</Text>
              <Text style={[styles.heroValue, { color: '#fbbf24' }]}>{paused}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={[styles.card, Shadow.sm]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>AI Weekly Summary</Text>
              <Text style={styles.sectionSub}>{stats.week_start ? `Since ${stats.week_start}` : 'Last 7 days'}</Text>
            </View>
            <Text style={styles.reportText}>
              {loading ? 'Loading your weekly report…' : report || 'No weekly report available yet.'}
            </Text>
          </View>

          <View style={[styles.card, Shadow.sm]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pause Block Wins</Text>
              <Text style={styles.sectionSub}>{skipped} purchases skipped</Text>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Money saved</Text>
                <Text style={styles.metricValue}>{money(saved)}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Paused items</Text>
                <Text style={styles.metricValue}>{paused}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, Shadow.sm]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Goal Progress</Text>
              <Text style={styles.sectionSub}>Current streak and savings momentum</Text>
            </View>
            {goals.length > 0 ? goals.map((goal) => (
              <View key={goal.name} style={styles.goalRow}>
                <Text style={styles.goalName}>{goal.name}</Text>
                <Text style={styles.goalPercent}>{goal.percent}%</Text>
              </View>
            )) : (
              <Text style={styles.emptyText}>No goals yet for this week.</Text>
            )}
          </View>

          <View style={[styles.card, Shadow.sm]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Spending Categories</Text>
              <Text style={styles.sectionSub}>{income > 0 ? `Income ${money(income)}` : 'No income recorded'}</Text>
            </View>
            {topCategories.length > 0 ? topCategories.map((item) => (
              <View key={item.category} style={styles.categoryRow}>
                <Text style={styles.categoryName}>{item.category}</Text>
                <Text style={styles.categoryAmount}>{money(item.amount)}</Text>
              </View>
            )) : (
              <Text style={styles.emptyText}>No category data yet.</Text>
            )}
          </View>

          <View style={{ height: TAB_BAR_SPACING }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { flexGrow: 1 },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.38)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1.1,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 18,
    marginTop: 6,
  },
  heroCards: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  heroCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  body: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border2,
    marginBottom: 12,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 11,
    color: Colors.mute,
    marginTop: 2,
  },
  reportText: {
    fontSize: 14,
    color: Colors.ink3,
    lineHeight: 21,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.mute2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.ink,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border2,
  },
  goalName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  goalPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.blue,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border2,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.ink3,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.mute,
    lineHeight: 18,
  },
});
