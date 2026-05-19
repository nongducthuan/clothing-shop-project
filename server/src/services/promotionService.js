const promotionModel = require('../models/promotionModel');

const promotionService = {
    calculateCartPromotions: async (cartItems) => {
        return await promotionService.calculateBuyXGetY(cartItems);
    },

    calculateBuyXGetY: async (cartItems) => {
        let giftItems = [];

        const activePromos = await promotionModel.getActiveBuyXGetYPromotions();

        if (activePromos.length === 0) {
            return { cartItems, giftItems };
        }

        const promoMap = {};
        const variantMap = {};

        for (const promo of activePromos) {
            // Nhóm các promo theo product_id (1 sản phẩm mua có thể có nhiều promo)
            promoMap[promo.buy_product_id] = promoMap[promo.buy_product_id] || [];
            promoMap[promo.buy_product_id].push(promo);

            // Fetch variants của quà tặng và lưu cache lại, tránh fetch 2 lần
            if (!variantMap[promo.gift_product_id]) {
                const variants = await promotionModel.getVariantsByProductId(promo.gift_product_id);
                variantMap[promo.gift_product_id] = variants.filter(v => v.stock > 0);
            }
        }

        // ✅ 2. XỬ LÝ CART
        for (const item of cartItems) {
            const matchedPromos = promoMap[item.product_id];

            // Bỏ qua nếu sản phẩm trong giỏ không có promo nào
            if (!matchedPromos) continue;

            // Lặp qua từng promo áp dụng cho sản phẩm này
            for (const promo of matchedPromos) {
                let expectedGiftQty =
                    Math.floor(item.quantity / promo.buy_quantity) * promo.gift_quantity;

                if (expectedGiftQty <= 0) continue;

                // Giới hạn max quà trên mỗi đơn hàng
                if (promo.max_gift_per_order !== null) {
                    expectedGiftQty = Math.min(expectedGiftQty, promo.max_gift_per_order);
                }

                // Giới hạn max quà cho toàn bộ chiến dịch
                if (promo.total_gift_limit !== null) {
                    const totalIssued = promo.total_gifts_issued || 0;
                    const remaining = Math.max(0, promo.total_gift_limit - totalIssued);
                    expectedGiftQty = Math.min(expectedGiftQty, remaining);
                }

                const variants = variantMap[promo.gift_product_id];

                // Bỏ qua nếu quà đã hết sạch stock ở mọi biến thể (size/color)
                if (!variants || variants.length === 0) continue;

                const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
                const actualGiftQty = Math.min(expectedGiftQty, totalStock);

                if (actualGiftQty <= 0) continue;

                const isPartialGift = actualGiftQty < expectedGiftQty;

                giftItems.push({
                    promotion_id: promo.id,
                    gift_product_id: promo.gift_product_id,
                    expected_quantity: expectedGiftQty,
                    actual_quantity: actualGiftQty,
                    is_partial_gift: isPartialGift,
                    status: isPartialGift ? "PARTIAL" : "FULL",
                    is_stackable: promo.is_stackable,

                    variants: variants.map(v => ({
                        size_id: v.size_id,
                        color_id: v.color_id,
                        color: v.color_name,
                        size: v.size,
                        stock: v.stock,
                        image: v.image_url
                    })),

                    message: isPartialGift
                        ? `Only ${actualGiftQty} free item(s) available. Please choose color and size.`
                        : `You received ${actualGiftQty} free item(s). Please choose color and size.`
                });

                // Nếu promo này không cho phép cộng dồn (is_stackable = 0)
                // Đánh dấu item này và dừng xét các promo khác cho item
                if (!promo.is_stackable) {
                    item.block_other_discounts = true;
                    break;
                }
            }
        }

        return { cartItems, giftItems };
    },
    applyPromotionsAtCheckout: async (userSelectedGifts) => {
        /* userSelectedGifts là mảng từ Frontend gửi lên khi checkout, ví dụ:
          [
            { promotion_id: 1, size_id: 12, actual_quantity: 1 },
            { promotion_id: 2, size_id: 15, actual_quantity: 2 }
          ]
        */

        if (!userSelectedGifts || userSelectedGifts.length === 0) {
            return { success: true, message: 'Không có quà tặng nào cần xử lý.' };
        }

        const db = require('../db');
        const connection = await db.getConnection(); // Lấy connection để chạy Transaction

        try {
            await connection.beginTransaction(); // Bắt đầu Transaction

            // Lặp qua từng quà tặng user đã chọn để trừ kho
            for (const gift of userSelectedGifts) {
                await promotionModel.updateGiftStockAndIssued(
                    connection,
                    gift.promotion_id,
                    gift.size_id,
                    gift.actual_quantity
                );
            }

            await connection.commit(); // Thành công -> Lưu vào Database
            return { success: true, message: 'Đã áp dụng khuyến mãi và trừ kho thành công.' };

        } catch (error) {
            await connection.rollback(); // Có lỗi -> Hoàn tác mọi thay đổi
            console.error('Lỗi khi xử lý quà tặng lúc Checkout:', error.message);
            throw error; // Ném lỗi ra để Controller bắt được và báo về Frontend
        } finally {
            connection.release(); // Quan trọng: Trả connection lại cho Pool
        }
    },
};

module.exports = promotionService;
