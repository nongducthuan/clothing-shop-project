import { describe, it, expect } from 'vitest';
import { 
    getPromotionBuyProductIds, 
    isPromotionBuyItem, 
    getLinkedBuyItems,
    isGiftAutoReturned 
} from './promotionUtils';

describe('promotionUtils', () => {
    describe('isPromotionBuyItem', () => {
        it('should return true if item is product X of a Buy X Get Y promo', () => {
            const item = { product_id: 10, is_gift: false };
            const allItems = [
                item,
                { product_id: 20, is_gift: true, promotion: { buy_product_id: 10 } }
            ];
            const buyProductIds = getPromotionBuyProductIds(allItems);
            expect(isPromotionBuyItem(item, buyProductIds)).toBe(true);
        });

        it('should return false if item is not product X', () => {
            const item = { product_id: 10, is_gift: false };
            const allItems = [
                item,
                { product_id: 20, is_gift: true, promotion: { buy_product_id: 99 } }
            ];
            const buyProductIds = getPromotionBuyProductIds(allItems);
            expect(isPromotionBuyItem(item, buyProductIds)).toBe(false);
        });

        it('should return false if item is a gift itself', () => {
            const item = { product_id: 10, is_gift: true, promotion: { buy_product_id: 10 } };
            const allItems = [item];
            const buyProductIds = getPromotionBuyProductIds(allItems);
            expect(isPromotionBuyItem(item, buyProductIds)).toBe(false);
        });
    });

    describe('getLinkedBuyItems', () => {
        it('should return all products X associated with this gift', () => {
            const allItems = [
                { id: 1, product_id: 10, is_gift: false }, // Product X
                { id: 2, product_id: 10, is_gift: false }, // Product X (another line)
                { id: 3, product_id: 21, is_gift: true, promotion: { buy_product_id: 10 } }, // Gift 1
                { id: 4, product_id: 30, is_gift: true, promotion: { buy_product_id: 99 } }  // Unrelated gift
            ];
            const gift = allItems[2]; // Gift 1
            const linkedItems = getLinkedBuyItems(gift, allItems);
            expect(linkedItems.length).toBe(2);
            expect(linkedItems.map(g => g.id)).toEqual([1, 2]);
        });
    });

    describe('isGiftAutoReturned', () => {
        it('should return true if the linked product X is selected for return', () => {
            const giftItem = { id: 3, product_id: 21, is_gift: true, promotion: { buy_product_id: 10 } };
            const allItems = [
                { id: 1, product_id: 10, is_gift: false }, // Product X
                giftItem
            ];
            // Simulate the user selecting item 1 to return
            const isItemSelected = (item) => item.id === 1;
            expect(isGiftAutoReturned(giftItem, allItems, isItemSelected)).toBe(true);
        });

        it('should return false if the linked product X is NOT selected for return', () => {
             const giftItem = { id: 3, product_id: 21, is_gift: true, promotion: { buy_product_id: 10 } };
            const allItems = [
                { id: 1, product_id: 10, is_gift: false }, // Product X
                giftItem
            ];
            // Simulate the user NOT selecting item 1 to return
            const isItemSelected = (item) => false;
            expect(isGiftAutoReturned(giftItem, allItems, isItemSelected)).toBe(false);
        });

        it('should return false if gift has no linked items', () => {
            const giftItem = { id: 2, is_gift: true };
            const isItemSelected = () => true;
            expect(isGiftAutoReturned(giftItem, [], isItemSelected)).toBe(false);
        });
    });
});
