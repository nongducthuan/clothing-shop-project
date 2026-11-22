"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import NextLink from "next/link";
import {
  useRouter as useNextRouter,
  usePathname as useNextPathname,
  useSearchParams as useNextSearchParams,
  useParams as useNextParams,
} from "next/navigation";
import * as RRD from "react-router-dom";

function useSafeRouter() {
  try {
    return useNextRouter();
  } catch {
    return {
      push: () => {},
      replace: () => {},
      back: () => {},
      forward: () => {},
      refresh: () => {},
      prefetch: () => {},
    };
  }
}

function useSafeNextPathname() {
  try {
    return useNextPathname();
  } catch {
    return null;
  }
}

function useSafeRRDPathname() {
  try {
    const loc = RRD.useLocation();
    return loc?.pathname || "";
  } catch {
    return "";
  }
}

function useSafePathname() {
  const nextPath = useSafeNextPathname();
  const rrdPath = useSafeRRDPathname();
  return nextPath || rrdPath || "";
}

function useSafeSearchParams() {
  try {
    return useNextSearchParams();
  } catch {
    return null;
  }
}

function useSafeNextParams() {
  try {
    return useNextParams();
  } catch {
    return null;
  }
}

function useSafeRRDParams() {
  try {
    return RRD.useParams();
  } catch {
    return null;
  }
}

function useSafeParams() {
  const nextP = useSafeNextParams();
  const rrdP = useSafeRRDParams();
  if (nextP && Object.keys(nextP).length > 0) return nextP;
  if (rrdP && Object.keys(rrdP).length > 0) return rrdP;
  return {};
}

function useSafeRRDNavigate() {
  try {
    return RRD.useNavigate();
  } catch {
    return null;
  }
}

function useSafeRRDLocation() {
  try {
    return RRD.useLocation();
  } catch {
    return null;
  }
}

function useSafeRRDSearchParams() {
  try {
    return RRD.useSearchParams();
  } catch {
    return null;
  }
}

// 1. Link wrapper: accepts `to` prop and converts to `href`
export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string | { pathname?: string; search?: string; hash?: string };
  replace?: boolean;
  scroll?: boolean;
  state?: unknown;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, children, ...props }, ref) => {
    const href = typeof to === "string" ? to : `${to.pathname || ""}${to.search || ""}${to.hash || ""}`;
    return (
      <NextLink ref={ref} href={href} {...props}>
        {children}
      </NextLink>
    );
  }
);
Link.displayName = "Link";

// 2. NavLink wrapper
export interface NavLinkProps extends Omit<LinkProps, "className"> {
  end?: boolean;
  className?: string | ((props: { isActive: boolean }) => string);
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, className, end, children, ...props }, ref) => {
    const pathname = useSafePathname();
    const href = typeof to === "string" ? to : `${to.pathname || ""}${to.search || ""}${to.hash || ""}`;
    const isActive = pathname ? (end ? pathname === href : pathname.startsWith(href)) : false;

    const computedClass =
      typeof className === "function" ? className({ isActive }) : className;

    return (
      <NextLink ref={ref} href={href} className={computedClass} {...props}>
        {children}
      </NextLink>
    );
  }
);
NavLink.displayName = "NavLink";

// 3. useNavigate wrapper
export function useNavigate() {
  const router = useSafeRouter();
  const rrdNavigate = useSafeRRDNavigate();

  const navigate = useCallback(
    (to: string | number, options?: { replace?: boolean; state?: unknown }) => {
      if (rrdNavigate) {
        if (typeof to === "number") {
          rrdNavigate(to);
        } else {
          rrdNavigate(to, options as RRD.NavigateOptions);
        }
        return;
      }

      if (typeof to === "number") {
        if (to < 0) {
          router.back();
        } else {
          router.forward();
        }
        return;
      }
      if (options?.state !== undefined && typeof window !== "undefined") {
        try {
          sessionStorage.setItem("next_router_state", JSON.stringify(options.state));
        } catch {}
      }
      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    },
    [router, rrdNavigate]
  );

  return navigate;
}

// 4. useParams wrapper
export function useParams<T extends Record<string, string | string[]> = Record<string, string>>(): T {
  const params = useSafeParams();
  return params as T;
}

// 5. useLocation wrapper
export function useLocation() {
  const rrdLocation = useSafeRRDLocation();
  const pathname = useSafePathname();
  const [search, setSearch] = useState("");
  const [state, setState] = useState<unknown>(null);

  useEffect(() => {
    if (rrdLocation) return;
    if (typeof window !== "undefined") {
      setSearch(window.location.search);
      try {
        const stored = sessionStorage.getItem("next_router_state");
        if (stored) {
          setState(JSON.parse(stored));
        }
      } catch {}
    }
  }, [pathname, rrdLocation]);

  return useMemo(() => {
    if (rrdLocation) {
      return rrdLocation;
    }
    return { pathname, search, hash: "", state, key: "default" };
  }, [rrdLocation, pathname, search, state]);
}

// 6. useSearchParams wrapper
export function useSearchParams(): [URLSearchParams, (params: URLSearchParams | Record<string, string>) => void] {
  const rrdSearchParams = useSafeRRDSearchParams();
  const nextSearchParams = useSafeSearchParams();
  const router = useSafeRouter();
  const pathname = useSafePathname();

  const searchParams = useMemo(() => {
    if (rrdSearchParams) {
      return rrdSearchParams[0];
    }
    if (nextSearchParams) {
      return new URLSearchParams(nextSearchParams.toString());
    }
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  }, [rrdSearchParams, nextSearchParams]);

  const setSearchParams = useCallback(
    (newParams: URLSearchParams | Record<string, string>) => {
      if (rrdSearchParams) {
        rrdSearchParams[1](newParams as Parameters<ReturnType<typeof RRD.useSearchParams>[1]>[0]);
        return;
      }
      const sp = newParams instanceof URLSearchParams ? newParams : new URLSearchParams(newParams);
      const query = sp.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`);
    },
    [rrdSearchParams, router, pathname]
  );

  return [searchParams, setSearchParams];
}

// 7. Navigate component wrapper
export function Navigate({ to, replace = true }: { to: string; replace?: boolean }) {
  const router = useSafeRouter();
  const rrdNavigate = useSafeRRDNavigate();
  useEffect(() => {
    if (rrdNavigate) {
      rrdNavigate(to, { replace });
      return;
    }
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [router, rrdNavigate, to, replace]);
  return null;
}
