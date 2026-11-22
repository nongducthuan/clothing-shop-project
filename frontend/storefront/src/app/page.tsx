import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Trang chủ | Clothing Shop",
  description: "Khám phá các bộ sưu tập thời trang nam nữ mới nhất, ưu đãi giảm giá và chính sách bán hàng tại Clothing Shop.",
};

export default function HomePage() {
  return <HomeClient />;
}
