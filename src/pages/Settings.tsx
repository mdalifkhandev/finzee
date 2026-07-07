import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  User,
  CreditCard,
  Bell,
  Shield,
  Link2,
  Crown,
  Check,
  ExternalLink,
  Loader2,
  Camera,
  KeyRound,
  Volume2,
  Sparkles,
  ChevronsUpDown,
  Languages,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";
import { useUserPrefs } from "@/hooks/use-user-prefs";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";
import { SkimToSaveCard } from "@/components/settings/SkimToSaveCard";
import { StablecoinSaverCard } from "@/components/settings/StablecoinSaverCard";
import { toast } from "sonner";

const VOICE_OPTIONS = [
  { id: "alloy", name: "Alloy", description: "Neutral and balanced" },
  { id: "echo", name: "Echo", description: "Warm and conversational" },
  { id: "fable", name: "Fable", description: "Expressive and dramatic" },
  { id: "onyx", name: "Onyx", description: "Deep and authoritative" },
  { id: "nova", name: "Nova", description: "Friendly and upbeat" },
  { id: "shimmer", name: "Shimmer", description: "Clear and energetic" },
];

const TONE_OPTIONS = [
  { id: "calm", name: "Calm", description: "Soft and measured responses" },
  { id: "friendly", name: "Friendly", description: "Warm and casual tone" },
  { id: "hype", name: "Hype", description: "Energetic and motivating" },
];

const EMOJI_OPTIONS = [
  { id: "none", name: "None", description: "No emojis in responses" },
  { id: "low", name: "Low", description: "Occasional emojis (1 max)" },
  { id: "high", name: "High", description: "Expressive with emojis (2-3)" },
];

const LANGUAGE_OPTIONS = [
  { id: "", name: "Auto (English)", flag: "🌐", description: "Default English responses" },
  { id: "Spanish", name: "Español (España)", flag: "🇪🇸", description: "European Spanish" },
  { id: "Spanish (Latin America)", name: "Español (Latinoamérica)", flag: "🇲🇽", description: "Latin American Spanish" },
  { id: "French", name: "Français", flag: "🇫🇷", description: "Respond in French" },
  { id: "German", name: "Deutsch", flag: "🇩🇪", description: "Respond in German" },
  { id: "Italian", name: "Italiano", flag: "🇮🇹", description: "Respond in Italian" },
  { id: "Portuguese", name: "Português (Portugal)", flag: "🇵🇹", description: "European Portuguese" },
  { id: "Portuguese (Brazil)", name: "Português (Brasil)", flag: "🇧🇷", description: "Brazilian Portuguese" },
  { id: "Dutch", name: "Nederlands", flag: "🇳🇱", description: "Respond in Dutch" },
  { id: "Russian", name: "Русский", flag: "🇷🇺", description: "Respond in Russian" },
  { id: "Ukrainian", name: "Українська", flag: "🇺🇦", description: "Respond in Ukrainian" },
  { id: "Polish", name: "Polski", flag: "🇵🇱", description: "Respond in Polish" },
  { id: "Czech", name: "Čeština", flag: "🇨🇿", description: "Respond in Czech" },
  { id: "Greek", name: "Ελληνικά", flag: "🇬🇷", description: "Respond in Greek" },
  { id: "Swedish", name: "Svenska", flag: "🇸🇪", description: "Respond in Swedish" },
  { id: "Norwegian", name: "Norsk", flag: "🇳🇴", description: "Respond in Norwegian" },
  { id: "Danish", name: "Dansk", flag: "🇩🇰", description: "Respond in Danish" },
  { id: "Finnish", name: "Suomi", flag: "🇫🇮", description: "Respond in Finnish" },
  { id: "Turkish", name: "Türkçe", flag: "🇹🇷", description: "Respond in Turkish" },
  { id: "Mandarin Chinese", name: "中文", flag: "🇨🇳", description: "Respond in Mandarin" },
  { id: "Japanese", name: "日本語", flag: "🇯🇵", description: "Respond in Japanese" },
  { id: "Korean", name: "한국어", flag: "🇰🇷", description: "Respond in Korean" },
  { id: "Hindi", name: "हिन्दी", flag: "🇮🇳", description: "Respond in Hindi" },
  { id: "Arabic", name: "العربية", flag: "🇸🇦", description: "Respond in Arabic" },
  { id: "Hebrew", name: "עברית", flag: "🇮🇱", description: "Respond in Hebrew" },
  { id: "Vietnamese", name: "Tiếng Việt", flag: "🇻🇳", description: "Respond in Vietnamese" },
  { id: "Thai", name: "ไทย", flag: "🇹🇭", description: "Respond in Thai" },
  { id: "Indonesian", name: "Bahasa Indonesia", flag: "🇮🇩", description: "Respond in Indonesian" },
  { id: "Hawaiian", name: "ʻŌlelo Hawaiʻi", flag: "🌺", description: "Respond in Hawaiian" },
  { id: "Hawaiian Pidgin", name: "Pidgin (Hawaiʻi)", flag: "🤙", description: "Respond in Hawaiian Pidgin/Creole" },
  { id: "Spanglish", name: "Spanglish", flag: "🇺🇸🇲🇽", description: "Respond in Spanish-English mix" },
  { id: "Singlish", name: "Singlish", flag: "🇸🇬", description: "Respond in Singaporean English" },
  { id: "Hinglish", name: "Hinglish", flag: "🇮🇳", description: "Respond in Hindi-English mix" },
  { id: "Taglish", name: "Taglish", flag: "🇵🇭", description: "Respond in Tagalog-English mix" },
  { id: "Manglish", name: "Manglish", flag: "🇲🇾", description: "Respond in Malaysian English" },
  { id: "Samoan", name: "Gagana Samoa", flag: "🇼🇸", description: "Respond in Samoan" },
  { id: "Maori", name: "Te Reo Māori", flag: "🇳🇿", description: "Respond in Māori" },
  { id: "Tagalog", name: "Tagalog", flag: "🇵🇭", description: "Respond in Tagalog/Filipino" },
  { id: "Tongan", name: "Lea Faka-Tonga", flag: "🇹🇴", description: "Respond in Tongan" },
  { id: "Fijian", name: "Vosa Vakaviti", flag: "🇫🇯", description: "Respond in Fijian" },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    current: false,
    features: ["2 bank accounts", "Basic insights", "5 FinzeeAI chats/month"],
  },
  {
    name: "Pro",
    price: "$12/mo",
    current: true,
    features: ["Unlimited accounts", "Advanced insights", "Unlimited FinzeeAI chats", "Goal tracking"],
  },
  {
    name: "Pro+",
    price: "$24/mo",
    current: false,
    features: ["Everything in Pro", "Family sharing", "Investment tracking", "API access"],
  },
];

export default function Settings() {
  const { user } = useAuth();
  const { profile, displayName, loading, updateProfile, uploadAvatar } = useProfile();
  const { prefs, updatePrefs } = useUserPrefs();
  const { theme, setTheme } = useTheme();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice settings - use prefs from DB when available, fallback to localStorage
  const [selectedVoice, setSelectedVoice] = useState(() => 
    localStorage.getItem("finzee_tts_voice") || "alloy"
  );
  const [voiceSpeed, setVoiceSpeed] = useState(() => 
    parseFloat(localStorage.getItem("finzee_tts_speed") || "0.95")
  );
  const [voiceEnabled, setVoiceEnabled] = useState(() => 
    localStorage.getItem("finzee_tts_enabled") !== "false"
  );

  // AI personality settings
  const [selectedTone, setSelectedTone] = useState("calm");
  const [selectedEmoji, setSelectedEmoji] = useState("low");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [languagePopoverOpen, setLanguagePopoverOpen] = useState(false);

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setSelectedLanguage((profile as any).preferred_language || "");
    }
  }, [profile]);

  // Sync prefs from DB when loaded
  useEffect(() => {
    if (prefs?.voice) {
      setSelectedVoice(prefs.voice);
    }
    if (prefs?.tone) {
      setSelectedTone(prefs.tone);
    }
    if (prefs?.emoji) {
      setSelectedEmoji(prefs.emoji);
    }
  }, [prefs]);

  // Persist voice settings to localStorage
  useEffect(() => {
    localStorage.setItem("finzee_tts_voice", selectedVoice);
  }, [selectedVoice]);

  useEffect(() => {
    localStorage.setItem("finzee_tts_speed", voiceSpeed.toString());
  }, [voiceSpeed]);

  useEffect(() => {
    localStorage.setItem("finzee_tts_enabled", voiceEnabled.toString());
  }, [voiceEnabled]);

  // Save tone to DB
  const handleToneChange = async (tone: string) => {
    setSelectedTone(tone);
    await updatePrefs({ tone });
    toast.success(`Tone set to ${tone}`);
  };

  // Save emoji to DB
  const handleEmojiChange = async (emoji: string) => {
    setSelectedEmoji(emoji);
    await updatePrefs({ emoji });
    toast.success(`Emoji level set to ${emoji}`);
  };

  // Save language to profile
  const handleLanguageChange = async (language: string) => {
    setSelectedLanguage(language);
    await updateProfile({ preferred_language: language || null } as any);
    toast.success(language ? `Language set to ${language}` : "Language set to Auto (English)");
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await updateProfile({ 
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null 
    });
    setIsSaving(false);
  };

  const handleVoiceChange = async (voice: string) => {
    setSelectedVoice(voice);
    await updatePrefs({ voice });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    await uploadAvatar(file);
    setIsUploading(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const name = displayName || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || '';

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile
                </CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatarUrl} alt={name} />
                      <AvatarFallback className="text-2xl">
                        {name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={handleAvatarClick}
                      disabled={isUploading}
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAvatarClick}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Change Photo'
                      )}
                    </Button>
                    <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP. Max 2MB</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">First Name</label>
                    <Input 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    <Input 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      className="mt-1" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input 
                    value={user?.email || ''} 
                    disabled
                    className="mt-1 bg-muted" 
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <Button 
                  variant="default" 
                  onClick={handleSaveProfile}
                  disabled={isSaving || loading}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notifications
                </CardTitle>
                <CardDescription>Choose what you want to be notified about</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Budget Alerts", description: "Get notified when you're close to your budget limit" },
                  { title: "Weekly Summary", description: "Receive a weekly summary of your finances" },
                  { title: "New Insights", description: "Be notified when FinzeeAI finds new insights" },
                  { title: "Goal Progress", description: "Updates on your savings goal progress" },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-primary" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize the look and feel of the app</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "light", label: "Light", icon: Sun },
                      { id: "dark", label: "Dark", icon: Moon },
                      { id: "system", label: "System", icon: Monitor },
                    ].map((option) => {
                      const Icon = option.icon;
                      const isSelected = theme === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => setTheme(option.id)}
                          className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all touch-manipulation ${
                            isSelected
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs sm:text-sm font-medium">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Personality */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Personality
                </CardTitle>
                <CardDescription>Customize how FinzeeAI communicates with you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Conversation Tone</label>
                  <Select value={selectedTone} onValueChange={handleToneChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((tone) => (
                        <SelectItem key={tone.id} value={tone.id}>
                          <div className="flex flex-col">
                            <span>{tone.name}</span>
                            <span className="text-xs text-muted-foreground">{tone.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Emoji Usage</label>
                  <Select value={selectedEmoji} onValueChange={handleEmojiChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select emoji level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMOJI_OPTIONS.map((emoji) => (
                        <SelectItem key={emoji.id} value={emoji.id}>
                          <div className="flex flex-col">
                            <span>{emoji.name}</span>
                            <span className="text-xs text-muted-foreground">{emoji.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Response Language</label>
                  <Popover open={languagePopoverOpen} onOpenChange={setLanguagePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={languagePopoverOpen}
                        className="w-full justify-between font-normal"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">
                            {LANGUAGE_OPTIONS.find(l => l.id === selectedLanguage)?.flag || "🌐"}
                          </span>
                          {selectedLanguage 
                            ? LANGUAGE_OPTIONS.find(l => l.id === selectedLanguage)?.name 
                            : "Auto (English)"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search languages..." />
                        <CommandList>
                          <CommandEmpty>No language found.</CommandEmpty>
                          <CommandGroup>
                            {LANGUAGE_OPTIONS.map((lang) => (
                              <CommandItem
                                key={lang.id || "auto"}
                                value={`${lang.name} ${lang.id} ${lang.description}`}
                                onSelect={() => {
                                  handleLanguageChange(lang.id);
                                  setLanguagePopoverOpen(false);
                                }}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{lang.flag}</span>
                                  <div className="flex flex-col">
                                    <span>{lang.name}</span>
                                    <span className="text-xs text-muted-foreground">{lang.description}</span>
                                  </div>
                                </div>
                                {selectedLanguage === lang.id && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-sm text-muted-foreground">
                    These settings affect how FinzeeAI responds in chat and generates insights for you.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Voice Settings */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-primary" />
                  Voice Settings
                </CardTitle>
                <CardDescription>Customize FinzeeAI's voice responses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Voice Responses</p>
                    <p className="text-sm text-muted-foreground">Enable spoken AI responses</p>
                  </div>
                  <Switch 
                    checked={voiceEnabled} 
                    onCheckedChange={(checked) => {
                      setVoiceEnabled(checked);
                      toast.success(checked ? "Voice responses enabled" : "Voice responses disabled");
                    }} 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Voice</label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICE_OPTIONS.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex flex-col">
                            <span>{voice.name}</span>
                            <span className="text-xs text-muted-foreground">{voice.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Speaking Speed</label>
                    <span className="text-sm text-muted-foreground">{voiceSpeed.toFixed(2)}x</span>
                  </div>
                  <Slider
                    value={[voiceSpeed]}
                    onValueChange={([value]) => setVoiceSpeed(value)}
                    min={0.7}
                    max={1.2}
                    step={0.05}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Slower</span>
                    <span>Faster</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skim-to-Save Automation */}
            <SkimToSaveCard />

            {/* Stablecoin Saver */}
            <StablecoinSaverCard />

            {/* Connected Accounts */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  Connected Accounts
                </CardTitle>
                <CardDescription>Manage your linked bank accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Chase", accounts: 2, status: "connected" },
                  { name: "American Express", accounts: 1, status: "connected" },
                ].map((bank) => (
                  <div key={bank.name} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary font-bold">
                        {bank.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{bank.name}</p>
                        <p className="text-sm text-muted-foreground">{bank.accounts} accounts linked</p>
                      </div>
                    </div>
                    <Badge variant="success">Connected</Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect New Account
                </Button>
              </CardContent>
            </Card>

            {/* Security */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security
                </CardTitle>
                <CardDescription>Protect your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Passkey Login</p>
                    <p className="text-sm text-muted-foreground">Use biometrics or security key</p>
                  </div>
                  <Badge variant="success">Enabled</Badge>
                </div>
                
                {/* Password Change Section */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Password</p>
                  </div>
                  {showPasswordForm ? (
                    <PasswordChangeForm onCancel={() => setShowPasswordForm(false)} />
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Change your password to keep your account secure
                      </p>
                      <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
                        Change Password
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Billing */}
          <div className="space-y-6">
            <Card variant="blue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Your Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.name}
                      className={`rounded-lg border p-4 ${
                        plan.current ? "border-primary bg-accent" : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{plan.name}</span>
                        <span className="font-display font-bold">{plan.price}</span>
                      </div>
                      <ul className="space-y-1">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="h-3 w-3 text-success" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {plan.current ? (
                        <Badge variant="default" className="mt-3">Current Plan</Badge>
                      ) : (
                        <Button variant="outline" size="sm" className="mt-3 w-full">
                          {plan.price === "$0" ? "Downgrade" : "Upgrade"}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">•••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/25</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Update Payment Method
                </Button>
              </CardContent>
            </Card>

            <Card variant="outline">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Need help? Check out our{" "}
                  <a href="#" className="text-primary hover:underline">
                    documentation
                    <ExternalLink className="inline h-3 w-3 ml-1" />
                  </a>{" "}
                  or{" "}
                  <a href="#" className="text-primary hover:underline">
                    contact support
                  </a>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
