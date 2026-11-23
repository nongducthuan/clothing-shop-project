// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import API from "./apiClient";

let hrefSet: string | null;
let calls: string[];

function failWith401(config: InternalAxiosRequestConfig) {
  calls.push(String(config.url));
  const err = Object.assign(new Error("401"), {
    config,
    response: { status: 401, data: { message: "nope" }, config },
  });
  return Promise.reject(err);
}

beforeEach(() => {
  hrefSet = null;
  calls = [];
  localStorage.clear();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { set href(v: string) { hrefSet = v; }, get href() { return "http://x/"; } },
  });
  API.defaults.adapter = failWith401 as never;
});

afterEach(() => localStorage.clear());

describe("apiClient 401 handling", () => {
  it("leaves a wrong-password login alone (no reload, no refresh attempt)", async () => {
    await expect(API.post("http://api/auth/login", { identifier: "a", password: "b" })).rejects.toBeTruthy();
    expect(hrefSet).toBeNull();
    expect(calls).toEqual(["http://api/auth/login"]);
  });

  it("does not redirect guests whose request carried no token", async () => {
    await expect(API.get("http://api/orders")).rejects.toBeTruthy();
    expect(hrefSet).toBeNull();
  });

  it("still logs out when a token-carrying request 401s and refresh is impossible", async () => {
    localStorage.setItem("token", "expired");
    localStorage.setItem("user", "{}");
    await expect(API.get("http://api/auth/me")).rejects.toBeTruthy();
    expect(hrefSet).toBe("/login");
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("reuses the token another tab just refreshed instead of spending the single-use refresh token", async () => {
    localStorage.setItem("token", "old");
    localStorage.setItem("refreshToken", "rt-1");
    const seenAuth: string[] = [];
    API.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      seenAuth.push(String(config.headers?.Authorization));
      if (seenAuth.length === 1) {
        localStorage.setItem("token", "new"); // another tab refreshed meanwhile
        return failWith401(config);
      }
      return { status: 200, statusText: "OK", data: { ok: true }, headers: {}, config };
    }) as never;

    const res = await API.get("http://api/orders");
    expect(res.data).toEqual({ ok: true });
    expect(seenAuth).toEqual(["Bearer old", "Bearer new"]);
    expect(localStorage.getItem("refreshToken")).toBe("rt-1");
    expect(hrefSet).toBeNull();
  });
});
