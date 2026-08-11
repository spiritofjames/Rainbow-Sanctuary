import Stripe from "stripe";
import { assertAllowedOrigin } from "../_lib/checkout-policy.mjs";
import { parseJsonBody, sendJson } from "../_lib/http.mjs";

const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MINIMUM_AMOUNT = 500;
const MAXIMUM_AMOUNT = 1000000;

function assertDonationConfiguration(environment) {
  if (environment.STRIPE_DONATION_CHECKOUT_ENABLED !== "true" || environment.STRIPE_DONATION_CHECKOUT_APPROVED !== "true") {
    throw new Error("Optional contributions are not enabled yet.");
  }
  if (!environment.STRIPE_SECRET_KEY) throw new Error("Secure checkout is not configured.");
  const liveKey = ["sk_live_", "rk_live_"].some((prefix) => environment.STRIPE_SECRET_KEY.startsWith(prefix));
  if (environment.VERCEL_ENV === "production" && (!liveKey || environment.STRIPE_DONATION_TAX_STATUS_APPROVED !== "true")) {
    throw new Error("Optional contributions have not been approved for live checkout.");
  }
  if (environment.VERCEL_ENV !== "production" && liveKey) throw new Error("Live Stripe keys are not permitted outside production.");
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }
  try {
    assertDonationConfiguration(process.env);
    const origin = assertAllowedOrigin(request, process.env);
    const body = parseJsonBody(request);
    const amountMinor = Number(body?.amountMinor);
    const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";
    if (!Number.isInteger(amountMinor) || amountMinor < MINIMUM_AMOUNT || amountMinor > MAXIMUM_AMOUNT) throw new Error("Choose a contribution between $5 and $10,000.");
    if (!REQUEST_ID_PATTERN.test(requestId)) throw new Error("Invalid request identifier.");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      billing_address_collection: "auto",
      line_items: [{ price_data: { currency: "usd", product_data: { name: "Rainbow Sanctuary optional contribution", metadata: { contribution: "true", source: "rainbow-sanctuary-web" } }, unit_amount: amountMinor }, quantity: 1 }],
      metadata: { contribution: "true", source: "rainbow-sanctuary-web" },
      payment_intent_data: { metadata: { contribution: "true", source: "rainbow-sanctuary-web" } },
      success_url: `${origin}/payment-confirmation?payment=confirmed&contribution=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/contribute?checkout=cancelled`
    }, { idempotencyKey: `rainbow:contribution:${amountMinor}:${requestId}` });
    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
    return sendJson(response, 200, { url: session.url });
  } catch (error) {
    const expected = /not enabled|not configured|approved|not permitted|not allowed|Invalid|Choose/.test(error.message);
    console.error("donation_checkout_error", { message: error.message });
    return sendJson(response, expected ? 400 : 502, { error: expected ? error.message : "Secure checkout is temporarily unavailable." });
  }
}
