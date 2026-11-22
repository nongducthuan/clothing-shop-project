import type { Metadata } from "next";
import SalesPolicyClient from "./SalesPolicyClient";

export const metadata: Metadata = {
  title: "Chính sách bán hàng | Shop",
  description: "Chính sách đổi trả, bảo hành và ưu đãi mua hàng",
};

export default function SalesPolicyPage() {
  return <SalesPolicyClient />;
}
