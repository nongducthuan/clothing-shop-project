import { Suspense } from "react";
import type { Metadata } from "next";
import PaymentReturnClient from "./PaymentReturnClient";

export const metadata: Metadata = {
  title: "Kết quả thanh toán | Shop",
};

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <PaymentReturnClient />
    </Suspense>
  );
}
