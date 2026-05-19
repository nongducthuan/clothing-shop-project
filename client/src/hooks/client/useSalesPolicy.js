import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function useSalesPolicy() {
  const [activeTab, setActiveTab] = useState("new");
  const navigate = useNavigate();

  const handleShopNow = () => {
    navigate("/");
  };

  const handleContactSupport = () => {
    window.open("https://zalo.me/0123456789", "_blank");
  };

  return {
    state: {
      activeTab,
    },
    actions: {
      setActiveTab,
      handleShopNow,
      handleContactSupport,
    },
  };
}
