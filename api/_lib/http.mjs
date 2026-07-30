export function applySecurityHeaders(response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("X-Content-Type-Options", "nosniff");
}

export function sendJson(response, status, value) {
  applySecurityHeaders(response);
  return response.status(status).json(value);
}

export function parseJsonBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return request.body;
  }
  if (typeof request.body === "string") {
    return JSON.parse(request.body);
  }
  throw new Error("A JSON request body is required.");
}

export async function readRawBody(request, limit = 1_000_000) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += buffer.length;
    if (length > limit) throw new Error("Request body is too large.");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}
