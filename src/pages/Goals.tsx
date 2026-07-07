import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, TrendingUp, Target, Sparkles } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/mock-data";
import { useDemoData } from "@/hooks/use-demo-data";

export default function Goals() {
  const { goals, isLoading } = useDemoData();

  const totalGoalAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          {/* Header skeleton */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Skeleton className="h-9 w-48" />
              <Skeleton className="mt-2 h-5 w-72" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Summary card skeleton */}
          <Card variant="blue" className="mb-8">
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-9 w-40" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-9 w-36" />
                </div>
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <div className="mt-2 flex items-center gap-3">
                    <Skeleton className="flex-1 h-3" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goal cards skeleton grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} variant="elevated" className="overflow-hidden">
                <div className="h-2 bg-secondary">
                  <Skeleton className="h-full w-1/2" />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between mb-2">
                      <Skeleton className="h-8 w-28" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-secondary/50 p-4">
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div>
                      <Skeleton className="h-3 w-20 mb-1" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Savings Goals</h1>
            <p className="mt-1 text-muted-foreground">
              Track your progress toward financial milestones
            </p>
          </div>
          <Button variant="hero">
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
        </div>

        {/* Summary */}
        <Card variant="blue" className="mb-8">
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Goal Amount</p>
                <p className="mt-2 font-display text-3xl font-bold">{formatCurrency(totalGoalAmount)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Saved</p>
                <p className="mt-2 font-display text-3xl font-bold text-success">{formatCurrency(totalSaved)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                <div className="mt-2 flex items-center gap-3">
                  <Progress value={Math.round((totalSaved / totalGoalAmount) * 100)} variant="success" className="flex-1 h-3" />
                  <span className="font-display text-lg font-bold">{Math.round((totalSaved / totalGoalAmount) * 100)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
            const remaining = goal.targetAmount - goal.currentAmount;
            const dueDate = new Date(goal.dueDate);
            const now = new Date();
            const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const monthsLeft = Math.ceil(daysLeft / 30);
            const monthlyTarget = remaining / monthsLeft;

            return (
              <Card key={goal.id} variant="elevated" className="overflow-hidden">
                <div className="h-2 bg-secondary">
                  <div 
                    className="h-full bg-success transition-all duration-500" 
                    style={{ width: `${percentage}%` }} 
                  />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-3xl">
                        {goal.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        <Badge variant="muted" className="mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          Due {formatDate(goal.dueDate)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="font-display text-3xl font-bold">{formatCurrency(goal.currentAmount)}</span>
                      <span className="text-muted-foreground">of {formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <Progress value={percentage} variant="success" className="h-3" />
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-secondary/50 p-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="font-semibold">{formatCurrency(remaining)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly target</p>
                      <p className="font-semibold">{formatCurrency(monthlyTarget)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-success">
                      <TrendingUp className="h-4 w-4" />
                      <span>{daysLeft} days left</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Funds
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add Goal Card */}
          <Card 
            variant="outline" 
            className="flex items-center justify-center border-dashed cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-all min-h-[300px]"
          >
            <div className="text-center p-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <p className="mt-4 font-display text-lg font-semibold text-foreground">Create New Goal</p>
              <p className="mt-2 text-sm text-muted-foreground max-w-[200px]">
                Set a savings target and track your progress over time
              </p>
              <Button variant="hero" className="mt-4">
                <Sparkles className="h-4 w-4 mr-2" />
                Get Started
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
