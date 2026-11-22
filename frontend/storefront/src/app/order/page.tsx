import type { Metadata } from "next";
import OrderLookupClient from "./OrderLookupClient";

export const metadata: Metadata = {
  title: "Tra cứu đơn hàng | Shop",
};

export default function OrderLookupPage() {
  return <OrderLookupClient />;
}
