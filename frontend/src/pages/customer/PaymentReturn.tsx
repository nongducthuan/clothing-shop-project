import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import API from "../../services/apiClient";
import PaymentBadge from "../../components/common/PaymentBadge";

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{
    success: boolean;
    orderId?: string | number;
    message: string;
  }>({
    success: false,
    message: "Verifying payment...",
  });

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const query = searchParams.toString();
        if (!query) {
          setStatus({ success: false, message: "No payment parameters found." });
          setLoading(false);
          return;
        }

        const res = await API.get(`/orders/vnpay-return?${query}`);
        if (res.data.success) {
          setStatus({
            success: true,
            orderId: res.data.orderId,
            message: "Payment successful via VNPay!",
          });
        } else {
          setStatus({
            success: false,
            orderId: res.data.orderId,
            message: res.data.message || "Payment was unsuccessful or cancelled.",
          });
        }
      } catch (err: any) {
        console.error("VNPay verification error:", err);
        setStatus({
          success: false,
          message: err.response?.data?.message || "Error verifying VNPay transaction.",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const responseCode = searchParams.get("vnp_ResponseCode");
  const txnRef = searchParams.get("vnp_TxnRef") || status.orderId;
  const amount = searchParams.get("vnp_Amount");
  const bankCode = searchParams.get("vnp_BankCode");
  const formattedAmount = amount ? (Number(amount) / 100).toLocaleString("vi-VN") + " đ" : null;

  return (
    <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 font-medium">Verifying VNPay transaction...</p>
          </div>
        ) : status.success ? (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <i className="fa-solid fa-circle-check text-4xl"></i>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">Payment Successful!</h2>
              <p className="text-slate-500 text-sm mt-1">Thank you for your purchase. Your order has been confirmed.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-semibold text-slate-900">#{txnRef}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Method:</span>
                <PaymentBadge method="vnpay" badgeStyle={true} />
              </div>
              {bankCode && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank:</span>
                  <span className="font-medium text-slate-800">{bankCode}</span>
                </div>
              )}
              {formattedAmount && (
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">Total Amount:</span>
                  <span className="font-bold text-blue-600">{formattedAmount}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to="/profile"
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl transition-all shadow-md"
              >
                View My Orders
              </Link>
              <Link
                to="/"
                className="w-full py-3 bg-transparent hover:bg-slate-100 text-slate-700 font-medium rounded-2xl transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <i className="fa-solid fa-circle-xmark text-4xl"></i>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">Payment Failed</h2>
              <p className="text-slate-500 text-sm mt-1">{status.message}</p>
              {responseCode && (
                <p className="text-xs text-rose-500 mt-2 font-mono">VNPay Error Code: {responseCode}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {status.orderId && (
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      const res = await API.post(
                        `/orders/${status.orderId}/repay`,
                        {},
                        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                      );
                      if (res.data?.payUrl) {
                        window.location.href = res.data.payUrl;
                      }
                    } catch (e: any) {
                      alert(e.response?.data?.message || "Unable to create payment link right now.");
                    }
                  }}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-rotate-right"></i> Retry VNPay Payment
                </button>
              )}
              <Link
                to="/profile"
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-2xl transition-colors"
              >
                Back to Order History
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
