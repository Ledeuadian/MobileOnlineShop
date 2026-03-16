/**
 * Supabase Edge Function: paymongo-handler
 *
 * Serves a simple HTML page after PayMongo redirects the user from GCash/Maya.
 * The user sees a success/failure message and a button to return to the app.
 *
 * Query params: ?status=success|failed&orderId=xxx
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'failed';
  const orderId = url.searchParams.get('orderId') || '0';

  const isSuccess = status === 'success';
  const deepLink = isSuccess
    ? `com.groceryshop.app://payment-result?status=success&orderId=${orderId}`
    : `com.groceryshop.app://payment-result?status=failed&orderId=${orderId}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${isSuccess ? 'Payment Successful' : 'Payment Failed'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: ${isSuccess ? '#f0fff4' : '#fff5f5'};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 40px 28px;
      text-align: center;
      max-width: 360px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .icon { font-size: 4rem; margin-bottom: 16px; }
    h1 {
      font-size: 1.5rem;
      color: ${isSuccess ? '#276749' : '#c53030'};
      margin-bottom: 12px;
    }
    p { color: #718096; line-height: 1.5; margin-bottom: 28px; }
    .btn {
      display: inline-block;
      background: ${isSuccess ? '#38a169' : '#e53e3e'};
      color: white;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
    }
    .counter { margin-top: 16px; color: #a0aec0; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isSuccess ? '✅' : '❌'}</div>
    <h1>${isSuccess ? 'Payment Successful!' : 'Payment Failed'}</h1>
    <p>${isSuccess
      ? 'Your payment was processed. Returning you to the app...'
      : 'Your payment could not be completed. Please return to the app and try again.'
    }</p>
    <a class="btn" href="${deepLink}">Return to App</a>
    <p class="counter" id="counter">Redirecting in <span id="secs">3</span>s...</p>
  </div>
  <script>
    let s = 3;
    const el = document.getElementById('secs');
    const t = setInterval(() => {
      s--;
      if (el) el.textContent = String(s);
      if (s <= 0) {
        clearInterval(t);
        window.location.href = '${deepLink}';
      }
    }, 1000);
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { ...corsHeaders, 'Content-Type': 'text/html;charset=UTF-8' },
  });
});
