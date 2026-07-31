import { Resend } from "resend";
import { readRawBody, sendJson } from "../_lib/http.mjs";

export const config = {
  api: { bodyParser: false }
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }
  if (!process.env.RESEND_WEBHOOK_SECRET) {
    return sendJson(response, 503, { error: "Webhook is not configured." });
  }

  try {
    const rawBody = await readRawBody(request);
    const resend = new Resend(process.env.RESEND_API_KEY || "re_webhook_verification_only");
    const event = resend.webhooks.verify({
      payload: rawBody.toString("utf8"),
      headers: {
        id: request.headers["svix-id"],
        timestamp: request.headers["svix-timestamp"],
        signature: request.headers["svix-signature"]
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET
    });

    console.info("resend_event_received", {
      webhookId: request.headers["svix-id"],
      type: event.type,
      emailId: event.data?.email_id || event.data?.id || ""
    });
    return sendJson(response, 200, { received: true });
  } catch (error) {
    console.error("resend_webhook_error", { message: error.message });
    return sendJson(response, 400, { error: "Invalid webhook delivery." });
  }
}
