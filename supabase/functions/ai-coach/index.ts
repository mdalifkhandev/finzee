// POST /ai-coach — sends a financial snapshot to Claude and returns coaching
// insights. Per spec: analysis only, nothing is stored.
// Body: { userQuestion?, spendingSummary?, recentInsights?[] }
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";
import { runAI } from "../_ai.ts";

const SYSTEM = `You are "FinZee", a warm, emotionally intelligent money coach.
Rules:
- Be concise and supportive, no walls of text.
- Use at most ONE emoji.
- Give one clear, specific, actionable next step.
- Reference the user's real numbers when provided.
- Never shame the user; encourage progress.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const body = await req.json().catch(() => ({}));
    const { userQuestion, spendingSummary, recentInsights } = body ?? {};

    // Pull light context (name, recent budget) to personalize — not stored.
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, income_pattern, pain_points")
      .eq("user_id", user.id)
      .maybeSingle();

    const firstName = profile?.first_name || "there";
    const context = [
      `User first name: ${firstName}.`,
      profile?.income_pattern ? `Income pattern: ${profile.income_pattern}.` : "",
      spendingSummary ? `Spending snapshot: ${JSON.stringify(spendingSummary)}.` : "",
      Array.isArray(recentInsights) && recentInsights.length
        ? `Recent insights: ${recentInsights.join("; ")}.`
        : "",
    ].filter(Boolean).join(" ");

    const userPrompt = `${context}\n\nUser question: ${userQuestion || "Give me a helpful check-in on my finances today."}`;

    const result = await runAI({ system: SYSTEM, user: userPrompt, maxTokens: 400 });

    return jsonResponse({
      coachingResponse: result.text,
      model: result.model,
      provider: result.provider,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
