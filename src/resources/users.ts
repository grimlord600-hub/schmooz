import type { ApiResponse } from "../types.js";
import type { SchmoozeTransport } from "../http/transport.js";
import { buildRegisterDevicePayload, buildWelcomeBody } from "../device/details.js";

export function createUsersApi(transport: SchmoozeTransport) {
  return {
    welcome(phoneNumber?: string): Promise<ApiResponse> {
      return transport.request("POST", "/v3/users/welcome", {
        body: buildWelcomeBody(transport.config, { phoneNumber }),
        noAccessToken: true,
      });
    },
    sessionStart(): Promise<ApiResponse> {
      return transport.request("POST", "/v2/users/session/start", { noBody: true });
    },
    sessionHeartbeat(body: Record<string, unknown> = {}): Promise<ApiResponse> {
      return transport.request("POST", "/v2/users/session/heartbeat", { body });
    },
    registerDevice(options?: { fcmToken?: string }): Promise<ApiResponse> {
      return transport.request("POST", "/v2/users/devices/register", {
        body: buildRegisterDevicePayload(transport.config, options),
      });
    },
    getProfileMe(): Promise<ApiResponse> {
      return transport.request("GET", "/v4/users/profiles/me");
    },
    updateProfileMe(body: Record<string, unknown>): Promise<ApiResponse> {
      return transport.request("POST", "/v4/users/profiles/me", { body });
    },
    viewProfiles(
      otherUserIds: number[],
      flowName = "MATCH_REC_VIEW",
    ): Promise<ApiResponse> {
      return transport.request("POST", "/v3/users/profiles/view", {
        body: { flow_name: flowName, other_user_ids: otherUserIds },
      });
    },
    forceUpdate(): Promise<ApiResponse> {
      return transport.request("GET", "/v2/users/force-update");
    },
    noAuthForceUpdate(): Promise<ApiResponse> {
      return transport.request("GET", "/v2/users/no-auth-force-update", {
        noAccessToken: true,
      });
    },
  };
}
