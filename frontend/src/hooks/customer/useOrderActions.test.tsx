// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const showToast = vi.fn();
vi.mock("../../context/ToastContext", () => ({ useToast: () => ({ showToast }) }));
vi.mock("../../context/LanguageContext", () => ({
  useLanguage: () => ({ t: (k: string) => k, translateApiMessage: (m?: string) => m }),
}));
vi.mock("../../services/apiClient", () => ({
  default: { post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import API from "../../services/apiClient";
import { useOrderActions } from "./useOrderActions";

const api = API as unknown as { post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

function setup(extra: Partial<Parameters<typeof useOrderActions>[0]> = {}) {
  const mocks = { setOrders: vi.fn(), setRepayBusy: vi.fn(), setCancelOrderBusy: vi.fn() };
  const opts = {
    ...mocks,
    messages: { repaySuccess: "repay_ok", repayError: "repay_fail" },
    ...extra,
  };
  return { mocks, ...renderHook(() => useOrderActions(opts)) };
}

beforeEach(() => {
  vi.clearAllMocks();
  window.confirm = vi.fn(() => true);
});

describe("useOrderActions — guest (có guestEmail)", () => {
  it("repay gửi email của đơn, fallback về email tra cứu, rồi gọi onRepaySuccess", async () => {
    api.post.mockResolvedValue({ data: { message: "ok" } });
    const onRepaySuccess = vi.fn();
    const { result, mocks } = setup({ guestEmail: "guest@x.com", onRepaySuccess });
    await act(() => result.current.handleRepay({ id: 7, payment_method: "COD" }, "MoMo"));
    expect(api.post).toHaveBeenCalledWith("/orders/7/repay", { email: "guest@x.com", new_payment_method: "MoMo" });
    expect(onRepaySuccess).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith("ok", "success");
    expect(mocks.setRepayBusy.mock.calls).toEqual([[true], [false]]);
  });

  it("hủy đơn gửi kèm email và bật/tắt trạng thái bận theo đơn", async () => {
    api.put.mockResolvedValue({ data: { payment_status: "Refunded" } });
    const { result, mocks } = setup({ guestEmail: "guest@x.com" });
    await act(() => result.current.handleCancelOrder(5));
    expect(api.put).toHaveBeenCalledWith("/orders/status", { order_id: 5, new_status: "Cancelled", email: "guest@x.com" });
    expect(showToast).toHaveBeenCalledWith("lookup.cancel_order_refund_note", "success");
    expect(mocks.setCancelOrderBusy.mock.calls).toEqual([[5], [null]]);
  });

  it("hủy yêu cầu trả hàng gửi email trong data và dùng loading riêng", async () => {
    api.delete.mockResolvedValue({});
    const setCancelReturnBusy = vi.fn();
    const { result, mocks } = setup({ guestEmail: "guest@x.com", setCancelReturnBusy });
    await act(() => result.current.handleCancelReturn(9));
    expect(api.delete).toHaveBeenCalledWith("/orders/9/return", { data: { email: "guest@x.com" } });
    expect(setCancelReturnBusy.mock.calls).toEqual([[true], [false]]);
    const updater = mocks.setOrders.mock.calls[0][0];
    expect(updater([{ id: 9, status: "Return Requested", return_request: {} }, { id: 1, status: "Delivered" }]))
      .toEqual([{ id: 9, status: "Delivered", return_request: null }, { id: 1, status: "Delivered" }]);
  });
});

describe("useOrderActions — user đã đăng nhập (không có guestEmail)", () => {
  it("repay chỉ gửi email trong đơn", async () => {
    api.post.mockResolvedValue({ data: {} });
    const { result } = setup();
    await act(() => result.current.handleRepay({ id: 3, email: "me@x.com", payment_method: "VNPay" }));
    expect(api.post).toHaveBeenCalledWith("/orders/3/repay", { email: "me@x.com", new_payment_method: "VNPay" });
    expect(showToast).toHaveBeenCalledWith("repay_ok", "success");
  });

  it("hủy đơn không gửi email và gọi onOrderChanged để tải lại danh sách", async () => {
    api.put.mockResolvedValue({ data: {} });
    const onOrderChanged = vi.fn();
    const { result } = setup({ onOrderChanged });
    await act(() => result.current.handleCancelOrder(4));
    expect(api.put).toHaveBeenCalledWith("/orders/status", { order_id: 4, new_status: "Cancelled" });
    expect(onOrderChanged).toHaveBeenCalled();
  });

  it("hủy trả hàng không gửi body, người dùng bấm Hủy ở confirm thì không gọi API", async () => {
    api.delete.mockResolvedValue({});
    const { result } = setup();
    await act(() => result.current.handleCancelReturn(2));
    expect(api.delete).toHaveBeenCalledWith("/orders/2/return", undefined);

    api.delete.mockClear();
    window.confirm = vi.fn(() => false);
    await act(() => result.current.handleCancelReturn(2));
    expect(api.delete).not.toHaveBeenCalled();
  });

  it("lỗi từ API hiện message của server hoặc message mặc định", async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: "Server says no" } } });
    const { result } = setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    await act(() => result.current.handleRepay({ id: 1 }));
    expect(showToast).toHaveBeenCalledWith("Server says no", "error");
    api.post.mockRejectedValueOnce(new Error("network"));
    await act(() => result.current.handleRepay({ id: 1 }));
    expect(showToast).toHaveBeenLastCalledWith("repay_fail", "error");
  });
});
