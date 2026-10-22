import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicCatalog } from "@/lib/catalog-data";
import { ShopDetailContent } from "@/components/page-content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug === "shine-baba-shop" ? "Shine Baba Shop" : "Shop" };
}

export default async function ShopDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== "shine-baba-shop") notFound();
  const { products } = await getPublicCatalog();
  return <ShopDetailContent products={products} />;
}
