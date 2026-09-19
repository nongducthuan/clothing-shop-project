import { useState, useMemo } from "react";
import { RETURN_STATUSES, STANDARD_STATUSES } from "../../utils/orderUtils";

export default function useOrderFilters(orders) {
  const [activeTab, setActiveTab] = useState("Standard"); // "Standard" | "Returns"
  const [filterStandard, setFilterStandard] = useState("All");
  const [filterReturn, setFilterReturn] = useState("All");

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
  };

  const displayedOrders = useMemo(() => {
    return orders.filter((order) => {
      const normStatus = order.status?.replace(/_/g, " ");
      if (activeTab === "Standard") {
        if (RETURN_STATUSES.includes(normStatus)) return false;
        return filterStandard === "All" || normStatus === filterStandard || order.status === filterStandard;
      } else {
        // Đơn đã hoàn tác duyệt nhầm: status = Delivered nhưng return_request còn Pending
        // (chờ admin quyết định lại) → hiển thị ở tab Returns như "Return Requested".
        const tabStatus = normStatus === "Delivered" && order.return_status === "Pending"
          ? "Return Requested"
          : normStatus;
        if (!RETURN_STATUSES.includes(tabStatus)) return false;
        return filterReturn === "All" || tabStatus === filterReturn || order.status === filterReturn;
      }
    });
  }, [orders, activeTab, filterStandard, filterReturn]);

  const currentFilters = activeTab === "Standard" ? ["All", ...STANDARD_STATUSES] : ["All", ...RETURN_STATUSES];
  const currentActiveFilter = activeTab === "Standard" ? filterStandard : filterReturn;
  const setCurrentFilter = activeTab === "Standard" ? setFilterStandard : setFilterReturn;

  return {
    activeTab,
    handleTabSwitch,
    currentFilters,
    currentActiveFilter,
    setCurrentFilter,
    displayedOrders,
  };
}

