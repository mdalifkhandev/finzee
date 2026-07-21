import { jsonResponse, optionsResponse } from "../_shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const { webhook_type, webhook_code, item_id, new_transactions } = body;

    console.log(`[plaid-webhook] Received ${webhook_type}:${webhook_code} for item ${item_id}`);

    if (webhook_type === "TRANSACTIONS") {
      console.log(`[plaid-webhook] Transactions update available. New transactions: ${new_transactions}`);
      // In a fully integrated environment, we would query the plaid api here for the new transactions
      // using the access_token associated with the item_id, and then insert them into the transactions table.
    }

    // Always respond 200 OK to Plaid to acknowledge receipt
    return jsonResponse({ success: true, message: "Webhook received" });
  } catch (err) {
    console.error("[plaid-webhook] Error processing webhook:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

// getEnv is imported for parity with sibling functions; referenced to avoid lint noise.
void undefined;
