import type { ApiResponse } from "../types.js";
import type { SchmoozeTransport } from "../http/transport.js";

export function createCommunitiesApi(transport: SchmoozeTransport) {
  return {
    available(): Promise<ApiResponse> {
      return transport.request("GET", "/v1/communities/available");
    },
  };
}

export function createTagsApi(transport: SchmoozeTransport) {
  return {
    seedsV1(body: Record<string, unknown> = {}): Promise<ApiResponse> {
      return transport.request("POST", "/v1/tags/seeds", { body });
    },
    seedsV3(): Promise<ApiResponse> {
      return transport.request("GET", "/v3/tags/seeds");
    },
  };
}

export function createChatApi(transport: SchmoozeTransport) {
  return {
    customerSupportChatroom(): Promise<ApiResponse> {
      return transport.request("GET", "/v1/chat/customer-support/chatroom");
    },
  };
}

export function createReferralApi(transport: SchmoozeTransport) {
  return {
    cardMe(): Promise<ApiResponse> {
      return transport.request("GET", "/v1/referral/card/me");
    },
  };
}

export function createNotificationsApi(transport: SchmoozeTransport) {
  return {
    androidChannelGroups(): Promise<ApiResponse> {
      return transport.request("GET", "/v1/notification/android/channel-groups");
    },
  };
}

export function createInsightsApi(transport: SchmoozeTransport) {
  return {
    memeInsightsAll(): Promise<ApiResponse> {
      return transport.request("GET", "/v2/meme-insights/me/all");
    },
  };
}

export function createIapApi(transport: SchmoozeTransport) {
  return {
    productScreens(): Promise<ApiResponse> {
      return transport.request("GET", "/v1/products/screens", { ironBank: true });
    },
    purchasedItemsAvailable(): Promise<ApiResponse> {
      return transport.request("GET", "/v1/products/purchased/items/available", {
        ironBank: true,
      });
    },
  };
}

export function createAssetsApi(transport: SchmoozeTransport) {
  return {
    getThirdPartyAsset(assetPath: string): Promise<ApiResponse> {
      const path = assetPath.startsWith("/")
        ? assetPath
        : `/v1/third-party/s3/${assetPath}`;
      return transport.request("GET", path);
    },
  };
}
