import { useEffect } from 'react';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  accounts as mockAccounts,
  transactions as mockTransactions,
  budgets as mockBudgets,
  goals as mockGoals,
  insights as mockInsights,
  currentUser as mockUser,
} from '@/lib/mock-data';

// Define explicit types for consistent returns
interface Account {
  id: string;
  userId: string;
  provider: string;
  name: string;
  mask: string;
  balance: number;
  status: 'active' | 'inactive';
  type: 'checking' | 'savings' | 'credit';
}

interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  timestamp: string;
  merchant: string;
  logo: string;
  mcc: string;
  categories: string[];
  status: 'posted' | 'pending';
  isRecurring?: boolean;
}

interface Budget {
  id: string;
  userId: string;
  month: string;
  category: string;
  icon: string;
  limitAmount: number;
  spentAmount: number;
}

interface Goal {
  id: string;
  userId: string;
  name: string;
  kind: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  dueDate: string;
  status: string;
  progress: number;
}

interface Insight {
  id: string;
  userId: string;
  topic: string;
  severity: 'low' | 'medium' | 'high';
  icon: string;
  title: string;
  description: string;
  costEstimate: number;
  actionLabel: string;
  createdAt: string;
}

interface DemoUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  tier: 'free' | 'pro';
  region: string;
  createdAt: string;
}

interface DemoDataReturn {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  insights: Insight[];
  currentUser: DemoUser;
  isLoading: boolean;
}

export function useDemoData(): DemoDataReturn {
  const { isDemoMode } = useDemoMode();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Demo mode should only serve mock data when no user is authenticated.
  // (Demo users like jason@finzee.demo should see their seeded backend data.)
  const shouldUseMockData = isDemoMode && !user;

  // Reset and refetch all data when auth state changes
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Invalidate all dashboard queries to clear cached data
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    });
    return () => sub?.subscription?.unsubscribe();
  }, [queryClient]);

  // Fetch real accounts
  const { data: realAccounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !shouldUseMockData && !!user,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch real transactions
  const { data: realTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('ts', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !shouldUseMockData && !!user,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch real budgets
  const { data: realBudgets, isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !shouldUseMockData && !!user,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch real goals with new columns (kind, due_date, status, progress)
  const { data: realGoals, isLoading: goalsLoading } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('id, user_id, name, kind, target_amount, current_amount, target_date, due_date, is_completed, status, progress, icon, color, category')
        .eq('user_id', user!.id)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !shouldUseMockData && !!user,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch real insights
  const { data: realInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !shouldUseMockData && !!user,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Return demo data or real data based on mode
  if (shouldUseMockData) {
    return {
      accounts: mockAccounts.map(acc => ({
        id: acc.id,
        userId: acc.userId,
        provider: acc.provider,
        name: acc.name,
        mask: acc.mask,
        balance: acc.balance,
        status: acc.status as 'active' | 'inactive',
        type: acc.type as 'checking' | 'savings' | 'credit',
      })),
      transactions: mockTransactions.map(tx => ({
        id: tx.id,
        accountId: tx.accountId,
        amount: tx.amount,
        currency: tx.currency,
        timestamp: tx.timestamp,
        merchant: tx.merchant,
        logo: tx.logo,
        mcc: tx.mcc,
        categories: tx.categories,
        status: tx.status as 'posted' | 'pending',
      })),
      budgets: mockBudgets.map(bud => ({
        id: bud.id,
        userId: bud.userId,
        month: bud.month,
        category: bud.category,
        icon: bud.icon,
        limitAmount: bud.limitAmount,
        spentAmount: bud.spentAmount,
      })),
      goals: mockGoals.map(goal => ({
        id: goal.id,
        userId: goal.userId,
        name: goal.name,
        kind: goal.kind || 'savings',
        icon: goal.icon,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        dueDate: goal.dueDate,
        status: goal.status || 'active',
        progress: goal.currentAmount / goal.targetAmount,
      })),
      insights: mockInsights.map(ins => ({
        id: ins.id,
        userId: ins.userId,
        topic: ins.topic,
        severity: ins.severity as 'low' | 'medium' | 'high',
        icon: ins.icon,
        title: ins.title,
        description: ins.description,
        costEstimate: ins.costEstimate,
        actionLabel: ins.actionLabel,
        createdAt: ins.createdAt,
      })),
      currentUser: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        avatar: mockUser.avatar,
        tier: mockUser.tier as 'free' | 'pro',
        region: mockUser.region,
        createdAt: mockUser.createdAt,
      },
      isLoading: false,
    };
  }

  // Transform real data to match mock data format
  const transformedAccounts = (realAccounts || []).map(acc => ({
    id: acc.id,
    userId: acc.user_id,
    provider: acc.institution || 'Unknown',
    name: acc.name,
    mask: acc.name.slice(-4),
    balance: Number(acc.balance),
    status: acc.is_active ? 'active' as const : 'inactive' as const,
    type: acc.type as 'checking' | 'savings' | 'credit',
  }));

  const transformedTransactions = (realTransactions || []).map(tx => ({
    id: tx.id,
    accountId: tx.account_id || '',
    amount: Number(tx.amount),
    currency: 'USD',
    timestamp: tx.ts,
    merchant: tx.merchant || tx.description || 'Unknown',
    logo: getCategoryEmoji(tx.categories?.[0]),
    mcc: '0000',
    categories: tx.categories || [],
    status: 'posted' as const,
  }));

  const transformedBudgets = (realBudgets || []).map(bud => ({
    id: bud.id,
    userId: bud.user_id,
    month: bud.month,
    category: bud.category,
    icon: getCategoryEmoji(bud.category),
    limitAmount: Number(bud.limit_amount),
    spentAmount: Number(bud.spent_amount),
  }));

  const transformedGoals = (realGoals || []).map(goal => ({
    id: goal.id,
    userId: goal.user_id,
    name: goal.name,
    kind: goal.kind || goal.category || 'savings',
    icon: getCategoryEmoji(goal.category || goal.kind || goal.name),
    targetAmount: Number(goal.target_amount),
    currentAmount: Number(goal.current_amount),
    dueDate: goal.due_date || goal.target_date || '',
    status: goal.status || (goal.is_completed ? 'completed' : 'active'),
    progress: goal.progress != null ? Number(goal.progress) : (Number(goal.current_amount) / Number(goal.target_amount)),
  }));

  const transformedInsights = (realInsights || []).map(ins => ({
    id: ins.id,
    userId: ins.user_id,
    topic: ins.category || 'General',
    severity: getInsightSeverity(ins.type),
    icon: getInsightIcon(ins.type),
    title: ins.title,
    description: ins.description,
    costEstimate: 0,
    actionLabel: 'View Details',
    createdAt: ins.created_at,
  }));

  return {
    accounts: transformedAccounts,
    transactions: transformedTransactions,
    budgets: transformedBudgets,
    goals: transformedGoals,
    insights: transformedInsights,
    currentUser: {
      id: user?.id || '',
      name: user?.email?.split('@')[0] || 'User',
      email: user?.email || '',
      avatar: '',
      tier: 'free' as const,
      region: 'US',
      createdAt: user?.created_at || '',
    },
    isLoading: accountsLoading || transactionsLoading || budgetsLoading || goalsLoading || insightsLoading,
  };
}

function getCategoryEmoji(category?: string | null): string {
  const emojiMap: Record<string, string> = {
    groceries: '🥬',
    dining: '🍽️',
    transportation: '🚗',
    entertainment: '🎬',
    shopping: '🛍️',
    subscriptions: '📱',
    utilities: '💡',
    income: '💼',
    transfer: '💰',
    housing: '🏠',
    savings: '🛡️',
    travel: '✈️',
    tech: '💻',
    education: '📚',
    emergency: '🛡️',
    'emergency fund': '🛡️',
    vacation: '✈️',
    gas: '⛽',
    default: '💵',
  };
  
  const key = (category || 'default').toLowerCase();
  return emojiMap[key] || emojiMap.default;
}

function getInsightSeverity(type: string): 'low' | 'medium' | 'high' {
  const severityMap: Record<string, 'low' | 'medium' | 'high'> = {
    warning: 'high',
    recommendation: 'medium',
    achievement: 'low',
    tip: 'low',
  };
  return severityMap[type] || 'medium';
}

function getInsightIcon(type: string): string {
  const iconMap: Record<string, string> = {
    warning: '⚠️',
    recommendation: '💡',
    achievement: '🏆',
    tip: '💡',
  };
  return iconMap[type] || '💡';
}
