import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "@/lib/router";
import { CartContext } from "@/context/CartContext";
import { useLanguage } from "@shop/shared/context/LanguageContext";
import API from "@shop/shared/services/apiClient";
import { getImageUrl, PLACEHOLDER_IMG } from "@shop/shared/utils/imageUtils";
import { formatCurrency } from "@shop/shared/utils/currencyUtils";
import { calculateSalePrice } from "@shop/shared/utils/priceUtils";
import { useRequiredContext } from "@shop/shared/hooks/useRequiredContext";

interface ProductSize {
  id: number;
  size: string;
  stock: number;
}

interface ProductColor {
  id: number;
  color_name: string;
  color_name_vi?: string;
  color_name_en?: string;
  image_url: string;
  color_code?: string;
  sizes?: ProductSize[];
  [key: string]: unknown;
}

interface Product {
  id: number;
  name: string;
  name_vi?: string;
  name_en?: string;
  description?: string;
  price: number;
  image_url?: string;
  category_id: number;
  category_name?: string;
  sale_percent?: number;
  colors?: ProductColor[];
  [key: string]: unknown;
}

interface Voucher {
  id: number;
  code: string;
  discount_percent: number;
  usage_limit?: number | null;
  min_order_value?: number;
  max_discount_amount?: number;
  apply_scope?: string;
  category_id?: number;
  product_id?: number;
}

interface Promotion {
  id: number;
  buy_product_id: number;
  gift_product_id: number;
  buy_quantity: number;
  gift_quantity: number;
  [key: string]: unknown;
}

export function useProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useRequiredContext(CartContext, 'CartContext');
  const { t, language } = useLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const selectedSizeRef = useRef(selectedSize);
  useEffect(() => {
    selectedSizeRef.current = selectedSize;
  }, [selectedSize]);
  const [mainImage, setMainImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [error, setError] = useState<string | null>(null);

  const [activeVoucher, setActiveVoucher] = useState<Voucher | null>(null);
  const [activePromotion, setActivePromotion] = useState<Promotion | null>(null);
  const [giftProduct, setGiftProduct] = useState<Product | null>(null);

  const productId = product?.id;
  const productCategoryId = product?.category_id;

  useEffect(() => {
    let cancelled = false;
    setActiveVoucher(null);
    setActivePromotion(null);
    setGiftProduct(null);

    if (!productId) return () => { cancelled = true; };

    const loadBenefits = async () => {
      try {
        const [voucherResponse, promotionResponse] = await Promise.all([
          API.get("/vouchers", {
            params: { product_id: productId, category_id: productCategoryId },
          }).catch((error: unknown) => {
            console.error("Voucher error:", error);
            return null;
          }),
          API.get("/promotions"),
        ]);
        if (cancelled) return;

        const voucherList = voucherResponse?.data?.data || voucherResponse?.data;
        setActiveVoucher(Array.isArray(voucherList) && voucherList.length > 0 ? voucherList[0] : null);

        const promotionData = promotionResponse.data?.data || promotionResponse.data;
        const promoList = Array.isArray(promotionData) ? promotionData as Promotion[] : [];
        const matchedPromotion = promoList.find(
          (promotion) => String(promotion.buy_product_id) === String(productId)
        ) ?? null;
        setActivePromotion(matchedPromotion);

        if (matchedPromotion) {
          const giftResponse = await API.get(`/products/${matchedPromotion.gift_product_id}`);
          if (cancelled) return;
          const gift = giftResponse.data?.data || giftResponse.data;
          setGiftProduct(gift as Product);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Promotion error:", error);
          setActivePromotion(null);
          setGiftProduct(null);
        }
      }
    };

    void loadBenefits();
    return () => { cancelled = true; };
  }, [productId, productCategoryId]);

  useEffect(() => {
    let cancelled = false;
    setProduct(null);
    setSelectedColor(null);
    setSelectedSize(null);
    setMainImage("");
    setError(null);
    setQuantity(1);

    API.get(`/products/${id}`)
      .then((response: { data: Product | { data: Product } }) => {
        if (cancelled) return;
        const data = ("data" in response.data && response.data.data ? response.data.data : response.data) as Product;
        if (data.image_url) {
          data.image_url = getImageUrl(data.image_url);
        }

        if (data.colors) {
          data.colors = data.colors.map((color) => ({
            ...color,
            image_url: getImageUrl(color.image_url),
          }));
        }

        setProduct(data);

        const colors = data.colors ?? [];
        if (colors.length > 0) {
          const firstColor = colors[0];
          setSelectedColor(firstColor);
          setMainImage(firstColor.image_url ?? "");

          const sizes = firstColor.sizes ?? [];
          if (sizes.length > 0) {
            const availableSize = sizes.find((size) => size.stock > 0);
            setSelectedSize(availableSize || sizes[0]);
          }
        } else {
          setMainImage(data.image_url ?? "");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError((err as Error).message);
      });

    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (selectedColor) {
      setMainImage(selectedColor.image_url);

      const sizes = selectedColor.sizes ?? [];
      if (sizes.length > 0) {
        const currentSizeName = selectedSizeRef.current?.size;
        const sameSizeAvailable = sizes.find(
          (size) => size.size === currentSizeName && size.stock > 0
        );
        const firstAvailable = sizes.find((size) => size.stock > 0);

        setSelectedSize(sameSizeAvailable || firstAvailable || sizes[0]);
      } else {
        setSelectedSize(null);
      }
    }
  }, [selectedColor]);

  useEffect(() => {
    if (selectedSize && Number(quantity) > selectedSize.stock) {
      setQuantity(Math.max(1, selectedSize.stock));
    }
  }, [selectedSize, quantity]);

  const isSale = (product?.sale_percent ?? 0) > 0;
  const salePrice = isSale && product
    ? calculateSalePrice(product.price, product.sale_percent)
    : Number(product?.price ?? 0);
  const isVoucherValidForProduct = activeVoucher !== null && activeVoucher !== undefined;
  const isProductIncomplete = !product?.colors || product?.colors.length === 0;
  const currentStock = selectedSize ? selectedSize.stock : 0;

  const getStockMessage = () => {
    if (!product || !product.colors || product.colors.length === 0) return t("product.updating", "Product is updating.");
    if (!selectedColor) return t("product.select_color", "Please select a color");
    if (!selectedColor.sizes || selectedColor.sizes.length === 0) return t("product.color_temp_out", "This color is temporarily out of size");
    if (!selectedSize) return t("product.select_size", "Please select a size");

    return currentStock === 0 ? t("product.out_of_stock", "Out of stock") : t("product.in_stock", "In stock: {count} items").replace("{count}", String(currentStock));
  };

  const handleAddToCart = (): boolean => {
    if (!product || !selectedColor || !selectedSize || selectedSize.stock <= 0) return false;
    const requestedQuantity = typeof quantity === "number" && quantity >= 1 ? quantity : 1;
    if (!Number.isFinite(requestedQuantity) || requestedQuantity < 1) return false;

    if (quantity === "" || quantity !== requestedQuantity) {
      setQuantity(requestedQuantity);
    }

    addToCart({
      id: product.id,
      category_id: product.category_id,
      name: product.name,
      name_vi: product.name_vi,
      name_en: product.name_en,
      price: salePrice,
      color_id: selectedColor.id,
      color: selectedColor.color_name,
      color_name_vi: selectedColor.color_name_vi,
      color_name_en: selectedColor.color_name_en,
      color_image: selectedColor.image_url,
      size_id: selectedSize.id,
      size: selectedSize.size,
      quantity: Math.min(Math.floor(requestedQuantity), currentStock),
      stock: currentStock,
    });

    let userProfile: unknown = null;
    try {
      const userProfileRaw = localStorage.getItem("user");
      userProfile = userProfileRaw ? JSON.parse(userProfileRaw) : null;
    } catch {
      // Broken optional tracking data should not interrupt adding to cart.
      try { localStorage.removeItem("user"); } catch { /* Storage may be unavailable. */ }
    }
    if (userProfile) {
      API.post("/products/interaction", {
        productId: product.id,
        type: "add_to_cart",
      }).catch((err) => console.error("Tracking error:", err));
    }
    return true;
  };

  const formatPrice = (price: number | string | null | undefined) => formatCurrency(price, language);

  return {
    state: {
      product, selectedColor, selectedSize, mainImage, quantity, error,
      activeVoucher, activePromotion, giftProduct,
      isSale, salePrice, isVoucherValidForProduct, isProductIncomplete, currentStock
    },
    actions: {
      setSelectedColor, setSelectedSize, setQuantity, handleAddToCart, navigate
    },
    helpers: {
      getStockMessage, formatPrice
    },
    constants: {
      PLACEHOLDER_IMG
    }
  };
}
