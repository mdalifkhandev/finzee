import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function QuickStartJason() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleQuickStart = async () => {
    setLoading(true);
    try {
      // Seed Jason's demo data
      const { data: seedData, error: seedError } = await supabase.functions.invoke("seed-demo");
      
      if (seedError || !seedData?.pass) {
        alert("Jason seed failed");
        console.error(seedData || seedError);
        setLoading(false);
        return;
      }

      // Sign in as Jason
      const { error } = await supabase.auth.signInWithPassword({
        email: "jason@finzee.demo",
        password: "Demo123!$",
      });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      navigate("/chat");
    } catch (err) {
      console.error("Quick start error:", err);
      alert("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleQuickStart}
      disabled={loading}
      className="rounded-full bg-primary text-primary-foreground"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        "Quick Start: Jason"
      )}
    </Button>
  );
}
