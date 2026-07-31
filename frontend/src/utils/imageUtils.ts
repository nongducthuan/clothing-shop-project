/**
 * imageUtils.ts
 *
 * Central utility for resolving image URLs throughout the application.
 *
 * Background:
 *   - The backend stores images as relative paths (e.g. `/uploads/abc.jpg`).
 *   - Static files are served from the server root, NOT from /api.
 *   - Therefore we need VITE_IMAGE_URL (http://localhost:5000) to build the
 *     full URL, not VITE_API_URL (http://localhost:5000/api).
 *
 * Usage:
 *   import { getImageUrl } from "@/utils/imageUtils";
 *   <img src={getImageUrl(product.image_url)} />
 */

const IMAGE_BASE = import.meta.env.VITE_IMAGE_URL as string;

/** Fallback placeholder shown when image_url is empty or fails to load. */
export const PLACEHOLDER_IMG = "https://placehold.co/300x400?text=No+Image";

/**
 * Resolves a raw `image_url` value from the API into a full, usable URL.
 *
 * - If `url` is already an absolute URL (starts with "http"), it is returned as-is.
 * - If `url` is a relative path (e.g. `/uploads/abc.jpg`), it is prefixed with
 *   `VITE_IMAGE_URL` so the browser can locate the static file on the server.
 * - If `url` is empty / null / undefined, the placeholder image URL is returned.
 *
 * @param url - The raw image_url string coming from the API response.
 * @returns A fully-qualified URL string ready to use in an <img src={}> attribute.
 */
export const getImageUrl = (url?: string | null): string => {
  if (!url) return PLACEHOLDER_IMG;
  if (url.startsWith("http")) return url;
  // Avoid double slashes: strip leading slash from url if IMAGE_BASE already ends with one
  const base = IMAGE_BASE.endsWith("/") ? IMAGE_BASE.slice(0, -1) : IMAGE_BASE;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
};
