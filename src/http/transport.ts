import { randomUUID } from "node:crypto";
import type { ApiResponse, HttpMethod, RequestOptions, SchmoozeConfig } from "../types.js";
import { calculateRequestHash, createClientSignature, stableStringify } from "../signing/index.js";
import { IRON_BANK_BASE, pathOmitsAccessToken } from "./paths.js";

export type TokenUpdateHandler = (tokens: {
  accessToken: string;
  refreshToken?: string;
}) => void | Promise<void>;

export class SchmoozeTransport {
  readonly config: SchmoozeConfig;
  sessionId: string;
  private refreshing = false;
  private tokenExpiry: number | null = null;
  onTokenUpdate?: TokenUpdateHandler;

  constructor(config: SchmoozeConfig, onTokenUpdate?: TokenUpdateHandler) {
    this.config = config;
    this.sessionId = randomUUID();
    this.onTokenUpdate = onTokenUpdate;
    this.decodeTokenExpiry();
  }

  setTokens(accessToken: string, refreshToken?: string): void {
    this.config.accessToken = accessToken;
    if (refreshToken !== undefined) {
      this.config.refreshToken = refreshToken;
    }
    this.decodeTokenExpiry();
  }

  private decodeTokenExpiry(): void {
    const token = this.config.accessToken;
    if (!token) {
      this.tokenExpiry = null;
      return;
    }
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1]!, "base64url").toString("utf8"),
      ) as { exp?: number };
      this.tokenExpiry = payload.exp ?? null;
    } catch {
      this.tokenExpiry = null;
    }
  }

  private isTokenExpired(bufferSeconds = 60): boolean {
    if (this.tokenExpiry === null) return true;
    return Math.floor(Date.now() / 1000) >= this.tokenExpiry - bufferSeconds;
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.config.refreshToken) return false;
    if (this.refreshing) {
      await new Promise((r) => setTimeout(r, 500));
      return !this.isTokenExpired();
    }
    this.refreshing = true;
    try {
      const url = `${this.config.iamUrl}/rotate-refresh-tokens`;
      const body = { refresh_token: this.config.refreshToken };
      const data = await this.request<{
        access_token?: string;
        refresh_token?: string;
      }>("POST", url, {
        body,
        absoluteUrl: true,
        authTokenOverride: this.config.accessToken,
      });
      const tokenData = data.data as { access_token?: string; refresh_token?: string };
      if (!data.success || !tokenData?.access_token) return false;
      this.setTokens(
        tokenData.access_token,
        tokenData.refresh_token ?? this.config.refreshToken,
      );
      await this.onTokenUpdate?.({
        accessToken: this.config.accessToken!,
        refreshToken: this.config.refreshToken,
      });
      return true;
    } catch {
      return false;
    } finally {
      this.refreshing = false;
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (this.config.autoRefresh && this.isTokenExpired()) {
      const ok = await this.refreshAccessToken();
      if (!ok) {
        throw new Error("Schmooze access token refresh failed");
      }
    }
  }

  private schmzeHeaders(requestId: string): Record<string, string> {
    return {
      "schmze-app-session-id": this.sessionId,
      "schmze-app-platform": this.config.appPlatform,
      "schmze-app-version": this.config.appVersion,
      "schmze-app-device-id": this.config.deviceId,
      "schmze-request-id": requestId,
    };
  }

  async request<T = unknown>(
    method: HttpMethod,
    pathOrUrl: string,
    options: RequestOptions & {
      body?: Record<string, unknown> | unknown[] | null;
      query?: Record<string, string | number | boolean>;
      absoluteUrl?: boolean;
      authTokenOverride?: string;
    } = {},
    retry = true,
  ): Promise<ApiResponse<T>> {
    const omitTokenByPath =
      options.noAccessToken ??
      (!options.absoluteUrl && pathOmitsAccessToken(pathOrUrl.split("?")[0] ?? pathOrUrl));

    if (!omitTokenByPath && !options.noClientSignature && !options.authTokenOverride) {
      await this.ensureValidToken();
    }

    let url: string;
    if (options.absoluteUrl) {
      url = pathOrUrl;
    } else {
      const base = options.ironBank ? IRON_BANK_BASE : this.config.baseUrl;
      url = `${base}${pathOrUrl}`;
    }

    if (options.query) {
      const u = new URL(url);
      for (const [k, v] of Object.entries(options.query)) {
        u.searchParams.set(k, String(v));
      }
      url = u.toString();
    }

    const timestampMs = Date.now();
    let bodyStr: string | undefined;
    if (options.noBody) {
      bodyStr = undefined;
    } else if (options.bodyString !== undefined) {
      bodyStr = options.bodyString;
    } else if (options.body != null) {
      bodyStr = stableStringify(
        options.body as Record<string, unknown> | unknown[],
      );
    }

    const requestId = randomUUID();
    const headers: Record<string, string> = {
      accept: "application/json",
      "Accept-Encoding": "gzip",
      Connection: "Keep-Alive",
      "User-Agent": this.config.userAgent,
      ...this.schmzeHeaders(requestId),
    };

    if (!options.noClientSignature) {
      const requestHash = calculateRequestHash(
        method,
        url,
        bodyStr ?? null,
        timestampMs,
        this.config.hmacKey,
        this.config.magicConstant,
      );
      headers.clientsignature = createClientSignature(
        timestampMs,
        requestHash,
        this.config.jwtSecret,
        this.config.appVersion,
        this.config.appPlatform,
        this.config.deviceId,
      );
    }

    const authToken = options.authTokenOverride ?? this.config.accessToken;
    if (!omitTokenByPath && authToken) {
      headers.authorization = authToken;
    } else if (omitTokenByPath) {
      headers.authorization = authToken ?? "";
    }

    if (method !== "GET" && bodyStr !== undefined) {
      headers["Content-Type"] = options.contentType ?? "application/json";
    }

    if (!options.noClientSignature && !options.ironBank) {
      headers.session_id = this.sessionId;
      if (!options.absoluteUrl || url.includes("drogon.schmooze.tech")) {
        headers.Host = "drogon.schmooze.tech";
      }
    }

    const init: RequestInit = { method, headers };
    if (bodyStr !== undefined && method !== "GET") {
      init.body = bodyStr;
    }

    const response = await fetch(url, init);
    if (
      retry &&
      (response.status === 401 || response.status === 498) &&
      this.config.autoRefresh &&
      !omitTokenByPath
    ) {
      if (await this.refreshAccessToken()) {
        return this.request<T>(method, pathOrUrl, options, false);
      }
    }

    const text = await response.text();
    let json: ApiResponse<T>;
    try {
      json = JSON.parse(text) as ApiResponse<T>;
    } catch {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
      }
      throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`);
    }

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${json.message ?? text.slice(0, 200)}`,
      );
    }
    return json;
  }

  async requestRaw(
    method: HttpMethod,
    absoluteUrl: string,
    body: BodyInit,
    options: RequestOptions & { contentType: string } = { contentType: "application/json" },
  ): Promise<Response> {
    await this.ensureValidToken();
    const requestId = randomUUID();
    const headers: Record<string, string> = {
      "User-Agent": this.config.userAgent,
      "Accept-Encoding": "gzip",
      Connection: "Keep-Alive",
      "Content-Type": options.contentType,
      ...this.schmzeHeaders(requestId),
    };
    if (this.config.accessToken) {
      headers.authorization = this.config.accessToken;
    }
    return fetch(absoluteUrl, { method, headers, body });
  }
}
