import { useState } from 'react';
import { appConfig } from '@/config/app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Coins, 
  DollarSign, 
  ArrowLeftRight, 
  ShieldCheck, 
  Wallet, 
  Clock, 
  CheckCircle2,
  Calendar,
  Unlink,
  ExternalLink
} from 'lucide-react';
import { useStablecoinSettings } from '@/hooks/use-stablecoin-settings';
import { WalletOnboardingWizard } from './WalletOnboardingWizard';
import { YieldEstimator } from './YieldEstimator';
import { toast } from 'sonner';

const WALLET_OPTIONS = [
  { id: 'metamask', name: 'MetaMask', icon: '🦊', color: 'bg-orange-500/10 border-orange-500/20' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: '🔵', color: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'phantom', name: 'Phantom', icon: '👻', color: 'bg-purple-500/10 border-purple-500/20' },
] as const;

const DAY_OPTIONS = Array.from({ length: 28 }, (_, i) => i + 1);

export function StablecoinSaverCard() {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showWalletWizard, setShowWalletWizard] = useState(false);
  const { settings, updateSettings, toggleEnabled, connectWallet, disconnectWallet } = useStablecoinSettings();

  const handleWalletConnected = (walletType: 'metamask' | 'coinbase' | 'phantom', address: string) => {
    connectWallet(walletType, address);
    toast.success(`${WALLET_OPTIONS.find(w => w.id === walletType)?.name} connected!`);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast.success('Wallet disconnected');
  };

  const formatOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
                <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base sm:text-lg">Stablecoin Saver</CardTitle>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">beta</Badge>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  Auto-sweep idle cash to USDC on paydays
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={toggleEnabled}
              className="shrink-0"
            />
          </div>
        </CardHeader>

        {settings.enabled && (
          <CardContent className="space-y-5 sm:space-y-6 p-4 pt-0 sm:p-6 sm:pt-0">
            {/* Wallet Connection */}
            <div className="space-y-2.5 sm:space-y-3">
              <Label className="flex items-center gap-2 text-xs sm:text-sm">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                Connected Wallet
              </Label>
              
              {settings.walletConnected ? (
                <div className="flex items-center justify-between gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-lg sm:text-xl shrink-0">
                      {WALLET_OPTIONS.find(w => w.id === settings.walletType)?.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm">
                        {WALLET_OPTIONS.find(w => w.id === settings.walletType)?.name}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate">
                        {settings.walletAddress}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDisconnect}
                    className="text-muted-foreground hover:text-destructive shrink-0 h-9 w-9 p-0"
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full h-11 sm:h-10"
                  onClick={() => setShowWalletWizard(true)}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
              )}
            </div>

            {/* Schedule Settings */}
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                    Payday
                  </Label>
                  <Select
                    value={settings.payday.toString()}
                    onValueChange={(value) => updateSettings({ payday: parseInt(value) })}
                  >
                    <SelectTrigger className="h-10 sm:h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_OPTIONS.map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {formatOrdinal(day)} of month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                    Bill Day
                  </Label>
                  <Select
                    value={settings.billDay.toString()}
                    onValueChange={(value) => updateSettings({ billDay: parseInt(value) })}
                  >
                    <SelectTrigger className="h-10 sm:h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_OPTIONS.map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {formatOrdinal(day)} of month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                💡 We'll sweep to USDC on the {formatOrdinal(settings.payday)} and back to your bank by the {formatOrdinal(settings.billDay)}
              </p>
            </div>

            {/* Sweep Percentage */}
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-xs sm:text-sm">
                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                  Sweep Amount
                </Label>
                <span className="text-xl sm:text-2xl font-bold text-primary">{settings.sweepPercentage}%</span>
              </div>
              <Slider
                value={[settings.sweepPercentage]}
                onValueChange={([value]) => updateSettings({ sweepPercentage: value })}
                min={10}
                max={90}
                step={5}
                className="py-3 touch-manipulation"
              />
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Percentage of idle cash to sweep into USDC
              </p>
            </div>

            {/* Yield Estimator - show when wallet connected */}
            {settings.walletConnected && (
              <YieldEstimator 
                sweepPercentage={settings.sweepPercentage}
                payday={settings.payday}
                billDay={settings.billDay}
              />
            )}

            {/* Status Summary */}
            {settings.walletConnected && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium text-xs sm:text-sm">Ready to sweep</span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  {settings.sweepPercentage}% of idle cash will auto-convert to USDC on the {formatOrdinal(settings.payday)}, 
                  then sweep back before the {formatOrdinal(settings.billDay)}.
                </p>
              </div>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-muted-foreground h-10"
              onClick={() => setShowInfoModal(true)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Learn how it works
            </Button>
          </CardContent>
        )}

        {!settings.enabled && (
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <Button 
              variant="outline" 
              className="w-full rounded-xl h-11 sm:h-10" 
              onClick={() => setShowInfoModal(true)}
            >
              Learn how it works
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Info Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Coins className="h-6 w-6 text-primary" />
              How Stablecoin Saver Works
            </DialogTitle>
            <DialogDescription>
              A smarter way to hold your idle cash between paydays
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* What is USDC */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold">What is USDC?</h3>
              </div>
              <div className="pl-11 space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">USDC (USD Coin)</strong> is a digital dollar—a stablecoin pegged 1:1 to the US dollar.
                </p>
                <ul className="space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>1 USDC = $1.00 USD (always)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Issued by Circle, audited monthly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>No price volatility like Bitcoin</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Sweep Mechanics */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold">Sweep Mechanics</h3>
              </div>
              <div className="pl-11 space-y-3 text-sm text-muted-foreground">
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-green-600 shrink-0" />
                    <span><strong className="text-foreground">Payday:</strong> Idle cash → USDC wallet</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-red-500 shrink-0" />
                    <span><strong className="text-foreground">Bill day:</strong> USDC → Bank (auto-convert)</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Non-Custodial */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold">Non-Custodial = You're in Control</h3>
              </div>
              <div className="pl-11 space-y-3 text-sm text-muted-foreground">
                <p>
                  {appConfig.brandName} never holds your money. Your USDC lives in a wallet <em>you</em> own.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-foreground text-xs">Your Wallet</span>
                    </div>
                    <p className="text-xs">Only you have the keys.</p>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-foreground text-xs">Custodial</span>
                    </div>
                    <p className="text-xs">A company holds your funds.</p>
                  </div>
                </div>
              </div>
            </section>

            <Button className="w-full rounded-xl" onClick={() => setShowInfoModal(false)}>
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Onboarding Wizard */}
      <WalletOnboardingWizard 
        open={showWalletWizard} 
        onOpenChange={setShowWalletWizard}
        onComplete={handleWalletConnected}
      />
    </>
  );
}
