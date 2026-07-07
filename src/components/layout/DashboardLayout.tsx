import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Menu, CreditCard } from "lucide-react";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { ChatLauncher } from "@/components/ChatLauncher";
import { appConfig } from "@/config/app";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <ChatLauncher />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Demo mode banner */}
      <div className="lg:pl-64">
        <DemoModeBanner />
      </div>
      
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <CreditCard className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">{appConfig.brandName}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Main content */}
      <main className="pt-14 lg:pt-0 lg:pl-64">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
