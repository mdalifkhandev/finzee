import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMAIL = "jason@finzee.demo";
const PASSWORD = "Demo123!$";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // Find Jason
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) {
      console.error('List users error:', listErr);
      return new Response(JSON.stringify({ error: listErr.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    let user = list?.users?.find(u => u.email === EMAIL);
    
    // Create if not exists
    if (!user) {
      const created = await admin.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true
      });
      if (created.error) {
        console.error('Create user error:', created.error);
        return new Response(JSON.stringify({ error: created.error.message }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      user = created.data.user!;
      console.log('Created Jason user:', user.id);
    } else {
      console.log('Found existing Jason user:', user.id);
    }

    const user_id = user.id;

    // 1) Persona/Profile (no "demo" text anywhere)
    const { error: profileErr } = await admin.from("profiles").upsert({
      user_id,
      first_name: "Jason",
      last_name: "Rivera",
      age: 32,
      bio: "Project manager in LA, ambitious and structured, stressed about the future; wants a proactive coach to cut waste and prep for a new baby.",
      avatar_url: "/demo/jason-avatar.png",
      tags: {
        persona: ["millennial", "project-manager", "new-dad", "subscriptions-overwhelm", "budget-rebalancer"],
        testimonial: {
          tag: "jason-case",
          loves: [
            "AI Budget Rebalancer tells him exactly where to cut back and why",
            "FinZee set up a New Dad Emergency Fund and broke it into steps",
            "Mental health check-ins: 'You're juggling a lot—celebrate that $500 payoff 🎉'"
          ]
        }
      },
      income_pattern: "salary",
      pain_points: ["financial-confusion", "subscriptions", "baby-planning"],
      goals: ["new-dad-emergency-fund", "credit-card-payoff", "baby-budget", "car-loan-plan", "subscription-cleanup"]
    }, { onConflict: "user_id" });
    if (profileErr) console.error('Profile upsert error:', profileErr);

    // 2) Preferences for voice/tone
    const { error: prefsErr } = await admin.from("user_prefs").upsert({
      user_id,
      tone: "friendly",
      emoji: "low",
      voice: "alloy",
      nudges: true
    }, { onConflict: "user_id" });
    if (prefsErr) console.error('Prefs upsert error:', prefsErr);

    // 3) Goals — EXACTLY Jason's (unique by user_id, kind)
    const today = new Date();
    const due3m = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 3, 28)).toISOString().slice(0, 10);
    const due6m = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 6, 28)).toISOString().slice(0, 10);
    const due12m = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 12, 28)).toISOString().slice(0, 10);

    const goals = [
      { kind: "New Dad Emergency Fund", name: "New Dad Emergency Fund", target_amount: 5000, current_amount: 1750, due_date: due6m, target_date: due6m, status: "active", progress: 0.35, is_completed: false, category: "savings" },
      { kind: "Credit Card Payoff", name: "Credit Card Payoff", target_amount: 12000, current_amount: 2160, due_date: due12m, target_date: due12m, status: "active", progress: 0.18, is_completed: false, category: "debt" },
      { kind: "Baby Budget Planner", name: "Baby Budget Planner", target_amount: 2500, current_amount: 550, due_date: due3m, target_date: due3m, status: "active", progress: 0.22, is_completed: false, category: "planning" },
      { kind: "Car Loan Paydown", name: "Car Loan Paydown", target_amount: 10000, current_amount: 4000, due_date: due12m, target_date: due12m, status: "active", progress: 0.40, is_completed: false, category: "debt" },
      { kind: "Subscription Cleanup", name: "Subscription Cleanup", target_amount: 300, current_amount: 30, due_date: due3m, target_date: due3m, status: "active", progress: 0.10, is_completed: false, category: "savings" }
    ];

    // Upsert by (user_id, kind) — prevents merging with Maya
    for (const g of goals) {
      const { error: goalErr } = await admin.from("goals").upsert(
        { user_id, ...g },
        { onConflict: "user_id,kind" }
      );
      if (goalErr) console.error('Goal upsert error:', goalErr);
    }

    // 4) Insights aligned to Jason (using actual schema: type, title, description, category)
    // First delete old insights for clean slate
    await admin.from("insights").delete().eq("user_id", user_id);
    
    const { error: insErr } = await admin.from("insights").insert([
      { 
        user_id, 
        type: "recommendation", 
        title: "AI Budget Rebalancer", 
        description: "Cut low-value spend and re-allocate to baby fund & emergency fund. Suggested cuts: Dining -$50, Subscriptions -$20.", 
        category: "budgeting",
        is_read: false,
        is_dismissed: false
      },
      { 
        user_id, 
        type: "tip", 
        title: "New Dad Emergency Fund Boost", 
        description: "Set up a $50/week auto-transfer to reach your goal faster. Small, automatic wins add up!", 
        category: "savings",
        is_read: false,
        is_dismissed: false
      },
      { 
        user_id, 
        type: "warning", 
        title: "Subscriptions Overload", 
        description: "You have ~7 active subscriptions. Consider canceling unused ones to save $30+/month.", 
        category: "subscriptions",
        is_read: false,
        is_dismissed: false
      }
    ]);
    if (insErr) console.error('Insights insert error:', insErr);

    // 5) Accounts with provider and external_id - using upsert with conditional unique indexes
    const accounts = [
      { 
        name: "Checking Account", 
        type: "checking", 
        institution: "First Pacific Bank", 
        balance: 3250.00, 
        provider: "First Pacific Bank", 
        external_id: "fpb_chk_001",
        mask: "4521",
        currency: "USD",
        is_active: true
      },
      { 
        name: "Savings Account", 
        type: "savings", 
        institution: "First Pacific Bank", 
        balance: 8420.00, 
        provider: "First Pacific Bank", 
        external_id: "fpb_sav_002",
        mask: "7832",
        currency: "USD",
        is_active: true
      },
      { 
        name: "Credit Card", 
        type: "credit", 
        institution: "Chase", 
        balance: -2840.00, 
        provider: "Chase", 
        external_id: "chase_cc_003",
        mask: "9124",
        currency: "USD",
        is_active: true
      }
    ];

    // Upsert accounts using the conditional unique index (user_id, provider, external_id)
    for (const acc of accounts) {
      const { error: accErr } = await admin.from("accounts").upsert(
        { user_id, ...acc },
        { onConflict: "user_id,provider,external_id" }
      );
      if (accErr) console.error('Account upsert error:', accErr);
    }

    // 6) Report
    const { data: goalsData } = await admin
      .from("goals")
      .select("kind, target_amount, status, due_date, progress")
      .eq("user_id", user_id)
      .order("due_date", { ascending: true });

    const report = {
      user_id,
      email: EMAIL,
      goals: goalsData || [],
      pass: (goalsData?.length || 0) >= 5
    };

    console.log('Seed complete:', report);

    return new Response(JSON.stringify(report), { 
      status: report.pass ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    const error = err as Error;
    console.error('Seed error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
