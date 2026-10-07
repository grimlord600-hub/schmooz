import type { ApiResponse, PostInteractAction } from "../types.js";
import type { SchmoozeTransport } from "../http/transport.js";

export function createPostsApi(transport: SchmoozeTransport) {
  return {
    fetchPosts(v = true, leftInCache = 2): Promise<ApiResponse> {
      return transport.request("GET", "/v1/posts/fetch", {
        query: { v: String(v).toLowerCase(), left_in_cache: leftInCache },
      });
    },
    interact(
      postId: number,
      action: PostInteractAction,
      payload: Record<string, unknown>,
    ): Promise<ApiResponse> {
      return transport.request("POST", `/v1/posts/interact/${postId}/${action}`, {
        body: payload,
      });
    },
    relate(
      postId: number,
      payload: Record<string, unknown>,
    ): Promise<ApiResponse> {
      return this.interact(postId, "relate", payload);
    },
  };
}
