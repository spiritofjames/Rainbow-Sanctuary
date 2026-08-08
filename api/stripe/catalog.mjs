import { publicOfferCatalog } from "../_lib/offer-catalog.mjs";
import { sendJson } from "../_lib/http.mjs";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendJson(response, 405, { error: "Method not allowed." });
  }
  response.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  return response.status(200).json({
    processingLabel: "Payment processing included",
    taxLabel: process.env.STRIPE_TAX_DISPLAY_APPROVED === "true"
      ? "Any applicable tax is included in the total shown."
      : "Tax treatment will be confirmed before live release.",
    offers: publicOfferCatalog(process.env)
  });
}
