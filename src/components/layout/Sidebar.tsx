import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Settings, LogOut, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { DemoModeToggle } from "@/components/DemoModeToggle";
import { appConfig } from "@/config/app";
import finzeeLogo from "@/assets/finzee-logo.png";

const navigation = [
  { name: `Chat with ${appConfig.brandName}`, href: "/chat", icon: "💬" },
  { name: "Wearables", href: "/wearables", icon: "⌚" },
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Transactions", href: "/transactions", icon: "🧾" },
  { name: "Goals", href: "/goals", icon: "🎯" },
  { name: "AI Insights", href: "/insights", icon: "✨" },
];

const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  // Use real profile data (works for both demo and regular users)
  const displayName = profile?.first_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || '';

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside 
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link to="/dashboard" className="flex items-center">
            <img src={finzeeLogo} alt={appConfig.brandName} className="h-10 w-auto" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Demo Mode Toggle */}
        {appConfig.showDemoBadges && (
          <div className="px-4 py-3 border-b border-border">
            <DemoModeToggle />
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-border p-3">
          {bottomNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}

          {/* User Profile */}
          <Link 
            to="/settings"
            onClick={handleLinkClick}
            className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2.5 hover:bg-secondary transition-colors"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">Free Plan</p>
            </div>
          </Link>
          <button 
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
