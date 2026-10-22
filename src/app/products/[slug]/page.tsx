import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicCatalog } from "@/lib/catalog-data";
import { ProductDetailContent } from "@/components/page-content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getPublicCatalog();
  const product = products.find((entry) => entry.slug === slug);
  return { title: product?.name ?? "Product", description: product?.description };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products } = await getPublicCatalog();
  const product = products.find((entry) => entry.slug === slug);
  if (!product) notFound();
  const related = products.filter((item) => item.slug !== product.slug && item.category === product.category).slice(0, 3);
  return <ProductDetailContent product={product} related={related} />;
}
