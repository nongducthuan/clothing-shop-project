"use client";

/**
 * Thin react-router-style facade over the Next.js App Router.
 * Keeps the `to`-based API used across the app (Link, NavLink, useNavigate,
 * useLocation, useSearchParams, ...) while delegating everything to
 * next/navigation. It must be rendered inside the Next app router
 * (tests mock `next/navigation`, see src/test/nextNavigationMock.tsx).
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import {
  useRouter,
  usePathname,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from "next/navigation";

const ROUTER_STATE_KEY = "next_router_state";

type To = string | { pathname?: string; search?: string; hash?: string };

/**
 * Route state (the `state` option of navigate) is kept in sessionStorage as
 * { path, state } and only handed back on the page it was sent to. It is
 * dropped as soon as the user is on any other page, so it can't resurface later.
 */
function writeRouterState(to: string, state: unknown) {
  try {
    sessionStorage.setItem(ROUTER_STATE_KEY, JSON.stringify({ path: to.split(/[?#]/)[0], state }));
  } catch {}
}

function readRouterState(pathname: string): unknown {
  try {
    const stored = sessionStorage.getItem(ROUTER_STATE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { path?: string; state?: unknown };
    if (parsed?.path === pathname) return parsed.state ?? null;
    sessionStorage.removeItem(ROUTER_STATE_KEY);
  } catch {
    try { sessionStorage.removeItem(ROUTER_STATE_KEY); } catch {}
  }
  return null;
}

function toHref(to: To): string {
  return typeof to === "string" ? to : `${to.pathname || ""}${to.search || ""}${to.hash || ""}`;
}

export { usePathname } from "next/navigation";

// 1. Link: accepts `to` and converts it to `href`
export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: To;
  replace?: boolean;
  scroll?: boolean;
  state?: unknown;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, children, ...props }, ref) => (
    <NextLink ref={ref} href={toHref(to)} {...props}>
      {children}
    </NextLink>
  )
);
Link.displayName = "Link";

// 2. NavLink
export interface NavLinkProps extends Omit<LinkProps, "className"> {
  end?: boolean;
  className?: string | ((props: { isActive: boolean }) => string);
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, className, end, children, ...props }, ref) => {
    const pathname = usePathname() ?? "";
    const href = toHref(to);
    const isActive = pathname ? (end ? pathname === href : pathname.startsWith(href)) : false;
    const computedClass = typeof className === "function" ? className({ isActive }) : className;

    return (
      <NextLink ref={ref} href={href} className={computedClass} {...props}>
        {children}
      </NextLink>
    );
  }
);
NavLink.displayName = "NavLink";

// 3. useNavigate
export function useNavigate() {
  const router = useRouter();

  return useCallback(
    (to: string | number, options?: { replace?: boolean; state?: unknown }) => {
      if (typeof to === "number") {
        if (to < 0) router.back();
        else router.forward();
        return;
      }
      if (options?.state !== undefined && typeof window !== "undefined") {
        writeRouterState(to, options.state);
      }
      if (options?.replace) router.replace(to);
      else router.push(to);
    },
    [router]
  );
}

// 4. useParams
export function useParams<T extends Record<string, string | string[]> = Record<string, string>>(): T {
  return (useNextParams() ?? {}) as T;
}

// 5. useLocation
export function useLocation() {
  const pathname = usePathname() ?? "";
  const nextSearchParams = useNextSearchParams();
  const search = useMemo(() => {
    const s = nextSearchParams?.toString();
    return s ? `?${s}` : "";
  }, [nextSearchParams]);
  const [state, setState] = useState<unknown>(null);

  useEffect(() => {
    setState(readRouterState(pathname));
  }, [pathname]);

  return useMemo(
    () => ({ pathname, search, hash: "", state, key: "default" }),
    [pathname, search, state]
  );
}

// 6. useSearchParams
export function useSearchParams(): [URLSearchParams, (params: URLSearchParams | Record<string, string>) => void] {
  const nextSearchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const searchParams = useMemo(
    () => new URLSearchParams(nextSearchParams?.toString() ?? ""),
    [nextSearchParams]
  );

  const setSearchParams = useCallback(
    (newParams: URLSearchParams | Record<string, string>) => {
      const query = new URLSearchParams(newParams).toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`);
    },
    [router, pathname]
  );

  return [searchParams, setSearchParams];
}

// 7. Navigate component
export function Navigate({ to, replace = true }: { to: string; replace?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [router, to, replace]);
  return null;
}
