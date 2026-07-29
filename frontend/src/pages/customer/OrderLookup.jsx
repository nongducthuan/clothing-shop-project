import React from "react";
import { useOrderLookup } from "../../hooks/client/useOrderLookup";
import OrderLookupHeader from "../../components/client/order-lookup/OrderLookupHeader";
import EmailStep from "../../components/client/order-lookup/EmailStep";
import OtpStep from "../../components/client/order-lookup/OtpStep";
import OrdersStep from "../../components/client/order-lookup/OrdersStep";
import ReturnFormStep from "../../components/client/order-lookup/ReturnFormStep";

export default function GuestOrderTracking() {
  const { state, actions, helpers } = useOrderLookup();

  return (
    <div className="min-h-[calc(100vh-25vh)] bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">

        {/* CARD HEADER */}
        <OrderLookupHeader step={state.step} email={state.email} />

        <div className="p-8">
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
              loading={state.loading}
              openReturnForm={actions.openReturnForm}
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
    </div>
  );
}
