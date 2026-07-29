import React from "react";
import { useProfilePage } from "../../hooks/client/useProfilePage";

import ProfileHeader from "../../components/client/profile/ProfileHeader";
import ProfileTabs from "../../components/client/profile/ProfileTabs";
import MembershipInfoTab from "../../components/client/profile/MembershipInfoTab";
import OrderListTab from "../../components/client/profile/OrderListTab";
import OrderDetailModal from "../../components/client/profile/OrderDetailModal";
import ReturnRequestModal from "../../components/client/profile/ReturnRequestModal";

export default function Profile() {
  const { state, actions, helpers } = useProfilePage();

  if (!state.user) return null;

  return (
    <div className="min-h-screen bg-white pb-20">

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
