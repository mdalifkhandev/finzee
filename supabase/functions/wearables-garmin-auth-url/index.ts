// GET /wearables-garmin-auth-url — returns the Garmin OAuth authorization URL
// for the client to open. Garmin uses OAuth 1.0a; when consumer keys are not
// configured we return a stub URL so the connect-wearable flow is testable.
import { jsonResponse, optionsResponse, requireUser } from "../_shared.ts";

const GARMIN_CONSUMER_KEY = Deno.env.get("GARMIN_CONSUMER_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const auth = await requireUser(req);
    if ("response" in auth) return auth.response;

    if (!GARMIN_CONSUMER_KEY) {
      return jsonResponse({
        authUrl: "https://connect.garmin.com/oauthConfirm",
        source: "stub",
        note: "Configure GARMIN_CONSUMER_KEY / GARMIN_CONSUMER_SECRET to enable real Garmin OAuth.",
      });
    }

    // With real credentials this is where the OAuth 1.0a request-token dance
    // would run to produce a user-specific authorize URL.
    const authUrl = `https://connect.garmin.com/oauthConfirm?oauth_consumer_key=${GARMIN_CONSUMER_KEY}`;
    return jsonResponse({ authUrl, source: "garmin" });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
