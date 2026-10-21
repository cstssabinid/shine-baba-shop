import type { Product } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export function ProductGrid({ items }: { items: Product[] }) {
  return (
    <div className="product-grid">
      {items.map((product) => <ProductCard key={product.slug} product={product} />)}
    </div>
  );
}
