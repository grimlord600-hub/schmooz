import { createHmac } from "node:crypto";

function base64UrlEncode(data: Buffer | string): string {
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function createClientSignature(
  timestampMs: number,
  requestHash: string,
  jwtSecret: string,
  appVersion: string,
  appPlatform: string,
  deviceId: string,
): string {
  const timestampSecs = Math.floor(timestampMs / 1000);

  const header = { alg: "HS256", typ: "JWT", kid: "kid_v1" };
  const payload = {
    exp: timestampSecs + 30,
    aud: "schmooze_app",
    app_version: appVersion,
    app_platform: appPlatform,
    device_id: deviceId,
    iat: timestampSecs,
    request_hash: requestHash,
  };

  const headerStr = JSON.stringify(header);
  const payloadStr = JSON.stringify(payload);
  const headerB64 = base64UrlEncode(headerStr);
  const payloadB64 = base64UrlEncode(payloadStr);
  const message = `${headerB64}.${payloadB64}`;
  const signature = createHmac("sha256", jwtSecret).update(message, "utf8").digest();
  const signatureB64 = base64UrlEncode(signature);
  return `${message}.${signatureB64}`;
}
