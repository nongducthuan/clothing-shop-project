/**
 * Minimal in-memory stand-in for `next/navigation`, for tests.
 *
 * Usage in a test file:
 *   vi.mock("next/navigation", () => import("@/test/nextNavigationMock"));
 *   setMockLocation("/category/1", "/category/:id");
 *
 * `useNavigate()` from "@/lib/router" then pushes into this store, and
 * pathname / search params / route params update reactively.
 */
import { useSyncExternalStore } from "react";

let url = "/";
let pattern = "";
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version += 1;
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function useVersion() {
  return useSyncExternalStore(subscribe, () => version, () => version);
}

export function setMockLocation(initialUrl: string, routePattern = "") {
  url = initialUrl;
  pattern = routePattern;
  emit();
}

function parts() {
  const [pathname, search = ""] = url.split("?");
  return { pathname, search };
}

export function useRouter() {
  return {
    push: (to: string) => { url = to; emit(); },
    replace: (to: string) => { url = to; emit(); },
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  };
}

export function usePathname() {
  useVersion();
  return parts().pathname;
}

export function useSearchParams() {
  useVersion();
  return new URLSearchParams(parts().search);
}

export function useParams() {
  useVersion();
  const { pathname } = parts();
  const params: Record<string, string> = {};
  const p = pattern.split("/");
  const u = pathname.split("/");
  p.forEach((seg, i) => {
    if (seg.startsWith(":") && u[i] !== undefined) params[seg.slice(1)] = u[i];
  });
  return params;
}
