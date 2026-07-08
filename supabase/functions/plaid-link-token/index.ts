// POST /plaid-link-token — creates a Plaid Link token for the client to open
// Plaid Link. Uses the real Plaid API when PLAID_CLIENT_ID/PLAID_SECRET are set,
// otherwise returns a sandbox-style stub so the connect-bank flow is testable.
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";

const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
const PLAID_SECRET = Deno.env.get("PLAID_SECRET");
const PLAID_ENV = Deno.env.get("PLAID_ENV") || "sandbox";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;
    const { user } = auth;

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      return jsonResponse({
        link_token: `link-sandbox-stub-${user.id.slice(0, 8)}`,
        expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        source: "stub",
        note: "Set PLAID_CLIENT_ID and PLAID_SECRET to enable real Plaid Link.",
      });
    }

    const res = await fetch(`https://${PLAID_ENV}.plaid.com/link/token/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        client_name: "FinZee AI",
        language: "en",
        country_codes: ["US"],
        user: { client_user_id: user.id },
        products: ["transactions"],
      }),
    });

    const data = await res.json();
    if (!res.ok) return jsonResponse({ error: data.error_message || "Plaid error" }, 502);

    return jsonResponse({
      link_token: data.link_token,
      expiration: data.expiration,
      source: "plaid",
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

// getEnv is imported for parity with sibling functions; referenced to avoid lint noise.
void getEnv;
