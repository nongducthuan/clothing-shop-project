import { Link, useNavigate } from "react-router-dom";
import { useCartPage } from "../../hooks/customer/useCartPage";
import { useLanguage } from "../../context/LanguageContext";
import CartItem from "../../components/customer/cart/CartItem";
import GiftItem from "../../components/customer/cart/GiftItem";
import OrderSummary from "../../components/customer/cart/OrderSummary";

export default function Cart() {
  const navigate = useNavigate();
  const { state, actions, helpers } = useCartPage();
  const { t } = useLanguage();

  const handleCheckout = () => {
    navigate("/checkout", {
      state: { appliedVoucher: state.appliedVoucher, earnedGifts: state.earnedGifts }
    });
  };

  if (state.cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white dark:bg-slate-900">
        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-8">
          <i className="fa-solid fa-bag-shopping text-4xl text-slate-300 dark:text-slate-600"></i>
        </div>
        <h2 className="text-3xl font-medium text-slate-900 dark:text-slate-100 tracking-tight">{t("cart.bag_empty", "Your bag is empty.")}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-3 mb-10 text-lg">{t("cart.sign_in_saved", "Sign in to see if you have any saved items.")}</p>
        <Link to="/" className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-10 py-4 rounded-full font-medium hover:bg-slate-800 dark:hover:bg-white transition-colors">
          {t("cart.continue_shopping", "Continue Shopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 flex-1">
      <div className="max-w-7xl mx-auto px-6 py-8">

        <header className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-slate-900 dark:text-slate-100">{t("cart.header", "Cart")}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg">{t("cart.free_delivery", "Free delivery and free returns.")}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

          {/* LEFT: CART ITEMS & GIFTS */}
          <div className="lg:col-span-8">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
              {state.cart.map((item) => (
                <CartItem
                  key={`${item.id}-${item.color_id}-${item.size_id}`}
                  item={item}
                  actions={actions}
                  helpers={helpers}
                />
              ))}
            </div>

            {/* FREE GIFTS SECTION */}
            {state.earnedGifts.length > 0 && (
              <div className="pt-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-3 m-0 leading-none">
                  <i className="fa-solid fa-gift text-slate-400"></i>
                  {t("cart.complimentary_gifts", "Complimentary Gifts")}
                </h3>
                <div className="space-y-4">
                  {state.earnedGifts.map((gift, idx) => (
                    <GiftItem
                      key={idx}
                      gift={gift}
                      detail={state.giftProductsDetails[gift.giftProductId]}
                      helpers={helpers}
                      onSelectVariant={actions.handleSelectGiftVariant}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <OrderSummary
              state={state}
              actions={actions}
              helpers={helpers}
              onCheckout={handleCheckout}
            />
          </aside>

        </div>
      </div>
    </div>
  );
}
