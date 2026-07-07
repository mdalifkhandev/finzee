import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Repeat, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/mock-data";

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
  status: "posted" | "pending";
  isRecurring?: boolean;
}

interface MerchantGroup {
  merchant: string;
  logo: string;
  categories: string[];
  transactions: Transaction[];
  totalAmount: number;
  avgAmount: number;
  frequency: string;
  lastTransaction: string;
}

interface RecurringTransactionsViewProps {
  transactions: Transaction[];
}

export function RecurringTransactionsView({ transactions }: RecurringTransactionsViewProps) {
  const merchantGroups = useMemo(() => {
    // Filter recurring transactions OR transactions that appear multiple times from same merchant
    const merchantMap = new Map<string, Transaction[]>();
    
    transactions.forEach(tx => {
      const key = tx.merchant.toLowerCase().trim();
      if (!merchantMap.has(key)) {
        merchantMap.set(key, []);
      }
      merchantMap.get(key)!.push(tx);
    });

    // Consider a merchant "recurring" if they have 2+ transactions OR isRecurring flag
    const groups: MerchantGroup[] = [];
    
    merchantMap.forEach((txs, merchantKey) => {
      const hasRecurring = txs.some(tx => tx.isRecurring);
      const multipleTransactions = txs.length >= 2;
      
      if (hasRecurring || multipleTransactions) {
        const sortedTxs = [...txs].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        const totalAmount = txs.reduce((sum, tx) => sum + tx.amount, 0);
        const avgAmount = totalAmount / txs.length;
        
        // Estimate frequency based on transaction dates
        let frequency = "One-time";
        if (txs.length >= 2) {
          const dates = txs.map(tx => new Date(tx.timestamp).getTime()).sort((a, b) => b - a);
          const avgDaysBetween = (dates[0] - dates[dates.length - 1]) / (1000 * 60 * 60 * 24) / (dates.length - 1);
          
          if (avgDaysBetween <= 7) frequency = "Weekly";
          else if (avgDaysBetween <= 14) frequency = "Bi-weekly";
          else if (avgDaysBetween <= 35) frequency = "Monthly";
          else if (avgDaysBetween <= 95) frequency = "Quarterly";
          else frequency = "Occasional";
        }
        
        groups.push({
          merchant: sortedTxs[0].merchant,
          logo: sortedTxs[0].logo,
          categories: [...new Set(txs.flatMap(tx => tx.categories))],
          transactions: sortedTxs,
          totalAmount,
          avgAmount,
          frequency,
          lastTransaction: sortedTxs[0].timestamp,
        });
      }
    });

    // Sort by total amount (most spent first)
    return groups.sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount));
  }, [transactions]);

  const totalRecurringSpend = merchantGroups
    .filter(g => g.totalAmount < 0)
    .reduce((sum, g) => sum + Math.abs(g.totalAmount), 0);

  const totalRecurringIncome = merchantGroups
    .filter(g => g.totalAmount > 0)
    .reduce((sum, g) => sum + g.totalAmount, 0);

  if (merchantGroups.length === 0) {
    return (
      <Card variant="elevated">
        <CardContent className="py-12 text-center">
          <Repeat className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium text-foreground">No recurring transactions found</p>
          <p className="mt-1 text-muted-foreground">
            Transactions will appear here when you have multiple payments to the same merchant
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Repeat className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recurring Merchants</p>
                <p className="text-2xl font-bold text-foreground">{merchantGroups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Recurring Spend</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRecurringSpend)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Recurring Income</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRecurringIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Merchant Groups */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Grouped by Merchant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {merchantGroups.map((group) => (
              <div
                key={group.merchant}
                className="rounded-lg border border-border p-4 transition-all hover:border-primary/30 hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl">
                      {group.logo}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{group.merchant}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {group.frequency}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {group.transactions.length} transaction{group.transactions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${group.totalAmount > 0 ? "text-success" : "text-foreground"}`}>
                      {group.totalAmount > 0 ? "+" : ""}{formatCurrency(group.totalAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Avg: {formatCurrency(Math.abs(group.avgAmount))}
                    </p>
                  </div>
                </div>
                
                {/* Categories */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.categories.slice(0, 3).map((cat) => (
                    <Badge key={cat} variant="secondary" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                  {group.categories.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{group.categories.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Recent transactions preview */}
                {group.transactions.length > 1 && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Recent Transactions
                    </p>
                    <div className="space-y-1">
                      {group.transactions.slice(0, 3).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {new Date(tx.timestamp).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className={tx.amount > 0 ? "text-success" : "text-foreground"}>
                            {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                          </span>
                        </div>
                      ))}
                      {group.transactions.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{group.transactions.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
