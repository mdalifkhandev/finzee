import { useDemoMode } from '@/contexts/DemoModeContext';
import { FlaskConical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { appConfig } from '@/config/app';

export function DemoModeBanner() {
  const { isDemoMode, setDemoMode } = useDemoMode();
  // Hide banner if config is set to false, or if not in demo mode
  if (!appConfig.showDemoBadges || !isDemoMode) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <FlaskConical className="h-4 w-4 text-primary" />
        <span className="font-medium text-primary">Demo Mode Active</span>
        <span className="text-muted-foreground">— Viewing sample data. Changes won't be saved.</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDemoMode(false)}
        className="h-6 w-6 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
