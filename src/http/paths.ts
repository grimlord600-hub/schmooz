export const DROGON_HOST = "drogon.schmooze.tech";
export const IRON_BANK_BASE = "https://iron-bank.schmooze.tech";
export const OTEL_BASE = "https://otel.schmooze.tech";
export const FIREBASE_IDENTITY_BASE =
  "https://www.googleapis.com/identitytoolkit/v3/relyingparty";

/** Paths that may omit the access token (still signed with clientsignature on drogon). */
export const NO_ACCESS_TOKEN_PATH_PREFIXES = [
  "/iam-svc/v1/auth/authorize",
  "/iam-svc/v1/auth/otp/send",
  "/iam-svc/v1/auth/otp/verify",
  "/v2/users/welcome",
  "/v2/users/welcome/appsflyer",
  "/v3/users/welcome",
  "/v2/auth/connected-accounts",
  "/v2/users/no-auth-force-update",
  "/v2/users/attribution/app-open",
  "/v1/auth/delete/connected-accounts",
  "/v1/auth/underage/email",
  "/v1/attribution/appsflyer/app/install",
  "/v1/attribution/appsflyer/app/open",
  "/v1/attribution/adjust/app/open",
] as const;

export function pathOmitsAccessToken(pathname: string): boolean {
  return NO_ACCESS_TOKEN_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "?") || pathname.startsWith(p + "/"),
  );
}

export function normalizePathForManifest(pathname: string): string {
  return pathname
    .replace(/\/\d+/g, "/{id}")
    .replace(/otp=\d+/g, "otp={otp}");
}
