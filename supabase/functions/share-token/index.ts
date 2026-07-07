import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SECRET = Deno.env.get("VIEWER_CODE")!;

function b64url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

async function hmacSign(data: Uint8Array): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  // Create a new ArrayBuffer to satisfy TypeScript
  const buffer = new ArrayBuffer(data.length);
  new Uint8Array(buffer).set(data);
  const sig = await crypto.subtle.sign("HMAC", key, buffer);
  return new Uint8Array(sig);
}

type Persona = "jason" | "maya" | "ava" | "all";

async function signShareToken(payload: { persona: Persona; exp: number }): Promise<string> {
  const body = new TextEncoder().encode(JSON.stringify(payload));
  const sig = await hmacSign(body);
  return `${b64url(body)}.${b64url(sig)}`;
}

async function verifyShareToken(token: string): Promise<{ persona: Persona; exp: number } | null> {
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;

  const body = b64urlDecode(b64);
  const expectedSig = await hmacSign(body);
  const gotSig = b64urlDecode(sig);

  // Timing-safe comparison
  if (expectedSig.length !== gotSig.length) return null;
  let diff = 0;
  for (let i = 0; i < expectedSig.length; i++) {
    diff |= expectedSig[i] ^ gotSig[i];
  }
  if (diff !== 0) return null;

  const payload = JSON.parse(new TextDecoder().decode(body));
  if (Date.now() / 1000 > payload.exp) return null;

  return payload;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, persona, token, ttlSeconds = 86400 } = await req.json();

    if (action === "sign") {
      if (!["jason", "maya", "ava", "all"].includes(persona)) {
        return new Response(JSON.stringify({ error: "Invalid persona" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
      const signedToken = await signShareToken({ persona, exp });
      return new Response(JSON.stringify({ token: signedToken, exp }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      const payload = await verifyShareToken(token);
      if (!payload) {
        return new Response(JSON.stringify({ valid: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ valid: true, ...payload }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
