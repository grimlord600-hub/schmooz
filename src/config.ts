import { readFileSync, writeFileSync } from "node:fs";
import type { SchmoozeConfig } from "./types.js";

const DEFAULT_FIREBASE_KEY = "AIzaSyCu8pDvpXq2Mv8vbVIuRfncMdTLePaQhPI";

export function configFromJson(raw: Record<string, unknown>): SchmoozeConfig {
  return {
    baseUrl: String(raw.base_url ?? raw.baseUrl ?? "https://drogon.schmooze.tech").replace(
      /\/$/,
      "",
    ),
    iamUrl: String(
      raw.iam_url ?? raw.iamUrl ?? "https://drogon.schmooze.tech/iam-svc/v1/auth",
    ).replace(/\/$/, ""),
    deviceId: String(raw.device_id ?? raw.deviceId ?? ""),
    accessToken: raw.access_token != null ? String(raw.access_token) : raw.accessToken != null ? String(raw.accessToken) : undefined,
    refreshToken:
      raw.refresh_token != null
        ? String(raw.refresh_token)
        : raw.refreshToken != null
          ? String(raw.refreshToken)
          : undefined,
    appVersion: String(raw.app_version ?? raw.appVersion ?? "5.2.9.1"),
    appPlatform: String(raw.app_platform ?? raw.appPlatform ?? "android"),
    userAgent: String(raw.user_agent ?? raw.userAgent ?? "okhttp/5.4.0"),
    hmacKey: String(raw.hmac_key ?? raw.hmacKey ?? ""),
    jwtSecret: String(raw.jwt_secret ?? raw.jwtSecret ?? ""),
    magicConstant: String(raw.magic_constant ?? raw.magicConstant ?? ""),
    autoRefresh: raw.auto_refresh !== false && raw.autoRefresh !== false,
    firebaseWebApiKey: String(
      raw.firebase_web_api_key ?? raw.firebaseWebApiKey ?? DEFAULT_FIREBASE_KEY,
    ),
    phoneCountryPrefix: String(raw.phone_country_prefix ?? raw.phoneCountryPrefix ?? "+91"),
    deviceOsVersion: raw.device_os_version != null
      ? String(raw.device_os_version)
      : raw.deviceOsVersion != null
        ? String(raw.deviceOsVersion)
        : undefined,
    deviceRamBytes:
      raw.device_ram_bytes != null
        ? Number(raw.device_ram_bytes)
        : raw.deviceRamBytes != null
          ? Number(raw.deviceRamBytes)
          : undefined,
    deviceModelId:
      raw.device_model_id != null
        ? String(raw.device_model_id)
        : raw.deviceModelId != null
          ? String(raw.deviceModelId)
          : undefined,
    deviceBrand:
      raw.device_brand != null
        ? String(raw.device_brand)
        : raw.deviceBrand != null
          ? String(raw.deviceBrand)
          : undefined,
  };
}

export function loadConfig(path: string): SchmoozeConfig {
  const text = readFileSync(path, "utf8");
  const parsed = JSON.parse(text) as Record<string, unknown>;
  return configFromJson(parsed);
}

export function loadConfigFromEnv(): SchmoozeConfig {
  const env = process.env;
  return configFromJson({
    base_url: env.SCHMOOZE_BASE_URL,
    iam_url: env.SCHMOOZE_IAM_URL,
    device_id: env.SCHMOOZE_DEVICE_ID,
    access_token: env.SCHMOOZE_ACCESS_TOKEN,
    refresh_token: env.SCHMOOZE_REFRESH_TOKEN,
    app_version: env.SCHMOOZE_APP_VERSION,
    hmac_key: env.SCHMOOZE_HMAC_KEY,
    jwt_secret: env.SCHMOOZE_JWT_SECRET,
    magic_constant: env.SCHMOOZE_MAGIC_CONSTANT,
  });
}

/** Update access_token / refresh_token in an existing schmooze_config.json file. */
export function persistTokensToConfigFile(
  configPath: string,
  tokens: { accessToken: string; refreshToken?: string },
): void {
  const text = readFileSync(configPath, "utf8");
  const raw = JSON.parse(text) as Record<string, unknown>;
  raw.access_token = tokens.accessToken;
  if (tokens.refreshToken) {
    raw.refresh_token = tokens.refreshToken;
  }
  writeFileSync(configPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
}

/** Stable device key placeholder; app uses native getDeviceKey — use deviceId until UDK is reversed. */
export function getDeviceKey(deviceId: string): string {
  return deviceId;
}
