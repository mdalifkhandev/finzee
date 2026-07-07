import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Loader2,
  Key,
  Eye,
  EyeOff,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WALLET_OPTIONS = [
  { 
    id: 'metamask', 
    name: 'MetaMask', 
    icon: '🦊', 
    color: 'bg-orange-500/10 border-orange-500/30 hover:border-orange-500/50',
    description: 'Most popular browser wallet',
    downloadUrl: 'https://metamask.io/download/'
  },
  { 
    id: 'coinbase', 
    name: 'Coinbase Wallet', 
    icon: '🔵', 
    color: 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50',
    description: 'Easy for Coinbase users',
    downloadUrl: 'https://www.coinbase.com/wallet'
  },
  { 
    id: 'phantom', 
    name: 'Phantom', 
    icon: '👻', 
    color: 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50',
    description: 'Multi-chain support',
    downloadUrl: 'https://phantom.app/'
  },
] as const;

interface WalletOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (walletType: 'metamask' | 'coinbase' | 'phantom', address: string) => void;
}

type Step = 'intro' | 'education' | 'select' | 'connect' | 'success';

export function WalletOnboardingWizard({ open, onOpenChange, onComplete }: WalletOnboardingWizardProps) {
  const [step, setStep] = useState<Step>('intro');
  const [selectedWallet, setSelectedWallet] = useState<typeof WALLET_OPTIONS[number] | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const steps: Step[] = ['intro', 'education', 'select', 'connect', 'success'];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const resetWizard = () => {
    setStep('intro');
    setSelectedWallet(null);
    setConnecting(false);
    setConnectedAddress(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetWizard, 300);
  };

  const handleConnect = async () => {
    if (!selectedWallet) return;
    
    setConnecting(true);
    
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockAddress = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    setConnectedAddress(mockAddress);
    setConnecting(false);
    setStep('success');
  };

  const handleComplete = () => {
    if (selectedWallet && connectedAddress) {
      onComplete(selectedWallet.id, connectedAddress);
      handleClose();
    }
  };

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md p-0 gap-0 overflow-hidden max-h-[90vh]">
        {/* Progress Header */}
        <div className="p-3 sm:p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-xs text-muted-foreground">
              {step === 'intro' && 'Welcome'}
              {step === 'education' && 'Learn'}
              {step === 'select' && 'Choose Wallet'}
              {step === 'connect' && 'Connect'}
              {step === 'success' && 'Complete'}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Content - scrollable on mobile */}
        <div className="p-4 sm:p-6 min-h-[320px] sm:min-h-[360px] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Introduction */}
            {step === 'intro' && (
              <motion.div
                key="intro"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Wallet className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Connect Your Wallet</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2 px-2">
                      To use Stablecoin Saver, you'll need a non-custodial wallet. Don't worry—we'll guide you through it!
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                  <h3 className="font-medium text-xs sm:text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    What you'll learn:
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Why non-custodial wallets are safer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>How to choose the right wallet</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Connect in under 2 minutes</span>
                    </li>
                  </ul>
                </div>

                <Button className="w-full h-11 sm:h-10 text-sm" onClick={() => setStep('education')}>
                  Let's Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* Step 2: Education */}
            {step === 'education' && (
              <motion.div
                key="education"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-4 sm:space-y-5"
              >
                <div className="text-center">
                  <div className="mx-auto w-11 h-11 sm:w-12 sm:h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-3">
                    <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold">Your Keys, Your Crypto</h2>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                    <Key className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Private Key = Ownership</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Your wallet has a private key that only you control. This proves you own your funds.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <Eye className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-xs sm:text-sm">FinZee Can See, Not Touch</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        We can view your balance to automate sweeps, but we can never move your funds without your approval.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Never Share Your Seed Phrase</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Your 12/24 word recovery phrase is sacred. FinZee will never ask for it.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 h-11 sm:h-10" onClick={() => setStep('intro')}>
                    Back
                  </Button>
                  <Button className="flex-1 h-11 sm:h-10" onClick={() => setStep('select')}>
                    Choose Wallet
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Select Wallet */}
            {step === 'select' && (
              <motion.div
                key="select"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-4 sm:space-y-5"
              >
                <div className="text-center">
                  <h2 className="text-base sm:text-lg font-semibold">Choose Your Wallet</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Select a wallet you already have, or pick one to install
                  </p>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  {WALLET_OPTIONS.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => setSelectedWallet(wallet)}
                      className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all active:scale-[0.98] touch-manipulation ${
                        selectedWallet?.id === wallet.id 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                          : wallet.color
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl">{wallet.icon}</span>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm sm:text-base">{wallet.name}</p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground">{wallet.description}</p>
                      </div>
                      {selectedWallet?.id === wallet.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 h-11 sm:h-10" onClick={() => setStep('education')}>
                    Back
                  </Button>
                  <Button 
                    className="flex-1 h-11 sm:h-10" 
                    onClick={() => setStep('connect')}
                    disabled={!selectedWallet}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Connect */}
            {step === 'connect' && selectedWallet && (
              <motion.div
                key="connect"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-4 sm:space-y-5"
              >
                <div className="text-center">
                  <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-2xl flex items-center justify-center mb-3 text-3xl sm:text-4xl">
                    {selectedWallet.icon}
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold">Connect {selectedWallet.name}</h2>
                </div>

                {!connecting ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-xl p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                      <p className="text-xs sm:text-sm font-medium">When you click connect:</p>
                      <ol className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="bg-primary/20 text-primary text-[10px] sm:text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">1</span>
                          <span>{selectedWallet.name} will open a popup</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-primary/20 text-primary text-[10px] sm:text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">2</span>
                          <span>Review the connection request</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-primary/20 text-primary text-[10px] sm:text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">3</span>
                          <span>Click "Connect" in your wallet</span>
                        </li>
                      </ol>
                    </div>

                    <p className="text-[11px] sm:text-xs text-center text-muted-foreground">
                      Don't have {selectedWallet.name}?{' '}
                      <a 
                        href={selectedWallet.downloadUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Download it first
                      </a>
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-3 sm:space-y-4">
                    <div className="relative">
                      <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
                      <div className="absolute inset-0 flex items-center justify-center text-xl sm:text-2xl">
                        {selectedWallet.icon}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Waiting for {selectedWallet.name}...
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">
                      Check your wallet popup
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-11 sm:h-10" 
                    onClick={() => setStep('select')}
                    disabled={connecting}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1 h-11 sm:h-10" 
                    onClick={handleConnect}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect Wallet
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Success */}
            {step === 'success' && selectedWallet && (
              <motion.div
                key="success"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-5 sm:space-y-6"
              >
                <div className="text-center space-y-3 sm:space-y-4">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
                  </motion.div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">You're All Set!</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      Your {selectedWallet.name} is now connected
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-3 sm:p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl sm:text-2xl">{selectedWallet.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm">{selectedWallet.name}</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground font-mono truncate">{connectedAddress}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 sm:p-4">
                  <h4 className="font-medium text-xs sm:text-sm mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    What's next?
                  </h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    Set your payday and bill day schedule, then we'll automatically sweep your idle cash to USDC and back—maximizing your savings potential.
                  </p>
                </div>

                <Button className="w-full h-11 sm:h-10" onClick={handleComplete}>
                  Complete Setup
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
