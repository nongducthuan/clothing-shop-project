import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getConfig } from "../config";

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

// Track an in-flight refresh to avoid parallel refresh calls
let refreshPromise: Promise<string> | null = null;

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: InternalAxiosRequestConfig & { _retry?: boolean } =
      error.config;

    const status = error.response?.status;
    const isRefreshRoute = originalRequest?.url?.includes("/auth/refresh");

    if (status === 401 && !originalRequest._retry && !isRefreshRoute) {
      originalRequest._retry = true;

      try {
        // Deduplicate concurrent refresh calls and don't null
        // the promise until the new token is fully persisted. This prevents
        // a third concurrent request from starting a second refresh after
        // the first resolves but before localStorage is updated.
        if (!refreshPromise) {
          refreshPromise = (async () => {
            if (typeof window === "undefined") {
              throw new Error("Cannot refresh token on server");
            }
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
          })();
        }

        const newToken = await refreshPromise;

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      } finally {
        // Clear the promise only after everything is done (success or failure)
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
