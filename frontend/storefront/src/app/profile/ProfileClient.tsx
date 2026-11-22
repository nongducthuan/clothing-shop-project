"use client";

import { useProfilePage } from "@/hooks/useProfilePage";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import MembershipInfoTab from "@/components/profile/MembershipInfoTab";
import OrderListTab from "@/components/profile/OrderListTab";
import OrderDetailModal from "@/components/profile/OrderDetailModal";
import ReturnRequestModal from "@/components/profile/ReturnRequestModal";
import ChangePaymentModal from "@/components/common/ChangePaymentModal";
import BuyAgainVariantModal from "@/components/common/BuyAgainVariantModal";

export default function ProfileClient() {
  const { state, actions, helpers } = useProfilePage();

  if (!state.user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/80 dark:bg-slate-900 font-sans min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-slate-800 dark:border-t-slate-300 rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs">
          Loading Profile...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-slate-900 pb-20">
      <ProfileHeader user={state.user} logout={actions.logout} />

      <div className="max-w-[1000px] mx-auto px-6">
        <ProfileTabs activeTab={state.activeTab} setActiveTab={actions.setActiveTab} />

        <div>
          {state.activeTab === "info" && (
            <MembershipInfoTab state={state} actions={actions} helpers={helpers} />
          )}

          {state.activeTab === "orders" && (
            <OrderListTab state={state} actions={actions} helpers={helpers} />
          )}
        </div>
      </div>

      <OrderDetailModal
        order={state.selectedOrder}
        onClose={() => actions.setSelectedOrder(null)}
        onOpenPaymentModal={actions.handleOpenPaymentModal}
        actions={actions}
        state={state}
        helpers={helpers}
      />

      <ReturnRequestModal state={state} actions={actions} />

      <ChangePaymentModal
        isOpen={!!state.paymentModalOrder}
        order={state.paymentModalOrder}
        onClose={actions.handleClosePaymentModal}
        onConfirm={(newMethod) =>
          state.paymentModalOrder
            ? actions.handleRepay(state.paymentModalOrder, newMethod)
            : Promise.resolve()
        }
        loading={state.repayLoading}
      />

      <BuyAgainVariantModal
        substitutions={state.buyAgainSuggestions ?? []}
        onConfirm={actions.handleConfirmBuyAgainSubstitutions}
        onClose={actions.handleCloseBuyAgainModal}
      />
    </div>
  );
}
