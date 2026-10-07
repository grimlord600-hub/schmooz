/**
 * Manual login flow: set env vars or edit placeholders below.
 * SCHMOOZE_CONFIG — path to schmooze_config.json (signing keys + device_id)
 */
import { resolve } from "node:path";
import { SchmoozeClient, loadConfig } from "../src/index.js";

const configPath =
  process.env.SCHMOOZE_CONFIG ??
  resolve(process.cwd(), "schmooze_config.json");

const phone = process.env.SCHMOOZE_PHONE ?? "+91XXXXXXXXXX";
const otp = process.env.SCHMOOZE_OTP ?? "000000";
const googleIdToken = process.env.SCHMOOZE_GOOGLE_ID_TOKEN ?? "";
const customToken = process.env.SCHMOOZE_FIREBASE_CUSTOM_TOKEN;

const client = new SchmoozeClient(loadConfig(configPath));

if (!googleIdToken && !customToken) {
  console.log(
    "Set SCHMOOZE_GOOGLE_ID_TOKEN or SCHMOOZE_FIREBASE_CUSTOM_TOKEN, SCHMOOZE_PHONE, SCHMOOZE_OTP",
  );
  process.exit(1);
}

const result = await client.auth.loginWithPhoneAndGoogle({
  phoneNumber: phone,
  otp,
  otpAttempt: 1,
  googleIdToken,
  firebaseCustomToken: customToken,
});

await client.auth.completeSession();
console.log("login ok, userId:", result.userId);
