import { getReturnDeadline, isWithinReturnWindow, RETURN_WINDOW_DAYS } from '../../constants/returnPolicy';
import { formatOrderResponse } from '../../utils/formatOrder';
import type { FormattableOrder } from '../../types/orderTypes';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-10-10T12:00:00Z');
const ago = (days: number) => new Date(now.getTime() - days * DAY);

describe('returnPolicy', () => {
  it('cửa sổ là 7 ngày', () => expect(RETURN_WINDOW_DAYS).toBe(7));

  it('đúng 7 ngày vẫn còn hạn, quá 7 ngày thì hết', () => {
    expect(isWithinReturnWindow({ delivered_at: ago(7) }, now)).toBe(true);
    expect(isWithinReturnWindow({ delivered_at: new Date(ago(7).getTime() - 1) }, now)).toBe(false);
  });

  it('ưu tiên delivered_at, fallback updated_at, thiếu cả hai thì không chặn', () => {
    expect(isWithinReturnWindow({ delivered_at: ago(1), updated_at: ago(60) }, now)).toBe(true);
    expect(isWithinReturnWindow({ delivered_at: null, updated_at: ago(60) }, now)).toBe(false);
    expect(isWithinReturnWindow({}, now)).toBe(true);
    expect(getReturnDeadline({})).toBeNull();
  });

  it('chấp nhận ngày dạng chuỗi ISO', () => {
    expect(isWithinReturnWindow({ delivered_at: ago(10).toISOString() }, now)).toBe(false);
  });
});

describe('formatOrderResponse – cờ can_return', () => {
  const base = (status: string, deliveredDaysAgo: number) =>
    ({
      id: 1, email: 'a@b.com', name: 'A', phone: '0900000000', address: 'x',
      total_price: 100, shipping_fee: 0, membership_discount: 0, voucher_discount: 0,
      status, payment_method: 'cod', payment_status: 'Paid',
      created_at: new Date(), delivered_at: new Date(Date.now() - deliveredDaysAgo * DAY), updated_at: new Date(),
      voucher: null, return_request: null, items: [],
    }) as unknown as FormattableOrder;

  it('Delivered trong hạn → can_return = true', () => {
    const r = formatOrderResponse(base('Delivered', 2));
    expect(r.can_return).toBe(true);
    expect(r.return_deadline).toBeInstanceOf(Date);
  });

  it('Delivered quá hạn → can_return = false', () => {
    expect(formatOrderResponse(base('Delivered', 9)).can_return).toBe(false);
  });

  it('đơn chưa giao → can_return = false, không có hạn', () => {
    const r = formatOrderResponse(base('Shipping', 0));
    expect(r.can_return).toBe(false);
    expect(r.return_deadline).toBeNull();
  });
});
