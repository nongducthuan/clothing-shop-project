import { useContext, useState, useEffect, useMemo } from "react";
import { CartContext } from "../../context/CartContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import API from "../../services/apiClient.js";

const API_URL = import.meta.env.VITE_API_URL;
const IMAGE_URL = import.meta.env.VITE_IMAGE_URL;

export function useCartPage() {
  const { cart, removeFromCart, updateQuantity } = useContext(CartContext);
  const { user, discount, tier } = useContext(AuthContext);

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherMessage, setVoucherMessage] = useState({ type: "", text: "" });
  const [isApplying, setIsApplying] = useState(false);

  const [activePromotions, setActivePromotions] = useState([]);
  const [giftProductsDetails, setGiftProductsDetails] = useState({});

  // Fetch active promotions
  useEffect(() => {
    API.get("/promotions/active")
      .then(res => setActivePromotions(res.data?.data || res.data || []))
      .catch(err => console.error("Promotions error", err));
  }, []);

  // Logic: Calculate earned gifts grouped by Product ID
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
          gifts.push({
            promoId: promo.id,
            promoName: promo.name,
            giftProductId: promo.gift_product_id,
            quantity: totalGiftQty,
          });
        }
      }
    });

    return gifts;
  }, [cart, activePromotions]);

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
      const response = await fetch(`${API_URL}/vouchers/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucherCode,
          orderTotal: orderTotalForVoucher,
          cartItems: cart
        })
      });

      const data = await response.json();

      if (data.success) {
        setAppliedVoucher(data.data);
        setVoucherMessage({ type: 'success', text: data.message });
      } else {
        setAppliedVoucher(null);
        setVoucherMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setVoucherMessage({ type: 'error', text: 'Server connection error' });
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
  const getImageUrl = (url) => {
    if (!url) return "https://via.placeholder.com/150?text=No+Image";
    return url.startsWith("http") ? url : `${IMAGE_URL}${url}`;
  };

  return {
    state: {
      cart, user, tier, discount,
      voucherCode, appliedVoucher, voucherMessage, isApplying,
      earnedGifts, giftProductsDetails,
      subtotal, membershipDiscount, voucherDiscount, finalTotal, totalQuantity
    },
    actions: {
      setVoucherCode, handleApplyVoucher, handleRemoveVoucher,
      removeFromCart, updateQuantity
    },
    helpers: {
      formatPrice, getImageUrl
    }
  };
}

