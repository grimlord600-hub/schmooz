import { FIREBASE_IDENTITY_BASE } from "../http/paths.js";
import type { SchmoozeConfig } from "../types.js";

const ANDROID_PACKAGE = "com.schmoozeapps.schmooze";
const ANDROID_CERT = "A247EBAF7F2F243D0268F80FE5D1FAA3E475D491";
const FIREBASE_GMPID = "1:748286713278:android:7908a52528f1a3e7246def";
const FIREBASE_CLIENT =
  "H4sIAAAAAAAAAKtWykhNLCpJSk0sKVayio7VUSpLLSrOzM9TslIyUqoFAFyivEQfAAAA";

export interface VerifyCustomTokenResult {
  idToken: string;
  refreshToken?: string;
  expiresIn?: string;
  localId?: string;
  raw: Record<string, unknown>;
}

function firebaseHeaders(): Record<string, string> {
  return {
    "content-type": "application/json",
    "x-android-package": ANDROID_PACKAGE,
    "x-android-cert": ANDROID_CERT,
    "accept-language": "en-GB, en-US",
    "x-client-version": "Android/Fallback/X23002000/FirebaseCore-Android",
    "x-firebase-gmpid": FIREBASE_GMPID,
    "x-firebase-client": FIREBASE_CLIENT,
    "user-agent":
      "Dalvik/2.1.0 (Linux; U; Android 13; Subsystem for Android(TM) Build/TQ3A.230901.001)",
    connection: "Keep-Alive",
    "accept-encoding": "gzip",
  };
}

export async function verifyCustomToken(
  config: SchmoozeConfig,
  customToken: string,
): Promise<VerifyCustomTokenResult> {
  const key = config.firebaseWebApiKey!;
  const url = `${FIREBASE_IDENTITY_BASE}/verifyCustomToken?key=${key}`;
  const response = await fetch(url, {
    method: "POST",
    headers: firebaseHeaders(),
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  const raw = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`verifyCustomToken failed: ${JSON.stringify(raw).slice(0, 300)}`);
  }
  return {
    idToken: String(raw.idToken ?? ""),
    refreshToken: raw.refreshToken != null ? String(raw.refreshToken) : undefined,
    expiresIn: raw.expiresIn != null ? String(raw.expiresIn) : undefined,
    localId: raw.localId != null ? String(raw.localId) : undefined,
    raw,
  };
}

export async function getAccountInfo(
  config: SchmoozeConfig,
  idToken: string,
): Promise<Record<string, unknown>> {
  const key = config.firebaseWebApiKey!;
  const url = `${FIREBASE_IDENTITY_BASE}/getAccountInfo?key=${key}`;
  const response = await fetch(url, {
    method: "POST",
    headers: firebaseHeaders(),
    body: JSON.stringify({ idToken }),
  });
  const raw = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`getAccountInfo failed: ${JSON.stringify(raw).slice(0, 300)}`);
  }
  return raw;
}
