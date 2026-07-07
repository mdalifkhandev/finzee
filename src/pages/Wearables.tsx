import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Watch, Heart, Activity, Moon, Zap, Smartphone, TrendingUp, TrendingDown, Brain, CircleDollarSign, Bell, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  Legend,
} from "recharts";
import { format } from "date-fns";
import {
  generateMockHeartRate,
  generateMockSleep,
  generateMockStress,
  generateMockActivity,
  generateSpendingCorrelations,
  getWearableSummary,
} from "@/lib/mock-wearables";
import { useStressAlerts } from "@/hooks/use-stress-alerts";
import { StressAlertBanner } from "@/components/wearables/StressAlertBanner";
import { PurchaseWarningDialog } from "@/components/wearables/PurchaseWarningDialog";
import { toast } from "@/hooks/use-toast";

const devices = [
  {
    name: "Apple Watch",
    icon: Watch,
    status: "Demo Mode",
    connected: true,
    description: "Syncing heart rate, activity, and sleep data",
  },
  {
    name: "Fitbit",
    icon: Activity,
    status: "Connect",
    connected: false,
    description: "Track steps, calories, and workout data",
  },
  {
    name: "Oura Ring",
    icon: Moon,
    status: "Connect",
    connected: false,
    description: "Monitor sleep quality and readiness scores",
  },
  {
    name: "Whoop",
    icon: Zap,
    status: "Connect",
    connected: false,
    description: "Strain, recovery, and sleep tracking",
  },
];

export default function Wearables() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showPurchaseWarning, setShowPurchaseWarning] = useState(false);
  const [mockPurchase, setMockPurchase] = useState({ amount: 0, category: "" });
  
  const { currentStress, isHighStress, triggerPurchaseWarning } = useStressAlerts();

  const summary = useMemo(() => getWearableSummary(), []);
  const heartRateData = useMemo(() => generateMockHeartRate(7), []);
  const sleepData = useMemo(() => generateMockSleep(14), []);
  const stressData = useMemo(() => generateMockStress(7), []);
  const activityData = useMemo(() => generateMockActivity(14), []);
  const correlations = useMemo(() => generateSpendingCorrelations(14), []);

  const simulatePurchase = () => {
    const categories = ["Shopping", "Food & Dining", "Entertainment", "Electronics"];
    const amount = Math.round((50 + Math.random() * 150) * 100) / 100;
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    if (isHighStress) {
      setMockPurchase({ amount, category });
      setShowPurchaseWarning(true);
    } else {
      toast({
        title: "✅ Purchase Approved",
        description: `Your stress is normal (${currentStress}%). Proceed with your $${amount.toFixed(2)} purchase.`,
      });
    }
  };

  const handlePurchaseProceed = () => {
    toast({
      title: "Purchase Recorded",
      description: `$${mockPurchase.amount.toFixed(2)} spent on ${mockPurchase.category}. Consider reviewing this later.`,
    });
  };

  const handlePurchaseCancel = () => {
    toast({
      title: "🎉 Great Decision!",
      description: `You saved $${mockPurchase.amount.toFixed(2)} by waiting. Your future self thanks you!`,
      variant: "default",
    });
  };

  // Format data for charts
  const heartRateChartData = useMemo(() => {
    const last24h = heartRateData.slice(-24);
    return last24h.map((r) => ({
      time: format(r.timestamp, "HH:mm"),
      bpm: r.bpm,
      zone: r.zone,
    }));
  }, [heartRateData]);

  const sleepChartData = useMemo(() => {
    return sleepData.map((s) => ({
      date: format(s.date, "MMM dd"),
      duration: s.duration,
      quality: s.quality,
      deep: s.deepSleep,
      rem: s.remSleep,
      light: s.lightSleep,
    }));
  }, [sleepData]);

  const stressChartData = useMemo(() => {
    const dailyAvg: Record<string, { total: number; count: number }> = {};
    stressData.forEach((s) => {
      const day = format(s.timestamp, "MMM dd");
      if (!dailyAvg[day]) dailyAvg[day] = { total: 0, count: 0 };
      dailyAvg[day].total += s.level;
      dailyAvg[day].count += 1;
    });
    return Object.entries(dailyAvg).map(([date, { total, count }]) => ({
      date,
      stress: Math.round(total / count),
    }));
  }, [stressData]);

  const correlationChartData = useMemo(() => {
    return correlations.map((c) => ({
      date: format(c.date, "MMM dd"),
      stress: c.stressLevel,
      sleep: c.sleepQuality,
      spending: c.spendingAmount,
    }));
  }, [correlations]);

  const getStressColor = (level: number) => {
    if (level < 25) return "text-green-500";
    if (level < 50) return "text-yellow-500";
    if (level < 75) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Purchase Warning Dialog */}
        <PurchaseWarningDialog
          open={showPurchaseWarning}
          onOpenChange={setShowPurchaseWarning}
          amount={mockPurchase.amount}
          category={mockPurchase.category}
          stressLevel={currentStress}
          onProceed={handlePurchaseProceed}
          onCancel={handlePurchaseCancel}
        />

        {/* Intro Card */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Wearables → Smarter Money</h2>
              <p className="text-sm text-muted-foreground">
                FinZee AI blends steps, sleep, and heart-rate signals with your budgets and goals to nudge better money moves.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={simulatePurchase}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Simulate Purchase
              </Button>
              <Badge variant="outline" className="border-primary text-primary">
                <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Demo
              </Badge>
            </div>
          </div>
        </div>

        {/* Stress Alert Banner */}
        <StressAlertBanner />

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Heart Rate</p>
                  <p className="text-2xl font-bold text-foreground">{summary.currentHeartRate} <span className="text-sm font-normal">bpm</span></p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <Heart className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Avg today: {summary.avgHeartRate} bpm</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sleep Quality</p>
                  <p className="text-2xl font-bold text-foreground">{summary.sleepQuality}%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                  <Moon className="h-6 w-6 text-indigo-500" />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{summary.sleepHours}h last night</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stress Level</p>
                  <p className={`text-2xl font-bold ${getStressColor(summary.stressLevel)}`}>{summary.stressLevel}%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <Brain className="h-6 w-6 text-orange-500" />
                </div>
              </div>
              <Progress value={summary.stressLevel} className="mt-2 h-1.5" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Steps Today</p>
                  <p className="text-2xl font-bold text-foreground">{summary.steps.toLocaleString()}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <Activity className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{summary.calories} cal burned</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="correlations">Spending Insights</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Heart Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Heart Rate (Last 24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={heartRateChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="time" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis domain={[50, 120]} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="bpm"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.2)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Sleep Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5 text-indigo-500" />
                    Sleep Duration (2 weeks)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sleepChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis domain={[0, 10]} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="deep" stackId="a" fill="#6366f1" name="Deep" />
                        <Bar dataKey="rem" stackId="a" fill="#8b5cf6" name="REM" />
                        <Bar dataKey="light" stackId="a" fill="#a5b4fc" name="Light" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Stress Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-orange-500" />
                    Daily Stress Levels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stressChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis domain={[0, 100]} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="stress"
                          stroke="#f97316"
                          strokeWidth={2}
                          dot={{ fill: '#f97316', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="correlations" className="space-y-6 mt-6">
            {/* Insights Banner */}
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CircleDollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Emotional Spending Detected</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Based on your wearable data, you tend to spend <strong>23% more</strong> when your stress levels are above 60%.
                      Your best financial decisions happen after nights with 7+ hours of quality sleep.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Correlation Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Stress vs Spending Correlation</CardTitle>
                <CardDescription>
                  How your emotional state affects your daily spending
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={correlationChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis yAxisId="left" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="stress"
                        stroke="#f97316"
                        strokeWidth={2}
                        name="Stress %"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="spending"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name="Spending $"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Insights Grid */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                      <TrendingUp className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">High Stress Days</p>
                      <p className="text-2xl font-bold text-red-500">+$47</p>
                      <p className="text-xs text-muted-foreground">avg extra spending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <TrendingDown className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Good Sleep Days</p>
                      <p className="text-2xl font-bold text-green-500">-$32</p>
                      <p className="text-xs text-muted-foreground">avg savings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Best Decision Time</p>
                      <p className="text-2xl font-bold text-primary">10 AM</p>
                      <p className="text-xs text-muted-foreground">lowest impulse spending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="devices" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  Connected Devices
                </CardTitle>
                <CardDescription>
                  Link your wearables to unlock emotion-aware insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {devices.map((device) => (
                    <div
                      key={device.name}
                      className={`flex items-center justify-between rounded-lg border p-4 ${
                        device.connected
                          ? "border-primary/50 bg-primary/5"
                          : "border-border bg-secondary/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          device.connected ? "bg-primary/10" : "bg-muted"
                        }`}>
                          <device.icon className={`h-5 w-5 ${device.connected ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{device.name}</p>
                          <p className="text-xs text-muted-foreground">{device.description}</p>
                        </div>
                      </div>
                      <Button
                        variant={device.connected ? "secondary" : "outline"}
                        size="sm"
                        disabled={device.connected}
                      >
                        {device.status}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
