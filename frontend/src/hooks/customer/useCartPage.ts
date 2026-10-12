import { useState, useEffect, useMemo } from "react";
import { CartContext } from "../../context/CartContext.tsx";
import { AuthContext } from "../../context/AuthContext.tsx";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency } from "../../utils/currencyUtils";
import { extractApiErrorMessage, buildMinOrderValueMessage, type ApiErrorPayload } from "../../utils/apiErrorUtils";
import { calculateShippingFee } from "../../utils/shippingUtils";
import { calculateMembershipDiscount, getDiscountableSubtotal } from "../../utils/checkoutPricing";
import API from "../../services/apiClient.ts";
import { getImageUrl } from "../../utils/imageUtils";
import { useRequiredContext } from "../useRequiredContext";

export interface CartPromotion {
  id: number;
  name: string;
  buy_product_id: number;
  buy_quantity: number;
  gift_product_id: number;
  gift_quantity: number;
  max_gift_per_order: number | null;
  total_gift_limit: number | null;
  total_gifts_issued: number;
  is_stackable: boolean;
  [key: string]: unknown;
}

export interface GiftProductDetail {
  id: number;
  name: string;
  price: number | string;
  image_url?: string;
  colors?: Array<{
    id: number;
    color_name?: string;
    image_url?: string;
    sizes?: Array<{ id: number; size: string; stock: number }>;
  }>;
  [key: string]: unknown;
}

interface SelectedGiftVariant {
  color_id: number | null;
  size_id: number | null;
}

export interface EarnedGift {
  promoId: number;
  promoName: string;
  promo: CartPromotion;
  giftProductId: number;
  quantity: number;
  color_id: number | null;
  size_id: number | null;
}

interface AppliedVoucher {
  code: string;
  discount_amount: number;
  min_order_value: number;
  [key: string]: unknown;
}

export function useCartPage() {
  const { cart, removeFromCart, updateQuantity, setItemQuantity } = useRequiredContext(CartContext, 'CartContext');
  const { user, discount, tier } = useRequiredContext(AuthContext, 'AuthContext');
  const { t, getLocalizedText, language, translateApiMessage } = useLanguage();

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  // Lưu RAW (type + message gốc / payload lỗi) rồi dịch lại mỗi khi đổi ngôn ngữ → tránh
  // thông báo bị "đóng băng" ở ngôn ngữ tại thời điểm bấm Áp dụng.
  const [voucherStatus, setVoucherStatus] = useState<{
    type: "" | "success" | "error";
    rawMessage?: string;
    errorPayload?: ApiErrorPayload | null;
  }>({ type: "" });
  const [isApplying, setIsApplying] = useState(false);

  const [activePromotions, setActivePromotions] = useState<CartPromotion[]>([]);
  const [giftProductsDetails, setGiftProductsDetails] = useState<Record<number, GiftProductDetail>>({});
  const [selectedGiftVariants, setSelectedGiftVariants] = useState<Record<number, SelectedGiftVariant>>({});

  useEffect(() => {
    API.get("/promotions")
      .then(res => setActivePromotions(res.data?.data || res.data || []))
      .catch(err => console.error("Promotions error", err));
  }, []);

  // Refresh prices and variant stock on mount. localStorage can outlive a sale or
  // inventory change, so don't rely on the snapshot captured when an item was added.
  const { setCart } = useRequiredContext(CartContext, 'CartContext');
  useEffect(() => {
    if (cart.length === 0) return;
    let cancelled = false;
    const productIds = [...new Set(cart.map(item => item.id))];

    const refreshCartItems = async () => {
      const [priceResult, detailResults] = await Promise.all([
        API.post("/products/prices", { productIds }).catch(() => null),
        Promise.all(productIds.map(async (id) => {
          try {
            const response = await API.get(`/products/${id}/options`);
            return { productId: id, colors: response.data?.data || response.data };
          } catch {
            return null;
          }
        })),
      ]);
      if (cancelled) return;

      const priceMap: Record<number, number> = priceResult?.data?.data || {};
      const stockMap = new Map<string, number>();
      const refreshedProductIds = new Set<number>();
      detailResults.forEach((product: unknown) => {
        if (!product || typeof product !== "object") return;
        const record = product as {
          productId?: number;
          colors?: Array<{ id: number; sizes?: Array<{ id: number; stock: number }> }>;
        };
        if (!record.productId || !Array.isArray(record.colors)) return;
        refreshedProductIds.add(record.productId);
        record.colors.forEach(color => {
          color.sizes?.forEach(size => {
            const stock = Number(size.stock);
            stockMap.set(`${record.productId}:${color.id}:${size.id}`, Number.isFinite(stock) ? Math.max(0, stock) : 0);
          });
        });
      });

      setCart(prev => prev.map(item => {
        const freshPrice = priceMap[item.id];
        const stockKey = `${item.id}:${item.color_id}:${item.size_id}`;
        const freshStock = stockMap.get(stockKey);
        return {
          ...item,
          ...(freshPrice !== undefined && Number.isFinite(Number(freshPrice)) ? { price: Number(freshPrice) } : {}),
          ...(freshStock !== undefined
            ? { stock: freshStock }
            : refreshedProductIds.has(item.id) ? { stock: 0 } : {}),
        };
      }));
    };

    void refreshCartItems().catch((error) => console.error("Cart refresh failed", error));
    return () => { cancelled = true; };
  // Load only when the cart page hook mounts; the server revalidates inventory at checkout too.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Logic: Calculate earned gifts grouped by Product ID with chosen/default variants
  const earnedGifts = useMemo(() => {
    const gifts: EarnedGift[] = [];
    const cartProductQtys: Record<number, number> = {};
    // Promotions may gift the same SKU; share one stock budget across all of them.
    const remainingGiftStockByProduct: Record<number, number> = {};

    cart.forEach(item => {
      cartProductQtys[item.id] = (cartProductQtys[item.id] || 0) + item.quantity;
    });

    const stoppedBuyProductIds = new Set<number>();
    for (const promo of activePromotions) {
      if (stoppedBuyProductIds.has(promo.buy_product_id)) continue;
      const productQty = cartProductQtys[promo.buy_product_id] || 0;

      if (productQty >= promo.buy_quantity) {
        let multiplier = Math.floor(productQty / promo.buy_quantity);
        let totalGiftQty = multiplier * promo.gift_quantity;

        if (promo.max_gift_per_order && totalGiftQty > promo.max_gift_per_order) {
          totalGiftQty = promo.max_gift_per_order;
        }
        if (promo.total_gift_limit !== null && promo.total_gift_limit !== undefined) {
          const remainingGiftLimit = Math.max(0, promo.total_gift_limit - promo.total_gifts_issued);
          totalGiftQty = Math.min(totalGiftQty, remainingGiftLimit);
        }

        const giftProdId = promo.gift_product_id;
        const detail = giftProductsDetails[giftProdId];
        const giftSizes = detail?.colors?.flatMap(color => color.sizes ?? []) ?? [];
        const hasTrackedVariantStock = giftSizes.length > 0;
        if (hasTrackedVariantStock) {
          const availableStock = Math.max(0, giftSizes.reduce(
            (sum, size) => sum + Math.max(0, Number(size.stock) || 0),
            0
          ) - (cartProductQtys[giftProdId] || 0));
          const remainingStock = remainingGiftStockByProduct[giftProdId] ?? availableStock;
          totalGiftQty = Math.min(totalGiftQty, remainingStock);
        }

        if (totalGiftQty > 0) {
          if (hasTrackedVariantStock) {
            const availableStock = Math.max(0, giftSizes.reduce(
              (sum, size) => sum + Math.max(0, Number(size.stock) || 0),
              0
            ) - (cartProductQtys[giftProdId] || 0));
            const remainingStock = remainingGiftStockByProduct[giftProdId] ?? availableStock;
            remainingGiftStockByProduct[giftProdId] = Math.max(0, remainingStock - totalGiftQty);
          }
          const userChoice = selectedGiftVariants[giftProdId];

          let colorId = userChoice?.color_id || null;
          let sizeId = userChoice?.size_id || null;

          if ((!colorId || !sizeId) && detail?.colors && detail.colors.length > 0) {
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
          if (promo.is_stackable === false) stoppedBuyProductIds.add(promo.buy_product_id);
        }
      }
    }

    return gifts;
  }, [cart, activePromotions, selectedGiftVariants, giftProductsDetails, getLocalizedText]);

  const handleSelectGiftVariant = (giftProductId: number, colorId: number | null, sizeId: number | null) => {
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

  // Sản phẩm không được cộng dồn giảm giá (do khuyến mãi tặng quà không stackable).
  const blockedProductIds = useMemo(
    () => new Set(
      earnedGifts
        .filter(gift => gift.promo.is_stackable === false)
        .map(gift => Number(gift.promo.buy_product_id))
    ),
    [earnedGifts]
  );

  const hasUnavailableItems = cart.some((item) =>
    typeof item.stock === "number" && Number.isFinite(item.stock) &&
    (item.stock <= 0 || item.quantity > item.stock)
  );

  const { subtotal, membershipDiscount, voucherDiscount, shippingFee, finalTotal, totalQuantity } = useMemo(() => {
    const subtotalValue = cart.reduce(
      (sum, item) => sum + Number(item.price) * (item.quantity || 1),
      0
    );

    const quantityValue = cart.reduce((sum, item) => sum + item.quantity, 0);
    const memDiscountValue = user ? calculateMembershipDiscount(cart, discount, blockedProductIds) : 0;

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
  }, [cart, user, discount, appliedVoucher, blockedProductIds]);

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

  // Payload gửi /vouchers/apply — dùng chung cho áp mới và tính lại khi giỏ thay đổi.
  const buildVoucherPayload = (code: string) => ({
    code,
    orderTotal: subtotal - membershipDiscount,
    // Tiền hàng gốc (trước membership/voucher) để backend kiểm tra điều kiện "đơn tối thiểu"
    // theo đúng tiền hàng, không bị giảm giá kéo xuống dưới ngưỡng.
    subtotal,
    membershipDiscountableSubtotal: getDiscountableSubtotal(cart, blockedProductIds),
    cartItems: cart.map(item => ({
      ...item,
      block_other_discounts: blockedProductIds.has(Number(item.id)),
    })),
  });

  // Voucher đã áp là kết quả "chụp" tại thời điểm bấm Áp dụng. Khi giỏ / hạng thành viên
  // thay đổi (đổi số lượng, xóa món, ...) phải tính lại để số tiền giảm khớp với đơn thật.
  useEffect(() => {
    if (!appliedVoucher?.code) return;
    let cancelled = false;
    API.post("/vouchers/apply", buildVoucherPayload(appliedVoucher.code))
      .then(res => {
        if (cancelled) return;
        if (res.data?.success) {
          setAppliedVoucher(res.data.data);
        } else {
          setAppliedVoucher(null);
          setVoucherCode("");
          setVoucherStatus({ type: "error", errorPayload: res.data });
        }
      })
      .catch(error => {
        if (cancelled) return;
        const payload = (error as { response?: { data?: ApiErrorPayload } }).response?.data;
        // Lỗi mạng (không có phản hồi từ server): giữ voucher hiện tại, backend vẫn kiểm tra lúc đặt hàng.
        if (!payload) return;
        setAppliedVoucher(null);
        setVoucherCode("");
        setVoucherStatus({ type: "error", errorPayload: payload });
      });
    return () => { cancelled = true; };
  // Chỉ chạy lại khi dữ liệu giỏ thay đổi; không đưa appliedVoucher vào deps để tránh vòng lặp.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, subtotal, membershipDiscount, blockedProductIds]);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsApplying(true);
    setVoucherStatus({ type: "" });

    try {
      const response = await API.post("/vouchers/apply", buildVoucherPayload(voucherCode));

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
      const payload = (error as { response?: { data?: ApiErrorPayload } }).response?.data;
      setVoucherStatus({ type: 'error', errorPayload: payload });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    setVoucherStatus({ type: "" });
  };

  const formatPrice = (n: number | string) => formatCurrency(n, language);

  return {
    state: {
      cart, user, tier, discount,
      voucherCode, appliedVoucher, voucherMessage, isApplying,
      earnedGifts, giftProductsDetails,
      subtotal, membershipDiscount, voucherDiscount, shippingFee, finalTotal, totalQuantity,
      hasUnavailableItems
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
