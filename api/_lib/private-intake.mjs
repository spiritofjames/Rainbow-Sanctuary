import Busboy from "busboy";

export const PRIVATE_HEADSHOT_MAX_BYTES = 2 * 1024 * 1024;
const FIELD_LIMIT_BYTES = 16 * 1024;

function detectImage(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: "jpg", mimeType: "image/jpeg" };
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) return { extension: "png", mimeType: "image/png" };
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) return { extension: "webp", mimeType: "image/webp" };
  throw new Error("Invalid private headshot file.");
}

export function validatePrivateHeadshot(buffer, declaredMimeType = "") {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12 || buffer.length > PRIVATE_HEADSHOT_MAX_BYTES) {
    throw new Error("Invalid private headshot file.");
  }
  const detected = detectImage(buffer);
  if (declaredMimeType && declaredMimeType !== detected.mimeType) {
    throw new Error("Invalid private headshot file.");
  }
  return { ...detected, buffer, size: buffer.length };
}

export function parseMultipartIntake(request) {
  return new Promise((resolve, reject) => {
    let parser;
    try {
      parser = Busboy({
        headers: request.headers,
        limits: {
          fieldSize: FIELD_LIMIT_BYTES,
          fields: 1,
          fileSize: PRIVATE_HEADSHOT_MAX_BYTES,
          files: 1
        }
      });
    } catch {
      reject(new Error("Invalid private intake request."));
      return;
    }

    let payloadText = "";
    let attachment = null;
    let parsingError = null;
    let sawFile = false;

    parser.on("field", (name, value, info) => {
      if (name !== "payload" || info.valueTruncated) parsingError ||= new Error("Invalid private intake request.");
      else payloadText = value;
    });
    parser.on("file", (name, stream, info) => {
      sawFile = true;
      if (name !== "headshot") parsingError ||= new Error("Invalid private intake request.");
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("limit", () => { parsingError ||= new Error("Invalid private headshot file."); });
      stream.on("end", () => {
        if (parsingError) return;
        try {
          attachment = validatePrivateHeadshot(Buffer.concat(chunks), info.mimeType);
        } catch (error) {
          parsingError ||= error;
        }
      });
    });
    parser.on("filesLimit", () => { parsingError ||= new Error("Invalid private intake request."); });
    parser.on("fieldsLimit", () => { parsingError ||= new Error("Invalid private intake request."); });
    parser.on("error", () => reject(new Error("Invalid private intake request.")));
    parser.on("close", () => {
      if (parsingError) return reject(parsingError);
      if (!payloadText || !sawFile || !attachment) return reject(new Error("Private headshot is required."));
      try {
        const input = JSON.parse(payloadText);
        resolve({ attachment, input });
      } catch {
        reject(new Error("Invalid private intake request."));
      }
    });
    request.pipe(parser);
  });
}
