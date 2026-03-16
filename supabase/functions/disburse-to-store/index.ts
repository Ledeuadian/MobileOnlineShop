/**
 * Supabase Edge Function: disburse-to-store
 *
 * Sends the net earnings for a single STORE_EARNINGS record to the store owner's
 * GCash number via Xendit Disbursements API, then marks the record as 'disbursed'.
 *
 * Required Supabase secrets:
 *   XENDIT_SECRET_KEY=xnd_production_... (or xnd_development_...)
 *
 * Request body: { earningId: number }
 * Response:     { success: true, disbursementId: string } | { success: false, error: string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const XENDIT_BASE = 'https://api.xendit.co';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const { earningId } = await req.json() as { earningId: number };

    if (!earningId) {
      return json({ success: false, error: 'Missing earningId' }, 400);
    }

    const xenditKey = Deno.env.get('XENDIT_SECRET_KEY');
    if (!xenditKey) {
      return json({ success: false, error: 'Xendit not configured' }, 500);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Step 1: Fetch the earning record + store's GCash number
    const { data: earning, error: fetchError } = await supabase
      .from('STORE_EARNINGS')
      .select(`
        earningId, storeId, orderId, netAmount, status,
        GROCERY_STORE!storeId(name, gcash_number)
      `)
      .eq('earningId', earningId)
      .single();

    if (fetchError || !earning) {
      return json({ success: false, error: 'Earning record not found' }, 404);
    }

    if (earning.status === 'disbursed') {
      return json({ success: false, error: 'Already disbursed' }, 400);
    }

    const store = (earning as { GROCERY_STORE?: { name?: string; gcash_number?: string } }).GROCERY_STORE;
    const gcashNumber = store?.gcash_number;
    const storeName = store?.name || `Store #${earning.storeId}`;

    if (!gcashNumber) {
      return json({
        success: false,
        error: `Store "${storeName}" has no GCash number set. Ask the store owner to add it in their Store Info.`,
      }, 400);
    }

    const netAmount = Number(earning.netAmount);
    const externalId = `payout-${earningId}-${Date.now()}`;

    // Step 2: Create Xendit disbursement (GCash)
    const authHeader = 'Basic ' + btoa(xenditKey + ':');

    const disbursementRes = await fetch(`${XENDIT_BASE}/disbursements`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: externalId,
        bank_code: 'GCASH',
        account_holder_name: storeName,
        account_number: gcashNumber,
        description: `Payout for Order #${earning.orderId}`,
        amount: netAmount, // Xendit uses PHP, not centavos
      }),
    });

    const disbursementData = await disbursementRes.json();

    if (!disbursementRes.ok) {
      const errMsg = disbursementData.message || disbursementData.error_code || 'Disbursement failed';
      console.error('Xendit error:', disbursementData);
      return json({ success: false, error: errMsg }, 400);
    }

    const disbursementId: string = disbursementData.id;

    // Step 3: Mark the earning as disbursed with the Xendit reference
    const { error: updateError } = await supabase
      .from('STORE_EARNINGS')
      .update({
        status: 'disbursed',
        disbursedAt: new Date().toISOString(),
        disbursementRef: disbursementId,
      })
      .eq('earningId', earningId);

    if (updateError) {
      console.error('DB update error after successful disbursement:', updateError);
      // Disbursement already sent — still return success
    }

    return json({ success: true, disbursementId });

  } catch (err) {
    console.error('Edge function error:', err);
    return json({ success: false, error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
