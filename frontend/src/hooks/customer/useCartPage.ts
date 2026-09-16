import { useContext, useState, useEffect, useMemo } from "react";
import { CartContext } from "../../context/CartContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext";
import API from "../../services/apiClient.js";
import { getImageUrl } from "../../utils/imageUtils";

export function useCartPage() {
  const { cart, removeFromCart, updateQuantity } = useContext(CartContext);
  const { user, discount, tier } = useContext(AuthContext);
  const { t, getLocalizedText } = useLanguage();

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherMessage, setVoucherMessage] = useState({ type: "", text: "" });
  const [isApplying, setIsApplying] = useState(false);

  const [activePromotions, setActivePromotions] = useState([]);
  const [giftProductsDetails, setGiftProductsDetails] = useState({});
  const [selectedGiftVariants, setSelectedGiftVariants] = useState({});

  // Fetch active promotions
  useEffect(() => {
    API.get("/promotions")
      .then(res => setActivePromotions(res.data?.data || res.data || []))
      .catch(err => console.error("Promotions error", err));
  }, []);

  // Logic: Calculate earned gifts grouped by Product ID with chosen/default variants
  const earnedGifts = useMemo(() => {
    const gifts = [];
    const cartProductQtys = {};

    cart.forEach(item => {
      cartProductQtys[item.id] = (cartProductQtys[item.id] || 0) + item.quantity;
    });

    activePromotions.forEach(promo => {
      const productQty = cartProductQtys[promo.buy_product_id] || 0;

      if (productQty >= promo.buy_quantity) {
        let multiplier = Math.floor(productQty / promo.buy_quantity);
        let totalGiftQty = multiplier * promo.gift_quantity;

        if (promo.max_gift_per_order && totalGiftQty > promo.max_gift_per_order) {
          totalGiftQty = promo.max_gift_per_order;
        }

        if (totalGiftQty > 0) {
          const giftProdId = promo.gift_product_id;
          const userChoice = selectedGiftVariants[giftProdId];
          const detail = giftProductsDetails[giftProdId];

          let colorId = userChoice?.color_id || null;
          let sizeId = userChoice?.size_id || null;

          if ((!colorId || !sizeId) && detail?.colors?.length > 0) {
            for (const c of detail.colors) {
              const availableSize = c.sizes?.find(s => s.stock > 0);
              if (availableSize) {
                if (!colorId) colorId = c.id;
                if (!sizeId) sizeId = availableSize.id;
                break;
              }
            }
          }

          gifts.push({
            promoId: promo.id,
            promoName: getLocalizedText(promo, 'name') || promo.name,
            promo: promo,
            giftProductId: giftProdId,
            quantity: totalGiftQty,
            color_id: colorId,
            size_id: sizeId
          });
        }
      }
    });

    return gifts;
  }, [cart, activePromotions, selectedGiftVariants, giftProductsDetails, getLocalizedText]);

  const handleSelectGiftVariant = (giftProductId, colorId, sizeId) => {
    setSelectedGiftVariants(prev => ({
      ...prev,
      [giftProductId]: { color_id: colorId, size_id: sizeId }
    }));
  };

  // Logic: Fetch details for earned gifts
  useEffect(() => {
    earnedGifts.forEach(gift => {
      if (!giftProductsDetails[gift.giftProductId]) {
        API.get(`/products/${gift.giftProductId}`)
          .then(res => {
            const product = res.data?.data || res.data;
            setGiftProductsDetails(prev => ({ ...prev, [gift.giftProductId]: product }));
          })
          .catch(err => console.error("Error fetching gift details", err));
      }
    });
  }, [earnedGifts, giftProductsDetails]);

  // Logic: Calculate totals
  const { subtotal, membershipDiscount, voucherDiscount, finalTotal, totalQuantity } = useMemo(() => {
    const subtotalValue = cart.reduce(
      (sum, item) => sum + Number(item.price) * (item.quantity || 1),
      0
    );

    const quantityValue = cart.reduce((sum, item) => sum + item.quantity, 0);
    const memDiscountValue = user ? subtotalValue * (discount / 100) : 0;

    let final = subtotalValue - memDiscountValue;
    let vouchDiscountValue = 0;

    if (appliedVoucher) {
      vouchDiscountValue = appliedVoucher.discount_amount;
      final = final - vouchDiscountValue;
    }

    if (final < 0) final = 0;

    return {
      subtotal: subtotalValue,
      membershipDiscount: memDiscountValue,
      voucherDiscount: vouchDiscountValue,
      finalTotal: final,
      totalQuantity: quantityValue,
    };
  }, [cart, user, discount, appliedVoucher]);

  // Logic: Apply Voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsApplying(true);
    setVoucherMessage({ type: "", text: "" });

    try {
      const orderTotalForVoucher = subtotal - membershipDiscount;
      const response = await API.post("/vouchers/apply", {
        code: voucherCode,
        orderTotal: orderTotalForVoucher,
        cartItems: cart
      });

      const data = response.data;

      if (data.success) {
        setAppliedVoucher(data.data);
        setVoucherMessage({ type: 'success', text: data.message });
      } else {
        setAppliedVoucher(null);
        setVoucherMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setAppliedVoucher(null);
       setVoucherMessage({ type: 'error', text: error.response?.data?.message || t("cart.server_error", "Server connection error") });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    setVoucherMessage({ type: "", text: "" });
  };

  // Helpers
  const formatPrice = (n) => Number(n).toLocaleString("vi-VN") + " đ";

  return {
    state: {
      cart, user, tier, discount,
      voucherCode, appliedVoucher, voucherMessage, isApplying,
      earnedGifts, giftProductsDetails,
      subtotal, membershipDiscount, voucherDiscount, finalTotal, totalQuantity
    },
    actions: {
      setVoucherCode, handleApplyVoucher, handleRemoveVoucher,
      removeFromCart, updateQuantity, handleSelectGiftVariant
    },
    helpers: {
      formatPrice, getImageUrl
    }
  };
}

