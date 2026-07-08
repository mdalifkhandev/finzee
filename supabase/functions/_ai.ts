// Shared LLM helper for the AI Coach endpoints.
//
// The product spec calls for Claude ("Claude analysis only, no data stored").
// We use Anthropic's Claude when ANTHROPIC_API_KEY is configured, and fall back
// to the project's existing OpenAI key when it is not — so the endpoints keep
// working in every environment. No prompt or response is ever persisted here.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_CHAT_MODEL") || "gpt-4o";

export interface AIResult {
  text: string;
  model: string;
  provider: "anthropic" | "openai";
}

export interface AIOptions {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

async function callAnthropic(opts: AIOptions): Promise<AIResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: opts.maxTokens ?? 512,
      temperature: opts.temperature ?? 0.7,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.content?.[0]?.text?.trim() || "";
  return { text, model: ANTHROPIC_MODEL, provider: "anthropic" };
}

async function callOpenAI(opts: AIOptions): Promise<AIResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 512,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim() || "";
  return { text, model: OPENAI_MODEL, provider: "openai" };
}

// Runs the completion against Claude, falling back to OpenAI. Throws only if
// neither provider is configured or both fail.
export async function runAI(opts: AIOptions): Promise<AIResult> {
  if (ANTHROPIC_API_KEY) {
    try {
      return await callAnthropic(opts);
    } catch (err) {
      if (!OPENAI_API_KEY) throw err;
      console.warn("Anthropic failed, falling back to OpenAI:", err instanceof Error ? err.message : err);
    }
  }
  if (OPENAI_API_KEY) return await callOpenAI(opts);
  throw new Error("No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.");
}

// Best-effort JSON extraction for endpoints that ask the model for JSON.
export function extractJSON<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
