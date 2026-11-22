import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Sản phẩm #${id} | Shop`,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  await params; // Ensure async params resolution in Next 16
  return <ProductDetailClient />;
}
