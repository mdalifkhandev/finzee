import type { Transaction } from '../types';
import { CONFIG } from '../constants/config';
import { callFunction } from './api';

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
  const data = await callFunction<{ transactions: any[] }>('plaid-transactions');
  return (data.transactions ?? []).map(t => ({
    id: String(t.id),
    userId,
    amount: Number(t.amount),
    merchant: t.merchant,
    category: t.category,
    date: t.date,
    isDiscretionary: Boolean(t.is_discretionary),
  }));
}

/** Creates a Plaid Link token (server-side) to open Plaid Link on the client. */
export async function createLinkToken(): Promise<{ link_token: string; source: string }> {
  return callFunction('plaid-link-token', { method: 'POST', body: {} });
}
