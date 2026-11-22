// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLocation, useNavigate } from "@/lib/router";
import { setMockLocation } from "@/test/nextNavigationMock";

vi.mock("next/navigation", () => import("@/test/nextNavigationMock"));

function Probe() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <span data-testid="path">{location.pathname}</span>
      <span data-testid="state">{JSON.stringify(location.state)}</span>
      <button onClick={() => navigate("/checkout", { state: { voucher: "A" } })}>checkout</button>
      <button onClick={() => navigate("/cart")}>cart</button>
    </>
  );
}

describe("route state", () => {
  beforeEach(() => {
    sessionStorage.clear();
    setMockLocation("/cart");
  });

  it("is delivered on the target page", () => {
    render(<Probe />);
    fireEvent.click(screen.getByText("checkout"));
    expect(screen.getByTestId("path").textContent).toBe("/checkout");
    expect(screen.getByTestId("state").textContent).toBe('{"voucher":"A"}');
  });

  it("is dropped once the user leaves the target page", () => {
    render(<Probe />);
    fireEvent.click(screen.getByText("checkout"));
    fireEvent.click(screen.getByText("cart"));
    expect(screen.getByTestId("state").textContent).toBe("null");
    act(() => setMockLocation("/checkout"));
    expect(screen.getByTestId("state").textContent).toBe("null");
  });
});
