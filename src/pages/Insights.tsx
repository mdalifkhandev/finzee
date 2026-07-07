import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight, Sparkles, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { insights, formatCurrency } from "@/lib/mock-data";
import { appConfig } from "@/config/app";

const severityConfig = {
  high: { color: "destructive", icon: AlertTriangle, label: "Action Needed" },
  medium: { color: "warning", icon: TrendingUp, label: "Worth Reviewing" },
  low: { color: "success", icon: CheckCircle, label: "Good News" },
} as const;

export default function Insights() {
  const potentialSavings = insights
    .filter((i) => i.costEstimate > 0)
    .reduce((sum, i) => sum + i.costEstimate, 0);

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">AI Insights</h1>
          </div>
          <p className="text-muted-foreground">
            Personalized recommendations based on your spending patterns
          </p>
        </div>

        {/* Summary Card */}
        <Card variant="blue" className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Potential Monthly Savings</p>
                <p className="mt-1 font-display text-4xl font-bold text-success">{formatCurrency(potentialSavings)}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Based on {insights.filter((i) => i.costEstimate > 0).length} actionable insights
                </p>
              </div>
              <div className="flex gap-3">
                <div className="text-center px-4 py-2 rounded-lg bg-card">
                  <p className="font-display text-2xl font-bold text-destructive">{insights.filter((i) => i.severity === "high").length}</p>
                  <p className="text-xs text-muted-foreground">High Priority</p>
                </div>
                <div className="text-center px-4 py-2 rounded-lg bg-card">
                  <p className="font-display text-2xl font-bold text-warning">{insights.filter((i) => i.severity === "medium").length}</p>
                  <p className="text-xs text-muted-foreground">Medium</p>
                </div>
                <div className="text-center px-4 py-2 rounded-lg bg-card">
                  <p className="font-display text-2xl font-bold text-success">{insights.filter((i) => i.severity === "low").length}</p>
                  <p className="text-xs text-muted-foreground">Low</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights List */}
        <div className="space-y-4">
          {insights.map((insight) => {
            const config = severityConfig[insight.severity];
            const SeverityIcon = config.icon;

            return (
              <Card key={insight.id} variant="elevated" className="overflow-hidden">
                <div className={`h-1 ${
                  insight.severity === "high" ? "bg-destructive" : 
                  insight.severity === "medium" ? "bg-warning" : "bg-success"
                }`} />
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-3xl">
                        {insight.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={config.color as "destructive" | "warning" | "success"}>
                            <SeverityIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{insight.topic}</span>
                        </div>
                        <h3 className="font-display text-lg font-semibold text-foreground">
                          {insight.title}
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 lg:flex-col lg:items-end">
                      {insight.costEstimate !== 0 && (
                        <div className={`text-right ${insight.costEstimate > 0 ? "" : ""}`}>
                          <p className="text-sm text-muted-foreground">
                            {insight.costEstimate > 0 ? "Potential savings" : "Extra available"}
                          </p>
                          <p className={`font-display text-2xl font-bold ${
                            insight.costEstimate > 0 ? "text-warning" : "text-success"
                          }`}>
                            {formatCurrency(Math.abs(insight.costEstimate))}/mo
                          </p>
                        </div>
                      )}
                      <Button variant={insight.severity === "high" ? "hero" : "outline"}>
                        {insight.actionLabel}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State (for when there are no insights) */}
        {insights.length === 0 && (
          <Card variant="outline" className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                <Lightbulb className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">No insights yet</h3>
              <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                Keep using {appConfig.brandName} and we'll analyze your spending patterns to provide personalized recommendations.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
