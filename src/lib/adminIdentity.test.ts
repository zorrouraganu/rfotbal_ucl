import { describe, expect, it } from "vitest";
import { isAdminUsername, normalizeRedditUsername } from "@/lib/adminIdentity";

describe("Reddit admin identity", () => {
  it("normalizes Reddit prefixes and casing", () => {
    expect(normalizeRedditUsername("u/SatiBagiPula")).toBe("satibagipula");
    expect(isAdminUsername("@SATIBAGIPULA")).toBe(true);
  });
  it("rejects every other Reddit user", () => expect(isAdminUsername("lorenzzo")).toBe(false));
});
