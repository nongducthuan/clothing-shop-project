/**
 * Helpers for "return to where you were" after login.
 * Only same-origin relative paths are accepted, to avoid open redirects.
 */

export const REDIRECT_PARAM = "redirect";

export function getSafeRedirect(value: string | null | undefined, fallback = "/"): string {
  if (!value || typeof value !== "string") return fallback;
  // Must be a single-slash relative path: no protocol-relative (//), no backslash tricks, no control chars.
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  const pathOnly = value.split(/[?#]/)[0];
  if (pathOnly === "/login") return fallback;
  return value;
}

export function buildLoginPath(from: string): string {
  const safe = getSafeRedirect(from, "");
  return safe ? `/login?${REDIRECT_PARAM}=${encodeURIComponent(safe)}` : "/login";
}
