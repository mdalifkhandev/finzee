type BudgetRow = {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number | string;
  spent_amount?: number | string | null;
  period?: string | null;
  month?: string | null;
  color?: string | null;
  icon?: string | null;
};

type TransactionRow = {
  amount: number | string;
  type?: string | null;
  ts?: string | null;
  categories?: string[] | null;
};

type BudgetSummaryEntry = {
  id: string;
  category: string;
  limit_amount: number;
  spent_amount: number;
  remaining: number;
  percent_used: number;
  period: string | null;
  month: string | null;
  color: string | null;
  icon: string | null;
  over_budget: boolean;
  threshold_pct: 80 | 100 | null;
  window_start: string;
};

type BudgetSummary = {
  categories: BudgetSummaryEntry[];
  totals: {
    budget: number;
    spent: number;
    remaining: number;
    percent_used: number;
  };
  period_start: string;
};

function toDateOnly(input?: string | null) {
  if (!input) return null;
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

function startOfPeriodUtc(period: string | null | undefined, anchor?: string | null) {
  const base = toDateOnly(anchor) ?? new Date();

  if (period === 'weekly') {
    const day = base.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    base.setUTCDate(base.getUTCDate() + diffToMonday);
    base.setUTCHours(0, 0, 0, 0);
    return base;
  }

  if (period === 'yearly') {
    return new Date(Date.UTC(base.getUTCFullYear(), 0, 1));
  }

  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
}

function normalizeCategory(value: string | null | undefined) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[_/\\-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\b(and|the|of|for)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function categoriesMatch(budgetCategory: string, transactionCategory: string) {
  const budget = normalizeCategory(budgetCategory);
  const txn = normalizeCategory(transactionCategory);
  if (!budget || !txn) return false;
  if (budget === txn) return true;
  if (budget.includes(txn) || txn.includes(budget)) return true;

  const budgetWords = new Set(budget.split(' ').filter(Boolean));
  const txnWords = new Set(txn.split(' ').filter(Boolean));
  let overlap = 0;
  for (const word of budgetWords) {
    if (txnWords.has(word)) overlap += 1;
  }

  return overlap > 0 && overlap / Math.max(budgetWords.size, txnWords.size) >= 0.5;
}

function extractTransactionCategory(tx: TransactionRow) {
  return Array.isArray(tx.categories) && tx.categories.length > 0
    ? String(tx.categories[0] ?? 'Uncategorized')
    : 'Uncategorized';
}

function extractTransactionDate(tx: TransactionRow) {
  const parsed = tx.ts ? new Date(tx.ts) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function isBudgetIncome(tx: TransactionRow) {
  return String(tx.type ?? '').toLowerCase() === 'income';
}

function buildSummaryFromData(budgets: BudgetRow[], transactions: TransactionRow[]): BudgetSummary {
  const now = new Date();
  const categories = budgets.map((budget) => {
    const windowStart = startOfPeriodUtc(budget.period ?? 'monthly', budget.month);
    const spent_amount = transactions.reduce((sum, tx) => {
      if (isBudgetIncome(tx)) return sum;

      const txDate = extractTransactionDate(tx);
      if (!txDate || txDate < windowStart || txDate > now) return sum;

      const txCategory = extractTransactionCategory(tx);
      if (!categoriesMatch(budget.category, txCategory)) return sum;

      return sum + Math.abs(Number(tx.amount) || 0);
    }, 0);

    const limit_amount = Number(budget.limit_amount) || 0;
    const percent_used = limit_amount > 0 ? Math.round((spent_amount / limit_amount) * 100) : 0;
    const over_budget = spent_amount > limit_amount;
    const threshold_pct: 80 | 100 | null = over_budget ? 100 : percent_used >= 80 ? 80 : null;

    return {
      id: budget.id,
      category: budget.category,
      limit_amount,
      spent_amount,
      remaining: Math.max(limit_amount - spent_amount, 0),
      percent_used,
      period: budget.period ?? null,
      month: budget.month ?? null,
      color: budget.color ?? null,
      icon: budget.icon ?? null,
      over_budget,
      threshold_pct,
      window_start: windowStart.toISOString().slice(0, 10),
    };
  });

  const totalBudget = categories.reduce((sum, item) => sum + item.limit_amount, 0);
  const totalSpent = categories.reduce((sum, item) => sum + item.spent_amount, 0);

  return {
    categories,
    totals: {
      budget: totalBudget,
      spent: totalSpent,
      remaining: Math.max(totalBudget - totalSpent, 0),
      percent_used: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    },
    period_start: categories[0]?.window_start ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10),
  };
}

async function fetchPushTokens(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .eq('user_id', userId)
    .eq('enabled', true);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row: { expo_push_token?: string | null }) => row.expo_push_token)
    .filter((token: string | null | undefined): token is string => Boolean(token));
}

async function isPushConsentEnabled(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('consent_logs')
    .select('push_reminders')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.push_reminders === true;
}

async function alertAlreadyLogged(supabase: any, userId: string, budgetId: string, monthStart: string, thresholdPct: number) {
  const { data, error } = await supabase
    .from('budget_alert_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('budget_id', budgetId)
    .eq('month_start', monthStart)
    .eq('threshold_pct', thresholdPct)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function recordAlert(supabase: any, payload: Record<string, unknown>) {
  const { error } = await supabase.from('budget_alert_logs').insert(payload);
  if (error) {
    throw error;
  }
}

async function sendExpoPush(messages: Array<Record<string, unknown>>) {
  if (messages.length === 0) return;

  for (let index = 0; index < messages.length; index += 100) {
    const batch = messages.slice(index, index + 100);
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Expo push send failed (${response.status}): ${text}`);
    }
  }
}

export async function loadBudgetSummary(supabase: any, userId: string, transactions?: TransactionRow[]): Promise<BudgetSummary> {
  const { data: budgets, error: budgetError } = await supabase
    .from('budgets')
    .select('id, category, limit_amount, spent_amount, period, month, color, icon')
    .eq('user_id', userId);

  if (budgetError) {
    throw budgetError;
  }

  let txs = transactions;
  if (!txs) {
    const oldestWindow = (budgets ?? []).reduce((oldest: Date | null, budget: BudgetRow) => {
      const windowStart = startOfPeriodUtc(budget.period ?? 'monthly', budget.month);
      if (!oldest || windowStart < oldest) return windowStart;
      return oldest;
    }, null);

    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('amount, type, ts, categories')
      .eq('user_id', userId)
      .gte('ts', (oldestWindow ?? new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1))).toISOString());

    if (txError) {
      throw txError;
    }

    txs = txData ?? [];
  }

  return buildSummaryFromData(budgets ?? [], txs ?? []);
}

export async function dispatchBudgetAlerts(
  supabase: any,
  userId: string,
  summary?: BudgetSummary,
) {
  try {
    const consentEnabled = await isPushConsentEnabled(supabase, userId);
    if (!consentEnabled) {
      return { sent: 0, skipped: 'push_consent_disabled' };
    }

    const tokens = await fetchPushTokens(supabase, userId);
    if (tokens.length === 0) {
      return { sent: 0, skipped: 'no_push_tokens' };
    }

    const snapshot = summary ?? await loadBudgetSummary(supabase, userId);
    const messages: Array<Record<string, unknown>> = [];
    const logs: Array<Record<string, unknown>> = [];

    for (const budget of snapshot.categories) {
      if (!budget.threshold_pct) continue;

      const monthStart = budget.window_start;
      const alreadyLogged = await alertAlreadyLogged(
        supabase,
        userId,
        budget.id,
        monthStart,
        budget.threshold_pct,
      );

      if (alreadyLogged) continue;

      const thresholdLabel = budget.threshold_pct >= 100 ? 'over budget' : 'approaching your limit';
      const title = `Budget alert: ${budget.category}`;
      const body = budget.threshold_pct >= 100
        ? `${budget.category} is over budget by $${Math.max(budget.spent_amount - budget.limit_amount, 0).toFixed(2)}.`
        : `${budget.category} is at ${budget.percent_used}% of your budget ($${budget.spent_amount.toFixed(2)} / $${budget.limit_amount.toFixed(2)}).`;

      for (const token of tokens) {
        messages.push({
          to: token,
          sound: 'default',
          title,
          body,
          data: {
            budget_id: budget.id,
            category: budget.category,
            threshold_pct: budget.threshold_pct,
            percent_used: budget.percent_used,
            month_start: monthStart,
          },
        });
      }

      logs.push({
        user_id: userId,
        budget_id: budget.id,
        category: budget.category,
        month_start: monthStart,
        threshold_pct: budget.threshold_pct,
        percent_used: budget.percent_used,
        amount_spent: budget.spent_amount,
        amount_limit: budget.limit_amount,
        title,
        body: `${budget.category} is ${thresholdLabel}.`,
        sent_at: new Date().toISOString(),
      });
    }

    if (messages.length > 0) {
      await sendExpoPush(messages);
      for (const log of logs) {
        await recordAlert(supabase, log);
      }
    }

    return { sent: messages.length, skipped: 'none' };
  } catch (error) {
    console.warn('[budget-alerts] dispatch failed:', error);
    return { sent: 0, skipped: 'error', error: error instanceof Error ? error.message : String(error) };
  }
}
