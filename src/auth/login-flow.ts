import type { ApiResponse, AuthorizeParams, AuthorizeResult } from "../types.js";
import { getDeviceKey } from "../config.js";
import type { SchmoozeTransport } from "../http/transport.js";
import { getAccountInfo, verifyCustomToken } from "./firebase.js";
import { buildRegisterDevicePayload, buildWelcomeBody } from "../device/details.js";
import { formatContactNo } from "./phone.js";
import { sendOtp, verifyOtp } from "./otp.js";

export async function authorize(
  transport: SchmoozeTransport,
  params: AuthorizeParams,
): Promise<AuthorizeResult> {
  const body: Record<string, unknown> = {
    id_token: params.idToken,
    device_key: params.deviceKey,
    firebase_id: params.firebaseId,
    app_version: params.appVersion ?? transport.config.appVersion,
    platform: params.platform ?? transport.config.appPlatform,
    apple_id_token: params.appleIdToken ?? "",
  };
  if (params.phoneNo) body.phone_no = params.phoneNo;
  if (params.adjustInstallAttribution) {
    body.adjust_install_attribution = params.adjustInstallAttribution;
  }
  if (params.onboardingFlowInit) {
    body.onboarding_flow_init = params.onboardingFlowInit;
  }

  const res = await transport.request<{
    access_token: string;
    access_token_expires_in?: number;
    refresh_token?: string;
    user_id?: number;
    is_new_user_created?: boolean;
  }>("POST", "/iam-svc/v1/auth/authorize", {
    body,
    noAccessToken: true,
  });

  if (!res.success || !res.data?.access_token) {
    throw new Error("authorize failed");
  }
  return {
    authToken: res.data.access_token,
    authTokenExpiresIn: res.data.access_token_expires_in,
    refreshToken: res.data.refresh_token,
    userId: res.data.user_id,
    isNewUserCreated: res.data.is_new_user_created,
  };
}

export async function signIn(
  transport: SchmoozeTransport,
  authToken: string,
  refreshToken?: string,
): Promise<ApiResponse> {
  const res = await transport.request("POST", "/v3/auth/login", {
    body: {},
    authTokenOverride: authToken,
    noAccessToken: false,
  });
  if (res.success && authToken) {
    transport.setTokens(authToken, refreshToken ?? transport.config.refreshToken);
  }
  return res;
}

export interface LoginWithPhoneOtpParams {
  phoneNumber: string;
  otp: string;
}

/** verifyOtp → Firebase (fb_token) → authorize → v3/login (matches app custom OTP flow). */
export async function loginWithPhoneOtp(
  transport: SchmoozeTransport,
  params: LoginWithPhoneOtpParams,
): Promise<AuthorizeResult> {
  const prefix = transport.config.phoneCountryPrefix ?? "+91";
  const contactNo = formatContactNo(params.phoneNumber, prefix);
  const verifyRes = await verifyOtp(transport, { ...params, phoneNumber: contactNo });
  if (!verifyRes.success) {
    throw new Error(
      `OTP verification failed: ${verifyRes.message ?? JSON.stringify(verifyRes)}`,
    );
  }
  const fbToken = (verifyRes.data as { fb_token?: string } | undefined)?.fb_token;
  if (!fbToken) {
    throw new Error("verifyOtp response missing data.fb_token");
  }

  const verified = await verifyCustomToken(transport.config, fbToken);
  const info = await getAccountInfo(transport.config, verified.idToken);
  const users = info.users as Array<{ localId?: string }> | undefined;
  const firebaseId = users?.[0]?.localId ?? verified.localId ?? "";

  const auth = await authorize(transport, {
    idToken: verified.idToken,
    deviceKey: getDeviceKey(transport.config.deviceId),
    firebaseId,
    phoneNo: contactNo,
  });

  transport.config.refreshToken = auth.refreshToken;
  transport.setTokens(auth.authToken, auth.refreshToken);
  await signIn(transport, auth.authToken, auth.refreshToken);
  return auth;
}

export interface LoginWithGoogleParams {
  phoneNumber: string;
  otp: string;
  otpAttempt: number;
  googleIdToken: string;
  firebaseCustomToken?: string;
}

/** OTP verify → Firebase confirm → authorize → v3 login. */
export async function loginWithPhoneAndGoogle(
  transport: SchmoozeTransport,
  params: LoginWithGoogleParams,
): Promise<AuthorizeResult> {
  await sendOtp(transport, {
    phoneNumber: params.phoneNumber,
    attempt: params.otpAttempt,
  });
  await verifyOtp(transport, {
    otp: params.otp,
    phoneNumber: params.phoneNumber,
  });

  let idToken = params.googleIdToken;
  let firebaseId = "";

  if (params.firebaseCustomToken) {
    const verified = await verifyCustomToken(
      transport.config,
      params.firebaseCustomToken,
    );
    idToken = verified.idToken;
    firebaseId = verified.localId ?? "";
    await getAccountInfo(transport.config, idToken);
  } else {
    const info = await getAccountInfo(transport.config, idToken);
    const users = info.users as Array<{ localId?: string }> | undefined;
    firebaseId = users?.[0]?.localId ?? "";
  }

  const deviceKey = getDeviceKey(transport.config.deviceId);
  const auth = await authorize(transport, {
    idToken,
    deviceKey,
    firebaseId,
    phoneNo: params.phoneNumber,
  });

  if (auth.refreshToken) {
    transport.config.refreshToken = auth.refreshToken;
  }
  transport.setTokens(auth.authToken, auth.refreshToken);
  await signIn(transport, auth.authToken, auth.refreshToken);
  return auth;
}

export interface CompleteSessionOptions {
  /** First-install welcome only; omit after OTP login. */
  welcomePhoneNumber?: string;
  fcmToken?: string;
  adjustInstallAttribution?: Record<string, unknown>;
}

export async function completeSession(
  transport: SchmoozeTransport,
  options: CompleteSessionOptions = {},
): Promise<void> {
  await transport.request("POST", "/v3/users/welcome", {
    body: buildWelcomeBody(transport.config, {
      phoneNumber: options.welcomePhoneNumber,
      adjustInstallAttribution: options.adjustInstallAttribution,
    }),
    noAccessToken: true,
  });
  await transport.request("POST", "/v2/users/session/start", { noBody: true });
  await transport.request("POST", "/v2/users/devices/register", {
    body: buildRegisterDevicePayload(transport.config, {
      fcmToken: options.fcmToken,
    }),
  });
}

export async function logout(transport: SchmoozeTransport): Promise<ApiResponse> {
  return transport.request("POST", "/v1/auth/logout", { body: {} });
}

export async function rotateRefreshTokens(
  transport: SchmoozeTransport,
): Promise<boolean> {
  return transport.refreshAccessToken();
}

export async function connectedAccounts(
  transport: SchmoozeTransport,
  body: Record<string, unknown> = {},
): Promise<ApiResponse> {
  return transport.request("POST", "/v2/auth/connected-accounts", {
    body,
    noAccessToken: true,
  });
}
