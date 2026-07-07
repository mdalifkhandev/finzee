import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const CHAT_MODEL = Deno.env.get('OPENAI_CHAT_MODEL') || 'gpt-4o';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

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

    // Fetch user profile with rich fields
    const { data: prof } = await supabase
      .from('profiles')
      .select('first_name, income_pattern, pain_points, goals')
      .eq('user_id', user.id)
      .single();

    // Fetch user prefs
    const { data: prefs } = await supabase
      .from('user_prefs')
      .select('tone, emoji, voice')
      .eq('user_id', user.id)
      .single();

    const name = prof?.first_name || user.email?.split('@')[0] || 'there';
    const tone = prefs?.tone || 'calm';
    const emoji = prefs?.emoji || 'low';
    const voice = prefs?.voice || 'alloy';

    // Fetch quick financial snapshot
    const dashboardResponse = await fetch(`${SUPABASE_URL}/functions/v1/dashboard-summary`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'apikey': SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json',
      },
    });

    let contextSnippet = '';
    if (dashboardResponse.ok) {
      const data = await dashboardResponse.json();
      const { summary, goals } = data;
      if (summary) {
        contextSnippet = `Balance: $${summary.total_balance?.toLocaleString() || 0}. `;
        if (summary.saved_mtd > 0) {
          contextSnippet += `Saved $${summary.saved_mtd.toLocaleString()} this month. `;
        }
        if (goals?.length > 0) {
          const topGoal = goals[0];
          contextSnippet += `Top goal: ${topGoal.name} at ${topGoal.progress}%.`;
        }
      }
    }

    // Build persona context
    const personaHints: string[] = [];
    if (prof?.income_pattern === 'irregular_freelance') {
      personaHints.push('freelancer with variable income');
    }
    if (prof?.pain_points?.includes('tax-deductions')) {
      personaHints.push('interested in tax tracking');
    }
    if (prof?.goals?.includes('build-cash-buffer')) {
      personaHints.push('building emergency fund');
    }

    const toneInstructions = tone === 'hype' 
      ? 'Be energetic and motivating!' 
      : tone === 'friendly' 
        ? 'Be warm and casual.' 
        : 'Be calm and measured.';
    
    const emojiInstructions = emoji === 'high' 
      ? 'Use 2-3 emojis.' 
      : emoji === 'low' 
        ? 'Use 1 emoji max.' 
        : 'No emojis.';

    const systemPrompt = `You are FinZee, a friendly finance coach. Generate a SHORT, warm welcome (2-3 sentences max).
Include the user's first name once. If context is provided, weave in ONE encouraging detail.
${toneInstructions} ${emojiInstructions}
${personaHints.length > 0 ? `User context: ${personaHints.join(', ')}.` : ''}
Keep it personal. No bullet points. End with an invitation to chat.`;

    const userPrompt = `User: ${name}. ${contextSnippet ? `Context: ${contextSnippet}` : 'No data yet.'}`;

    console.log(`Welcome request for ${name}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 100
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || `Hey ${name}! Ready to check in on your finances?`;

    return new Response(JSON.stringify({ 
      text, 
      voice: { voice, pace: 0.95 } 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Welcome error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
