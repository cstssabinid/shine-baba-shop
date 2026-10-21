import type { Metadata } from "next";
import { ProductsContent } from "@/components/page-content";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Explore the Shine Baba Shop sample catalog from Kigali, Rwanda.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  return <ProductsContent initialQuery={params.q ?? ""} initialCategory={params.category ?? ""} />;
}
