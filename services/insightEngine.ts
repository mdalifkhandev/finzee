import type { Transaction, HealthDailyMetric, Insight } from '../types';

export function generateInsights(
  _userId: string,
  transactions: Transaction[],
  healthMetrics: HealthDailyMetric[],
  _monthlyBudget: number,
): Insight[] {
  const insights: Insight[] = [];
  const now = new Date().toISOString();
  const discretionary = transactions.filter(t => t.isDiscretionary);
  const discretionaryTotal = discretionary.reduce((sum, t) => sum + t.amount, 0);
  const highStressDays = healthMetrics.filter(m => m.stressIndicator === 'high');
  const stressSpends = discretionary.filter(t =>
    highStressDays.some(m => m.date === t.date)
  );

  if (stressSpends.length > 0) {
    const biggest = stressSpends.reduce((a, b) => a.amount > b.amount ? a : b);
    insights.push({
      id: 'stress-' + biggest.id,
      title: `Stress spend detected on ${new Date(biggest.date).toLocaleDateString('en-US', { weekday: 'long' })}`,
      body: `You spent $${biggest.amount} on ${biggest.merchant} after a high-stress day. Discretionary budget is now ${Math.round((discretionaryTotal / _monthlyBudget) * 100)}% with 19 days remaining.`,
      type: 'stress_spend',
      severity: 'warning',
      createdAt: now,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'default',
      title: 'Your finances look healthy today',
      body: 'No stress spend detected. Stay on track with your goals.',
      type: 'goal_update',
      severity: 'info',
      createdAt: now,
    });
  }

  return insights;
}

interface PurchaseEvalInput {
  price: number;
  category: string;
  urgency: 'low' | 'medium' | 'high';
  mood: 'stressed' | 'neutral' | 'happy';
  reason: string;
  monthlyBudgetRemaining: number;
  currentGoalProgress: number;
}

interface PurchaseEvalResult {
  recommendation: 'buy' | 'wait' | 'pause';
  budgetImpact: string;
  goalImpact: string;
  emotionalRisk: 'low' | 'medium' | 'high';
}

export function evaluatePurchase(input: PurchaseEvalInput): PurchaseEvalResult {
  const { price, urgency, mood, monthlyBudgetRemaining, currentGoalProgress } = input;
  const pctOfBudget = (price / monthlyBudgetRemaining) * 100;

  let emotionalRisk: 'low' | 'medium' | 'high' = 'low';
  if (mood === 'stressed') emotionalRisk = 'high';
  else if (mood === 'neutral' && urgency === 'low') emotionalRisk = 'medium';

  let recommendation: 'buy' | 'wait' | 'pause' = 'buy';
  if (emotionalRisk === 'high' || pctOfBudget > 50) {
    recommendation = 'pause';
  } else if (urgency === 'low' || pctOfBudget > 25) {
    recommendation = 'wait';
  }

  const budgetImpact = pctOfBudget > 100
    ? `Over budget by $${(price - monthlyBudgetRemaining).toFixed(0)}`
    : `Uses ${pctOfBudget.toFixed(0)}% of remaining monthly budget ($${monthlyBudgetRemaining.toFixed(0)} left)`;

  const goalImpact = currentGoalProgress < 0.5
    ? `Your goals are ${(currentGoalProgress * 100).toFixed(0)}% funded — this spend delays them further`
    : `Goals are on track at ${(currentGoalProgress * 100).toFixed(0)}% — manageable impact`;

  return { recommendation, budgetImpact, goalImpact, emotionalRisk };
}
