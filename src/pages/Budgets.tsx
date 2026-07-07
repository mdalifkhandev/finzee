import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit2, TrendingUp, TrendingDown } from "lucide-react";
import { budgets, formatCurrency } from "@/lib/mock-data";
const totalBudget = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
const totalRemaining = totalBudget - totalSpent;
export default function Budgets() {
  return <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Budgets</h1>
            <p className="mt-1 text-muted-foreground">November 2026 · Track your monthly spending by category</p>
          </div>
          <Button variant="hero">
            <Plus className="h-4 w-4 mr-2" />
            Create Budget
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card variant="elevated">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
              <p className="mt-2 font-display text-3xl font-bold">{formatCurrency(totalBudget)}</p>
              <p className="mt-2 text-sm text-muted-foreground">For this month</p>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Spent So Far</p>
              <p className="mt-2 font-display text-3xl font-bold">{formatCurrency(totalSpent)}</p>
              <div className="mt-2 flex items-center gap-1 text-sm text-warning">
                <TrendingUp className="h-4 w-4" />
                <span>{Math.round(totalSpent / totalBudget * 100)}% of budget used</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="blue">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Remaining</p>
              <p className="mt-2 font-display text-3xl font-bold text-success">{formatCurrency(totalRemaining)}</p>
              <div className="mt-2 flex items-center gap-1 text-sm text-success">
                <TrendingDown className="h-4 w-4" />
                <span>You're under budget!</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card variant="elevated" className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium">Overall Budget Progress</p>
              <Badge variant={totalSpent > totalBudget ? "destructive" : "success"}>
                {Math.round(totalSpent / totalBudget * 100)}% used
              </Badge>
            </div>
            <Progress value={Math.min(Math.round(totalSpent / totalBudget * 100), 100)} className="h-4" />
            <p className="mt-2 text-sm text-muted-foreground">
              {formatCurrency(totalRemaining)} remaining for the rest of the month
            </p>
          </CardContent>
        </Card>

        {/* Budget Categories */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map(budget => {
          const percentage = Math.round(budget.spentAmount / budget.limitAmount * 100);
          const remaining = budget.limitAmount - budget.spentAmount;
          const isOverBudget = percentage > 100;
          const isNearLimit = percentage >= 80 && percentage <= 100;
          return <Card key={budget.id} variant="interactive" className={isOverBudget ? "border-destructive/50" : isNearLimit ? "border-warning/50" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl">
                        {budget.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{budget.category}</CardTitle>
                        <p className="text-sm text-muted-foreground">Monthly envelope</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="font-display text-2xl font-bold">
                      {formatCurrency(budget.spentAmount)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {formatCurrency(budget.limitAmount)}
                    </span>
                  </div>
                  <Progress value={Math.min(percentage, 100)} variant={isOverBudget ? "destructive" : isNearLimit ? "warning" : "default"} className="h-2" />
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant={isOverBudget ? "destructive" : isNearLimit ? "warning" : "success"}>
                      {isOverBudget ? `${Math.abs(percentage - 100)}% over` : `${remaining > 0 ? formatCurrency(remaining) : "$0"} left`}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{percentage}%</span>
                  </div>
                </CardContent>
              </Card>;
        })}

          {/* Add Budget Card */}
          <Card variant="outline" className="flex items-center justify-center border-dashed cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-all min-h-[200px]">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 font-medium text-muted-foreground">Add New Budget</p>
              <p className="text-sm text-muted-foreground">Create a new category</p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>;
}