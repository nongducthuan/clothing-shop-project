import axios from "axios";

// Create an Axios instance with base configuration
const API = axios.create({
  baseURL: "http://localhost:5000",
});

// Request interceptor to attach authentication token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    // Ensure the Authorization header follows the "Bearer <token>" format
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
