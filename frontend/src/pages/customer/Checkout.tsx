import React from "react";
import { useCheckoutPage } from "../../hooks/customer/useCheckoutPage";
import { ShippingSection, GuestContactSection, PaymentSection } from "../../components/customer/checkout/CheckoutForms";
import { CheckoutSummary } from "../../components/customer/checkout/CheckoutSummary";
import { EmptyCheckout } from "../../components/customer/checkout/EmptyCheckout";

export default function Checkout() {
  const { state, actions, helpers } = useCheckoutPage();

  if (state.cart.length === 0) {
    return <EmptyCheckout onShop={() => actions.navigate("/")} />;
  }

  return (
    <div className="bg-white flex-1 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 py-8">

        <header className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-slate-900">Checkout</h1>
          <p className="text-slate-500 mt-3 text-lg">Please provide your details to complete the order.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

          {/* LEFT COLUMN: FORMS */}
          <div className="lg:col-span-7">
            <ShippingSection
              address={state.shippingAddress}
              setAddress={actions.setShippingAddress}
              fetchLocation={actions.fetchCurrentLocation}
              isLocating={state.isLocating}
              locationError={state.locationError}
            />

            {!state.user && (
              <GuestContactSection
                guestInfo={state.guestInfo}
                onChange={actions.handleGuestChange}
              />
            )}

            <PaymentSection
              currentMethod={state.paymentMethod}
              onChange={actions.setPaymentMethod}
            />

            <div className="mt-12 pt-8 border-t border-slate-100">
              <button
                onClick={actions.handleSubmitOrder}
                className="w-full bg-slate-900 text-white h-12 py-3.5 rounded-full font-semibold text-base hover:bg-slate-800 transition-all active:scale-[0.98] shadow-md flex items-center justify-center"
              >
                Place Order
              </button>

              {state.statusMessage && (
                <div className={`mt-4 p-4 rounded-2xl text-sm font-medium text-center ${state.statusMessage.includes("✅") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {state.statusMessage}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24">
            <CheckoutSummary state={state} helpers={helpers} />
          </aside>

        </div>
      </div>
    </div>
  );
}
