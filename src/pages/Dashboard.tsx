import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LocalDeals } from "@/components/LocalDeals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  PiggyBank,
  Target,
  Lightbulb,
  ArrowRight,
  Plus,
} from "lucide-react";
import { formatCurrency, formatCompactCurrency, formatDate } from "@/lib/mock-data";
import { useDemoData } from "@/hooks/use-demo-data";
import { useStressSpendingDetect } from "@/hooks/use-stress-spending";
import { useSkimProcessor } from "@/hooks/use-skim-processor";
import { StressSpendingNudge } from "@/components/spending/StressSpendingNudge";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";
import { StablecoinSaverDashboardCard } from "@/components/dashboard/StablecoinSaverCard";

export default function Dashboard() {
  const demoData = useDemoData();
  const { accounts, transactions, budgets, goals, insights, currentUser, isLoading } = demoData;
  const { user } = useAuth();
  const { profile } = useProfile();
  
  // Stress spending detection (only for users with impulse-delivery pain point, like Ava)
  const { analysis: stressAnalysis, examPeriod } = useStressSpendingDetect();
  
  // Auto-process skim-to-save when dashboard loads
  const { processSkims, isEnabled: skimEnabled } = useSkimProcessor();
  
  useEffect(() => {
    if (user && skimEnabled) {
      processSkims();
    }
  }, [user, skimEnabled]);

  const totalBalance = accounts.reduce((sum: number, acc) => sum + acc.balance, 0);
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((sum: number, t) => sum + t.amount, 0);
  const totalSpending = Math.abs(transactions.filter((t) => t.amount < 0).reduce((sum: number, t) => sum + t.amount, 0));
  
  // Show stress spending nudge for users like Ava
  const showStressNudge = stressAnalysis?.isSpike && stressAnalysis.recentDeliverySpend > 30;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Profile Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-background shadow-lg">
            <AvatarImage src={profile?.avatar_url || ''} alt={currentUser.name} />
            <AvatarFallback className="text-xl sm:text-2xl bg-primary/10 text-primary">
              {currentUser.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Welcome back, {currentUser.name.split(" ")[0]}! 👋
            </h1>
            {profile?.bio ? (
              <p className="mt-2 text-muted-foreground line-clamp-2 max-w-2xl">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-1 text-sm sm:text-base text-muted-foreground">
                Here's what's happening with your finances today.
              </p>
            )}
            {profile?.income_pattern && (
              <Badge variant="outline" className="mt-2 capitalize">
                {profile.income_pattern.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
        </div>

        {/* Stress Spending Nudge (for users like Ava) */}
        {showStressNudge && stressAnalysis && examPeriod && (
          <div className="mb-6">
            <StressSpendingNudge
              recentSpend={stressAnalysis.recentDeliverySpend}
              topMerchant={stressAnalysis.topMerchant}
              spikePercentage={stressAnalysis.spikePercentage}
              isExamPeriod={examPeriod.isExamPeriod}
              periodName={examPeriod.periodName}
            />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 lg:grid-cols-4 mb-6 sm:mb-8">
          <Card variant="elevated">
            <CardContent className="p-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Balance</p>
                <Badge variant="blue" className="shrink-0 w-fit text-[10px] sm:text-xs">All accounts</Badge>
              </div>
              <p className="mt-1 sm:mt-2 font-display text-lg sm:text-2xl lg:text-3xl font-bold truncate">{formatCompactCurrency(totalBalance)}</p>
              <div className="mt-2 sm:mt-4 flex items-center gap-1 text-xs sm:text-sm text-success">
                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">+2.5% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Income</p>
                <Badge variant="success" className="shrink-0 w-fit text-[10px] sm:text-xs">This month</Badge>
              </div>
              <p className="mt-1 sm:mt-2 font-display text-lg sm:text-2xl lg:text-3xl font-bold text-success truncate">{formatCompactCurrency(totalIncome)}</p>
              <div className="mt-2 sm:mt-4 flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">On track for $6,500</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Spending</p>
                <Badge variant="muted" className="shrink-0 w-fit text-[10px] sm:text-xs">This month</Badge>
              </div>
              <p className="mt-1 sm:mt-2 font-display text-lg sm:text-2xl lg:text-3xl font-bold truncate">{formatCompactCurrency(totalSpending)}</p>
              <div className="mt-2 sm:mt-4 flex items-center gap-1 text-xs sm:text-sm text-warning">
                <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Saved</p>
                <Badge variant="blue" className="shrink-0 w-fit text-[10px] sm:text-xs">This month</Badge>
              </div>
              <p className="mt-1 sm:mt-2 font-display text-lg sm:text-2xl lg:text-3xl font-bold text-primary truncate">{formatCompactCurrency(totalIncome - totalSpending)}</p>
              <div className="mt-2 sm:mt-4 flex items-center gap-1 text-xs sm:text-sm text-success">
                <PiggyBank className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">Great job saving!</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stablecoin Saver (Beta) */}
        <div className="mb-6 sm:mb-8">
          <StablecoinSaverDashboardCard personaName={currentUser.name} />
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Recent Transactions */}
          <Card variant="elevated" className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Recent Transactions
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/transactions">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-lg">
                        {tx.logo}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{tx.merchant}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(tx.timestamp)}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${tx.amount > 0 ? "text-success" : "text-foreground"}`}>
                      {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card variant="blue">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                AI Insights
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/insights">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.slice(0, 2).map((insight) => (
                  <div key={insight.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{insight.icon}</span>
                      <div>
                        <p className="font-medium text-foreground">{insight.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{insight.description}</p>
                        {insight.costEstimate !== 0 && (
                          <Badge 
                            variant={insight.costEstimate > 0 ? "warning" : "success"} 
                            className="mt-2"
                          >
                            {insight.costEstimate > 0 ? "Save" : "Extra"} {formatCurrency(Math.abs(insight.costEstimate))}/mo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budgets & Goals */}
        <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Budgets Overview */}
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-primary" />
                Budget Overview
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/budgets">
                  Manage
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgets.slice(0, 4).map((budget) => {
                  const percentage = Math.round((budget.spentAmount / budget.limitAmount) * 100);
                  const isOverBudget = percentage > 100;
                  const isNearLimit = percentage >= 80 && percentage <= 100;
                  return (
                    <div key={budget.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0">{budget.icon}</span>
                          <span className="font-medium truncate">{budget.category}</span>
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap ml-2">
                          {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.limitAmount)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        variant={isOverBudget ? "destructive" : isNearLimit ? "warning" : "default"}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Goals Overview */}
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Savings Goals
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/goals">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.map((goal) => {
                  const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
                  return (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0">{goal.icon}</span>
                          <span className="font-medium truncate">{goal.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap ml-2">
                          {percentage}%
                        </span>
                      </div>
                      <Progress value={percentage} variant="success" />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)} · Due {formatDate(goal.dueDate)}
                      </p>
                    </div>
                  );
                })}
                <Button variant="outline" className="w-full mt-2" asChild>
                  <Link to="/goals">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Goal
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Local Deals & Connected Accounts */}
        <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Local Deals */}
          <LocalDeals />
          
          {/* Connected Accounts */}
          <Card variant="elevated" className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Connected Accounts</CardTitle>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{account.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{account.provider}</p>
                    </div>
                    <p className={`font-semibold whitespace-nowrap ${account.balance < 0 ? "text-destructive" : ""}`}>
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
