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

    if ((status === 401 || status === 403) && !originalRequest._retry && !isRefreshRoute) {
      originalRequest._retry = true;

      try {
        // Deduplicate concurrent refresh calls
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
        refreshPromise = null;

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch {
        refreshPromise = null;
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
