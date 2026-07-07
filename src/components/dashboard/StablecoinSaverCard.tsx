import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { appConfig } from '@/config/app';
import { Coins, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface StablecoinSaverCardProps {
  personaName?: string;
}

function getPersonaFraming(name?: string): string {
  const lower = name?.toLowerCase() ?? '';
  if (lower.includes('jason'))
    return 'Flexibility + emergency buffer — keep part of your savings instantly accessible, anywhere.';
  if (lower.includes('maya'))
    return 'Cash-flow smoothing — bridge gaps between invoices by parking idle cash in a stable digital dollar.';
  if (lower.includes('ava'))
    return 'Safe, optional savings with guardrails — a low-risk way to let your money work while you focus on school.';
  return 'A smarter, flexible way to store and move money.';
}

export function StablecoinSaverDashboardCard({ personaName }: StablecoinSaverCardProps) {
  const [simulated, setSimulated] = useState(false);

  const subtitle = getPersonaFraming(personaName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card variant="elevated" className="relative overflow-hidden border-primary/20">
        {/* Animated glow overlay */}
        <div className="pointer-events-none absolute -inset-px rounded-xl opacity-60">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
        </div>

        <CardHeader className="pb-3 relative">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              >
                <Coins className="h-5 w-5 text-primary" />
              </motion.div>
              Stablecoin Saver
              <Badge variant="outline" className="text-[10px] font-normal border-primary/30 animate-pulse">Beta</Badge>
            </CardTitle>
            <Badge variant="blue" className="text-[10px]">USD-pegged • Optional</Badge>
          </div>
          <CardDescription className="text-sm">{subtitle}</CardDescription>
        </CardHeader>

      <CardContent className="space-y-4 relative">
        {/* Simulated balance */}
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl sm:text-3xl font-bold">$1,250.00</span>
          <span className="text-sm text-muted-foreground">USDC</span>
        </div>

        {/* AI feedback message */}
        <AnimatePresence>
          {simulated && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-lg border border-primary/20 bg-accent p-3 text-sm text-foreground"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p>
                  {appConfig.brandName} moved 10% of your excess cash into a USD-pegged stablecoin to keep it working for you.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button
            size="sm"
            onClick={() => setSimulated(true)}
            disabled={simulated}
          >
            {simulated ? 'Simulated ✓' : 'Simulate Auto-Save'}
          </Button>
          <Button variant="link" size="sm" asChild className="px-0">
            <Link to="/settings">
              Learn how this works
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Stablecoins are not FDIC insured.
        </p>
      </CardContent>
      </Card>
    </motion.div>
  );
}
