import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getConfig } from "../config";
import { buildLoginPath } from "../utils/redirectUtils";

const API: AxiosInstance = axios.create();

API.interceptors.request.use((config) => {
  if (!config.baseURL) {
    config.baseURL = getConfig().apiUrl;
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const lang = localStorage.getItem("language") || "vi";
    config.headers["Accept-Language"] = lang;
    const guestAccessToken = sessionStorage.getItem("guestOrderAccessToken");
    if (guestAccessToken) {
      config.headers["X-Guest-Order-Access"] = guestAccessToken;
    }
  }

  return config;
});

// Serialise refreshes across browser tabs (Web Locks API); falls back to running directly.
function runExclusiveAcrossTabs<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  return locks ? (locks.request("shop-token-refresh", task) as Promise<T>) : task();
}

// Track an in-flight refresh to avoid parallel refresh calls
let refreshPromise: Promise<string> | null = null;

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined =
      error.config;
    if (!originalRequest) return Promise.reject(error);

    const status = error.response?.status;
    // Login/register/refresh answer 401 for "wrong credentials" / "bad refresh token",
    // not "expired access token": refreshing and redirecting there reloads the page
    // and wipes the error message the user is meant to see.
    const isAuthRoute = /\/auth\/(login|register|refresh)(?:[/?#]|$)/.test(originalRequest.url ?? "");
    // Only a request that carried a token can have an expired session.
    const hadAuthHeader = Boolean(originalRequest.headers?.Authorization);

    if (status === 401 && !originalRequest._retry && !isAuthRoute && hadAuthHeader) {
      originalRequest._retry = true;

      try {
        // Deduplicate concurrent refresh calls and don't null
        // the promise until the new token is fully persisted. This prevents
        // a third concurrent request from starting a second refresh after
        // the first resolves but before localStorage is updated.
        if (!refreshPromise) {
          const failedToken = String(originalRequest.headers?.Authorization ?? "").replace(/^Bearer\s+/i, "");
          refreshPromise = runExclusiveAcrossTabs(async () => {
            if (typeof window === "undefined") {
              throw new Error("Cannot refresh token on server");
            }
            // Refresh tokens are single-use. If another tab already refreshed while we
            // waited for the lock, reuse its result instead of spending a stale token
            // (which the server would reject and log this user out everywhere).
            const currentToken = localStorage.getItem("token");
            if (currentToken && currentToken !== "null" && currentToken !== failedToken) return currentToken;

            const storedRefreshToken = localStorage.getItem("refreshToken");
            if (!storedRefreshToken) throw new Error("No refresh token stored");

            const apiUrl = getConfig().apiUrl;
            const { data } = await axios.post(
              `${apiUrl}/auth/refresh`,
              { refreshToken: storedRefreshToken }
            );
            localStorage.setItem("token", data.token);
            localStorage.setItem("refreshToken", data.refreshToken);
            return data.token as string;
          }).finally(() => {
            refreshPromise = null;
          });
        }

        const newToken = await refreshPromise;

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          const target = buildLoginPath(`${window.location.pathname}${window.location.search}${window.location.hash}`);
          window.location.href = target;
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
