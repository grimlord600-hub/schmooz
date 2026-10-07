import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatContactNo } from "../src/auth/phone.js";

describe("formatContactNo", () => {
  it("prefixes Indian local numbers", () => {
    assert.equal(formatContactNo("8941924458", "+91"), "+918941924458");
  });
  it("keeps E.164", () => {
    assert.equal(formatContactNo("+918941924458", "+91"), "+918941924458");
  });
});
