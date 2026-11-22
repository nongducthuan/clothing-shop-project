/**
 * imageUtils.ts
 *
 * Central utility for resolving image URLs throughout the application.
 */
import { getConfig } from "../config";

/** Fallback placeholder shown when image_url is empty or fails to load. */
export const PLACEHOLDER_IMG = "https://placehold.co/300x400?text=No+Image";

/**
 * Resolves a raw `image_url` value from the API into a full, usable URL.
 *
 * - If `url` is already an absolute URL (starts with "http"), it is returned as-is.
 * - If `url` is a relative path (e.g. `/uploads/abc.jpg`), it is prefixed with
 *   `imageUrl` so the browser can locate the static file on the server.
 * - If `url` is empty / null / undefined, the placeholder image URL is returned.
 *
 * @param url - The raw image_url string coming from the API response.
 * @returns A fully-qualified URL string ready to use in an <img src={}> attribute.
 */
export const getImageUrl = (url?: string | null): string => {
  if (!url || url === "null" || url === "undefined") return PLACEHOLDER_IMG;
  if (url.startsWith("http")) return url;
  const imageBase = getConfig().imageUrl || "";
  // Avoid double slashes: strip leading slash from url if imageBase already ends with one
  const base = imageBase.endsWith("/") ? imageBase.slice(0, -1) : imageBase;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
};
