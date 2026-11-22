import type { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Thanh toán | Shop",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
