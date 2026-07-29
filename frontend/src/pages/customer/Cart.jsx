import { Link, useNavigate } from "react-router-dom";
import { useCartPage } from "../../hooks/client/useCartPage";
import CartItem from "../../components/client/cart/CartItem";
import GiftItem from "../../components/client/cart/GiftItem";
import OrderSummary from "../../components/client/cart/OrderSummary";

export default function Cart() {
  const navigate = useNavigate();
  const { state, actions, helpers } = useCartPage();

  const handleCheckout = () => {
    navigate("/checkout", {
      state: { appliedVoucher: state.appliedVoucher, earnedGifts: state.earnedGifts }
    });
  };

  if (state.cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
          <i className="fa-solid fa-bag-shopping text-4xl text-slate-300"></i>
        </div>
        <h2 className="text-3xl font-medium text-slate-900 tracking-tight">Your bag is empty.</h2>
        <p className="text-slate-500 mt-3 mb-10 text-lg">Sign in to see if you have any saved items.</p>
        <Link to="/" className="bg-slate-900 text-white px-10 py-4 rounded-full font-medium hover:bg-slate-800 transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-16">

        <header className="mb-16">
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-slate-900">Cart</h1>
          <p className="text-slate-500 mt-4 text-lg">Free delivery and free returns.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

          {/* LEFT: CART ITEMS & GIFTS */}
          <div className="lg:col-span-8">
            <div className="divide-y divide-slate-100 border-t border-slate-100">
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
              <div className="mt-16 pt-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-3">
                  <i className="fa-solid fa-gift text-slate-400"></i>
                  Complimentary Gifts
                </h3>
                <div className="space-y-4">
                  {state.earnedGifts.map((gift, idx) => (
                    <GiftItem
                      key={idx}
                      gift={gift}
                      detail={state.giftProductsDetails[gift.giftProductId]}
                      helpers={helpers}
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
