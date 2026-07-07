import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  Plus,
  Brain,
  Repeat,
  List,
} from "lucide-react";
import { useDemoData } from "@/hooks/use-demo-data";
import { formatCurrency, formatDateTime } from "@/lib/mock-data";
import { useStressAlerts } from "@/hooks/use-stress-alerts";
import { StressAlertBanner } from "@/components/wearables/StressAlertBanner";
import { PurchaseWarningDialog } from "@/components/wearables/PurchaseWarningDialog";
import { RecurringTransactionsView } from "@/components/transactions/RecurringTransactionsView";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = ["All", "Groceries", "Food", "Transportation", "Entertainment", "Shopping", "Utilities", "Income"];
const expenseCategories = ["Groceries", "Food", "Transportation", "Entertainment", "Shopping", "Utilities"];

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPurchaseWarning, setShowPurchaseWarning] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [pendingTransaction, setPendingTransaction] = useState({
    merchant: "",
    amount: "",
    category: "",
  });

  const { currentStress, isHighStress } = useStressAlerts();
  const { transactions, isLoading } = useDemoData();

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.merchant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || tx.categories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handleAddTransaction = () => {
    const amount = parseFloat(pendingTransaction.amount);
    
    if (!pendingTransaction.merchant || !amount || !pendingTransaction.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    // Check stress level before proceeding
    if (isHighStress && amount > 0) {
      setShowAddDialog(false);
      setShowPurchaseWarning(true);
      return;
    }

    completeTransaction();
  };

  const completeTransaction = () => {
    toast({
      title: "✅ Transaction Added",
      description: `${pendingTransaction.merchant}: $${parseFloat(pendingTransaction.amount).toFixed(2)} in ${pendingTransaction.category}`,
    });
    setPendingTransaction({ merchant: "", amount: "", category: "" });
    setShowAddDialog(false);
  };

  const handlePurchaseProceed = () => {
    completeTransaction();
    toast({
      title: "Transaction Recorded",
      description: "Consider reviewing high-stress purchases at the end of the day.",
    });
  };

  const handlePurchaseCancel = () => {
    toast({
      title: "🎉 Smart Choice!",
      description: `You decided to wait. Your stress level is ${currentStress}% - try again when you're calmer.`,
    });
    setPendingTransaction({ merchant: "", amount: "", category: "" });
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Purchase Warning Dialog */}
        <PurchaseWarningDialog
          open={showPurchaseWarning}
          onOpenChange={setShowPurchaseWarning}
          amount={parseFloat(pendingTransaction.amount) || 0}
          category={pendingTransaction.category}
          stressLevel={currentStress}
          onProceed={handlePurchaseProceed}
          onCancel={handlePurchaseCancel}
        />

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Transactions</h1>
            <p className="mt-1 text-muted-foreground">
              View and manage all your transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isHighStress && (
              <Badge variant="outline" className="border-destructive text-destructive gap-1.5">
                <Brain className="h-3 w-3" />
                High Stress: {currentStress}%
              </Badge>
            )}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                  <DialogDescription>
                    Record a new expense or income.
                    {isHighStress && (
                      <span className="mt-2 block text-destructive">
                        ⚠️ Your stress level is elevated ({currentStress}%). Consider waiting before making purchases.
                      </span>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="merchant">Merchant / Description</Label>
                    <Input
                      id="merchant"
                      placeholder="e.g., Amazon, Starbucks"
                      value={pendingTransaction.merchant}
                      onChange={(e) =>
                        setPendingTransaction((prev) => ({ ...prev, merchant: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={pendingTransaction.amount}
                      onChange={(e) =>
                        setPendingTransaction((prev) => ({ ...prev, amount: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={pendingTransaction.category}
                      onValueChange={(value) =>
                        setPendingTransaction((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTransaction}>
                    {isHighStress ? "Review & Add" : "Add Transaction"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stress Alert Banner */}
        <div className="mb-6">
          <StressAlertBanner />
        </div>

        {/* Tabs for All vs Recurring */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              All Transactions
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Recurring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Filters */}
            <Card variant="elevated">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions List */}
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {isLoading ? "Loading..." : `${filteredTransactions.length} transactions`}
                </CardTitle>
                <Button variant="ghost" size="sm">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:border-primary/30 hover:shadow-card"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl">
                          {tx.logo}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{tx.merchant}</p>
                          <p className="text-sm text-muted-foreground">{formatDateTime(tx.timestamp)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex gap-2">
                          {tx.categories.slice(0, 2).map((cat) => (
                            <Badge key={cat} variant="secondary">{cat}</Badge>
                          ))}
                        </div>
                        <p className={`font-semibold text-lg ${tx.amount > 0 ? "text-success" : "text-foreground"}`}>
                          {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredTransactions.length === 0 && !isLoading && (
                  <div className="py-12 text-center">
                    <Filter className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-lg font-medium text-foreground">No transactions found</p>
                    <p className="mt-1 text-muted-foreground">Try adjusting your search or filters</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recurring">
            <RecurringTransactionsView transactions={transactions} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
