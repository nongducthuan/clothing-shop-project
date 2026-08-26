import React from "react";
import { useProfilePage } from "../../hooks/customer/useProfilePage";

import ProfileHeader from "../../components/customer/profile/ProfileHeader";
import ProfileTabs from "../../components/customer/profile/ProfileTabs";
import MembershipInfoTab from "../../components/customer/profile/MembershipInfoTab";
import OrderListTab from "../../components/customer/profile/OrderListTab";
import OrderDetailModal from "../../components/customer/profile/OrderDetailModal";
import ReturnRequestModal from "../../components/customer/profile/ReturnRequestModal";

export default function Profile() {
  const { state, actions, helpers } = useProfilePage();

  if (!state.user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/80 font-sans min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white pb-20">

      {/* Header */}
      <ProfileHeader user={state.user} logout={actions.logout} />

      <div className="max-w-[1000px] mx-auto px-6">

        {/* Sliding Pill Tabs */}
        <ProfileTabs activeTab={state.activeTab} setActiveTab={actions.setActiveTab} />

        {/* Tab Content */}
        <div>
          {state.activeTab === "info" && (
            <MembershipInfoTab state={state} actions={actions} helpers={helpers} />
          )}

          {state.activeTab === "orders" && (
            <OrderListTab state={state} actions={actions} helpers={helpers} />
          )}
        </div>

      </div>

      {/* Modals */}
      <OrderDetailModal
        order={state.selectedOrder}
        onClose={() => actions.setSelectedOrder(null)}
        helpers={helpers}
      />

      <ReturnRequestModal
        state={state}
        actions={actions}
      />

    </div>
  );
}
