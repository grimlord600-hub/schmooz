export interface SchmoozeConfig {
  baseUrl: string;
  iamUrl: string;
  deviceId: string;
  accessToken?: string;
  refreshToken?: string;
  appVersion: string;
  appPlatform: string;
  userAgent: string;
  hmacKey: string;
  jwtSecret: string;
  magicConstant: string;
  autoRefresh?: boolean;
  firebaseWebApiKey?: string;
  phoneCountryPrefix?: string;
  deviceOsVersion?: string;
  deviceRamBytes?: number;
  deviceModelId?: string;
  deviceBrand?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface AuthorizeParams {
  idToken: string;
  deviceKey: string;
  firebaseId: string;
  appVersion?: string;
  platform?: string;
  appleIdToken?: string;
  phoneNo?: string;
  adjustInstallAttribution?: unknown;
  onboardingFlowInit?: unknown;
}

export interface AuthorizeResult {
  authToken: string;
  authTokenExpiresIn?: number;
  refreshToken?: string;
  userId?: number;
  isNewUserCreated?: boolean;
}

export interface SendOtpParams {
  phoneNumber: string;
  attempt: number;
  udk?: string;
}

export interface VerifyOtpParams {
  otp: string;
  phoneNumber: string;
}

export type PostInteractAction = "relate" | "right" | "left" | "bookmark";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  /** Skip access token in authorization header (pre-login paths). */
  noAccessToken?: boolean;
  /** Skip clientsignature (OTEL). */
  noClientSignature?: boolean;
  /** Override content type for body. */
  contentType?: string;
  /** Raw body string for signing (when not JSON). */
  bodyString?: string;
  /** POST with no body (e.g. session/start). */
  noBody?: boolean;
  /** Use iron-bank host. */
  ironBank?: boolean;
}
