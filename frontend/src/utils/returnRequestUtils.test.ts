import { describe, it, expect } from "vitest";
import { buildReturnItems, buildReturnFormData, buildOptimisticReturnRequest } from "./returnRequestUtils";

const items = [
  { id: 1, product_id: 10, quantity: 2, price: 100000, payable_amount: 180000, is_gift: false, product_name: "Áo X" },
  { id: 2, product_id: 20, quantity: 1, price: 50000, payable_amount: 50000, is_gift: false, product_name: "Quần" },
  { id: 3, product_id: 30, quantity: 1, price: 0, payable_amount: 0, is_gift: true, promotion: { buy_product_id: 10 }, product_name: "Quà Y" },
];

describe("buildReturnItems", () => {
  it("bỏ qua dòng không tick và dòng quà tặng", () => {
    const res = buildReturnItems(
      { 1: { selected: false, return_quantity: 1 }, 2: { selected: true, return_quantity: 1 }, 3: { selected: false, return_quantity: 1 } },
      items
    );
    expect(res).toEqual([{ order_item_id: 2, return_quantity: 1 }]);
  });

  it("sản phẩm X của Buy X Get Y bắt buộc trả đủ số lượng", () => {
    const res = buildReturnItems({ 1: { selected: true, return_quantity: 1 } }, items);
    expect(res).toEqual([{ order_item_id: 1, return_quantity: 2 }]);
  });

  it("số lượng không hợp lệ rơi về 1; không có selectedItems → rỗng", () => {
    expect(buildReturnItems({ 2: { selected: true, return_quantity: "" } }, items)).toEqual([{ order_item_id: 2, return_quantity: 1 }]);
    expect(buildReturnItems(undefined, items)).toEqual([]);
  });
});

describe("buildReturnFormData", () => {
  it("dùng đúng tên field ngân hàng được truyền vào", () => {
    const fd = buildReturnFormData({
      reasonCode: "damaged", description: "vỡ", email: "a@b.c",
      returnItems: [{ order_item_id: 2, return_quantity: 1 }],
      bankInfo: { name: "VCB", acc: "123", owner: "A" },
      bankFieldName: "bankInfo",
    });
    expect(fd.get("reason_code")).toBe("damaged");
    expect(fd.get("email")).toBe("a@b.c");
    expect(JSON.parse(fd.get("bankInfo") as string)).toEqual({ name: "VCB", acc: "123", owner: "A" });
    expect(fd.get("refund_bank_info")).toBeNull();
    expect(JSON.parse(fd.get("returnItems") as string)).toEqual([{ order_item_id: 2, return_quantity: 1 }]);
  });
});

describe("buildOptimisticReturnRequest", () => {
  it("trả một phần: tính tiền hoàn theo payable_amount, không gom quà khi X không được trả", () => {
    const rr = buildOptimisticReturnRequest(
      { items, total_price: 280000, shipping_fee: 50000 },
      [{ order_item_id: 2, return_quantity: 1 }], "damaged", "vỡ"
    );
    expect(rr).toMatchObject({ id: "pending", status: "Pending", reason_code: "damaged", refund_amount: 50000 });
    expect(rr.items.map((i) => i.order_item_id)).toEqual([2]);
  });

  it("trả toàn bộ: hoàn total_price trừ phí ship và kèm quà tặng của sản phẩm X", () => {
    const rr = buildOptimisticReturnRequest(
      { items, total_price: 280000, shipping_fee: 50000 },
      [{ order_item_id: 1, return_quantity: 2 }, { order_item_id: 2, return_quantity: 1 }], "other", "đổi ý"
    );
    expect(rr.refund_amount).toBe(230000);
    const gift = rr.items.find((i) => i.is_gift);
    expect(gift).toMatchObject({ order_item_id: 3, refund_amount: 0 });
    expect(rr.items.filter((i) => !i.is_gift).reduce((s, i) => s + i.refund_amount, 0)).toBe(230000);
  });
});
