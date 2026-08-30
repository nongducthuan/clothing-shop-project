import axios, { AxiosInstance } from "axios";

// Create an Axios instance with base configuration
const API: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor to attach authentication token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && token !== "null") {
    // Ensure the Authorization header follows the "Bearer <token>" format
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
