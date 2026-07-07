import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL = "ava@finzee.demo";
const PASSWORD = "Demo123!$";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sbAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    console.log("Starting Ava demo seed...");

    // 1) Ensure auth user exists
    const { data: list } = await sbAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = list?.users?.find((u) => u.email === EMAIL);
    
    if (!user) {
      console.log("Creating new Ava user...");
      const { data: created, error: createErr } = await sbAdmin.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
      });
      if (createErr) {
        console.error("Error creating user:", createErr);
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      user = created.user!;
    }
    
    const user_id = user!.id;
    console.log("User ID:", user_id);

    // 2) Profile - Gen-Z college student + content creator
    const { error: profileErr } = await sbAdmin.from("profiles").upsert({
      user_id,
      first_name: "Ava",
      last_name: "Nguyen",
      age: 21,
      bio: "College senior (CS) + part-time content creator in Austin. Needs simple, automatic money moves that fit school and side gigs—no jargon.",
      avatar_url: "/demo/ava-avatar.png",
      tags: ["gen-z", "student", "content-creator", "credit-hygiene", "exam-cycles"],
      income_pattern: "irregular_freelance",
      pain_points: ["misaligned-paydays", "impulse-delivery", "overdraft-risk", "credit-utilization"],
      goals: ["emergency-1k-90d", "credit-+52-6m", "study-abroad-3k-8m"],
    }, { onConflict: "user_id" });
    
    if (profileErr) console.error("Profile error:", profileErr);

    // 3) User preferences - friendly tone for Gen-Z
    const { error: prefsErr } = await sbAdmin.from("user_prefs").upsert({
      user_id,
      tone: "friendly",
      emoji: "low",
      voice: "alloy",
      nudges: true,
    }, { onConflict: "user_id" });
    
    if (prefsErr) console.error("Prefs error:", prefsErr);

    // 4) Accounts - simple checking account
    const { data: upsertedAcc, error: accErr } = await sbAdmin.from("accounts").upsert({
      user_id,
      name: "First Pacific Checking",
      type: "checking",
      provider: "First Pacific Bank",
      external_id: "fpb_ava_001",
      mask: "9876",
      balance: 1200.00,
      is_active: true,
      currency: "USD",
      icon: "🏦",
      color: "#10B981",
    }, { onConflict: "user_id,provider,external_id" }).select("id").single();
    
    if (accErr) console.error("Account error:", accErr);
    const accountId = upsertedAcc?.id || null;

    // 5) Budgets for current month
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthDate = monthStart.toISOString().slice(0, 10);

    const budgets = [
      { user_id, month: monthDate, category: "Rent", limit_amount: 850, spent_amount: 0, period: "monthly" },
      { user_id, month: monthDate, category: "Groceries", limit_amount: 220, spent_amount: 0, period: "monthly" },
      { user_id, month: monthDate, category: "Eating Out", limit_amount: 120, spent_amount: 0, period: "monthly" },
      { user_id, month: monthDate, category: "Transport", limit_amount: 70, spent_amount: 0, period: "monthly" },
      { user_id, month: monthDate, category: "Subscriptions", limit_amount: 84, spent_amount: 0, period: "monthly" },
      { user_id, month: monthDate, category: "Phone", limit_amount: 55, spent_amount: 0, period: "monthly" },
    ];

    for (const budget of budgets) {
      const { error: budgetErr } = await sbAdmin.from("budgets").upsert(budget, { onConflict: "user_id,month,category" });
      if (budgetErr) console.error("Budget error:", budgetErr);
    }

    // 6) Seed transactions - aligned to Ava's spend patterns + irregular income
    // Clear existing transactions first
    await sbAdmin.from("transactions").delete().eq("user_id", user_id);

    const transactions: any[] = [];

    const addTx = (amount: number, merchant: string, cat: string, d: Date, isRecurring = false, description?: string) => {
      transactions.push({
        user_id,
        account_id: accountId,
        amount: +amount.toFixed(2),
        merchant,
        categories: [cat],
        ts: d.toISOString(),
        type: amount > 0 ? "income" : "expense",
        is_recurring: isRecurring,
        description: description || null,
      });
    };

    // Income - Creator payouts (~$600/mo in 3 drops)
    for (let i = 0; i < 3; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 3 + i * 9, 15, 0));
      addTx(200, "Creator Payout", "Income", d, true);
    }

    // Income - Campus IT job (~$1500/mo, biweekly but misaligned)
    for (let i = 0; i < 2; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 5 + i * 14, 9, 0));
      addTx(750, "Campus IT Payroll", "Income", d, true);
    }

    // Rent share (1st of month)
    addTx(-850, "Apartment Rent Split", "Rent", new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 8)), true);

    // Groceries (3-4 trips to HEB)
    [6, 14, 22].forEach((day) => {
      const amount = -70 - Math.random() * 20;
      addTx(amount, "HEB", "Groceries", new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, 18)));
    });

    // Eating out / delivery (impulse during exams)
    [10, 17, 24].forEach((day) => {
      const amount = -18 - Math.random() * 12;
      addTx(amount, "DoorDash", "Eating Out", new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, 21)), false, "exam week micro-splurge");
    });

    // Transport - rideshares
    [4, 12, 20, 28].forEach((day) => {
      if (day <= now.getUTCDate()) {
        const amount = -8 - Math.random() * 10;
        addTx(amount, "Uber", "Transport", new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, 19)));
      }
    });

    // Subscriptions (Spotify, Netflix, iCloud, Notion, Adobe Student = ~$84)
    const subDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 9, 7));
    const subs: [string, number][] = [
      ["Spotify", -5.99],
      ["Netflix", -7.99],
      ["iCloud", -2.99],
      ["Notion", -4.00],
      ["Adobe Creative Cloud", -63.99],
    ];
    subs.forEach(([merchant, amount]) => {
      addTx(amount, merchant, "Subscriptions", subDate, true);
    });

    // Phone (family plan share)
    addTx(-55, "T-Mobile Family", "Phone", new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15, 8)), true);

    // Insert all transactions
    const { error: txErr } = await sbAdmin.from("transactions").insert(transactions);
    if (txErr) console.error("Transaction insert error:", txErr);

    // Backfill budget spent_amount from MTD transactions
    const { data: txMTD = [] } = await sbAdmin
      .from("transactions")
      .select("amount, categories, ts")
      .eq("user_id", user_id)
      .gte("ts", monthStart.toISOString());

    const spentByCat: Record<string, number> = {};
    for (const t of txMTD as any[]) {
      if (t.amount < 0) {
        const cat = (t.categories?.[0] || "").toLowerCase().replace(" ", "_");
        spentByCat[cat] = (spentByCat[cat] || 0) + Math.abs(t.amount);
      }
    }

    // Update budgets with actual spent amounts
    const budgetUpdates = [
      { user_id, month: monthDate, category: "Rent", spent_amount: Math.round((spentByCat["rent"] || 0) * 100) / 100 },
      { user_id, month: monthDate, category: "Groceries", spent_amount: Math.round((spentByCat["groceries"] || 0) * 100) / 100 },
      { user_id, month: monthDate, category: "Eating Out", spent_amount: Math.round((spentByCat["eating_out"] || spentByCat["eating out"] || 0) * 100) / 100 },
      { user_id, month: monthDate, category: "Transport", spent_amount: Math.round((spentByCat["transport"] || 0) * 100) / 100 },
      { user_id, month: monthDate, category: "Subscriptions", spent_amount: Math.round((spentByCat["subscriptions"] || 0) * 100) / 100 },
      { user_id, month: monthDate, category: "Phone", spent_amount: Math.round((spentByCat["phone"] || 0) * 100) / 100 },
    ];

    for (const update of budgetUpdates) {
      await sbAdmin.from("budgets").upsert(update, { onConflict: "user_id,month,category" });
    }

    // 7) Goals - aligned to Ava's persona
    const due90 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 3, 28)).toISOString().slice(0, 10);
    const due6m = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 6, 28)).toISOString().slice(0, 10);
    const due8m = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 8, 28)).toISOString().slice(0, 10);

    // Clear existing goals
    await sbAdmin.from("goals").delete().eq("user_id", user_id);

    const goals = [
      {
        user_id,
        name: "Emergency Fund",
        kind: "emergency",
        target_amount: 1000,
        current_amount: 120,
        due_date: due90,
        status: "active",
        progress: 0.12,
        icon: "🛡️",
        color: "#10B981",
      },
      {
        user_id,
        name: "Credit Score +52",
        kind: "credit",
        target_amount: 52,
        current_amount: 4,
        due_date: due6m,
        status: "active",
        progress: 0.08,
        icon: "📈",
        color: "#6366F1",
      },
      {
        user_id,
        name: "Study Abroad Fund",
        kind: "savings",
        target_amount: 3000,
        current_amount: 120,
        due_date: due8m,
        status: "active",
        progress: 0.04,
        icon: "✈️",
        color: "#F59E0B",
      },
    ];

    for (const goal of goals) {
      const { error: goalErr } = await sbAdmin.from("goals").upsert(goal, { onConflict: "user_id,kind" });
      if (goalErr) console.error("Goal error:", goalErr);
    }

    // 8) Insights - aligned to Ava's needs
    // Clear existing insights
    await sbAdmin.from("insights").delete().eq("user_id", user_id);

    const insights = [
      {
        user_id,
        type: "recommendation",
        title: "Auto-save after each deposit",
        description: "Set up a 5% skim-to-save rule after each Creator Payout or paycheck. This builds your emergency fund without thinking about it.",
        category: "Savings",
        is_read: false,
        is_dismissed: false,
      },
      {
        user_id,
        type: "warning",
        title: "Credit utilization reminder",
        description: "Your statement closes in 5 days. Keep utilization under 30% to boost your credit score. You're at 42% right now.",
        category: "Credit",
        is_read: false,
        is_dismissed: false,
      },
      {
        user_id,
        type: "tip",
        title: "Exam week spending alert",
        description: "You typically spend $50+ extra on delivery during exams. Try prepping meals this weekend to stay on track.",
        category: "Spending",
        is_read: false,
        is_dismissed: false,
      },
      {
        user_id,
        type: "tip",
        title: "Student perks nearby",
        description: "HEB and Chipotle near campus offer 10-15% student discounts. Flash your ID to save!",
        category: "Deals",
        is_read: false,
        is_dismissed: false,
      },
      {
        user_id,
        type: "achievement",
        title: "Great job on rent!",
        description: "You've paid rent on time for 3 months straight. This consistency helps your credit history.",
        category: "Housing",
        is_read: false,
        is_dismissed: false,
      },
    ];

    const { error: insightErr } = await sbAdmin.from("insights").insert(insights);
    if (insightErr) console.error("Insight error:", insightErr);

    // 9) Self-check counts
    const [bc, tc, gc] = await Promise.all([
      sbAdmin.from("budgets").select("id", { count: "exact", head: true }).eq("user_id", user_id).eq("month", monthDate),
      sbAdmin.from("transactions").select("id", { count: "exact", head: true }).eq("user_id", user_id).gte("ts", monthStart.toISOString()),
      sbAdmin.from("goals").select("id", { count: "exact", head: true }).eq("user_id", user_id),
    ]);

    const result = {
      success: true,
      email: EMAIL,
      user_id,
      counts: {
        budgets: bc.count || 0,
        tx_mtd: tc.count || 0,
        goals: gc.count || 0,
      },
      pass: (bc.count || 0) >= 6 && (tc.count || 0) >= 10 && (gc.count || 0) >= 3,
    };

    console.log("Ava seed complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
