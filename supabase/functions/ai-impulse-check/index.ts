// POST /ai-impulse-check — sends a proposed purchase to Claude and returns a
// short intervention message + a recommendation. Analysis only, nothing stored.
// Body: { itemName, price, category?, reason?, budgetRemaining? }
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";
import { runAI, extractJSON } from "../_ai.ts";

const SYSTEM = `You are FinZee, a supportive money coach helping someone pause before an impulse purchase.
Given a proposed purchase, respond ONLY with minified JSON:
{"message": string, "recommendation": "pause" | "buy" | "skip", "reflection_question": string}
- message: 1-2 warm sentences, no shame, at most one emoji.
- recommendation: "pause" for a 24hr wait if it seems impulsive, "skip" if clearly wasteful, "buy" if reasonable/needed.
- reflection_question: one short question to help them decide.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;

    const body = await req.json().catch(() => ({}));
    const { itemName, price, category, reason, budgetRemaining } = body ?? {};
    if (!itemName) return jsonResponse({ error: "itemName is required" }, 400);

    const userPrompt = [
      `Item: ${itemName}`,
      price !== undefined ? `Price: $${price}` : "",
      category ? `Category: ${category}` : "",
      reason ? `Their stated reason: ${reason}` : "",
      budgetRemaining !== undefined ? `Discretionary budget remaining: $${budgetRemaining}` : "",
    ].filter(Boolean).join("\n");

    const result = await runAI({ system: SYSTEM, user: userPrompt, maxTokens: 300, temperature: 0.6 });
    const parsed = extractJSON<{ message: string; recommendation: string; reflection_question: string }>(result.text);

    return jsonResponse({
      message: parsed?.message ?? result.text,
      recommendation: parsed?.recommendation ?? "pause",
      reflection_question: parsed?.reflection_question ?? "Will this still matter to you in a week?",
      model: result.model,
      provider: result.provider,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
