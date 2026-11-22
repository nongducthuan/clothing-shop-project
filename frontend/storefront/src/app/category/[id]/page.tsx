import type { Metadata } from "next";
import CategoryClient from "./CategoryClient";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Danh mục sản phẩm #${id} | Shop`,
  };
}

export default async function CategoryPage({ params }: Props) {
  await params; // Ensure async params resolution in Next 16
  return <CategoryClient />;
}
