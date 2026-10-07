import type { ApiResponse } from "../types.js";
import type { SchmoozeTransport } from "../http/transport.js";

export function createMatchesApi(transport: SchmoozeTransport) {
  return {
    pendingMatches(): Promise<ApiResponse> {
      return transport.request("GET", "/v4/matches/pending-match");
    },
    pendingShortcut(): Promise<ApiResponse> {
      return transport.request("GET", "/v4/matches/pending-match/shortcut");
    },
    schmoozedYou(): Promise<ApiResponse> {
      return transport.request("GET", "/v7/matches/schmoozed-you");
    },
    curatedForYou(): Promise<ApiResponse> {
      return transport.request(
        "GET",
        "/v1/matches/pending-match/oracle/curated-for-you",
      );
    },
    revealCurated(userId: number, curationId: string): Promise<ApiResponse> {
      return transport.request(
        "GET",
        `/v1/matches/pending-match/oracle/reveal/${userId}`,
        { query: { curation_id: curationId } },
      );
    },
    nlsSearchSuggestions(): Promise<ApiResponse> {
      return transport.request(
        "GET",
        "/v1/matches/pending-match/nls/search-suggestions",
      );
    },
    pokeSuggestions(): Promise<ApiResponse> {
      return transport.request("GET", "/v1/matches/poke/suggestions");
    },
    matchEquation(): Promise<ApiResponse> {
      return transport.request("GET", "/v1/matches/match_equation");
    },
    matchAction(
      userId: number,
      payload: Record<string, unknown>,
    ): Promise<ApiResponse> {
      return transport.request("POST", `/v1/matches/${userId}/action`, {
        body: payload,
      });
    },
    defaultMatchAction(
      userId: number,
      status = true,
      matchReaction = "schmooze",
      screenType = "PENDING_MATCH",
      screenTimeMs = 8000,
      isSuperliked = false,
    ): Promise<ApiResponse> {
      return this.matchAction(userId, {
        status,
        match_reaction: matchReaction,
        screen_type: screenType,
        screen_time_ms: screenTimeMs,
        user_actions: { is_superliked: isSuperliked },
        compliment_buy_drop_off_nudge_meta: { nudge_shown: false },
      });
    },
  };
}
