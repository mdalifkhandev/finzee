import { ReactNode } from "react";
import { Link } from "react-router-dom";
import finzeeLogo from "@/assets/finzee-logo.png";
import { appConfig } from "@/config/app";

interface PageShellProps {
  children: ReactNode;
}

export default function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/50">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={finzeeLogo} alt={appConfig.brandName} className="h-8 w-auto" />
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/chat" className="text-muted-foreground hover:text-foreground transition-colors">
              Chat
            </Link>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link to="/wearables" className="text-muted-foreground hover:text-foreground transition-colors">
              Wearables
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-4">
        {children}
      </main>
    </div>
  );
}
