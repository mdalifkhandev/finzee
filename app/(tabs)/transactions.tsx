// FinZee AI™ — Transactions Screen
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { callFunction } from '../../services/api';

type TransactionItem = {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  date: string | null;
  is_discretionary?: boolean;
};

type CategoryFilter = {
  name: string;
  count: number;
  amount: number;
};

const TAB_BAR_SPACING = Platform.OS === 'ios' ? 50 : 30;

const CATEGORY_COLORS: Record<string, string> = {
  groceries: '#34d399',
  food: '#f59e0b',
  dining: '#f59e0b',
  shopping: '#a855f7',
  entertainment: '#ec4899',
  transportation: '#60a5fa',
  travel: '#60a5fa',
  utilities: '#14b8a6',
  income: '#34d399',
  subscriptions: '#f97316',
  health: '#10b981',
  uncategorized: '#94a3b8',
};

function money(value: number) {
  return `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDayLabel(dateString: string | null) {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function colorForCategory(category: string) {
  return CATEGORY_COLORS[category.toLowerCase()] ?? CATEGORY_COLORS.uncategorized;
}

function TxRow({ item }: { item: TransactionItem }) {
  const categoryColor = colorForCategory(item.category);
  const isIncome = item.amount >= 0;

  return (
    <View style={styles.txRow}>
      <View style={[styles.txIconWrap, { backgroundColor: `${categoryColor}18` }]}>
        <Text style={styles.txIcon}>{isIncome ? '↗' : '↘'}</Text>
      </View>

      <View style={styles.txInfo}>
        <View style={styles.txTop}>
          <Text style={styles.txMerchant} numberOfLines={1}>{item.merchant}</Text>
          <Text style={[styles.txAmount, { color: isIncome ? Colors.green : Colors.ink }]}>
            {isIncome ? '+' : '-'}{money(item.amount)}
          </Text>
        </View>
        <View style={styles.txBottom}>
          <View style={[styles.categoryPill, { backgroundColor: `${categoryColor}14`, borderColor: `${categoryColor}30` }]}>
            <Text style={[styles.categoryPillText, { color: categoryColor }]}>{item.category}</Text>
          </View>
          <Text style={styles.txDate}>{formatDayLabel(item.date)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function TransactionsScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [source, setSource] = useState<'db' | 'empty' | 'error'>('empty');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await callFunction<{ transactions?: TransactionItem[]; source?: string }>('plaid-transactions', {
        method: 'GET',
        query: { limit: 250 },
      });

      const rows = Array.isArray(response?.transactions) ? response.transactions : [];
      setTransactions(rows);
      setSource((response?.source as 'db' | 'empty' | undefined) ?? (rows.length > 0 ? 'db' : 'empty'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load transactions';
      setErrorMessage(message);
      setTransactions([]);
      setSource('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo<CategoryFilter[]>(() => {
    const map = new Map<string, { count: number; amount: number }>();
    for (const item of transactions) {
      const category = item.category || 'Uncategorized';
      const current = map.get(category) ?? { count: 0, amount: 0 };
      current.count += 1;
      current.amount += Math.abs(Number(item.amount) || 0);
      map.set(category, current);
    }

    return [
      { name: 'All', count: transactions.length, amount: transactions.reduce((sum, item) => sum + Math.abs(item.amount || 0), 0) },
      ...Array.from(map.entries())
        .map(([name, value]) => ({ name, count: value.count, amount: value.amount }))
        .sort((a, b) => b.amount - a.amount),
    ];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        !query ||
        item.merchant.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [transactions, search, selectedCategory]);

  const totalSpent = useMemo(
    () => transactions.filter((item) => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0),
    [transactions],
  );
  const totalIncome = useMemo(
    () => transactions.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0),
    [transactions],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#06080f" translucent={false} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={Colors.blue} />}
      >
        <LinearGradient colors={['#06080f', '#0f172a', '#1e1b4b']} style={styles.hero}>
          <Text style={styles.kicker}>FinZee AI™</Text>
          <Text style={styles.title}>Transactions</Text>
          <Text style={styles.subtitle}>Plaid-powered spending, categories, and filters in one place.</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Spent</Text>
              <Text style={styles.summaryValue}>{money(totalSpent)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={styles.summaryValue}>{money(totalIncome)}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={[styles.searchBox, Shadow.sm]}>
            <Ionicons name="search" size={18} color={Colors.mute2} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search merchants or categories"
              placeholderTextColor={Colors.mute2}
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={Colors.mute2} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {categories.map((category) => {
              const active = selectedCategory === category.name;
              return (
                <TouchableOpacity
                  key={category.name}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedCategory(category.name)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {category.name}
                  </Text>
                  <Text style={[styles.filterChipSub, active && styles.filterChipTextActive]}>
                    {category.count} · {money(category.amount)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>All Transactions</Text>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceBadgeText}>{source === 'db' ? 'Live DB' : source === 'empty' ? 'No data yet' : 'Error'}</Text>
            </View>
          </View>

          {errorMessage ? (
            <View style={styles.emptyCard}>
              <Ionicons name="warning-outline" size={30} color={Colors.red} />
              <Text style={styles.emptyTitle}>Couldn’t load transactions</Text>
              <Text style={styles.emptyText}>{errorMessage}</Text>
            </View>
          ) : filteredTransactions.length > 0 ? (
            <View style={styles.txList}>
              {filteredTransactions.map((item) => (
                <TxRow key={item.id} item={item} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={34} color={Colors.mute2} />
              <Text style={styles.emptyTitle}>{loading ? 'Loading transactions…' : 'No transactions found'}</Text>
              <Text style={styles.emptyText}>
                {loading
                  ? 'Fetching your Plaid data and category breakdown.'
                  : 'Try another search or sync more transactions from your connected account.'}
              </Text>
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
  body: {
    padding: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border2,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.ink,
    paddingVertical: 0,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    minWidth: 92,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  filterChipActive: {
    backgroundColor: Colors.blueTint,
    borderColor: 'rgba(26,86,219,0.18)',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
  },
  filterChipTextActive: {
    color: Colors.blue,
  },
  filterChipSub: {
    fontSize: 10,
    color: Colors.mute,
    marginTop: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  sourceBadge: {
    backgroundColor: Colors.bg2,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  txList: {
    gap: 10,
  },
  txRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border2,
    ...Shadow.sm,
  },
  txIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.ink,
  },
  txInfo: {
    flex: 1,
    gap: 6,
  },
  txTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  txMerchant: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  txBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  txDate: {
    fontSize: 11,
    color: Colors.mute,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
    marginTop: 8,
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
});
