import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ok = Boolean(Deno.env.get('OPENAI_API_KEY'));
  
  return new Response(
    JSON.stringify({ ok }),
    { 
      status: ok ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});
