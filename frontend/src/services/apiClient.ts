import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

API.interceptors.request.use((config) => {
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
        // BUG #6 fix: Deduplicate concurrent refresh calls and don't null
        // the promise until the new token is fully persisted. This prevents
        // a third concurrent request from starting a second refresh after
        // the first resolves but before localStorage is updated.
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const storedRefreshToken = localStorage.getItem("refreshToken");
            if (!storedRefreshToken) throw new Error("No refresh token stored");

            const { data } = await axios.post(
              `${import.meta.env.VITE_API_URL}/auth/refresh`,
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
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
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
