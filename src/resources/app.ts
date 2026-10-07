import type { ApiResponse } from "../types.js";
import type { SchmoozeTransport } from "../http/transport.js";

export function createAppApi(transport: SchmoozeTransport) {
  return {
    getConfig(): Promise<ApiResponse> {
      return transport.request("GET", "/app/config");
    },
    getCurrentTime(): Promise<ApiResponse> {
      return transport.request("GET", "/app/current-time");
    },
    getReportProfile(): Promise<ApiResponse> {
      return transport.request("GET", "/app/config/report-profile");
    },
    getAssets(body: Record<string, unknown> = {}): Promise<ApiResponse> {
      return transport.request("POST", "/v2/app/assets", { body });
    },
  };
}
