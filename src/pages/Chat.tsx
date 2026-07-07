import { useState, useRef, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  MessageCircle,
  TrendingUp,
  PiggyBank,
  Target,
  CreditCard,
  Trash2,
  GraduationCap,
  Briefcase,
  Baby,
  Wallet,
} from "lucide-react";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { AudioPlayer } from "@/components/voice/AudioPlayer";
import { chat, speak, fetchWelcome } from "@/lib/ai/router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/use-profile";
import { DEMO_EMAILS } from "@/components/DemoLoginButton";
import { appConfig } from "@/config/app";

type Msg = { role: "user" | "assistant"; text: string; audioUrl?: string };

// Persona-specific configurations
const PERSONA_CONFIG = {
  jason: {
    welcomeTitle: "Hey Jason! 👶 Ready to tackle those new-dad finances?",
    welcomeDescription: "I know things are hectic with the little one. Let's make sure your emergency fund and 529 plan are on track.",
    suggestedPrompts: [
      { icon: Baby, text: "How's my baby supplies budget looking?" },
      { icon: Target, text: "Check my 529 plan progress" },
      { icon: PiggyBank, text: "Help me build my emergency fund faster" },
      { icon: CreditCard, text: "Review my family subscriptions" },
    ],
  },
  maya: {
    welcomeTitle: "Hey Maya! 💪 Let's keep that freelance cash flow strong.",
    welcomeDescription: "Irregular income can be tricky, but we've got this. Let's check your runway and tax savings.",
    suggestedPrompts: [
      { icon: Briefcase, text: "What's my cash runway right now?" },
      { icon: Wallet, text: "Am I saving enough for taxes?" },
      { icon: TrendingUp, text: "Show my income vs spending trend" },
      { icon: Target, text: "How's my emergency fund progress?" },
    ],
  },
  ava: {
    welcomeTitle: "Hey Ava! 📚 Let's keep your money simple and stress-free.",
    welcomeDescription: "Between classes and content creation, I'll help you stay on top of your finances without the jargon.",
    suggestedPrompts: [
      { icon: GraduationCap, text: "How's my study abroad fund looking?" },
      { icon: CreditCard, text: "Help me boost my credit score" },
      { icon: TrendingUp, text: "Where did my money go this month?" },
      { icon: PiggyBank, text: "Tips to save during exam week" },
    ],
  },
  default: {
    welcomeTitle: `Welcome to ${appConfig.brandName}`,
    welcomeDescription: "I'm your personal finance coach. Ask me anything about budgeting, saving, investing, or managing your money better.",
    suggestedPrompts: [
      { icon: TrendingUp, text: "How's my spending this month?" },
      { icon: PiggyBank, text: "Help me create a budget" },
      { icon: Target, text: "What goals should I set?" },
      { icon: CreditCard, text: "Review my subscriptions" },
    ],
  },
};

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [welcomeFetched, setWelcomeFetched] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  // Detect which demo persona is logged in
  const personaKey = useMemo(() => {
    const email = user?.email?.toLowerCase();
    if (email === "jason@finzee.demo") return "jason";
    if (email === "maya@finzee.demo") return "maya";
    if (email === "ava@finzee.demo") return "ava";
    return "default";
  }, [user?.email]);

  const persona = PERSONA_CONFIG[personaKey];
  const isDemoUser = DEMO_EMAILS.includes(user?.email || "");

  // Read voice settings from localStorage
  const getVoiceSettings = () => ({
    enabled: localStorage.getItem("finzee_tts_enabled") !== "false",
    voice: localStorage.getItem("finzee_tts_voice") || "alloy",
    speed: parseFloat(localStorage.getItem("finzee_tts_speed") || "0.95"),
  });

  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(() => getVoiceSettings().enabled);

  // Auto-fetch welcome message on first load
  useEffect(() => {
    if (!user || welcomeFetched || msgs.length > 0) return;
    
    const loadWelcome = async () => {
      setWelcomeFetched(true);
      setIsLoading(true);
      
      try {
        const { text, voice } = await fetchWelcome();
        const settings = getVoiceSettings();
        
        let audioUrl: string | undefined;
        if (settings.enabled && voice) {
          try {
            audioUrl = await speak(text, settings.voice, settings.speed);
          } catch (ttsError) {
            console.error("TTS error:", ttsError);
          }
        }
        
        setMsgs([{ role: "assistant", text, audioUrl }]);
      } catch (error) {
        console.error("Welcome fetch error:", error);
        // Fallback to static welcome
        const fallbackName = profile?.first_name || 'there';
        setMsgs([{ 
          role: "assistant", 
          text: `Hey ${fallbackName}! 👋 Ready to check in on your finances? Ask me anything!` 
        }]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWelcome();
  }, [user, welcomeFetched, msgs.length, profile]);

  const handleClearChat = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setMsgs([]);
      setWelcomeFetched(false); // Allow welcome to re-fetch
      toast({
        title: "Chat cleared",
        description: "All messages have been deleted.",
      });
    } catch (error) {
      console.error("Clear chat error:", error);
      toast({
        title: "Error",
        description: "Failed to clear chat.",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [msgs]);

  const handleSend = async (t: string) => {
    if (!t.trim() || isLoading) return;

    setMsgs((m) => [...m, { role: "user", text: t }]);
    setIsLoading(true);

    try {
      const response = await chat(t);
      const settings = getVoiceSettings();
      
      let audioUrl: string | undefined;
      if (settings.enabled) {
        try {
          audioUrl = await speak(response.text, settings.voice, settings.speed);
        } catch (ttsError) {
          console.error("TTS error:", ttsError);
        }
      }

      setMsgs((m) => [...m, { role: "assistant", text: response.text, audioUrl }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  const userName = profile?.first_name || user?.email?.split("@")[0] || "User";

  return (
    <DashboardLayout>
      <div className="flex h-[100dvh] flex-col">
        {/* Chat Header */}
        <div className="border-b border-border bg-card px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-base sm:text-lg font-semibold flex items-center gap-2 truncate">
                  {appConfig.brandName}
                  <Badge variant="blue">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Your AI finance coach</p>
              </div>
            </div>
            
            {msgs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Clear chat</span>
              </Button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {msgs.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/10 mb-4">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">{persona.welcomeTitle}</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {persona.welcomeDescription}
                </p>
                {isDemoUser && (
                  <Badge variant="secondary" className="mt-4">
                    Demo Mode • {personaKey.charAt(0).toUpperCase() + personaKey.slice(1)}'s Account
                  </Badge>
                )}
              </div>
            )}

            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {m.role === "assistant" ? (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
                    <MessageCircle className="h-5 w-5 text-primary-foreground" />
                  </div>
                ) : (
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={userName} />
                    <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 break-words ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm sm:text-base">{m.text}</p>
                  
                  {m.audioUrl && (
                    <div className="mt-2">
                      <AudioPlayer
                        audioContent={m.audioUrl}
                        autoPlay={i === msgs.length - 1}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
                  <MessageCircle className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="bg-secondary rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggested Prompts */}
        {msgs.length === 0 && (
          <div className="border-t border-border bg-secondary/30 px-4 sm:px-8 py-4">
            <p className="text-sm text-muted-foreground mb-3">
              {isDemoUser ? `Suggested for ${profile?.first_name || personaKey}:` : "Suggested questions:"}
            </p>
            <div className="flex flex-wrap gap-2">
              {persona.suggestedPrompts.map((prompt) => (
                <Button
                  key={prompt.text}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleSuggestedPrompt(prompt.text)}
                  disabled={isLoading}
                >
                  <prompt.icon className="h-4 w-4 text-primary" />
                  {prompt.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div
          className="sticky bottom-0 border-t border-border bg-card px-4 sm:px-8 py-3 sm:py-4"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto max-w-3xl">
            <ChatComposer
              onSend={handleSend}
              isLoading={isLoading}
              voiceReplyEnabled={voiceReplyEnabled}
              onVoiceReplyToggle={() => {
                const newValue = !voiceReplyEnabled;
                setVoiceReplyEnabled(newValue);
                localStorage.setItem("finzee_tts_enabled", newValue.toString());
              }}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
