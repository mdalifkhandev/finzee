import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SkimRequest {
  percentage: number;
  targetGoalKind: string;
  lastProcessedTransactionId?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { percentage, targetGoalKind, lastProcessedTransactionId }: SkimRequest = await req.json();

    // Find income transactions that haven't been skimmed yet
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'income')
      .order('created_at', { ascending: true });

    // If we have a last processed ID, only get transactions after it
    if (lastProcessedTransactionId) {
      const { data: lastTx } = await supabase
        .from('transactions')
        .select('created_at')
        .eq('id', lastProcessedTransactionId)
        .single();
      
      if (lastTx) {
        query = query.gt('created_at', lastTx.created_at);
      }
    }

    const { data: incomeTransactions, error: txError } = await query;
    if (txError) throw txError;

    if (!incomeTransactions || incomeTransactions.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No new income to skim',
        skimmed: [],
        totalSkimmed: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find or create the target goal
    let { data: targetGoal } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('kind', targetGoalKind)
      .single();

    if (!targetGoal) {
      // Create the goal if it doesn't exist
      const { data: newGoal, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          kind: targetGoalKind,
          name: targetGoalKind === 'emergency' ? 'Emergency Fund' : 'Savings Goal',
          target_amount: 1000,
          current_amount: 0,
          due_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'active',
        })
        .select()
        .single();

      if (goalError) throw goalError;
      targetGoal = newGoal;
    }

    const skimmedTransactions = [];
    let totalSkimmed = 0;

    for (const income of incomeTransactions) {
      const skimAmount = Math.round(income.amount * (percentage / 100) * 100) / 100;
      
      if (skimAmount < 0.01) continue;

      // Create a savings transfer transaction
      const { data: skimTx, error: skimError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: skimAmount,
          type: 'transfer',
          categories: ['Savings', 'Auto-Skim'],
          merchant: `Skim to ${targetGoal.name}`,
          description: `Auto-saved ${percentage}% from ${income.merchant || 'income'}`,
          ts: new Date().toISOString(),
        })
        .select()
        .single();

      if (skimError) {
        console.error('Error creating skim transaction:', skimError);
        continue;
      }

      // Update the goal's current amount
      await supabase
        .from('goals')
        .update({ 
          current_amount: targetGoal.current_amount + skimAmount,
          progress: Math.min(100, Math.round(((targetGoal.current_amount + skimAmount) / targetGoal.target_amount) * 100)),
        })
        .eq('id', targetGoal.id);

      targetGoal.current_amount += skimAmount;
      totalSkimmed += skimAmount;
      skimmedTransactions.push({
        sourceId: income.id,
        skimId: skimTx.id,
        amount: skimAmount,
        sourceMerchant: income.merchant,
      });
    }

    // Create an insight if we skimmed anything
    if (totalSkimmed > 0) {
      await supabase
        .from('insights')
        .insert({
          user_id: user.id,
          type: 'tip',
          title: '💰 Auto-Saved!',
          description: `Nice! I just skimmed $${totalSkimmed.toFixed(2)} (${percentage}%) from ${skimmedTransactions.length} deposit${skimmedTransactions.length > 1 ? 's' : ''} into your ${targetGoal.name}. Your savings are now at $${targetGoal.current_amount.toFixed(2)}!`,
          category: 'savings',
        });
    }

    const lastProcessed = incomeTransactions[incomeTransactions.length - 1]?.id || lastProcessedTransactionId;

    return new Response(JSON.stringify({
      message: totalSkimmed > 0 ? `Skimmed $${totalSkimmed.toFixed(2)} to ${targetGoal.name}` : 'No income to skim',
      skimmed: skimmedTransactions,
      totalSkimmed,
      lastProcessedTransactionId: lastProcessed,
      goalProgress: {
        name: targetGoal.name,
        current: targetGoal.current_amount,
        target: targetGoal.target_amount,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Skim process error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
