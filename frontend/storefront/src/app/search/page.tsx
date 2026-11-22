import { Suspense } from "react";
import type { Metadata } from "next";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Tìm kiếm sản phẩm | Shop",
  description: "Tìm kiếm trang phục, quần áo, phụ kiện thời trang với mức giá tốt nhất.",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64 text-violet-500 font-bold">
          Loading...
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
