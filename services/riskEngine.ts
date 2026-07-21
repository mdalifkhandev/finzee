import type { Transaction, HealthDailyMetric } from '../types';

export function calculateRiskProfile(
  transactions: Transaction[],
  healthMetrics: HealthDailyMetric[],
  monthlyBudgetRemaining: number
) {
  const discretionary = transactions.filter(t => t.isDiscretionary);
  const highStressDays = healthMetrics.filter(m => m.stressIndicator === 'high');
  const stressSpends = discretionary.filter(t =>
    highStressDays.some(m => m.date === t.date)
  );

  const totalStressSpend = stressSpends.reduce((sum, t) => sum + t.amount, 0);
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  if (totalStressSpend > monthlyBudgetRemaining * 0.3) {
    riskLevel = 'high';
  } else if (totalStressSpend > monthlyBudgetRemaining * 0.1) {
    riskLevel = 'medium';
  }

  return {
    riskLevel,
    stressSpendsCount: stressSpends.length,
    totalStressSpend,
  };
}
