import axios, { AxiosInstance } from "axios";

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

export default API;
