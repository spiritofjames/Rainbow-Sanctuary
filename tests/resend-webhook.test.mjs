import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/resend/webhook.mjs";

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end(body) { this.body = body ? JSON.parse(body) : null; return this; }
  };
}

test("Resend webhook accepts POST only", async () => {
  const response = responseRecorder();
  await handler({ method: "GET", headers: {} }, response);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, "POST");
});

test("Resend webhook fails closed when its signing secret is absent", async () => {
  const previous = process.env.RESEND_WEBHOOK_SECRET;
  delete process.env.RESEND_WEBHOOK_SECRET;
  const response = responseRecorder();
  await handler({ method: "POST", headers: {} }, response);
  assert.equal(response.statusCode, 503);
  if (previous) process.env.RESEND_WEBHOOK_SECRET = previous;
});
