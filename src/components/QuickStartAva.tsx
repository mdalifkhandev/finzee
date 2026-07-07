import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function QuickStartAva() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleQuickStart = async () => {
    setLoading(true);
    try {
      // Seed Ava's demo data
      const { data: seedData, error: seedError } = await supabase.functions.invoke("seed-demo-ava");
      
      if (seedError || !seedData?.pass) {
        alert("Ava seed failed");
        console.error(seedData || seedError);
        setLoading(false);
        return;
      }

      // Sign in as Ava
      const { error } = await supabase.auth.signInWithPassword({
        email: "ava@finzee.demo",
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
      variant="outline"
      className="rounded-full"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        "Quick Start: Ava"
      )}
    </Button>
  );
}
