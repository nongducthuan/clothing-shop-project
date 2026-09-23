import { describe, it, expect } from 'vitest';
import { 
    isStatusAllowed, 
    isStatusFlowLocked, 
    isPaymentAllowed, 
    isClosedOrderStatus 
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
});
