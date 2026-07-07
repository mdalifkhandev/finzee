import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Sparkles, PiggyBank, TrendingUp } from 'lucide-react';
import { useSkimSettings } from '@/hooks/use-skim-settings';
import { useSkimProcessor } from '@/hooks/use-skim-processor';
import { Button } from '@/components/ui/button';

const GOAL_TYPES = [
  { value: 'emergency', label: 'Emergency Fund', icon: '🆘' },
  { value: 'vacation', label: 'Vacation', icon: '🏖️' },
  { value: 'car', label: 'Car Fund', icon: '🚗' },
  { value: 'house', label: 'House Down Payment', icon: '🏠' },
  { value: 'education', label: 'Education', icon: '🎓' },
  { value: 'retirement', label: 'Retirement', icon: '👴' },
];

export function SkimToSaveCard() {
  const { settings, updateSettings, toggleEnabled } = useSkimSettings();
  const { processSkims, processing, lastResult } = useSkimProcessor();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Skim-to-Save</CardTitle>
              <CardDescription>Auto-save a % of every deposit</CardDescription>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={toggleEnabled}
          />
        </div>
      </CardHeader>
      
      {settings.enabled && (
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Skim Percentage
              </Label>
              <span className="text-2xl font-bold text-primary">{settings.percentage}%</span>
            </div>
            <Slider
              value={[settings.percentage]}
              onValueChange={([value]) => updateSettings({ percentage: value })}
              min={1}
              max={20}
              step={1}
              className="py-2"
            />
            <p className="text-xs text-muted-foreground">
              For every $100 deposit, you'll auto-save ${settings.percentage.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
              Save to Goal
            </Label>
            <Select
              value={settings.targetGoalKind}
              onValueChange={(value) => updateSettings({ targetGoalKind: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_TYPES.map((goal) => (
                  <SelectItem key={goal.value} value={goal.value}>
                    <span className="flex items-center gap-2">
                      <span>{goal.icon}</span>
                      <span>{goal.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {lastResult && lastResult.totalSkimmed > 0 && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✨ Last skim: ${lastResult.totalSkimmed.toFixed(2)} → {lastResult.goalProgress?.name}
              </p>
              {lastResult.goalProgress && (
                <p className="text-xs text-muted-foreground mt-1">
                  Goal progress: ${lastResult.goalProgress.current.toFixed(2)} / ${lastResult.goalProgress.target.toFixed(2)}
                </p>
              )}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={processSkims}
            disabled={processing}
            className="w-full"
          >
            {processing ? 'Processing...' : 'Process Pending Skims'}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
