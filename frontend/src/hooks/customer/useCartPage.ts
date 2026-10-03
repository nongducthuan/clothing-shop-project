import { useContext, useState, useEffect, useMemo } from "react";
import { CartContext } from "../../context/CartContext.tsx";
import { AuthContext } from "../../context/AuthContext.tsx";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency } from "../../utils/currencyUtils";
import { extractApiErrorMessage, buildMinOrderValueMessage, type ApiErrorPayload } from "../../utils/apiErrorUtils";
import { calculateShippingFee } from "../../utils/shippingUtils";
import API from "../../services/apiClient.ts";
import { getImageUrl } from "../../utils/imageUtils";

export function useCartPage() {
  const { cart, removeFromCart, updateQuantity, setItemQuantity } = useContext(CartContext);
  const { user, discount, tier } = useContext(AuthContext);
  const { t, getLocalizedText, language, translateApiMessage } = useLanguage();

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  // Lưu RAW (type + message gốc / payload lỗi) rồi dịch lại mỗi khi đổi ngôn ngữ → tránh
  // thông báo bị "đóng băng" ở ngôn ngữ tại thời điểm bấm Áp dụng.
  const [voucherStatus, setVoucherStatus] = useState<{
    type: "" | "success" | "error";
    rawMessage?: string;
    errorPayload?: ApiErrorPayload | null;
  }>({ type: "" });
  const [isApplying, setIsApplying] = useState(false);

  const [activePromotions, setActivePromotions] = useState([]);
  const [giftProductsDetails, setGiftProductsDetails] = useState({});
  const [selectedGiftVariants, setSelectedGiftVariants] = useState({});

  useEffect(() => {
    API.get("/promotions")
      .then(res => setActivePromotions(res.data?.data || res.data || []))
      .catch(err => console.error("Promotions error", err));
  }, []);

  // Refresh cart prices from server on mount to avoid stale prices
  // (e.g. sale started/ended after item was added to cart)
  const { setCart } = useContext(CartContext);
  useEffect(() => {
    if (cart.length === 0) return;
    const productIds = [...new Set(cart.map(item => item.id))];
    API.post("/products/prices", { productIds })
      .then(res => {
        const priceMap: Record<number, number> = res.data?.data || {};
        setCart(prev => prev.map(item => {
          const freshPrice = priceMap[item.id];
          if (freshPrice !== undefined && freshPrice !== Number(item.price)) {
            return { ...item, price: freshPrice };
          }
          return item;
        }));
      })
      .catch(() => { /* price refresh is best-effort; stale price still safe at checkout */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const { subtotal, membershipDiscount, voucherDiscount, shippingFee, finalTotal, totalQuantity } = useMemo(() => {
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

    const shipFee = calculateShippingFee("", quantityValue, final);
    const finalWithShipping = final + (shipFee || 0);

    return {
      subtotal: subtotalValue,
      membershipDiscount: memDiscountValue,
      voucherDiscount: vouchDiscountValue,
      shippingFee: shipFee,
      finalTotal: finalWithShipping,
      totalQuantity: quantityValue,
    };
  }, [cart, user, discount, appliedVoucher]);

  // Tự động gỡ voucher nếu khách hàng giảm số lượng dẫn đến không đủ điều kiện
  useEffect(() => {
    if (appliedVoucher && subtotal < appliedVoucher.min_order_value) {
      setAppliedVoucher(null);
      setVoucherCode("");
      setVoucherStatus({
        type: 'error',
        errorPayload: {
          message: "Minimum order value not met",
          min_order_value: appliedVoucher.min_order_value
        }
      });
    }
  }, [subtotal, appliedVoucher]);

  // Lỗi áp voucher: ưu tiên thông báo ngưỡng đơn tối thiểu (có số tiền), rồi mới tới
  // lỗi field / message chung của backend.
  const buildVoucherErrorText = (data: ApiErrorPayload | undefined | null): string =>
    buildMinOrderValueMessage(data, t, (value) => formatCurrency(value, language)) ??
    extractApiErrorMessage(
      data,
      translateApiMessage,
      t("cart.server_error", "Server connection error")
    );

  // Dịch lại thông báo theo `language` hiện tại (reactive) thay vì lưu chuỗi đã dịch.
  const voucherMessage = useMemo(() => {
    if (voucherStatus.type === "success") {
      return { type: "success", text: translateApiMessage(voucherStatus.rawMessage) };
    }
    if (voucherStatus.type === "error") {
      return { type: "error", text: buildVoucherErrorText(voucherStatus.errorPayload) };
    }
    return { type: "", text: "" };
    // `language` nằm trong deps để dịch lại khi người dùng đổi ngôn ngữ;
    // buildVoucherErrorText/translateApiMessage là closure mới mỗi render nên không cần liệt kê.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voucherStatus, language]);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsApplying(true);
    setVoucherStatus({ type: "" });

    try {
      const orderTotalForVoucher = subtotal - membershipDiscount;
      const response = await API.post("/vouchers/apply", {
        code: voucherCode,
        orderTotal: orderTotalForVoucher,
        // Tiền hàng gốc (trước membership/voucher) để backend kiểm tra điều kiện "đơn tối thiểu"
        // theo đúng tiền hàng, không bị giảm giá kéo xuống dưới ngưỡng.
        subtotal,
        cartItems: cart
      });

      const data = response.data;

      if (data.success) {
        setAppliedVoucher(data.data);
        setVoucherStatus({ type: 'success', rawMessage: data.message });
      } else {
        setAppliedVoucher(null);
        setVoucherStatus({ type: 'error', errorPayload: data });
      }
    } catch (error) {
      setAppliedVoucher(null);
      setVoucherStatus({ type: 'error', errorPayload: error.response?.data });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    setVoucherStatus({ type: "" });
  };

  const formatPrice = (n) => formatCurrency(n, language);

  return {
    state: {
      cart, user, tier, discount,
      voucherCode, appliedVoucher, voucherMessage, isApplying,
      earnedGifts, giftProductsDetails,
      subtotal, membershipDiscount, voucherDiscount, shippingFee, finalTotal, totalQuantity
    },
    actions: {
      setVoucherCode, handleApplyVoucher, handleRemoveVoucher,
      removeFromCart, updateQuantity, setItemQuantity, handleSelectGiftVariant
    },
    helpers: {
      formatPrice, getImageUrl
    }
  };
}

