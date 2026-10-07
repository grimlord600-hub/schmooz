import { createHmac } from "node:crypto";

export function calculateRequestHash(
  method: string,
  url: string,
  body: string | null | undefined,
  timestampMs: number,
  hmacKey: string,
  magicConstant: string,
): string {
  const timestampSecs = Math.floor(timestampMs / 1000);
  const parsed = new URL(url);
  const urlWithoutQuery = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;

  let params = "";
  if (parsed.search && parsed.search.length > 1) {
    const entries = [...parsed.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
    params = entries.map(([k, v]) => `${k}=${v}`).join("&");
  }

  // App treats stringified empty object as no body for signing (see decompiled fetcher ~258582).
  let bodyStr = body ?? "";
  if (bodyStr === "{}") {
    bodyStr = "";
  }
  const hashInput = `${method}&${urlWithoutQuery}&${params}&${bodyStr}&${timestampSecs}${magicConstant}`;

  return createHmac("sha256", hmacKey).update(hashInput, "utf8").digest("hex");
}
