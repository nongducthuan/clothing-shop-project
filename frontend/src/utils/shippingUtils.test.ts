import { describe, it, expect } from 'vitest';
import { calculateShippingFee, extractProvince, FREE_SHIPPING_THRESHOLD } from './shippingUtils';

describe('shippingUtils', () => {
    describe('extractProvince', () => {
        it('should extract TP. Hồ Chí Minh correctly', () => {
            expect(extractProvince('123 Lê Lợi, Quận 1, TP. Hồ Chí Minh')).toBe('TP. Hồ Chí Minh');
            expect(extractProvince('123 Lê Lợi, Q1, Hồ Chí Minh')).toBe('Hồ Chí Minh');
            expect(extractProvince('HCM')).toBe('HCM');
        });

        it('should extract Hà Nội correctly', () => {
            expect(extractProvince('Ba Đình, TP. Hà Nội')).toBe('TP. Hà Nội');
            expect(extractProvince('Hà Nội')).toBe('Hà Nội');
        });

        it('should fallback to last segment if no comma', () => {
            expect(extractProvince('Bình Dương')).toBe('Bình Dương');
        });
    });

    describe('calculateShippingFee', () => {
        it('should return 0 when total is greater than or equal to FREE_SHIPPING_THRESHOLD', () => {
            expect(calculateShippingFee('Hồ Chí Minh', 1, FREE_SHIPPING_THRESHOLD)).toBe(0);
            expect(calculateShippingFee('Hà Nội', 5, FREE_SHIPPING_THRESHOLD + 100000)).toBe(0);
        });

        it('should calculate base fee correctly for Inner city (HCM/HN)', () => {
            // inner_city = 20000
            expect(calculateShippingFee('Hồ Chí Minh', 1, 100000)).toBe(20000);
            expect(calculateShippingFee('Hà Nội', 1, 100000)).toBe(20000);
        });

        it('should calculate base fee correctly for Nearby (Bình Dương)', () => {
            // nearby = 25000
            expect(calculateShippingFee('Bình Dương', 1, 100000)).toBe(25000);
        });

        it('should calculate base fee correctly for Remote (Điện Biên)', () => {
            // remote = 45000
            expect(calculateShippingFee('Điện Biên', 1, 100000)).toBe(45000);
        });

        it('should add extra item fee correctly', () => {
            // FREE_ITEM_LIMIT = 5, EXTRA_ITEM_FEE = 5000
            // 6 items => 1 extra item => +5000
            expect(calculateShippingFee('Hồ Chí Minh', 6, 100000)).toBe(25000); 
            // 8 items => 3 extra items => +15000
            expect(calculateShippingFee('Điện Biên', 8, 100000)).toBe(60000); 
        });
    });
});
