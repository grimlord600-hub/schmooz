import type { SchmoozeConfig } from "./types.js";
import { SchmoozeTransport, type TokenUpdateHandler } from "./http/transport.js";
import { createAppApi } from "./resources/app.js";
import { createPostsApi } from "./resources/posts.js";
import { createMatchesApi } from "./resources/matches.js";
import { createUsersApi } from "./resources/users.js";
import {
  createAssetsApi,
  createChatApi,
  createCommunitiesApi,
  createIapApi,
  createInsightsApi,
  createNotificationsApi,
  createReferralApi,
  createTagsApi,
} from "./resources/misc.js";
import { TelemetryClient } from "./telemetry/client.js";
import * as authFlow from "./auth/login-flow.js";
import * as otp from "./auth/otp.js";
import * as firebase from "./auth/firebase.js";

export class SchmoozeClient {
  readonly transport: SchmoozeTransport;
  readonly app: ReturnType<typeof createAppApi>;
  readonly posts: ReturnType<typeof createPostsApi>;
  readonly matches: ReturnType<typeof createMatchesApi>;
  readonly users: ReturnType<typeof createUsersApi>;
  readonly communities: ReturnType<typeof createCommunitiesApi>;
  readonly tags: ReturnType<typeof createTagsApi>;
  readonly chat: ReturnType<typeof createChatApi>;
  readonly referral: ReturnType<typeof createReferralApi>;
  readonly notifications: ReturnType<typeof createNotificationsApi>;
  readonly insights: ReturnType<typeof createInsightsApi>;
  readonly iap: ReturnType<typeof createIapApi>;
  readonly assets: ReturnType<typeof createAssetsApi>;
  readonly telemetry: TelemetryClient;

  readonly auth = {
    sendOtp: (p: Parameters<typeof otp.sendOtp>[1]) => otp.sendOtp(this.transport, p),
    verifyOtp: (p: Parameters<typeof otp.verifyOtp>[1]) => otp.verifyOtp(this.transport, p),
    authorize: (p: Parameters<typeof authFlow.authorize>[1]) =>
      authFlow.authorize(this.transport, p),
    signIn: (token: string) => authFlow.signIn(this.transport, token),
    loginWithPhoneAndGoogle: (p: Parameters<typeof authFlow.loginWithPhoneAndGoogle>[1]) =>
      authFlow.loginWithPhoneAndGoogle(this.transport, p),
    loginWithPhoneOtp: (p: Parameters<typeof authFlow.loginWithPhoneOtp>[1]) =>
      authFlow.loginWithPhoneOtp(this.transport, p),
    completeSession: (options?: Parameters<typeof authFlow.completeSession>[1]) =>
      authFlow.completeSession(this.transport, options),
    logout: () => authFlow.logout(this.transport),
    rotateRefreshTokens: () => authFlow.rotateRefreshTokens(this.transport),
    connectedAccounts: (body?: Record<string, unknown>) =>
      authFlow.connectedAccounts(this.transport, body),
    verifyCustomToken: (token: string) =>
      firebase.verifyCustomToken(this.config, token),
    getAccountInfo: (idToken: string) =>
      firebase.getAccountInfo(this.config, idToken),
  };

  constructor(config: SchmoozeConfig, onTokenUpdate?: TokenUpdateHandler) {
    this.transport = new SchmoozeTransport(config, onTokenUpdate);
    this.app = createAppApi(this.transport);
    this.posts = createPostsApi(this.transport);
    this.matches = createMatchesApi(this.transport);
    this.users = createUsersApi(this.transport);
    this.communities = createCommunitiesApi(this.transport);
    this.tags = createTagsApi(this.transport);
    this.chat = createChatApi(this.transport);
    this.referral = createReferralApi(this.transport);
    this.notifications = createNotificationsApi(this.transport);
    this.insights = createInsightsApi(this.transport);
    this.iap = createIapApi(this.transport);
    this.assets = createAssetsApi(this.transport);
    this.telemetry = new TelemetryClient(this.transport);
  }

  get config(): SchmoozeConfig {
    return this.transport.config;
  }

  setTokens(accessToken: string, refreshToken?: string): void {
    this.transport.setTokens(accessToken, refreshToken);
  }
}
