import { getDeviceKey } from "../config.js";
import type { SchmoozeConfig } from "../types.js";

export interface DeviceDetailsPayload {
  device_id: string;
  platform: string;
  app_version: string;
  os_version: string;
  ram: number;
  model_id: string;
  brand: string;
  phone_number?: string;
}

export interface RegisterDevicePayload {
  fcm_token: string;
  is_notification_on: boolean;
  platform: string;
  version: string;
  os_version: string;
  ram: number;
  brand: string;
  device_id: string;
  device_key: string;
  android_channel_permissions: Array<{ id: string; is_notification_on: boolean }>;
}

export interface BuildDeviceDetailsOptions {
  /** Only for first-install welcome; omit after login (API rejects phone_number). */
  phoneNumber?: string;
}

export function buildDeviceDetails(
  config: SchmoozeConfig,
  options: BuildDeviceDetailsOptions = {},
): DeviceDetailsPayload {
  const details: DeviceDetailsPayload = {
    device_id: config.deviceId,
    platform: config.appPlatform,
    app_version: config.appVersion,
    os_version: config.deviceOsVersion ?? "13",
    ram: config.deviceRamBytes ?? 8_589_934_592,
    model_id: config.deviceModelId ?? config.deviceId,
    brand: config.deviceBrand ?? "google",
  };
  if (options.phoneNumber) {
    details.phone_number = options.phoneNumber.replace(/^\+\d{1,3}/, "");
  }
  return details;
}

export function buildWelcomeBody(
  config: SchmoozeConfig,
  options: {
    phoneNumber?: string;
    adjustInstallAttribution?: Record<string, unknown>;
  } = {},
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    device_details: buildDeviceDetails(config, {
      phoneNumber: options.phoneNumber,
    }),
  };
  const attribution = options.adjustInstallAttribution;
  if (attribution && Object.keys(attribution).length > 0) {
    body.adjust_install_attribution = attribution;
  }
  return body;
}

export function buildRegisterDevicePayload(
  config: SchmoozeConfig,
  options: { fcmToken?: string; isNotificationOn?: boolean } = {},
): RegisterDevicePayload {
  const details = buildDeviceDetails(config);
  return {
    fcm_token: options.fcmToken ?? "",
    is_notification_on: options.isNotificationOn ?? true,
    platform: config.appPlatform,
    version: config.appVersion,
    os_version: details.os_version,
    ram: details.ram,
    brand: details.brand,
    device_id: config.deviceId,
    device_key: getDeviceKey(config.deviceId),
    android_channel_permissions: [],
  };
}
