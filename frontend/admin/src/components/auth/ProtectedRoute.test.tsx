// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthContextType } from "@shop/shared/context/AuthContext";
import { LanguageProvider } from "@shop/shared/context/LanguageProvider";
import type { User } from "@shop/shared/types";
import ProtectedRoute from "./ProtectedRoute";

function LoginProbe() {
  const loc = useLocation();
  return <span data-testid="login">{loc.pathname + loc.search}</span>;
}

function renderAt(path: string, user: Partial<User> | null, logout = vi.fn()) {
  const ctx = { user, logout } as unknown as AuthContextType;
  render(
    <LanguageProvider>
      <AuthContext.Provider value={ctx}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/login" element={<LoginProbe />} />
            <Route path="/orders" element={<ProtectedRoute roleRequired="admin"><span>secret</span></ProtectedRoute>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </LanguageProvider>,
  );
  return logout;
}

describe("admin ProtectedRoute", () => {
  it("sends anonymous visitors to login and remembers the target", () => {
    renderAt("/orders?status=pending", null);
    expect(screen.getByTestId("login").textContent).toBe("/login?redirect=%2Forders%3Fstatus%3Dpending");
  });

  it("renders children for admins", () => {
    renderAt("/orders", { role: "admin" });
    expect(screen.getByText("secret")).toBeTruthy();
  });

  it("shows a translated no-access screen with a logout button for other roles", () => {
    const logout = renderAt("/orders", { role: "user" });
    expect(screen.queryByText("secret")).toBeNull();
    fireEvent.click(screen.getByRole("button"));
    expect(logout).toHaveBeenCalled();
  });
});
