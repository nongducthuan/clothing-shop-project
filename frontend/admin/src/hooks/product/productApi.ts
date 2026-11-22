// Client fetch mỏng dùng riêng cho trang quản lý sản phẩm.

const API_URL = import.meta.env.VITE_API_URL;

/** Số sản phẩm mỗi trang — khớp mặc định của GET /admin/products (backend chặn tối đa 100). */
export const PAGE_SIZE = 50;

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const productApi = {
  get: async (endpoint: string, options: ApiOptions = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      method: "GET",
      headers: { "Content-Type": "application/json", ...options.headers }
    });
    if (!res.ok) throw new Error("API Error");
    return { data: await res.json() };
  },
  post: async (endpoint: string, body: unknown, options: ApiOptions = {}) => {
    const isFormData = body instanceof FormData;
    const headers: Record<string, string> = { ...options.headers };
    if (!isFormData) headers["Content-Type"] = "application/json";

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      method: "POST",
      headers,
      body: isFormData ? body : JSON.stringify(body),
    });
    if (!res.ok) throw new Error("API Error");
    return { data: await res.json() };
  },
  put: async (endpoint: string, body: unknown, options: ApiOptions = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      method: "PUT",
      headers: { "Content-Type": "application/json", ...options.headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("API Error");
    return { data: await res.json() };
  },
  delete: async (endpoint: string, options: ApiOptions = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      method: "DELETE",
      headers: { ...options.headers }
    });
    if (!res.ok) throw new Error("API Error");
    return { data: await res.json() };
  }
};
