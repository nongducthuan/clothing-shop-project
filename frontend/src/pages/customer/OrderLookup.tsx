import React from "react";
import { useOrderLookup } from "../../hooks/customer/useOrderLookup";
import OrderLookupHeader from "../../components/customer/order-lookup/OrderLookupHeader";
import EmailStep from "../../components/customer/order-lookup/EmailStep";
import OtpStep from "../../components/customer/order-lookup/OtpStep";
import OrdersStep from "../../components/customer/order-lookup/OrdersStep";
import ReturnFormStep from "../../components/customer/order-lookup/ReturnFormStep";
import ChangePaymentModal from "../../components/customer/common/ChangePaymentModal";
import BuyAgainVariantModal from "../../components/customer/common/BuyAgainVariantModal";

export default function GuestOrderTracking() {
  const { state, actions, helpers } = useOrderLookup();

  const isWideStep = state.step === 3 || state.step === 4;

  return (
    <div className="flex-1 flex items-center justify-center px-3 sm:px-6 py-6 sm:py-12 bg-white dark:bg-slate-900">
      <div className={`bg-white dark:bg-slate-800 w-full rounded-2xl shadow-xl dark:shadow-slate-900/50 overflow-hidden transition-all duration-300 ${isWideStep ? 'max-w-3xl' : 'max-w-md'}`}>

        {/* CARD HEADER */}
        <OrderLookupHeader step={state.step} email={state.email} />

        <div className="p-4 sm:p-6 md:p-8">
          {/* STEP 1: EMAIL ENTRY */}
          {state.step === 1 && (
            <EmailStep
              email={state.email}
              setEmail={actions.setEmail}
              onSubmit={actions.handleSendOtp}
              loading={state.loading}
            />
          )}

          {/* STEP 2: OTP ENTRY */}
          {state.step === 2 && (
            <OtpStep
              otp={state.otp}
              setOtp={actions.setOtp}
              onSubmit={actions.handleVerifyOtp}
              loading={state.loading}
              onBack={() => actions.setStep(1)}
            />
          )}

          {/* STEP 3: RESULTS */}
          {state.step === 3 && (
            <OrdersStep
              orders={state.orders}
              expandedOrder={state.expandedOrder}
              toggleOrder={actions.toggleOrder}
              formatCurrency={helpers.formatCurrency}
              handleRepay={actions.handleRepay}
              handleOpenPaymentModal={actions.handleOpenPaymentModal}
              loading={state.loading}
              openReturnForm={actions.openReturnForm}
              handleCancelReturn={actions.handleCancelReturn}
              handleCancelOrder={actions.handleCancelOrder}
              handleBuyAgain={actions.handleBuyAgain}
              onReset={actions.resetLookup}
            />
          )}

          {/* STEP 4: RETURN FORM */}
          {state.step === 4 && (
            <ReturnFormStep
              returnForm={state.returnForm}
              setReturnForm={actions.setReturnForm}
              selectedOrder={state.selectedOrder}
              formatCurrency={helpers.formatCurrency}
              handleReturnSubmit={actions.handleReturnSubmit}
              loading={state.loading}
              onCancel={() => actions.setStep(3)}
            />
          )}
        </div>
      </div>

      <ChangePaymentModal
        isOpen={!!state.paymentModalOrder}
        order={state.paymentModalOrder}
        onClose={actions.handleClosePaymentModal}
        onConfirm={(newMethod) => actions.handleRepay(state.paymentModalOrder, newMethod)}
        loading={state.loading}
      />

      <BuyAgainVariantModal
        substitutions={state.buyAgainSuggestions ?? []}
        onConfirm={actions.handleConfirmBuyAgainSubstitutions}
        onClose={actions.handleCloseBuyAgainModal}
      />
    </div>
  );
}
