/**
 * Pro-rata Discount Allocation Service
 *
 * Phân bổ (Pro-rata) tổng giảm giá từ Membership & Voucher cho từng OrderItem dựa trên
 * tỷ lệ giá trị sản phẩm: (price * quantity) / eligibleTotal.
 *
 * Mục tiêu nghiệp vụ:
 * - Mỗi OrderItem lưu `discount_amount` (phần giảm giá được phân bổ) và `payable_amount`
 *   (số tiền thực tế khách phải trả cho item đó).
 * - Khi khách hoàn trả 1 phần đơn hàng, refund = payable_amount / quantity * return_quantity
 *   → hoàn đúng số tiền khách đã trả, không bị "ăn gian" phần voucher/membership.
 *
 * Các bất biến (invariant) được đảm bảo:
 * 1. discount_amount + payable_amount === price * quantity.
 * 2. payable_amount >= 0.
 * 3. Tổng payable_amount của tất cả item === số tiền hàng khách thực trả (payableTotal,
 *    CHƯA bao gồm phí vận chuyển) → hoàn toàn bộ đơn không bao giờ vượt quá số tiền đã trả.
 * 4. Gift item (Buy X Get Y): discount_amount = 0, payable_amount = 0.
 *
 * Toàn bộ phép tính được thực hiện trên đơn vị "đồng" (số nguyên VNĐ) kết hợp thuật toán
 * largest-remainder, do đó không bị sai lệch do floating point và số tiền lưu DB / hiển thị
 * luôn là số nguyên "đẹp", khớp 100% khi đối soát.
 */

export interface AllocatableItem {
    product_id: number;
    quantity: number;
    price: number;
    is_gift?: boolean;
}

export interface AllocationOptions {
    /** Tổng tiền giảm giá từ hạng thành viên (Membership) */
    membershipDiscount: number;
    /** Tổng tiền giảm giá từ Voucher */
    voucherDiscount: number;
    /** Danh sách product_id thuộc phạm vi áp dụng của voucher */
    eligibleProductIds: number[];
    /** Số tiền hàng khách thực trả sau khi trừ Membership + Voucher (KHÔNG gồm phí ship) */
    payableTotal: number;
    /** Danh sách product_id của Buy X Get Y non-stackable: không được áp thêm membership/voucher */
    blockedProductIds?: Set<number>;
}

export interface ItemAllocation {
    discount_amount: number;
    payable_amount: number;
}

/** Làm tròn về đơn vị "đồng" (số nguyên VNĐ). */
const toVnd = (value: number): number => {
    const num = Number(value);
    return Number.isFinite(num) ? Math.round(num) : 0;
};

/**
 * Chia `total` (đồng) thành các phần số nguyên theo trọng số (largest remainder method).
 * Tổng các phần luôn bằng đúng `total` → không thất thoát/lệch 1 đồng do làm tròn.
 */
function distributeVnd(total: number, weights: number[]): number[] {
    const result = new Array<number>(weights.length).fill(0);
    if (weights.length === 0 || total <= 0) return result;

    const weightSum = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
    if (weightSum <= 0) return result;

    const remainders: { index: number; frac: number }[] = [];
    let allocated = 0;

    for (let i = 0; i < weights.length; i++) {
        const exact = (total * Math.max(0, weights[i])) / weightSum;
        const base = Math.floor(exact);
        result[i] = base;
        allocated += base;
        remainders.push({ index: i, frac: exact - base });
    }

    // Phần dư chia cho các item có phần thập phân lớn nhất (tie-break theo index để deterministic)
    remainders.sort((a, b) => b.frac - a.frac || a.index - b.index);

    let remaining = total - allocated;
    let cursor = 0;
    while (remaining > 0 && remainders.length > 0) {
        result[remainders[cursor % remainders.length].index] += 1;
        remaining -= 1;
        cursor += 1;
    }
    while (remaining < 0) {
        // Chỉ xảy ra khi số item ít hơn số đồng cần bù; trừ dần từ item lớn nhất còn dương
        const target = remainders.find(r => result[r.index] > 0);
        if (!target) break;
        result[target.index] -= 1;
        remaining += 1;
    }

    return result;
}

/**
 * Phân bổ Membership & Voucher discount cho từng item theo tỷ lệ giá trị sản phẩm.
 * Hàm thuần (pure function) – không mutate dữ liệu đầu vào.
 */
export function allocateItemDiscounts(
    items: AllocatableItem[],
    options: AllocationOptions
): ItemAllocation[] {
    const allocations: ItemAllocation[] = items.map(() => ({ discount_amount: 0, payable_amount: 0 }));
    if (!Array.isArray(items) || items.length === 0) return allocations;

    const {
        membershipDiscount = 0,
        voucherDiscount = 0,
        eligibleProductIds = [],
        payableTotal = 0,
        blockedProductIds = new Set<number>()
    } = options || ({} as AllocationOptions);

    // Chỉ phân bổ cho sản phẩm mua thật (không gồm quà tặng Buy X Get Y)
    const activeIndices: number[] = [];
    const itemTotalVnd: Record<number, number> = {};

    items.forEach((item, index) => {
        if (item.is_gift) return;
        activeIndices.push(index);
        itemTotalVnd[index] = toVnd(Number(item.price) * Number(item.quantity));
    });

    if (activeIndices.length === 0) return allocations;

    const activeWeights = activeIndices.map(index => itemTotalVnd[index]);

    // 1. Membership: phân bổ trên sản phẩm không bị chặn bởi Buy X Get Y non-stackable
    const membershipWeights = activeIndices.map(index =>
        blockedProductIds.has(items[index].product_id) ? 0 : itemTotalVnd[index]
    );
    const membershipEligibleSumVnd = membershipWeights.reduce((sum, w) => sum + w, 0);
    const membershipVndTotal = Math.min(toVnd(membershipDiscount), membershipEligibleSumVnd);
    const membershipVnd = distributeVnd(membershipVndTotal, membershipWeights);

    // 2. Voucher: chỉ phân bổ cho sản phẩm nằm trong phạm vi voucher (all/product/category)
    //    và không bị chặn bởi Buy X Get Y non-stackable
    const eligibleWeights = activeIndices.map(index =>
        eligibleProductIds.includes(items[index].product_id) && !blockedProductIds.has(items[index].product_id)
            ? itemTotalVnd[index]
            : 0
    );
    const eligibleSumVnd = eligibleWeights.reduce((sum, w) => sum + w, 0);
    const voucherVndTotal = Math.min(toVnd(voucherDiscount), eligibleSumVnd);
    const voucherVnd = distributeVnd(voucherVndTotal, eligibleWeights);

    // 3. payable = giá trị item - (membership + voucher phân bổ), không được âm
    const payableVnd = activeIndices.map((index, pos) =>
        Math.max(0, itemTotalVnd[index] - membershipVnd[pos] - voucherVnd[pos])
    );

    // 4. Đối soát tổng payable với số tiền hàng khách thực trả:
    //    - Lớn hơn (do clamp ở bước 3, thường gặp với voucher giới hạn theo product/category)
    //      → giảm theo tỷ lệ để KHÔNG hoàn vượt quá số tiền khách đã trả.
    //    - Nhỏ hơn (lệch làm tròn) → bù thêm để hoàn đủ số tiền khách đã trả.
    const targetVnd = Math.max(0, toVnd(payableTotal));
    const payableSumVnd = payableVnd.reduce((sum, c) => sum + c, 0);

    if (payableSumVnd !== targetVnd) {
        const redistributionWeights = payableSumVnd > 0 ? payableVnd : activeWeights;
        const redistributed = distributeVnd(targetVnd, redistributionWeights);
        redistributed.forEach((vnd, pos) => {
            payableVnd[pos] = Math.max(0, vnd);
        });
    }

    activeIndices.forEach((index, pos) => {
        const payable = payableVnd[pos];
        allocations[index] = {
            payable_amount: payable,
            discount_amount: Math.max(0, itemTotalVnd[index] - payable)
        };
    });

    return allocations;
}
