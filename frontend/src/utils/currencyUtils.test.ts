import { describe, it, expect } from 'vitest';
import { formatCurrency, getItemUnitPayableAmount } from './currencyUtils';

describe('currencyUtils', () => {
    describe('formatCurrency', () => {
        it('should format Vietnamese currency correctly', () => {
            // Replace non-breaking spaces that Intl might output with normal space for test comparison
            const formatted = formatCurrency(1500000, 'vi').replace(/\u00A0/g, ' ');
            // The exact format might vary slightly depending on Node version ('1.500.000 ₫' or '1.500.000₫')
            expect(formatted).toMatch(/1\.500\.000\s?₫/);
        });

        it('should format English currency correctly', () => {
            expect(formatCurrency(1500000, 'en')).toBe('VND 1,500,000');
        });

        it('should handle zero or null', () => {
            expect(formatCurrency(0, 'en')).toBe('VND 0');
            expect(formatCurrency(null, 'en')).toBe('VND 0');
            expect(formatCurrency(undefined, 'en')).toBe('VND 0');
        });
    });

    describe('getItemUnitPayableAmount', () => {
        it('should return payable_amount / quantity when payable_amount is provided', () => {
            const item = { payable_amount: 150000, quantity: 2, price: 100000 };
            expect(getItemUnitPayableAmount(item)).toBe(75000);
        });

        it('should fallback to price when payable_amount is missing', () => {
            const item = { price: 100000, quantity: 2 };
            expect(getItemUnitPayableAmount(item)).toBe(100000);
        });

        it('should handle 0 correctly', () => {
            const item = { payable_amount: 0, quantity: 1, price: 100000 };
            expect(getItemUnitPayableAmount(item)).toBe(0);
        });

        it('should handle null/undefined item', () => {
            expect(getItemUnitPayableAmount(null)).toBe(0);
            expect(getItemUnitPayableAmount(undefined)).toBe(0);
        });
    });
});
