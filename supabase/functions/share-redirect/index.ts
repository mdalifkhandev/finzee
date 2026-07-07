import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_PERSONAS = ["jason", "maya", "ava"];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const persona = url.searchParams.get("persona")?.toLowerCase();

    if (!persona || !VALID_PERSONAS.includes(persona)) {
      return new Response(
        JSON.stringify({ error: "Invalid persona. Use: jason, maya, or ava" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const viewerCode = Deno.env.get("VIEWER_CODE");
    if (!viewerCode) {
      return new Response(
        JSON.stringify({ error: "VIEWER_CODE not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the origin from referer or use a default
    const referer = req.headers.get("referer");
    const origin = referer ? new URL(referer).origin : "https://fin-wise-navi.lovable.app";
    
    const redirectUrl = `${origin}/share/${persona}?code=${encodeURIComponent(viewerCode)}`;

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": redirectUrl,
      },
    });
  } catch (error) {
    console.error("Share redirect error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
