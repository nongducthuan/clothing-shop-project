// @ts-nocheck
import { useState, useEffect, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CartContext } from "../../context/CartContext.jsx";
import API from "../../services/apiClient.js";
import { getImageUrl, PLACEHOLDER_IMG } from "../../utils/imageUtils";

export function useProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  // --- STATE ---
  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(null);

  const [activeVoucher, setActiveVoucher] = useState(null);
  const [activePromotion, setActivePromotion] = useState(null);
  const [giftProduct, setGiftProduct] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user ? user.id : null;

  // --- EFFECTS ---

  // Fetch Vouchers & Promotions
  useEffect(() => {
    if (product) {
      API.get("/vouchers", {
        params: {
          product_id: product.id,
          category_id: product.category_id,
        },
      })
        .then((res) => {
          const voucherList = res.data.data || res.data;
          if (Array.isArray(voucherList) && voucherList.length > 0) {
            setActiveVoucher(voucherList[0]);
          }
        })
        .catch((err) => console.error("Voucher error:", err));
    }

    API.get("/promotions")
      .then((res) => {
        const promoList = res.data?.data || res.data || [];
        const matchedPromo = promoList.find(
          (p) => String(p.buy_product_id) === String(product?.id)
        );

        if (matchedPromo) {
          setActivePromotion(matchedPromo);
          API.get(`/products/${matchedPromo.gift_product_id}`)
            .then((giftRes) => {
              const gift = giftRes.data?.data || giftRes.data;
              setGiftProduct(gift);
            })
            .catch(() => setGiftProduct(null));
        }
      })
      .catch(() => setActivePromotion(null));
  }, [product]);

  // Fetch Product Details
  useEffect(() => {
    let url = `${API.defaults?.baseURL || import.meta.env.VITE_API_URL}/products/${id}`;
    if (currentUserId) {
      url += `?userId=${currentUserId}`;
    }

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("Product does not exist");
        return response.json();
      })
      .then((data) => {
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

        if (data.colors?.length > 0) {
          const firstColor = data.colors[0];
          setSelectedColor(firstColor);
          setMainImage(firstColor.image_url);

          if (firstColor.sizes?.length > 0) {
            const availableSize = firstColor.sizes.find((size) => size.stock > 0);
            setSelectedSize(availableSize || firstColor.sizes[0]);
          }
        } else {
          setMainImage(data.image_url);
        }
      })
      .catch((err) => setError(err.message));
  }, [id, currentUserId]);

  // Handle Color Change
  useEffect(() => {
    if (selectedColor) {
      setMainImage(selectedColor.image_url);

      if (selectedColor.sizes?.length > 0) {
        const sameSizeAvailable = selectedColor.sizes.find(
          (size) => size.size === selectedSize?.size && size.stock > 0
        );
        const firstAvailable = selectedColor.sizes.find((size) => size.stock > 0);

        setSelectedSize(sameSizeAvailable || firstAvailable || selectedColor.sizes[0]);
      } else {
        setSelectedSize(null);
      }
    }
  }, [selectedColor]);

  // --- DERIVED VARIABLES ---
  const isSale = product?.sale_percent > 0;
  const salePrice = isSale ? product.price * (1 - product.sale_percent / 100) : product?.price;
  const isVoucherValidForProduct = activeVoucher !== null && activeVoucher !== undefined;
  const isProductIncomplete = !product?.colors || product?.colors.length === 0;
  const currentStock = selectedSize ? selectedSize.stock : 0;

  // --- HANDLERS & HELPERS ---
  const getStockMessage = () => {
    if (!product || !product.colors || product.colors.length === 0) return "Product is updating.";
    if (!selectedColor) return "Please select a color";
    if (!selectedColor.sizes || selectedColor.sizes.length === 0) return "This color is temporarily out of size";
    if (!selectedSize) return "Please select a size";

    return currentStock === 0 ? "Out of stock" : `In stock: ${currentStock} items`;
  };

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      category_id: product.category_id,
      name: product.name,
      price: salePrice,
      color_id: selectedColor?.id,
      color: selectedColor?.color_name,
      color_image: selectedColor?.image_url,
      size_id: selectedSize?.id,
      size: selectedSize?.size,
      quantity,
      stock: currentStock,
    });

    const userProfile = JSON.parse(localStorage.getItem("user"));
    if (userProfile) {
      API.post("/products/interaction", {
        productId: product.id,
        type: "add_to_cart",
      }).catch((err) => console.log("Tracking error:", err));
    }
  };

  const formatPrice = (price) => Number(price).toLocaleString("vi-VN");

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


