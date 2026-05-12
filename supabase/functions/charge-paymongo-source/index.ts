/**
 * Supabase Edge Function: charge-paymongo-source
 *
 * Called by the frontend AFTER the PayMongo source becomes chargeable.
 * Uses the SECRET key (stored in Supabase secrets) to create the actual Payment,
 * then updates the ORDERS table in Supabase.
 *
 * Required Supabase secrets (set with `supabase secrets set`):
 *   PAYMONGO_SECRET_KEY=sk_test_...
 *
 * Request body: { sourceId: string, orderId: number, amount: number }
 * Response:     { success: true, paymentId: string } | { success: false, error: string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PAYMONGO_BASE = 'https://api.paymongo.com/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const { sourceId, orderId, amount } = await req.json() as {
      sourceId: string;
      orderId: number;
      amount: number; // in centavos
    };

    if (!sourceId || !orderId || !amount) {
      return json({ success: false, error: 'Missing required fields' }, 400);
    }

    const secretKey = Deno.env.get('PAYMONGO_SECRET_KEY');
    if (!secretKey) {
      return json({ success: false, error: 'Payment service not configured' }, 500);
    }

    const authHeader = 'Basic ' + btoa(secretKey + ':');

    // Step 1: Verify source is actually chargeable
    const sourceRes = await fetch(`${PAYMONGO_BASE}/sources/${sourceId}`, {
      headers: { 'Authorization': authHeader },
    });
    const sourceData = await sourceRes.json();
    const sourceStatus: string = sourceData.data?.attributes?.status;

    if (sourceStatus !== 'chargeable') {
      return json({
        success: false,
        error: `Source is not chargeable (status: ${sourceStatus})`,
      }, 400);
    }

    // Step 2: Create the Payment from the Source
    const paymentRes = await fetch(`${PAYMONGO_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount,
            source: { id: sourceId, type: 'source' },
            currency: 'PHP',
            description: `Order #${orderId}`,
          },
        },
      }),
    });

    const paymentData = await paymentRes.json();

    if (!paymentRes.ok || !paymentData.data?.id) {
      const errDetail = paymentData.errors?.[0]?.detail || 'Payment creation failed';
      return json({ success: false, error: errDetail }, 400);
    }

    const paymentId: string = paymentData.data.id;
    const paymentStatus: string = paymentData.data.attributes.status;
    const paymentMethod: string = sourceData.data.attributes.type; // 'gcash' or 'paymaya'

    // Step 3: Update the ORDERS table
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const friendlyMethod = paymentMethod === 'gcash' ? 'GCash' : 'Maya';
    const isPaid = paymentStatus === 'paid';

    const { error: updateError } = await supabase
      .from('ORDERS')
      .update({
        status: isPaid ? 'paid' : 'pending_payment',
        paymentMethod: friendlyMethod,
      })
      .eq('orderId', orderId);

    if (updateError) {
      console.error('DB update error:', updateError);
    }

    // Step 4: Record store earnings if payment was successful
    if (isPaid) {
      // Get storeId from the order
      const { data: orderRow } = await supabase
        .from('ORDERS')
        .select('storeId, total')
        .eq('orderId', orderId)
        .single();

      if (orderRow?.storeId) {
        const grossAmount = orderRow.total as number;
        const platformFee = Math.round(grossAmount * 0.05 * 100) / 100; // 5%
        const netAmount = Math.round((grossAmount - platformFee) * 100) / 100;

        const { error: earningsError } = await supabase
          .from('STORE_EARNINGS')
          .insert({
            storeId: orderRow.storeId,
            orderId,
            grossAmount,
            platformFee,
            netAmount,
            paymentMethod: friendlyMethod,
            paymentId,
            status: 'pending',
          });

        if (earningsError) {
          console.error('Earnings insert error:', earningsError);
        }
      }
    }

    return json({ success: true, paymentId, paymentStatus });

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
