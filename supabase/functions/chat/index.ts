import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const CHAT_MODEL = Deno.env.get('OPENAI_CHAT_MODEL') || 'gpt-4o';
const FALLBACK = Deno.env.get('OPENAI_FALLBACK_MODEL') || 'gpt-4o';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const SYSTEM_PROMPT = `You are "FinZee", a personalized, emotionally intelligent money coach.

CORE RULES:
1. Greet by first name ONCE at the start (e.g., "Hey Jason," or "Hi Maya,")
2. Use ONE emoji max per response
3. Be concise and supportive—no walls of text
4. Match "tone" preference: calm (soft, measured), friendly (warm, casual), hype (energetic)
5. Use only the provided user data/context to answer. Do not invent facts.
6. If the user asks something outside the available data, say what you can see and what is missing.
7. Never answer with mock/example values.

INCOME PATTERN RULES:

If persona.income_pattern == "salary" (e.g., Jason):
- Prioritize budget rebalancing and bill planning
- Focus on new-baby prep and family financial goals
- Suggest automated contributions timed with payday
- Emphasize predictable monthly progress metrics
- Celebrate debt paydown wins

If persona.income_pattern == "irregular_freelance" (e.g., Maya, Ava):
- Prioritize cash-flow smoothing with weekly sweeps
- Recommend percentage-based buckets: 60% needs, 20% taxes, 10% goals, 10% fun
- Include quarterly tax set-asides with gentle reminders
- Suggest a monthly "floor" (minimum needed) + buffer strategy
- Help smooth irregular income timing

PAIN POINTS RULES:

If persona.pain_points includes "subscriptions":
- Flag subscription bloat, suggest specific cuts
- Celebrate every subscription canceled

If persona.pain_points includes "financial-confusion":
- Lead with clarity—one clear next step
- Avoid jargon; use plain numbers

If persona.pain_points includes "baby-planning":
- Acknowledge excitement and stress of baby prep
- Prioritize baby-related goals with warmth

If persona.pain_points includes "impulse-delivery":
- Gently flag delivery spending during stress periods
- Suggest alternatives: "Swapping 2 DoorDash orders = $30 toward your goal"

If persona.pain_points includes "overdraft-risk":
- Mention overdraft guardrails and buffer amounts
- Alert when balance dips near danger zone

If persona.pain_points includes "credit-utilization":
- Remind about statement close dates and <30% target
- Celebrate on-time payments

PERSONA-SPECIFIC RULES:

If persona.name == "Jason" (new dad, salary):
- Focus on New Dad Emergency Fund, credit card payoff, baby budget
- Practical tone with gentle encouragement
- Reference specific goals by name and progress

If persona.name == "Maya" (freelancer):
- Focus on cash-flow smoothing, tax savings, irregular income buffer
- Reference invoice wins and quarterly tax deadlines
- Suggest business expense tracking

If persona.name == "Ava" (Gen-Z student/creator):
- ALWAYS use no-jargon, plain language
- Keep responses SHORT: 2-3 bullets max + 2 actions
- Mention: overdraft guardrails, skim-to-save, exam-week nudges, credit hygiene
- Reference campus life, student discounts, content creation
- Use casual Gen-Z tone sparingly

STABLECOIN SAVER (BETA) — REFERENCE NATURALLY WHEN RELEVANT:
The app has a "Stablecoin Saver" feature (Beta, demo mode) that lets users park idle cash in a USD-pegged stablecoin (USDC). It is NOT crypto trading or speculation — position it as modern financial infrastructure.
- Mention it when discussing: savings goals, emergency buffers, irregular income smoothing, or globally accessible savings.
- Jason: frame as "flexibility + emergency buffer — keep part of your savings instantly accessible."
- Maya: frame as "cash-flow smoothing — bridge gaps between invoices with a stable digital dollar."
- Ava: frame as "safe, optional savings with guardrails — low-risk way to let money work for you."
- Example phrasing: "If you'd like, we can route part of your savings through the Stablecoin Saver for faster, more flexible access."
- Always note: "Stablecoins are not FDIC insured" when recommending.
- Tone: educational, calm, non-speculative. Never frame as investment or trading.

GOALS PRIORITY ORDER:
1. Emergency Fund (safety first)
2. High-interest debt payoff
3. Essential upcoming expenses
4. Lower-interest debt
5. Lifestyle optimization

RESPONSE FORMAT:
- One-line empathic reflection
- 2-3 bullets with crisp numbers
- 1-2 short actions for next 7 days
- Brief motivating close (one emoji max)
 - Keep every number tied to the provided user data.

EXAMPLES:

USER (Jason, salary, baby-planning):
Q: "How am I doing on my goals?"
A: "Hey Jason, you're making steady progress—new baby prep is no joke!

• New Dad Emergency Fund: $1,750 of $5,000 (35%)—on track for July.
• Credit Card Payoff: $2,160 down, $9,840 to go.
• Baby Budget: $550 saved toward nursery essentials.

Actions: (1) Set up a $50/week auto-transfer to your emergency fund. (2) Check Insights for that streaming sub you haven't used.

You've got this! 💪"

USER (Maya, irregular_freelance):
Q: "How's my spending?"
A: "Hey Maya, solid month—let's keep building that buffer.

• Income: $4,500 (nice invoice!)—set aside ~$1,125 for quarterly taxes.
• Spending $1,847 vs your $2,700 floor—you're $853 under.
• Tax savings bucket: $2,340 (on track for Q2).

Actions: (1) Tag coworking receipts as 'business'—potential write-off. (2) Move $200 to your buffer while cash is good.

Building smart! 💪"

USER (Ava, irregular_freelance, Gen-Z):
Q: "Where did my money go?"
A: "Hey Ava, let's break it down real quick!

• DoorDash: $89 (exam week vibes)—$30 over usual.
• Credit at 42%—statement closes in 5 days, pay down $50 to hit <30%.

Actions: (1) Set up skim-to-save: 5% auto-moves after your next payout. (2) Grab that HEB 10% student discount.

Small moves add up! ✨"`;


async function fetchUserContext(authHeader: string): Promise<Record<string, unknown> | null> {
  try {
    // Use ai-user-context for optimized persona + financial context
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-user-context`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'apikey': SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch ai-user-context:', response.status);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching ai-user-context:', err);
    return null;
  }
}

async function fetchFallbackUserContext(supabase: ReturnType<typeof createClient>, userId: string) {
  try {
    const [profileRes, prefsRes, accountsRes, goalsRes, budgetsRes, pauseRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("user_prefs")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true),
      supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .order("target_date", { ascending: true }),
      supabase
        .from("budgets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("pause_list_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const profile = profileRes.data ?? null;
    const prefs = prefsRes.data ?? null;
    const accounts = accountsRes.data ?? [];
    const goals = goalsRes.data ?? [];
    const budgets = budgetsRes.data ?? [];
    const pauseItems = pauseRes.data ?? [];
    const activeGoals = goals.filter((goal: any) => goal.is_completed !== true && goal.status !== "completed");
    const pendingPauseItems = pauseItems.filter((item: any) => item.status === "pending");
    const skippedPauseItems = pauseItems.filter((item: any) => item.status === "skipped");
    const boughtPauseItems = pauseItems.filter((item: any) => item.status === "bought");

    const totalBalance = accounts.reduce((sum: number, account: any) => sum + Number(account.balance || 0), 0);
    const totalGoalTarget = goals.reduce((sum: number, goal: any) => sum + Number(goal.target_amount || 0), 0);
    const totalGoalProgress = goals.reduce((sum: number, goal: any) => sum + Number(goal.current_amount || 0), 0);

    return {
      user_id: userId,
      profile: profile ? {
        first_name: profile.first_name ?? null,
        income_pattern: profile.income_pattern ?? null,
        pain_points: profile.pain_points ?? [],
        goals: profile.goals ?? [],
        preferred_language: profile.preferred_language ?? null,
      } : null,
      prefs: prefs ? {
        tone: prefs.tone || "calm",
        emoji: prefs.emoji || "low",
        nudges: prefs.nudges ?? true,
      } : { tone: "calm", emoji: "low", nudges: true },
      financial_summary: {
        total_balance: +Number(totalBalance).toFixed(2),
        accounts_count: accounts.length,
        active_goals_count: activeGoals.length,
        goals_progress_pct: totalGoalTarget > 0 ? +((totalGoalProgress / totalGoalTarget) * 100).toFixed(1) : 0,
        budget_utilization_pct: 0,
      },
      goals: goals.map((goal: any) => ({
        name: goal.name,
        kind: goal.kind ?? goal.name ?? null,
        category: goal.category ?? null,
        current_amount: Number(goal.current_amount || 0),
        target_amount: Number(goal.target_amount || 0),
        progress_pct: Number(goal.target_amount || 0) > 0
          ? +((Number(goal.current_amount || 0) / Number(goal.target_amount || 0)) * 100).toFixed(1)
          : 0,
        due_date: goal.target_date ?? goal.due_date ?? null,
        status: goal.status ?? (goal.is_completed ? "completed" : "active"),
      })),
      active_goals: activeGoals.map((goal: any) => ({
        name: goal.name,
        kind: goal.kind ?? goal.name ?? null,
        category: goal.category ?? null,
        current_amount: Number(goal.current_amount || 0),
        target_amount: Number(goal.target_amount || 0),
        progress_pct: Number(goal.target_amount || 0) > 0
          ? +((Number(goal.current_amount || 0) / Number(goal.target_amount || 0)) * 100).toFixed(1)
          : 0,
        due_date: goal.target_date ?? goal.due_date ?? null,
        status: goal.status ?? (goal.is_completed ? "completed" : "active"),
      })),
      pause_summary: {
        total: pauseItems.length,
        pending: pendingPauseItems.length,
        skipped: skippedPauseItems.length,
        bought: boughtPauseItems.length,
        currently_held: pendingPauseItems.reduce((sum: number, item: any) => sum + Number(item.price || 0), 0),
        total_saved: skippedPauseItems.reduce((sum: number, item: any) => sum + Number(item.price || 0), 0),
      },
      pause_items: pauseItems.map((item: any) => ({
        item_name: item.item_name,
        price: Number(item.price || 0),
        category: item.category ?? null,
        reason: item.reason ?? null,
        status: item.status ?? "pending",
        reminder_due_at: item.reminder_due_at ?? null,
      })),
      budgets: budgets.map((budget: any) => ({
        category: budget.category ?? null,
        spent: Number(budget.spent_amount ?? budget.spent ?? 0),
        limit: Number(budget.limit_amount ?? budget.amount ?? 0),
        pct: Number(budget.limit_amount ?? budget.amount ?? 0) > 0
          ? +((Number(budget.spent_amount ?? budget.spent ?? 0) / Number(budget.limit_amount ?? budget.amount ?? 0)) * 100).toFixed(1)
          : 0,
      })),
    };
  } catch (error) {
    console.error("Fallback context build failed:", error);
    return null;
  }
}

function buildIntentHint(message: string) {
  const text = message.toLowerCase();
  if (/(pause list|paused|pause|hold|impulse|buy this|should i buy|should i pause|how many pause|how many held)/i.test(text)) {
    return "pause";
  }
  if (/(goal|goals|house|home|savings|save)/i.test(text)) {
    return "goal";
  }
  return "general";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function buildFallbackReply(message: string, userContext: Record<string, unknown> | null) {
  const goals = Array.isArray(userContext?.goals) ? userContext.goals as Record<string, unknown>[] : [];
  const activeGoals = Array.isArray(userContext?.active_goals) ? userContext.active_goals as Record<string, unknown>[] : goals;
  const allGoals = activeGoals.length ? activeGoals : goals;
  const pauseSummary = userContext?.pause_summary as Record<string, unknown> | undefined;
  const pauseItems = Array.isArray(userContext?.pause_items) ? userContext.pause_items as Record<string, unknown>[] : [];
  const normalizedMessage = message.toLowerCase();
  const profile = userContext?.profile as Record<string, unknown> | null;
  const userName = String(profile?.first_name ?? "there");
  const financialSummary = userContext?.financial_summary as Record<string, unknown> | undefined;

  if (/(pause list|paused|pause|hold|impulse|buy this|should i buy|should i pause|how many pause|how many held)/i.test(normalizedMessage)) {
    const total = Number(pauseSummary?.total ?? pauseItems.length ?? 0);
    const pending = Number(pauseSummary?.pending ?? pauseItems.filter((item) => item.status === "pending").length ?? 0);
    const held = Number(pauseSummary?.currently_held ?? pauseItems.filter((item) => item.status === "pending").reduce((sum, item) => sum + Number(item.price ?? 0), 0) ?? 0);
    const saved = Number(pauseSummary?.total_saved ?? pauseItems.filter((item) => item.status === "skipped").reduce((sum, item) => sum + Number(item.price ?? 0), 0) ?? 0);

    return [
      `You have ${pending} item${pending === 1 ? "" : "s"} currently on your Pause List.`,
      `• Total pause items: ${total}.`,
      `• Currently held: ${formatCurrency(held)}.`,
      `• Saved so far: ${formatCurrency(saved)}.`,
      `Ask me about a specific item and I’ll help you decide what to do next.`,
    ].join("\n");
  }

  const houseGoal = allGoals.find((goal) => {
    const name = String(goal.name ?? "").toLowerCase();
    const category = String(goal.category ?? "").toLowerCase();
    const kind = String(goal.kind ?? "").toLowerCase();
    return name.includes("house") || name.includes("home") || category.includes("house") || category.includes("home") || kind.includes("house") || kind.includes("home");
  }) || allGoals[0];

  if (houseGoal && /(house|home|goal)/i.test(normalizedMessage)) {
    const current = Number(houseGoal.current_amount ?? 0);
    const target = Number(houseGoal.target_amount ?? 0);
    const remaining = Math.max(target - current, 0);
    const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
    const status = remaining <= 0 ? "You’ve already hit it 🎉" : `You’re ${pct}% there.`;
    return [
      `You're on the right track with your house goal.`,
      `• ${houseGoal.name}: ${formatCurrency(current)} of ${formatCurrency(target)} (${pct}%).`,
      `• Remaining: ${formatCurrency(remaining)}.`,
      `• Next step: keep automating small transfers each week.`,
      status,
    ].join("\n");
  }

  if (financialSummary) {
    const balance = Number(financialSummary.total_balance ?? 0);
    const accounts = Number(financialSummary.accounts_count ?? 0);
    const activeGoalsCount = Number(financialSummary.active_goals_count ?? 0);
    return [
      `Hi ${userName}, I can see your current financial snapshot.`,
      `• Balance tracked: ${formatCurrency(balance)} across ${accounts} account${accounts === 1 ? "" : "s"}.`,
      `• Active goals: ${activeGoalsCount}.`,
      `• Pause items: ${Number(pauseSummary?.total ?? pauseItems.length ?? 0)}.`,
      `Ask me about your house goal, pause list, or spending and I’ll answer from your data.`,
    ].join("\n");
  }

  if (/(goal|goals|savings|save)/i.test(normalizedMessage) && allGoals.length > 0) {
    const goalLines = allGoals.slice(0, 3).map((goal) => {
      const current = Number(goal.current_amount ?? 0);
      const target = Number(goal.target_amount ?? 0);
      const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
      return `• ${goal.name}: ${formatCurrency(current)} of ${formatCurrency(target)} (${pct}%).`;
    });
    return [
      `You do have active goals I can see.`,
      ...goalLines,
      `• Best move: keep funding the highest-priority goal first.`,
      `You're building real momentum 💪`,
    ].join("\n");
  }

  if (allGoals.length > 0) {
    const goalLines = allGoals.slice(0, 2).map((goal) => {
      const current = Number(goal.current_amount ?? 0);
      const target = Number(goal.target_amount ?? 0);
      const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
      return `• ${goal.name}: ${pct}% complete.`;
    });
    return [
      `I can see your goals, but I need a more specific question to give the best answer.`,
      ...goalLines,
      `Try asking: "Am I on track for my house goal?" or "How far am I from my biggest goal?"`,
    ].join("\n");
  }

  return "I don't see enough connected data yet to personalize this fully. Link a bank or add a goal, and I can get much more specific.";
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { message, context: providedContext } = await req.json();
    
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Bad request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Chat request from user ${user.id}: ${message.substring(0, 100)}...`);

    // Fetch user financial context from dashboard-summary
    let userContext = await fetchUserContext(authHeader);
    if (!userContext) {
      console.warn(`Chat request ${user.id}: ai-user-context unavailable, using fallback DB context.`);
      userContext = await fetchFallbackUserContext(supabase, user.id);
    }

    const financialSummary = userContext?.financial_summary as Record<string, number> | undefined;
    const goals = Array.isArray(userContext?.goals) ? userContext.goals : [];
    const budgets = Array.isArray(userContext?.budgets) ? userContext.budgets : [];
    const pauseSummary = userContext?.pause_summary as Record<string, number> | undefined;
    const hasAnyContext =
      Boolean(userContext) &&
      (
        (financialSummary?.accounts_count ?? 0) > 0 ||
        goals.length > 0 ||
        budgets.length > 0 ||
        (pauseSummary?.total ?? 0) > 0
      );

    // If we truly have no usable context, return a gentle nudge.
    if (!hasAnyContext) {
      return new Response(JSON.stringify({
        text: "I don't see enough connected data yet to personalize this fully. Link a bank or add a goal, and I can get much more specific."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build persona from ai-user-context response
    const profile = userContext?.profile as Record<string, unknown> | null;
    const prefs = userContext?.prefs as Record<string, unknown> | null;
    
    const preferredLanguage = profile?.preferred_language as string | null;
    
    const persona = {
      name: profile?.first_name || "there",
      tone: prefs?.tone || "calm",
      emoji: prefs?.emoji || "low",
      nudges: prefs?.nudges ?? true,
      income_pattern: profile?.income_pattern || null,
      pain_points: profile?.pain_points || [],
      goals: profile?.goals || [],
      preferred_language: preferredLanguage
    };

    const intent = buildIntentHint(message);

    // Build language instruction if preferred_language is set
    const languageInstruction = preferredLanguage 
      ? `\n\nLANGUAGE: Respond in ${preferredLanguage}. Keep financial terms clear and universally understood (e.g., "budget", "savings", "income"). If a term has no clear translation, use the English term with a brief explanation.`
      : '';

    const payload = {
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + languageInstruction },
        ...(Array.isArray(providedContext?.messages) ? providedContext.messages : []),
        { 
          role: 'user', 
          content: `Intent: ${intent}\nPersona: ${JSON.stringify(persona)}\nData: ${JSON.stringify(userContext)}\nQuestion: ${message}` 
        }
      ],
      temperature: 0.2
    };

    let text: string;
    let usage: unknown;
    let fallback = false;

    try {
      if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY not configured");
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      text = (data.choices?.[0]?.message?.content ?? '').trim();
      usage = data.usage;
    } catch (err) {
      console.log(`Primary model failed, trying fallback ${FALLBACK}...`, err);
      fallback = true;
      try {
        if (OPENAI_API_KEY) {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...payload, model: FALLBACK }),
          });

          if (response.ok) {
            const data = await response.json();
            text = (data.choices?.[0]?.message?.content ?? '').trim();
            usage = data.usage;
          }
        }
      } catch (fallbackErr) {
        console.warn("Fallback model failed, using deterministic reply:", fallbackErr);
      }
    }

    if (!text) {
      text = buildFallbackReply(message, userContext);
    }

    if (!/[\w]/.test(text)) {
      text = buildFallbackReply(message, userContext);
    }

    // Save messages to database
    const { error: saveUserError } = await supabase
      .from('messages')
      .insert({ user_id: user.id, role: 'user', content: message });

    if (saveUserError) {
      console.error('Error saving user message:', saveUserError);
    }

    const { error: saveAssistantError } = await supabase
      .from('messages')
      .insert({ user_id: user.id, role: 'assistant', content: text });

    if (saveAssistantError) {
      console.error('Error saving assistant message:', saveAssistantError);
    }

    console.log(`Response generated, fallback: ${fallback}, tokens: ${(usage as any)?.total_tokens}`);

    return new Response(JSON.stringify({ text, usage, fallback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
