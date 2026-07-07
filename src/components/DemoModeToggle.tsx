import { useDemoMode } from '@/contexts/DemoModeContext';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { FlaskConical } from 'lucide-react';

export function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <div className="flex items-center gap-2">
      <FlaskConical className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Demo</span>
      <Switch
        checked={isDemoMode}
        onCheckedChange={toggleDemoMode}
        aria-label="Toggle demo mode"
      />
      {isDemoMode && (
        <Badge variant="secondary" className="text-xs">
          Sample Data
        </Badge>
      )}
    </div>
  );
}
