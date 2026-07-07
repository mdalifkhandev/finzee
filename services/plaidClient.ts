import type { Transaction } from '../types';
import { CONFIG } from '../constants/config';

const DEV_TRANSACTIONS: Transaction[] = [
  { id: 't1', userId: 'dev', amount: 149, merchant: 'Nike.com', category: 'Shopping', date: '2026-06-10', isDiscretionary: true },
  { id: 't2', userId: 'dev', amount: 42.5, merchant: 'Whole Foods', category: 'Groceries', date: '2026-06-11', isDiscretionary: false },
  { id: 't3', userId: 'dev', amount: 18.99, merchant: 'Netflix', category: 'Entertainment', date: '2026-06-12', isDiscretionary: true },
  { id: 't4', userId: 'dev', amount: 65, merchant: 'Shell Gas', category: 'Gas', date: '2026-06-13', isDiscretionary: false },
  { id: 't5', userId: 'dev', amount: 89, merchant: 'Zara', category: 'Shopping', date: '2026-06-14', isDiscretionary: true },
];

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  if (CONFIG.DEV_MODE) {
    await new Promise(r => setTimeout(r, 300));
    return DEV_TRANSACTIONS.map(t => ({ ...t, userId }));
  }
  const res = await fetch(`${CONFIG.API_BASE_URL}/api/plaid/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}
