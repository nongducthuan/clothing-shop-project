/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AIMessage from "../AIMessage";
import { LanguageContext, type LanguageContextType } from "@shop/shared/context/LanguageContext";

vi.mock("next/navigation", () => import("@/test/nextNavigationMock"));

const languageContext = {
  t: (_key: string, fallback?: string) => fallback ?? _key,
} as LanguageContextType;

function renderMessage(content: string) {
  return render(
    <LanguageContext.Provider value={languageContext}>
      <AIMessage role="ai" content={content} />
    </LanguageContext.Provider>,
  );
}

describe("AIMessage product links", () => {
  it("shows the product name as the link instead of exposing its path", () => {
    const { container } = renderMessage(
      "Mình gợi ý bạn tham khảo [Quần Tây Nữ Cạp Cao Ống Rộng](/products/8), hiện có giá 320.000đ.",
    );

    expect(screen.getByRole("link", { name: "Quần Tây Nữ Cạp Cao Ống Rộng" }).getAttribute("href"))
      .toBe("/products/8");
    expect(container.textContent).toContain("320.000đ");
    expect(container.textContent).not.toContain("/products/8");
    expect(container.textContent).not.toContain("[Quần Tây");
  });

  it("repairs a product link when the AI puts its path on the next line", () => {
    const { container } = renderMessage(
      "- [Quần Short Unisex Cotton Twill Cổ Điển]\n  (/products/36) - 250.000đ",
    );

    expect(screen.getByRole("link", { name: "Quần Short Unisex Cotton Twill Cổ Điển" }).getAttribute("href"))
      .toBe("/products/36");
    expect(container.textContent).toContain("250.000đ");
    expect(container.textContent).not.toContain("/products/36");
  });
});
