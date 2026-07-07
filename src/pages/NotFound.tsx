import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import finzeeLogo from "@/assets/finzee-logo.png";
import { appConfig } from "@/config/app";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-muted/50 flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link to="/" className="inline-block">
            <img src={finzeeLogo} alt={appConfig.brandName} className="h-8 w-auto" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* 404 Badge */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <span className="text-3xl font-bold text-primary">404</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Page not found
          </h1>

          {/* Description */}
          <p className="text-muted-foreground text-lg mb-8">
            Looks like this page took an unexpected detour. Let's get you back on track.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/">
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/d">
                <ArrowLeft className="h-4 w-4" />
                Try Demo
              </Link>
            </Button>
          </div>

          {/* Help Link */}
          <p className="mt-8 text-sm text-muted-foreground">
            Need help?{" "}
            <Link to="/chat" className="text-primary hover:underline inline-flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              Chat with {appConfig.brandName}
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {appConfig.brandName} — Your AI Finance Coach
        </p>
      </footer>
    </div>
  );
};

export default NotFound;
