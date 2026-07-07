import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const TTS_MODEL = Deno.env.get('OPENAI_TTS_MODEL') || 'gpt-4o-mini-tts';
const TTS_VOICE = Deno.env.get('OPENAI_TTS_VOICE') || 'alloy';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Strip currency words but keep the number
function stripCurrencyWords(input: string): string {
  return input
    .replace(/\$ ?(?=\d)/g, "")            // "$123" -> "123"
    .replace(/\bUS\$ ?(?=\d)/gi, "")       // "US$ 123" -> "123"
    .replace(/\bUSD\b/gi, "")              // "USD 123" -> " 123"
    .replace(/\b(dollars?)\b/gi, "")       // "123 dollars" -> "123"
    .replace(/\s{2,}/g, " ")
    .trim();
}

type CurrencyStyle = "silent" | "name" | "symbol";

// Naturalize text for clearer, more natural TTS output
function naturalize(text: string, opts?: { currencyStyle?: CurrencyStyle }): string {
  let t = text;
  
  // 1) Turn bullets into sentences
  t = t.replace(/^[\s•*-]+/gm, "").replace(/\n\s*•\s*/g, ". ").replace(/\n+/g, ". ");
  
  // 2) Currency handling
  if (opts?.currencyStyle === "silent") {
    t = stripCurrencyWords(t);             // "$1,132" -> "1,132"
  } else if (opts?.currencyStyle === "name") {
    // Turn "$123" into "123 dollars"
    t = t.replace(/\$ ?(?=\d)/g, "").replace(/(\d[\d,\.]*)/g, "$1 dollars");
  }
  // "symbol" (default): leave "$" alone, TTS will decide how to say it
  
  // 3) Expand percent for clearer speech
  t = t.replace(/%/g, " percent ");
  
  // 4) Tidy spaces + finish with period
  t = t.replace(/\s+/g, " ");
  if (!/[.!?]$/.test(t)) t += ".";
  
  return t.trim();
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

    const { text, voice, pace, currencyStyle } = await req.json();
    
    if (!text) {
      return new Response('Missing text', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const input = naturalize(text, { currencyStyle: currencyStyle || "silent" });
    console.log(`TTS request from user ${user.id}: "${input.substring(0, 50)}..."`);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        voice: voice || TTS_VOICE,
        input,
        speed: pace && typeof pace === 'number' ? pace : 1.0,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      return new Response(await response.text(), {
        status: response.status,
        headers: corsHeaders,
      });
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`TTS complete: ${audioBuffer.byteLength} bytes`);

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error in voice-speak function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
