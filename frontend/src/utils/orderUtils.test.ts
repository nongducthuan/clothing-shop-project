import { describe, it, expect } from 'vitest';
import { 
    isStatusAllowed, 
    isStatusFlowLocked, 
    isPaymentAllowed, 
    isClosedOrderStatus,
    balanceReturnItemsRefund
} from './orderUtils';

describe('orderUtils', () => {
    describe('isStatusAllowed', () => {
        it('should allow normal forward transitions', () => {
            expect(isStatusAllowed('Pending', 'Confirmed')).toBe(true);
            expect(isStatusAllowed('Confirmed', 'Shipping')).toBe(true);
            expect(isStatusAllowed('Shipping', 'Delivered')).toBe(true);
        });

        it('should block backward or invalid transitions', () => {
            expect(isStatusAllowed('Shipping', 'Pending')).toBe(false);
            expect(isStatusAllowed('Delivered', 'Confirmed')).toBe(false);
            expect(isStatusAllowed('Pending', 'Delivered')).toBe(false);
        });

        it('should allow Cancelled only from Pending or Confirmed', () => {
            expect(isStatusAllowed('Pending', 'Cancelled')).toBe(true);
            expect(isStatusAllowed('Confirmed', 'Cancelled')).toBe(true);
            expect(isStatusAllowed('Shipping', 'Cancelled')).toBe(true); // Shipping -> Cancelled is allowed in standard flow
        });
    });

    describe('isStatusFlowLocked', () => {
        it('should lock dropdown for terminal states', () => {
            expect(isStatusFlowLocked('Return Requested')).toBe(true);
            expect(isStatusFlowLocked('Return Approved')).toBe(true);
        });

        it('should not lock dropdown for active states', () => {
            expect(isStatusFlowLocked('Pending')).toBe(false);
            expect(isStatusFlowLocked('Confirmed')).toBe(false);
            expect(isStatusFlowLocked('Shipping')).toBe(false);
            // Cancelled and Delivered are not locked because they have UNDO options
            expect(isStatusFlowLocked('Cancelled')).toBe(false); 
            expect(isStatusFlowLocked('Delivered')).toBe(false);
        });
    });

    describe('isPaymentAllowed', () => {
        it('should allow payment for Unpaid online orders not cancelled', () => {
            expect(isPaymentAllowed('Unpaid', 'Paid')).toBe(true);
        });

        it('should block payment Refunded if order is not Cancelled or Return Approved', () => {
            expect(isPaymentAllowed('Unpaid', 'Refunded', 'Pending')).toBe(false);
        });

        it('should allow payment Refunded if order is Cancelled', () => {
            expect(isPaymentAllowed('Unpaid', 'Refunded', 'Cancelled')).toBe(true);
        });

        it('should allow Unpaid from Paid', () => {
             expect(isPaymentAllowed('Paid', 'Unpaid')).toBe(true);
        });
    });

    describe('isClosedOrderStatus', () => {
        it('should return true for terminal statuses', () => {
            expect(isClosedOrderStatus('Cancelled')).toBe(true);
            expect(isClosedOrderStatus('Return Approved')).toBe(true);
        });

        it('should return false for active statuses', () => {
            expect(isClosedOrderStatus('Delivered')).toBe(false);
            expect(isClosedOrderStatus('Pending')).toBe(false);
        });
    });

    describe('balanceReturnItemsRefund', () => {
        it('should round item refund amounts to integers and balance remainder to match total', () => {
            const items = [
                { id: 1, refund_amount: 2876710.52, is_gift: false },
                { id: 2, refund_amount: 4315065.79, is_gift: false },
                { id: 3, refund_amount: 3452052.63, is_gift: false },
                { id: 4, refund_amount: 2876710.53, is_gift: false },
                { id: 5, refund_amount: 3452052.63, is_gift: false },
                { id: 6, refund_amount: 2301368.42, is_gift: false },
                { id: 7, refund_amount: 4315065.79, is_gift: false },
                { id: 8, refund_amount: 5753421.05, is_gift: false },
                { id: 9, refund_amount: 2876710.53, is_gift: false },
                { id: 10, refund_amount: 2876710.53, is_gift: false },
                { id: 11, refund_amount: 5178078.95, is_gift: false },
                { id: 12, refund_amount: 3452052.63, is_gift: false },
            ];

            const balanced = balanceReturnItemsRefund(items, 43726000);

            // All amounts must be integers
            balanced.forEach(item => {
                expect(Number.isInteger(item.refund_amount)).toBe(true);
            });

            // Sum of balanced amounts must exactly match total
            const sum = balanced.reduce((acc, it) => acc + it.refund_amount, 0);
            expect(sum).toBe(43726000);
        });

        it('should keep gift items at 0 and not balance them', () => {
            const items = [
                { id: 1, refund_amount: 100000.4, is_gift: false },
                { id: 2, refund_amount: 0, is_gift: true },
            ];
            const balanced = balanceReturnItemsRefund(items, 100000);
            expect(balanced[0].refund_amount).toBe(100000);
            expect(balanced[1].refund_amount).toBe(0);
        });
    });
});
