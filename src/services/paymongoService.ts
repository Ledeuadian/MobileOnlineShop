/**
 * PayMongo frontend service.
 * Only uses the PUBLIC key — the secret key never leaves the Supabase Edge Function.
 */

const PAYMONGO_BASE = 'https://api.paymongo.com/v1';

// Public key is safe to expose in client-side code (same as Stripe publishable key)
const PUBLIC_KEY = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY as string;

if (!PUBLIC_KEY) {
  console.warn('VITE_PAYMONGO_PUBLIC_KEY is not set. PayMongo payments will not work.');
}

const publicAuthHeader = () => 'Basic ' + btoa(PUBLIC_KEY + ':');

export type EWalletType = 'gcash' | 'paymaya';

export interface PayMongoSource {
  sourceId: string;
  checkoutUrl: string;
  status: string;
  amount: number;
}

/**
 * Creates a PayMongo GCash or Maya source.
 * The redirect URLs just show a "Return to app" page — actual processing is via polling.
 */
export async function createEWalletSource(
  type: EWalletType,
  amountPHP: number,
  orderId: number,
  orderNumber: string
): Promise<PayMongoSource> {
  // Amount in centavos (PayMongo requires integers)
  const amountCentavos = Math.round(amountPHP * 100);

  // Supabase function handler URL — shows "Return to app" after payment
  const callbackBase = `${import.meta.env.VITE_SUPABASE_URL || 'https://jugtklulvvpcpfsrdxom.supabase.co'}/functions/v1/paymongo-handler`;
  const successUrl = `${callbackBase}?status=success&orderId=${orderId}`;
  const failedUrl  = `${callbackBase}?status=failed&orderId=${orderId}`;

  const res = await fetch(`${PAYMONGO_BASE}/sources`, {
    method: 'POST',
    headers: {
      'Authorization': publicAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: amountCentavos,
          redirect: { success: successUrl, failed: failedUrl },
          type,
          currency: 'PHP',
          description: `Order ${orderNumber}`,
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.errors?.[0]?.detail || 'Failed to create payment source');
  }

  const { data } = await res.json();
  return {
    sourceId: data.id as string,
    checkoutUrl: data.attributes.redirect.checkout_url as string,
    status: data.attributes.status as string,
    amount: data.attributes.amount as number,
  };
}

/**
 * Polls a PayMongo source until it becomes chargeable, expired, or times out.
 * Returns 'chargeable' | 'failed' | 'timeout'
 */
export async function waitForSourceChargeable(
  sourceId: string,
  onStatusChange?: (status: string) => void,
  maxWaitMs = 5 * 60 * 1000  // 5 minutes
): Promise<'chargeable' | 'failed' | 'timeout'> {
  const pollInterval = 3000; // 3 seconds
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    await delay(pollInterval);

    try {
      const res = await fetch(`${PAYMONGO_BASE}/sources/${sourceId}`, {
        headers: { 'Authorization': publicAuthHeader() },
      });

      if (!res.ok) continue;

      const { data } = await res.json();
      const status: string = data.attributes.status;

      onStatusChange?.(status);

      if (status === 'chargeable') return 'chargeable';
      if (status === 'expired' || status === 'consumed') return 'failed';
    } catch {
      // Network error — keep polling
    }
  }

  return 'timeout';
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
