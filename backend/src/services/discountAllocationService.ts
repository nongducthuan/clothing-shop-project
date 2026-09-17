/**
 * Pro-rata Discount Allocation Service
 *
 * Phân bổ (Pro-rata) tổng giảm giá từ Membership & Voucher cho từng OrderItem dựa trên
 * t lệ giá trị sản phẩm: (price * quantity) / eligibleTotal.
 *
 * Mục tiêu nghiệp vụ:
 * - Mỗi OrderItem lưu `discount_amount` (phần giảm giá được phân bổ) và `payable_amount`
 *   (số tiền thực tế khách phải trả cho item đó).
 * - Khi khách hoàn trả 1 phần đơn hàng, refund = payable_amount / quantity * return_quantity
 *   → hoàn đúng số tiền khách đã trả, không bị "ăn gian" phần voucher/membership.
 *
 * Các bất biến (invariant) được đảm bảo:
 * 1. discount_amount + payable_amount === price * quantity (làm tròn 2 chữ số thập phân).
 * 2. payable_amount >= 0.
 * 3. Tổng payable_amount của tất cả item === số tiền hàng khách thực trả (payableTotal,
 *    CHƯA bao gồm phí vận chuyển) → hoàn toàn bộ đơn không bao giờ vượt quá số tiền đã trả.
 * 4. Gift item (Buy X Get Y): discount_amount = 0, payable_amount = 0.
 *
 * Toàn bộ phép tính được thực hiện trên đơn vị "cent" (số nguyên) kết hợp thuật toán
 * largest-remainder, do đó không bị sai lệch do floating point.
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
}

export interface ItemAllocation {
    discount_amount: number;
    payable_amount: number;
}

const toCents = (value: number): number => {
    const num = Number(value);
    return Number.isFinite(num) ? Math.round(num * 100) : 0;
};

const fromCents = (cents: number): number => Math.round(cents) / 100;

/**
 * Chia `totalCents` thành các phần nguyên theo trọng số (largest remainder method).
 * Tổng các phần luôn bằng đúng `totalCents` → không thất thoát/lệch 1 cent do làm tròn.
 */
function distributeCents(totalCents: number, weights: number[]): number[] {
    const result = new Array<number>(weights.length).fill(0);
    if (weights.length === 0 || totalCents <= 0) return result;

    const weightSum = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
    if (weightSum <= 0) return result;

    const remainders: { index: number; frac: number }[] = [];
    let allocated = 0;

    for (let i = 0; i < weights.length; i++) {
        const exact = (totalCents * Math.max(0, weights[i])) / weightSum;
        const base = Math.floor(exact);
        result[i] = base;
        allocated += base;
        remainders.push({ index: i, frac: exact - base });
    }

    // Phần dư chia cho các item có phần thập phân lớn nhất (tie-break theo index để deterministic)
    remainders.sort((a, b) => b.frac - a.frac || a.index - b.index);

    let remaining = totalCents - allocated;
    let cursor = 0;
    while (remaining > 0 && remainders.length > 0) {
        result[remainders[cursor % remainders.length].index] += 1;
        remaining -= 1;
        cursor += 1;
    }
    while (remaining < 0) {
        // Chỉ xảy ra khi số item ít hơn số cent cần bù; trừ dần từ item lớn nhất còn dương
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
        payableTotal = 0
    } = options || ({} as AllocationOptions);

    // Chỉ phân bổ cho sản phẩm mua thật (không gồm quà tặng Buy X Get Y)
    const activeIndices: number[] = [];
    const itemTotalCents: Record<number, number> = {};

    items.forEach((item, index) => {
        if (item.is_gift) return;
        activeIndices.push(index);
        itemTotalCents[index] = toCents(Number(item.price) * Number(item.quantity));
    });

    if (activeIndices.length === 0) return allocations;

    const activeWeights = activeIndices.map(index => itemTotalCents[index]);
    const itemTotalSumCents = activeWeights.reduce((sum, w) => sum + w, 0);

    // 1. Membership: phân bổ trên toàn bộ sản phẩm mua theo tỷ lệ giá trị
    const membershipCentsTotal = Math.min(toCents(membershipDiscount), itemTotalSumCents);
    const membershipCents = distributeCents(membershipCentsTotal, activeWeights);

    // 2. Voucher: chỉ phân bổ cho sản phẩm nằm trong phạm vi voucher (all/product/category)
    const eligibleWeights = activeIndices.map(index =>
        eligibleProductIds.includes(items[index].product_id) ? itemTotalCents[index] : 0
    );
    const eligibleSumCents = eligibleWeights.reduce((sum, w) => sum + w, 0);
    const voucherCentsTotal = Math.min(toCents(voucherDiscount), eligibleSumCents);
    const voucherCents = distributeCents(voucherCentsTotal, eligibleWeights);

    // 3. payable = giá trị item - (membership + voucher phân bổ), không được âm
    const payableCents = activeIndices.map((index, pos) =>
        Math.max(0, itemTotalCents[index] - membershipCents[pos] - voucherCents[pos])
    );

    // 4. Đối soát tổng payable với số tiền hàng khách thực trả:
    //    - Lớn hơn (do clamp ở bước 3, thường gặp với voucher giới hạn theo product/category)
    //      → giảm theo tỷ lệ để KHÔNG hoàn vượt quá số tiền khách đã trả.
    //    - Nhỏ hơn (lệch làm tròn) → bù thêm để hoàn đủ số tiền khách đã trả.
    const targetCents = Math.max(0, toCents(payableTotal));
    const payableSumCents = payableCents.reduce((sum, c) => sum + c, 0);

    if (payableSumCents !== targetCents) {
        const redistributionWeights = payableSumCents > 0 ? payableCents : activeWeights;
        const redistributed = distributeCents(targetCents, redistributionWeights);
        redistributed.forEach((cents, pos) => {
            payableCents[pos] = Math.max(0, cents);
        });
    }

    activeIndices.forEach((index, pos) => {
        const payable = payableCents[pos];
        allocations[index] = {
            payable_amount: fromCents(payable),
            discount_amount: fromCents(Math.max(0, itemTotalCents[index] - payable))
        };
    });

    return allocations;
}
