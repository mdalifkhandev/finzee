import type { Transaction } from '../types';

export function calculateForecast(
  currentBalance: number,
  transactions: Transaction[],
  daysToForecast: number = 30
): { forecastedBalance: number; projectedExpenses: number; projectedIncome: number } {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const recentTx = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
  
  const incomeTx = recentTx.filter(t => t.type === 'income');
  const expenseTx = recentTx.filter(t => t.type !== 'income');

  const avgDailyIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0) / 30;
  const avgDailyExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0) / 30;

  const projectedIncome = avgDailyIncome * daysToForecast;
  const projectedExpenses = avgDailyExpense * daysToForecast;

  const forecastedBalance = currentBalance + projectedIncome - projectedExpenses;

  return { forecastedBalance, projectedExpenses, projectedIncome };
}
