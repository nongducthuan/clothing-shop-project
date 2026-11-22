import { describe, expect, it } from "vitest";
import { buildLoginPath, getSafeRedirect } from "./redirectUtils";

describe("getSafeRedirect", () => {
  it("keeps same-origin paths with query and hash", () => {
    expect(getSafeRedirect("/orders")).toBe("/orders");
    expect(getSafeRedirect("/profile?tab=orders#x")).toBe("/profile?tab=orders#x");
  });

  it("falls back for empty, external or malformed targets", () => {
    for (const bad of [null, undefined, "", "orders", "//evil.com", "https://evil.com", "/\\evil.com", "/a\nb", "javascript:alert(1)"]) {
      expect(getSafeRedirect(bad)).toBe("/");
    }
  });

  it("never redirects back to the login page", () => {
    expect(getSafeRedirect("/login")).toBe("/");
    expect(getSafeRedirect("/login?redirect=/x", "/home")).toBe("/home");
  });
});

describe("buildLoginPath", () => {
  it("encodes the target", () => {
    expect(buildLoginPath("/profile?tab=orders")).toBe("/login?redirect=%2Fprofile%3Ftab%3Dorders");
  });
  it("omits the param for unsafe or login targets", () => {
    expect(buildLoginPath("//evil.com")).toBe("/login");
    expect(buildLoginPath("/login")).toBe("/login");
  });
});
