import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, Info, Sparkles, DollarSign, Clock, Percent } from 'lucide-react';

// Simulated current APY rates from various protocols
const DEFI_PROTOCOLS = [
  { 
    id: 'aave', 
    name: 'Aave', 
    apy: 4.82, 
    risk: 'low',
    description: 'Largest lending protocol on Ethereum',
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
  },
  { 
    id: 'compound', 
    name: 'Compound', 
    apy: 4.15, 
    risk: 'low',
    description: 'Pioneer of DeFi lending',
    color: 'bg-green-500/10 text-green-600 border-green-500/20'
  },
  { 
    id: 'morpho', 
    name: 'Morpho', 
    apy: 5.23, 
    risk: 'medium',
    description: 'Optimized lending layer',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  },
  { 
    id: 'makerdao', 
    name: 'MakerDAO DSR', 
    apy: 5.00, 
    risk: 'low',
    description: 'DAI Savings Rate',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  },
];

interface YieldEstimatorProps {
  sweepPercentage: number;
  payday: number;
  billDay: number;
}

export function YieldEstimator({ sweepPercentage, payday, billDay }: YieldEstimatorProps) {
  const [monthlyDeposit, setMonthlyDeposit] = useState(3000);
  const [selectedProtocol, setSelectedProtocol] = useState(DEFI_PROTOCOLS[0]);

  // Calculate days between payday and bill day
  const daysInUsdc = useMemo(() => {
    if (billDay > payday) {
      return billDay - payday;
    }
    // Wraps around the month
    return (28 - payday) + billDay;
  }, [payday, billDay]);

  // Calculate estimated yields
  const calculations = useMemo(() => {
    const sweepAmount = monthlyDeposit * (sweepPercentage / 100);
    const dailyRate = selectedProtocol.apy / 100 / 365;
    
    // Yield for the days between payday and bill day
    const monthlyYield = sweepAmount * dailyRate * daysInUsdc;
    const yearlyYield = monthlyYield * 12;
    
    // Compare to traditional savings (0.5% APY average)
    const traditionalDailyRate = 0.005 / 365;
    const traditionalMonthlyYield = sweepAmount * traditionalDailyRate * daysInUsdc;
    const traditionalYearlyYield = traditionalMonthlyYield * 12;
    
    const extraEarnings = yearlyYield - traditionalYearlyYield;
    
    return {
      sweepAmount,
      monthlyYield,
      yearlyYield,
      traditionalYearlyYield,
      extraEarnings,
      multiplier: yearlyYield / traditionalYearlyYield
    };
  }, [monthlyDeposit, sweepPercentage, selectedProtocol, daysInUsdc]);

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low':
        return <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">Low Risk</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">Medium Risk</Badge>;
      case 'high':
        return <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/30">High Risk</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-green-500/10 rounded-lg">
          <TrendingUp className="h-4 w-4 text-green-600" />
        </div>
        <Label className="font-medium text-sm sm:text-base">Yield Estimator</Label>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px] sm:max-w-xs">
            <p className="text-xs">
              Estimated earnings from holding USDC in DeFi protocols. 
              Rates are variable and these are approximations based on current market conditions.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Monthly Income Input */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Monthly paycheck</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            value={monthlyDeposit}
            onChange={(e) => setMonthlyDeposit(Number(e.target.value) || 0)}
            className="pl-9 h-11 text-base"
            inputMode="numeric"
            min={0}
            step={100}
          />
        </div>
      </div>

      {/* Protocol Selection - Stack on mobile, 2-col on larger screens */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">DeFi Protocol</Label>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
          {DEFI_PROTOCOLS.map((protocol) => (
            <button
              key={protocol.id}
              onClick={() => setSelectedProtocol(protocol)}
              className={`p-3 sm:p-3 rounded-xl border text-left transition-all active:scale-[0.98] touch-manipulation ${
                selectedProtocol.id === protocol.id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="font-medium text-sm truncate">{protocol.name}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-md shrink-0 ${protocol.color}`}>
                  {protocol.apy}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{protocol.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Yield Breakdown */}
      <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-500/5 to-primary/5 border-green-500/20">
        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 shrink-0" />
              <span>Sweep amount</span>
            </span>
            <span className="font-medium">${calculations.sweepAmount.toLocaleString()}/mo</span>
          </div>
          
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Days earning yield</span>
            </span>
            <span className="font-medium">{daysInUsdc} days/mo</span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5 shrink-0" />
              <span>Protocol APY</span>
            </span>
            <span className="font-medium flex items-center gap-1.5 flex-wrap justify-end">
              <span>{selectedProtocol.apy}%</span>
              {getRiskBadge(selectedProtocol.risk)}
            </span>
          </div>

          <div className="border-t border-border/50 pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Est. monthly yield</span>
              <span className="text-base sm:text-lg font-bold text-green-600">
                +${calculations.monthlyYield.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs sm:text-sm text-muted-foreground">Est. yearly yield</span>
              <span className="text-lg sm:text-xl font-bold text-green-600">
                +${calculations.yearlyYield.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Comparison Card */}
      <div className="p-3 bg-muted/50 rounded-xl space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs sm:text-sm font-medium">vs. Traditional Savings</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A typical savings account at 0.5% APY would earn you just{' '}
          <span className="font-medium text-foreground">${calculations.traditionalYearlyYield.toFixed(2)}/year</span>.
        </p>
        <p className="text-xs leading-relaxed">
          With {selectedProtocol.name}, you could earn{' '}
          <span className="font-bold text-green-600">${calculations.extraEarnings.toFixed(2)} more</span>{' '}
          ({calculations.multiplier.toFixed(1)}x more yield)!
        </p>
      </div>

      <p className="text-[11px] sm:text-xs text-muted-foreground text-center px-2">
        ⚠️ DeFi yields are variable. Past performance doesn't guarantee future results.
      </p>
    </div>
  );
}
