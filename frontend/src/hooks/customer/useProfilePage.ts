import { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import API from "../../services/apiClient.js";
import { getImageUrl } from "../../utils/imageUtils";

const TIER_CONFIG = {
  Normal: { next: 5000000, color: "text-slate-500", bg: "bg-slate-100", icon: "fa-circle-user", label: "Bronze" },
  Bronze: { next: 10000000, color: "text-orange-500", bg: "bg-orange-100", icon: "fa-medal", label: "Silver" },
  Silver: { next: 15000000, color: "text-slate-500", bg: "bg-slate-100", icon: "fa-award", label: "Gold" },
  Gold: { next: 20000000, color: "text-yellow-500", bg: "bg-yellow-100", icon: "fa-crown", label: "Diamond" },
  Diamond: { next: null, color: "text-cyan-500", bg: "bg-cyan-100", icon: "fa-gem", label: "Maximum" },
};

const INITIAL_RETURN_DATA = {
  reason: "Change mind",
  note: "",
  bankName: "",
  bankNumber: "",
  accountHolder: "",
  images: [],
};

export function useProfilePage() {
  const { user, logout, tier, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- State Management ---
  const [activeTab, setActiveTab] = useState("info");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [phone, setPhone] = useState(user?.phone || "");

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState(null);
  const [returnData, setReturnData] = useState(INITIAL_RETURN_DATA);

  // --- Derived Variables ---
  const currentConfig = TIER_CONFIG[tier] || TIER_CONFIG.Normal;
  const totalSpent = Number(user?.total_spent || 0);
  const safeProgress = useMemo(() => {
    const rawProgress = currentConfig.next ? (totalSpent / currentConfig.next) * 100 : 100;
    return Math.min(rawProgress, 100);
  }, [totalSpent, currentConfig.next]);

  // --- Effects ---
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    refreshUser();

    const urlParams = new URLSearchParams(window.location.search);
    const paymentResult = urlParams.get("resultCode");

    if (paymentResult) {
      if (paymentResult === "0") {
        alert("🎉 Order paid successfully! Thank you.");
        fetchOrders(); // Refresh orders to show 'Paid' status
      } else {
        alert("❌ Payment failed or was cancelled.");
      }
      window.history.replaceState({}, document.title, "/profile");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  useEffect(() => {
    if (user && activeTab === "orders" && orders.length === 0) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  // --- Handlers & API Calls ---
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Order Fetch Error:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleMoMoPayment = async (order) => {
    try {
      const token = localStorage.getItem("token");
      const response = await API.post(
        `/orders/${order.id}/repay`,
        { email: order.email },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (response.data?.payUrl) {
        window.location.href = response.data.payUrl;
      }
    } catch (error) {
      console.error("Repay error:", error);
      alert(error.response?.data?.message || "Unable to create payment link right now.");
    }
  };

  const handleOpenReturnModal = (orderId) => {
    setReturnOrderId(orderId);
    setReturnData(INITIAL_RETURN_DATA);
    setShowReturnModal(true);
  };

  const handleSubmitReturn = async () => {
    const { bankName, bankNumber, accountHolder, reason, note, images } = returnData;

    if (!bankName || !bankNumber || !accountHolder) {
      return alert("Please fill in all bank details.");
    }

    const currentOrder = orders.find((o) => o.id === returnOrderId);
    if (!currentOrder?.email) {
      return alert("Order email information not found!");
    }

    const formData = new FormData();
    formData.append("reason_code", reason);
    formData.append("description", note);
    formData.append("email", currentOrder.email);
    formData.append("bankInfo", JSON.stringify({ name: bankName, acc: bankNumber, owner: accountHolder }));

    if (images?.length > 0) {
      Array.from(images).forEach((file) => formData.append("images", file));
    }

    try {
      const response = await API.put(
        `/orders/${returnOrderId}/return-request`,
        formData,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (response.status === 200 || response.status === 201) {
        alert("Return request submitted successfully! Your order is being processed.");
        setShowReturnModal(false);
        fetchOrders();
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert(error.response?.data?.message || "Unable to connect to the server or process request.");
    }
  };

  const handleReturnDataChange = (field, value) => setReturnData((prev) => ({ ...prev, [field]: value }));
  const formatCurrency = (val) => Number(val).toLocaleString("en-US") + " VND";
  const getImgUrl = (path) => getImageUrl(path);

  return {
    state: {
      user, tier, phone, activeTab, orders, loadingOrders, selectedOrder,
      showReturnModal, returnOrderId, returnData, currentConfig, totalSpent, safeProgress
    },
    actions: {
      setActiveTab, setPhone, logout, setSelectedOrder,
      handleMoMoPayment, handleOpenReturnModal, setShowReturnModal,
      handleSubmitReturn, handleReturnDataChange
    },
    helpers: {
      formatCurrency, getImgUrl
    }
  };
}
