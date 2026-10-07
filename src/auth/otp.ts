import type { ApiResponse } from "../types.js";
import type { SendOtpParams, VerifyOtpParams } from "../types.js";
import { getDeviceKey } from "../config.js";
import type { SchmoozeTransport } from "../http/transport.js";
import { formatContactNo } from "./phone.js";

export async function sendOtp(
  transport: SchmoozeTransport,
  params: SendOtpParams,
): Promise<ApiResponse> {
  const udk = params.udk ?? getDeviceKey(transport.config.deviceId);
  const prefix = transport.config.phoneCountryPrefix ?? "+91";
  const contactNo = formatContactNo(params.phoneNumber, prefix);
  const path = "/iam-svc/v1/auth/otp/send";
  return transport.request("POST", path, {
    body: {
      attempt: params.attempt,
      contact_no: contactNo,
      udk,
    },
    noAccessToken: true,
  });
}

export async function verifyOtp(
  transport: SchmoozeTransport,
  params: VerifyOtpParams,
): Promise<ApiResponse> {
  const prefix = transport.config.phoneCountryPrefix ?? "+91";
  const contact = formatContactNo(params.phoneNumber, prefix);
  const path = `/iam-svc/v1/auth/otp/verify?otp=${encodeURIComponent(params.otp)}&contact_no=${encodeURIComponent(contact)}`;
  return transport.request("GET", path, { noAccessToken: true });
}
