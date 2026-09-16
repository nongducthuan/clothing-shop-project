import React, { useEffect, useState, useContext } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import API from "../../services/apiClient";
import PaymentBadge from "../../components/common/PaymentBadge";
import ChangePaymentModal from "../../components/customer/common/ChangePaymentModal";
import { AuthContext } from "../../context/AuthContext";

export default function PaymentReturn() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [repayLoading, setRepayLoading] = useState(false);
  const [status, setStatus] = useState<{
    success: boolean;
    orderId?: string | number;
    message: string;
  }>({
    success: false,
    message: "Verifying payment...",
  });

  const isMomo = Boolean(searchParams.get("partnerCode") || searchParams.get("resultCode"));

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const query = searchParams.toString();
        if (!query) {
          setStatus({ success: false, message: "No payment parameters found." });
          setLoading(false);
          return;
        }

        const endpoint = isMomo ? `/orders/momo-return?${query}` : `/orders/vnpay-return?${query}`;
        const res = await API.get(endpoint);
        if (res.data.success) {
          setStatus({
            success: true,
            orderId: res.data.orderId,
            message: isMomo ? "Payment successful via MoMo!" : "Payment successful via VNPay!",
          });
        } else {
          setStatus({
            success: false,
            orderId: res.data.orderId,
            message: res.data.message || "Payment was unsuccessful or cancelled.",
          });
        }
      } catch (err: any) {
        console.error("Payment verification error:", err);
        setStatus({
          success: false,
          message: err.response?.data?.message || "Error verifying payment transaction.",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, isMomo]);

  const handleRepayConfirm = async (newMethod: string) => {
    if (!status.orderId) return;
    setRepayLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        `/orders/${status.orderId}/repay`,
        { new_payment_method: newMethod },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.data?.payUrl) {
        window.location.href = res.data.payUrl;
      } else {
        alert(res.data?.message || "Payment method updated successfully!");
        setShowChangeModal(false);
        navigate(user ? "/profile?tab=orders" : "/order");
      }
    } catch (e: any) {
      alert(e.response?.data?.message || "Unable to change payment method right now.");
    } finally {
      setRepayLoading(false);
    }
  };

  const responseCode = searchParams.get("vnp_ResponseCode") || searchParams.get("resultCode");
  const rawOrderId = searchParams.get("orderId");
  const parsedMoMoOrderId = rawOrderId ? (rawOrderId.startsWith("REPAY") ? rawOrderId.split("_")[1] : rawOrderId.split("_")[0]) : null;
  const txnRef = searchParams.get("vnp_TxnRef") || parsedMoMoOrderId || status.orderId;
  const rawAmount = searchParams.get("amount") || searchParams.get("vnp_Amount");
  const bankCode = searchParams.get("vnp_BankCode") || searchParams.get("payType");
  const formattedAmount = rawAmount
    ? (isMomo ? Number(rawAmount) : Number(rawAmount) / 100).toLocaleString("vi-VN") + " đ"
    : null;

  return (
    <div className="min-h-[70vh] bg-slate-50 dark:bg-slate-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700 text-center">
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">Verifying transaction...</p>
          </div>
        ) : status.success ? (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <i className="fa-solid fa-circle-check text-4xl"></i>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Payment Successful!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Thank you for your purchase. Your order has been confirmed.</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-600 text-left text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Order ID:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">#{txnRef}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Payment Method:</span>
                <PaymentBadge method={isMomo ? "momo" : "vnpay"} badgeStyle={true} />
              </div>
              {bankCode && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Channel / Bank:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 uppercase">{bankCode}</span>
                </div>
              )}
              {formattedAmount && (
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Total Amount:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{formattedAmount}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to={user ? "/profile?tab=orders" : "/order"}
                className="w-full py-3.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-semibold rounded-2xl transition-all shadow-md"
              >
                View My Orders
              </Link>
              <Link
                to="/"
                className="w-full py-3 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-2xl transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/40 rounded-full flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
              <i className="fa-solid fa-circle-xmark text-4xl"></i>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Payment Failed</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{status.message}</p>
              {responseCode && (
                <p className="text-xs text-rose-500 mt-2 font-mono">VNPay Error Code: {responseCode}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {status.orderId && (
                <button
                  onClick={() => setShowChangeModal(true)}
                  className="w-full py-3.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-semibold rounded-2xl transition-all shadow-md text-center"
                >
                  Pay / Change Payment Method
                </button>
              )}
              <Link
                to={user ? "/profile?tab=orders" : "/order"}
                className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-2xl transition-colors"
              >
                Back to Order History
              </Link>
            </div>
          </div>
        )}
      </div>

      {status.orderId && (
        <ChangePaymentModal
          isOpen={showChangeModal}
          order={{ id: status.orderId, payment_method: "vnpay" }}
          onClose={() => setShowChangeModal(false)}
          onConfirm={handleRepayConfirm}
          loading={repayLoading}
        />
      )}
    </div>
  );
}
