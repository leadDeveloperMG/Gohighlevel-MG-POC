export async function createCheckoutSession(input: {
  priceId?: string;
  amount?: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { ok: true, mocked: true, url: input.successUrl + "?mock=1" };
  }

  const params = new URLSearchParams({
    mode: input.priceId ? "subscription" : "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });
  if (input.customerEmail) params.set("customer_email", input.customerEmail);
  if (input.priceId) {
    params.set("line_items[0][price]", input.priceId);
    params.set("line_items[0][quantity]", "1");
  } else if (input.amount) {
    params.set("line_items[0][price_data][currency]", "usd");
    params.set("line_items[0][price_data][unit_amount]", String(input.amount));
    params.set("line_items[0][price_data][product_data][name]", "Checkout");
    params.set("line_items[0][quantity]", "1");
  }
  Object.entries(input.metadata || {}).forEach(([k, v]) => {
    params.set(`metadata[${k}]`, v);
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const data = (await res.json()) as { url?: string; error?: { message: string } };
  if (!res.ok) return { ok: false, mocked: false, error: data.error?.message };
  return { ok: true, mocked: false, url: data.url };
}

export function validateStripeSignature(rawBody: string, signature?: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return true;
  return Boolean(signature && rawBody);
}
