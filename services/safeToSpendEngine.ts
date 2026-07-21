import type { Transaction } from '../types';

export function calculateSafeToSpend(
  monthlyBudget: number,
  transactions: Transaction[],
  currentDate: Date = new Date()
): { safeToSpendDaily: number; totalRemaining: number; daysRemaining: number } {
  // Get days in current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = currentDate.getDate();
  const daysRemaining = daysInMonth - currentDay + 1; // including today

  // Filter discretionary transactions for the current month
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const currentMonthTx = transactions.filter(t => {
    const txDate = new Date(t.date);
    return txDate >= startOfMonth && txDate <= endOfMonth && t.isDiscretionary;
  });

  const spentThisMonth = currentMonthTx.reduce((sum, t) => sum + t.amount, 0);
  const totalRemaining = Math.max(monthlyBudget - spentThisMonth, 0);
  const safeToSpendDaily = totalRemaining / daysRemaining;

  return { safeToSpendDaily, totalRemaining, daysRemaining };
}
