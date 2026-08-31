import { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CartContext } from "../../context/CartContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import API from "../../services/apiClient.js";
import { getImageUrl } from "../../utils/imageUtils";

// --- HELPER HOOK: GEOLOCATION ---
const useGeolocation = () => {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const getAddressFromCoords = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=vi`,
        { headers: { "Accept-Language": "vi", "User-Agent": "ClothingShopApp/1.0" } }
      );

      if (response.status === 429) throw new Error("Too many requests. Please try again later.");
      if (!response.ok) throw new Error("Location API Error");

      const data = await response.json();
      const addr = data.address || {};
      const parts = [
        addr.house_number && addr.road ? `${addr.house_number} ${addr.road}` : addr.road,
        addr.suburb || addr.quarter || addr.village || addr.neighbourhood,
        addr.district || addr.county || addr.city_district,
        addr.city || addr.town || addr.state || addr.province,
      ];

      return parts.filter(Boolean).join(", ");
    } catch (err) {
      throw err;
    }
  };

  const fetchCurrentLocation = (onSuccess) => {
    setIsLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const address = await getAddressFromCoords(pos.coords.latitude, pos.coords.longitude);
          onSuccess(address);
        } catch (err) {
          setLocationError(err.message);
        } finally {
          setIsLocating(false);
        }
      },
      async () => {
        // Fallback to IP Geolocation if GPS is denied
        try {
          const ipRes = await fetch("https://ipapi.co/json/");
          if (!ipRes.ok) {
            throw new Error("IP Geolocation service failed");
          }
          const ipData = await ipRes.json();
          if (!ipData || typeof ipData.latitude !== "number" || typeof ipData.longitude !== "number") {
            throw new Error("Invalid IP Geolocation data");
          }
          const address = await getAddressFromCoords(ipData.latitude, ipData.longitude);
          onSuccess(address);
        } catch {
          setLocationError("Could not determine location. Please enter manually.");
        } finally {
          setIsLocating(false);
        }
      },
      { timeout: 5000 }
    );
  };

  return { fetchCurrentLocation, isLocating, locationError };
};

// --- MAIN HOOK ---
export function useCheckoutPage() {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const { cart, setCart } = useContext(CartContext);
  const { user, discount, tier } = useContext(AuthContext);
  const { fetchCurrentLocation, isLocating, locationError } = useGeolocation();

  // State Management
  const [statusMessage, setStatusMessage] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [guestInfo, setGuestInfo] = useState({ name: "", phone: "", email: "" });
  const [giftDetails, setGiftDetails] = useState({});

  const appliedVoucher = routeLocation.state?.appliedVoucher || null;
  const earnedGifts = routeLocation.state?.earnedGifts || [];

  // Fetch gift product details
  useEffect(() => {
    earnedGifts.forEach((gift) => {
      if (!giftDetails[gift.giftProductId]) {
        API.get(`/products/${gift.giftProductId}`)
          .then((res) => {
            const product = res.data?.data || res.data;
            setGiftDetails((prev) => ({ ...prev, [gift.giftProductId]: product }));
          })
          .catch((err) => console.error("Gift fetch error:", err));
      }
    });
  }, [earnedGifts, giftDetails]);

  // Calculations
  const subtotal = useMemo(() =>
    cart.reduce((sum, item) => sum + Number(item.price) * (item.quantity ?? 1), 0),
  [cart]);

  const membershipDiscount = user ? subtotal * (discount / 100) : 0;
  const voucherDiscount = appliedVoucher ? Number(appliedVoucher.discount_amount) : 0;
  const finalTotal = Math.max(0, subtotal - membershipDiscount - voucherDiscount);

  const resolveItemImage = (item) => {
    const rawUrl = item.color_image || item.image_url;
    return getImageUrl(rawUrl);
  };

  // Handlers
  const handleGuestChange = (e) => {
    const { name, value } = e.target;
    setGuestInfo(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!shippingAddress.trim()) return "Please enter a shipping address.";
    if (!user) {
      if (!guestInfo.name || !guestInfo.phone || !guestInfo.email) return "Please fill in all contact information.";
      if (!guestInfo.email.includes("@")) return "Invalid email format.";
    }
    return null;
  };

  const handleSubmitOrder = async () => {
    const error = validateForm();
    if (error) {
      setStatusMessage(`❌ ${error}`);
      return;
    }

    try {
      const itemsPayload = [
        ...cart.map(p => ({
          product_id: p.id,
          color_id: p.color_id,
          size_id: p.size_id,
          quantity: p.quantity || 1,
          price: p.price,
          is_gift: false
        })),
        ...earnedGifts.map(gift => ({
          product_id: gift.giftProductId,
          color_id: null,
          size_id: null,
          quantity: gift.quantity,
          price: 0,
          is_gift: true,
          promotion_id: gift.promoId
        }))
      ];

      const orderData = {
        user_id: user?.id || null,
        total_price: finalTotal,
        voucher_id: appliedVoucher?.id || null,
        address: shippingAddress,
        phone: user?.phone || guestInfo.phone,
        name: user?.name || guestInfo.name,
        email: user?.email || guestInfo.email,
        payment_method: paymentMethod,
        items: itemsPayload,
      };

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await API.post("/orders", orderData, { headers });

      setCart([]); // Clear cart

      if (res.data.payUrl) {
        window.location.href = res.data.payUrl;
      } else {
        setStatusMessage("✅ Order placed successfully!");
        setTimeout(() => navigate(user ? "/profile" : "/"), 2000);
      }
    } catch (err) {
      setStatusMessage(`❌ Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const formatPrice = (n) => Number(n).toLocaleString("vi-VN") + " đ";

  return {
    state: {
      cart, user, tier, discount,
      statusMessage, shippingAddress, paymentMethod, guestInfo,
      appliedVoucher, earnedGifts, giftDetails,
      subtotal, membershipDiscount, voucherDiscount, finalTotal,
      isLocating, locationError
    },
    actions: {
      setShippingAddress, setPaymentMethod, handleGuestChange,
      handleSubmitOrder, fetchCurrentLocation, navigate
    },
    helpers: {
      getImageUrl: resolveItemImage, formatPrice
    }
  };
}

