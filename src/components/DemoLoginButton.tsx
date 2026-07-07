import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { useDemoMode } from "@/contexts/DemoModeContext";

interface DemoLoginButtonProps {
  variant?: "maya" | "jason" | "ava";
  className?: string;
}

const DEMO_USERS = {
  maya: {
    email: "maya@finzee.demo",
    password: "Demo123!$",
    name: "Maya",
    seedFunction: "seed-demo-maya",
    description: "Freelancer",
  },
  jason: {
    email: "jason@finzee.demo",
    password: "Demo123!$",
    name: "Jason",
    seedFunction: "seed-demo",
    description: "New Dad",
  },
  ava: {
    email: "ava@finzee.demo",
    password: "Demo123!$",
    name: "Ava",
    seedFunction: "seed-demo-ava",
    description: "Student",
  },
};

// Export for use in auth detection
export const DEMO_EMAILS = [DEMO_USERS.maya.email, DEMO_USERS.jason.email, DEMO_USERS.ava.email];

export function DemoLoginButton({ variant = "maya", className }: DemoLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setDemoMode } = useDemoMode();
  const demoUser = DEMO_USERS[variant];

  async function seedAndLogin() {
    setIsLoading(true);
    
    try {
      // Step 1: Seed demo data
      toast.info(`Setting up ${demoUser.name}'s demo account...`);
      
      const { data, error: seedError } = await supabase.functions.invoke(demoUser.seedFunction, {
        method: 'POST',
      });

      if (seedError) {
        console.error('Seed error:', seedError);
        toast.error(`Failed to set up demo: ${seedError.message}`);
        return;
      }

      if (!data?.pass) {
        console.log('Seed report:', data);
        toast.error('Demo setup incomplete. Check console for details.');
        return;
      }

      console.log('Seed successful:', data);

      // Step 2: Log in as demo user
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: demoUser.email,
        password: demoUser.password,
      });

      if (loginError) {
        toast.error(`Login failed: ${loginError.message}`);
        return;
      }

      // Step 3: Enable demo mode automatically
      setDemoMode(true);

      toast.success(`Welcome, ${demoUser.name}! 🎉 Demo mode enabled.`);
      navigate('/chat');
      
    } catch (err) {
      console.error('Demo login error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={seedAndLogin}
      disabled={isLoading}
      variant="outline"
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FlaskConical className="h-4 w-4 mr-2" />
      )}
      {isLoading ? `Setting up ${demoUser.name}...` : `Try Demo (${demoUser.name})`}
    </Button>
  );
}
