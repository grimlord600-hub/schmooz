import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateRequestHash, createClientSignature, stableStringify } from "../src/signing/index.js";

describe("signing parity with schmooze_api.py --verify-capture", () => {
  it("matches request hash for POST interact capture", () => {
    const tsMs = 1791386389 * 1000;
    const body = {
      meta: "ToDo",
      screen_time: 20.543,
      post_bucket: "top",
      tags: [],
      playback_duration: null,
    };
    const url = "https://drogon.schmooze.tech/v1/posts/interact/605586/right";
    const bodyStr = stableStringify(body);
    const hash = calculateRequestHash(
      "POST",
      url,
      bodyStr,
      tsMs,
      "b00b89993af92d1b1963177261649fff22f09f06e286bc4d3b0a89baf4fbe7ea",
      "&4fc6a4f3b1110317",
    );
    const expected =
      "43d84247b1ba3dc31e2ac780e0f3d3718195db5d924e6de26cbd370971996995";
    assert.equal(hash, expected);
    const sig = createClientSignature(
      tsMs,
      hash,
      "EVfzVIsOH2r59sz1bAjl55b35oGfFMucLnuUCyMPIJ92hCISmlJu7N8n6YKI80CrtcJKL2bCGq2r1KzzwW50YhXAWRmgonn6T22C9t8JQz5hjZIfhNBcPLyI9J1RVAYE",
      "5.2.9.1",
      "android",
      "ef105979d2496d9b",
    );
    assert.ok(sig.startsWith("eyJ"));
  });

  it("matches request hash for POST v3/auth/login (empty {} body → hash as empty)", () => {
    const tsMs = 1791388877 * 1000;
    const url = "https://drogon.schmooze.tech/v3/auth/login";
    const hash = calculateRequestHash(
      "POST",
      url,
      "{}",
      tsMs,
      "b00b89993af92d1b1963177261649fff22f09f06e286bc4d3b0a89baf4fbe7ea",
      "&4fc6a4f3b1110317",
    );
    assert.equal(
      hash,
      "197ab1c6090dcd261a0abadfc16d4fce2502b60ebb31606b5f3348d1bd4585e3",
    );
  });
});
