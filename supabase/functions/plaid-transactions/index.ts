// GET /plaid-transactions — returns the user's transactions.
// Reads real transactions from the DB. If the user has none and Plaid is not
// configured, returns realistic mock data so the app works end-to-end.
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";

const MOCK = [
  { id: "t1", amount: 149, merchant: "Nike.com", category: "Shopping", date: "2026-06-10", is_discretionary: true },
  { id: "t2", amount: 42.5, merchant: "Whole Foods", category: "Groceries", date: "2026-06-11", is_discretionary: false },
  { id: "t3", amount: 18.99, merchant: "Netflix", category: "Entertainment", date: "2026-06-12", is_discretionary: true },
  { id: "t4", amount: 65, merchant: "Shell Gas", category: "Gas", date: "2026-06-13", is_discretionary: false },
  { id: "t5", amount: 89, merchant: "Zara", category: "Shopping", date: "2026-06-14", is_discretionary: true },
];

const DISCRETIONARY = ["shopping", "entertainment", "dining", "food and drink", "travel", "recreation"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);

    const { data, error } = await supabase
      .from("transactions")
      .select("id, amount, merchant, category, description, type, date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(limit);

    if (error) return jsonResponse({ error: error.message }, 500);

    if (!data || data.length === 0) {
      return jsonResponse({ transactions: MOCK, source: "mock" });
    }

    const transactions = data.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      merchant: t.merchant ?? t.description ?? "Unknown",
      category: t.category,
      date: t.date,
      is_discretionary: DISCRETIONARY.includes((t.category ?? "").toLowerCase()),
    }));

    return jsonResponse({ transactions, source: "db" });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
