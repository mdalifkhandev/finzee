// FinZee AI™ — Budget Screen
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StatusBar,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { callFunction } from '../../services/api';

type BudgetRow = {
  id: string;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  percent_used: number;
  over_budget: boolean;
  period?: string | null;
  color?: string | null;
  icon?: string | null;
};

type BudgetSummaryResponse = {
  categories?: BudgetRow[];
  totals?: { budget: number; spent: number; remaining: number; percent_used: number };
  period_start?: string;
};

const TAB_BAR_SPACING = Platform.OS === 'ios' ? 50 : 30;

function money(value: number) {
  return `$${Math.abs(Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function categoryHue(category: string) {
  const map: Record<string, string> = {
    groceries: '#34d399',
    food: '#f59e0b',
    dining: '#f59e0b',
    shopping: '#a855f7',
    entertainment: '#ec4899',
    transportation: '#60a5fa',
    travel: '#60a5fa',
    utilities: '#14b8a6',
    income: '#34d399',
    health: '#10b981',
    uncategorized: '#94a3b8',
  };

  return map[category.toLowerCase()] ?? map.uncategorized;
}

function progressColor(percent: number) {
  if (percent >= 100) return '#ef4444';
  if (percent >= 80) return '#f59e0b';
  return '#10b981';
}

export default function BudgetsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetRow | null>(null);
  const [summary, setSummary] = useState<BudgetSummaryResponse>({});
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [form, setForm] = useState({
    category: 'Shopping',
    amount: '',
    period: 'monthly',
    color: '',
    icon: '💳',
  });

  const load = useCallback(async () => {
    if (!user) {
      setBudgets([]);
      setSummary({});
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setLoading(true);
      const response = await callFunction<BudgetSummaryResponse>('budget-summary', { method: 'GET' });
      const rows = Array.isArray(response?.categories) ? response.categories : [];
      setSummary(response ?? {});
      setBudgets(rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load budgets';
      Alert.alert('Budget load failed', message);
      setBudgets([]);
      setSummary({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const totalBudget = summary.totals?.budget ?? budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = summary.totals?.spent ?? budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const overallPercent = summary.totals?.percent_used ?? (totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0);

  const categoriesInUse = useMemo(() => {
    const base = ['Shopping', 'Food', 'Groceries', 'Transportation', 'Entertainment', 'Utilities', 'Health', 'Travel'];
    const seen = new Set(base);
    for (const budget of budgets) {
      if (budget.category && !seen.has(budget.category)) {
        seen.add(budget.category);
        base.push(budget.category);
      }
    }
    return base;
  }, [budgets]);

  const aiSuggestion = useMemo(() => {
    const nearLimit = budgets.find((b) => b.percent_used >= 80 && b.percent_used < 100);
    const overLimit = budgets.find((b) => b.percent_used >= 100);

    if (overLimit) {
      return `Your ${overLimit.category} budget is over limit. Reduce discretionary spending or increase the category cap.`;
    }
    if (nearLimit) {
      return `${nearLimit.category} is at ${nearLimit.percent_used}% used. Keep a close eye on the next few purchases.`;
    }
    return 'Your budget looks balanced. Keep tracking weekly to stay ahead of overspending.';
  }, [budgets]);

  const openCreate = useCallback(() => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in before creating a budget.');
      return;
    }
    setSelectedBudget(null);
    setForm({
      category: 'Shopping',
      amount: '',
      period: 'monthly',
      color: '',
      icon: '💳',
    });
    setShowModal(true);
  }, [user]);

  const editBudget = useCallback((budget: BudgetRow) => {
    setSelectedBudget(budget);
    setForm({
      category: budget.category,
      amount: String(budget.amount ?? ''),
      period: budget.period ?? 'monthly',
      color: budget.color ?? '',
      icon: budget.icon ?? '💳',
    });
    setShowModal(true);
  }, []);

  const saveBudget = useCallback(async () => {
    if (!user) return;
    const amount = Number.parseFloat(form.amount);
    if (!form.category.trim() || Number.isNaN(amount) || amount < 0) {
      Alert.alert('Missing info', 'Please provide a valid category and amount.');
      return;
    }

    setSaving(true);
    try {
      const response = await callFunction('budget-set', {
        method: 'POST',
        body: {
          category: form.category.trim(),
          amount,
          period: form.period,
          color: form.color.trim() || undefined,
          icon: form.icon.trim() || undefined,
        },
      });

      if (!response) {
        throw new Error('No response from budget-set');
      }

      Alert.alert(
        selectedBudget ? 'Budget updated' : 'Budget created',
        `${form.category} budget saved successfully.`,
      );
      setShowModal(false);
      setSelectedBudget(null);
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save budget';
      Alert.alert('Save failed', message);
    } finally {
      setSaving(false);
    }
  }, [form, load, selectedBudget, user]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#06080f" translucent={false} />

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>{selectedBudget ? 'Edit budget' : 'Create budget'}</Text>
                <Text style={styles.modalTitle}>{selectedBudget ? 'Update this limit' : 'Add a new budget'}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={Colors.mute} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                  {categoriesInUse.map((category) => {
                    const active = form.category === category;
                    return (
                      <TouchableOpacity
                        key={category}
                        style={[styles.categoryChip, active && styles.categoryChipActive]}
                        onPress={() => setForm((prev) => ({ ...prev, category }))}
                      >
                        <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{category}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Limit amount</Text>
                  <TextInput
                    style={styles.formInput}
                    value={form.amount}
                    onChangeText={(amount) => setForm((prev) => ({ ...prev, amount }))}
                    placeholder="500"
                    placeholderTextColor={Colors.mute2}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Period</Text>
                  <View style={styles.segmentWrap}>
                    {(['weekly', 'monthly', 'yearly'] as const).map((period) => {
                      const active = form.period === period;
                      return (
                        <TouchableOpacity
                          key={period}
                          style={[styles.segment, active && styles.segmentActive]}
                          onPress={() => setForm((prev) => ({ ...prev, period }))}
                        >
                          <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                            {period[0].toUpperCase() + period.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Emoji</Text>
                  <TextInput
                    style={styles.formInput}
                    value={form.icon}
                    onChangeText={(icon) => setForm((prev) => ({ ...prev, icon }))}
                    placeholder="💳"
                    placeholderTextColor={Colors.mute2}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Color</Text>
                  <TextInput
                    style={styles.formInput}
                    value={form.color}
                    onChangeText={(color) => setForm((prev) => ({ ...prev, color }))}
                    placeholder="#4f46e5"
                    placeholderTextColor={Colors.mute2}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowModal(false);
                  setSelectedBudget(null);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveBudget} disabled={saving}>
                <LinearGradient colors={['#2563eb', '#4f46e5']} style={styles.saveGrad}>
                  <Text style={styles.saveText}>{saving ? 'Saving…' : selectedBudget ? 'Update Budget' : 'Save Budget'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={Colors.blue} />}
      >
        <LinearGradient colors={['#06080f', '#0f172a', '#1e1b4b']} style={styles.hero}>
          <Text style={styles.kicker}>FinZee AI™</Text>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.subtitle}>Set limits per category and track spending in real time.</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Budget</Text>
              <Text style={styles.summaryValue}>{money(totalBudget)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Spent</Text>
              <Text style={styles.summaryValue}>{money(totalSpent)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Used</Text>
              <Text style={styles.summaryValue}>{overallPercent}%</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={openCreate}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Add Budget</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.aiCard}>
            <View style={styles.aiChip}>
              <Text style={styles.aiChipText}>AI Suggestion</Text>
            </View>
            <Text style={styles.aiTitle}>{aiSuggestion}</Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Category Limits</Text>
            <Text style={styles.sectionSub}>Live from Supabase</Text>
          </View>

          {loading ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Loading budgets…</Text>
            </View>
          ) : budgets.length > 0 ? (
            <View style={styles.list}>
              {budgets.map((budget) => {
                const fillColor = progressColor(budget.percent_used);
                const categoryColor = categoryHue(budget.category);
                const width = `${Math.min(budget.percent_used, 100)}%`;
                return (
                  <TouchableOpacity key={budget.id} style={styles.card} onPress={() => editBudget(budget)}>
                    <View style={styles.cardTop}>
                      <View style={[styles.iconWrap, { backgroundColor: `${categoryColor}16` }]}>
                        <Text style={styles.iconText}>{budget.icon || '💸'}</Text>
                      </View>
                      <View style={styles.cardMeta}>
                        <View style={styles.cardRow}>
                          <Text style={styles.cardTitle}>{budget.category}</Text>
                          <View style={[styles.percentPill, { backgroundColor: `${fillColor}18` }]}>
                            <Text style={[styles.percentText, { color: fillColor }]}>
                              {budget.over_budget ? `${budget.percent_used}% over` : `${budget.percent_used}%`}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.cardSub}>
                          {money(budget.spent)} of {money(budget.amount)} • {budget.period ?? 'monthly'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width, backgroundColor: fillColor }]} />
                    </View>

                    <View style={styles.cardBottom}>
                      <Text style={styles.remainingText}>
                        {budget.over_budget ? `${money(budget.spent - budget.amount)} over budget` : `${money(budget.remaining)} remaining`}
                      </Text>
                      <Text style={styles.editHint}>Tap to edit</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="wallet-outline" size={34} color={Colors.mute2} />
              <Text style={styles.emptyTitle}>No budgets yet</Text>
              <Text style={styles.emptyText}>Create your first category limit to start real-time tracking and alerts.</Text>
            </View>
          )}

          <View style={{ height: TAB_BAR_SPACING }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingHorizontal: 20,
    paddingBottom: 22,
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
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  addButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(59,130,246,0.24)',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.28)',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  body: {
    padding: 16,
  },
  aiCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border2,
    marginBottom: 14,
    ...Shadow.sm,
  },
  aiChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#ede9fe',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  aiChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5b21b6',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink3,
    lineHeight: 20,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 11,
    color: Colors.mute,
    marginTop: 2,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border2,
    ...Shadow.sm,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 24,
  },
  cardMeta: {
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  percentPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  percentText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardSub: {
    fontSize: 11,
    color: Colors.mute,
    marginTop: 4,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.bg2,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink3,
  },
  editHint: {
    fontSize: 11,
    color: Colors.mute2,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.mute,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  modalKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.mute2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.5,
  },
  modalBody: {
    paddingBottom: 10,
    gap: 12,
  },
  formGroup: {
    gap: 7,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  formInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1.2,
    borderColor: Colors.border2,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.ink,
  },
  categoryRow: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  categoryChipActive: {
    backgroundColor: Colors.blueTint,
    borderColor: 'rgba(59,130,246,0.25)',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.ink,
  },
  categoryChipTextActive: {
    color: Colors.blue,
  },
  segmentWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: Colors.blueTint,
    borderColor: 'rgba(59,130,246,0.28)',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.mute,
  },
  segmentTextActive: {
    color: Colors.blue,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 6,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink3,
  },
  saveBtn: {
    flex: 1.5,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  saveGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
});
