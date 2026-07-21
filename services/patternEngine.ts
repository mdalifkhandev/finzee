import type { Transaction } from '../types';

export function detectSpendingPatterns(transactions: Transaction[]) {
  const patterns = [];
  
  const deliveryMerchants = ['doordash', 'uber eats', 'grubhub', 'postmates'];
  const deliveryTx = transactions.filter(t => 
    deliveryMerchants.some(m => (t.merchant || '').toLowerCase().includes(m))
  );

  if (deliveryTx.length > 3) {
    const totalDelivery = deliveryTx.reduce((sum, t) => sum + t.amount, 0);
    patterns.push({
      type: 'delivery_spike',
      description: `You've ordered delivery ${deliveryTx.length} times recently, totaling $${totalDelivery.toFixed(2)}.`,
      transactions: deliveryTx
    });
  }

  // Large single purchases
  const largeTx = transactions.filter(t => t.amount > 500 && t.type !== 'income');
  if (largeTx.length > 0) {
    patterns.push({
      type: 'large_purchases',
      description: `You have ${largeTx.length} large purchases over $500 recently.`,
      transactions: largeTx
    });
  }

  return {
    patterns,
    hasDeliverySpike: deliveryTx.length > 3
  };
}
