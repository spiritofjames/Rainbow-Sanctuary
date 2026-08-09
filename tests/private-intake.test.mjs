import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { parseMultipartIntake, PRIVATE_HEADSHOT_MAX_BYTES, validatePrivateHeadshot } from "../api/_lib/private-intake.mjs";

test("private headshot validation uses image signatures rather than filenames", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
  assert.deepEqual(
    { ...validatePrivateHeadshot(jpeg, "image/jpeg"), buffer: undefined },
    { buffer: undefined, extension: "jpg", mimeType: "image/jpeg", size: jpeg.length }
  );
  assert.throws(() => validatePrivateHeadshot(jpeg, "image/png"), /invalid private headshot/i);
  assert.throws(() => validatePrivateHeadshot(Buffer.from("not-an-image"), "image/png"), /invalid private headshot/i);
});

test("private headshot rejects an upload above the two-megabyte boundary", () => {
  assert.throws(
    () => validatePrivateHeadshot(Buffer.alloc(PRIVATE_HEADSHOT_MAX_BYTES + 1), "image/jpeg"),
    /invalid private headshot/i
  );
});

test("multipart private intake accepts exactly one JSON payload and one verified headshot", async () => {
  const boundary = "rainbow-test-boundary";
  const payload = JSON.stringify({ reason: "private-healing", photoConsent: true });
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
  const request = Readable.from(Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="payload"\r\n\r\n${payload}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="headshot"; filename="ignored.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
    jpeg,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]));
  request.headers = { "content-type": `multipart/form-data; boundary=${boundary}` };

  const parsed = await parseMultipartIntake(request);
  assert.deepEqual(parsed.input, { reason: "private-healing", photoConsent: true });
  assert.equal(parsed.attachment.mimeType, "image/jpeg");
  assert.equal(parsed.attachment.extension, "jpg");
  assert.deepEqual(parsed.attachment.buffer, jpeg);
});
