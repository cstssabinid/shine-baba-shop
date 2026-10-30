import { categories as sampleCategories, products as sampleProducts, type Product } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  color: string;
  emoji: string;
};

export async function getPublicCatalog() {
  const [records, storedCategories] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { category: true, images: { orderBy: { sortOrder: "asc" } }, variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);

  const products: Product[] = records.flatMap((record) => {
    const variants = record.variants;
    if (variants.length === 0) return [];
    const sample = sampleProducts.find((product) => product.slug === record.slug);
    const image = record.images[0]?.url ?? sample?.image ?? "";
    const firstVariant = variants[0];
    const optionEntries = firstVariant.options && typeof firstVariant.options === "object" && !Array.isArray(firstVariant.options)
      ? Object.entries(firstVariant.options as Record<string, unknown>)
      : [];
    const optionLabel = optionEntries[0]?.[0] ?? sample?.options?.label ?? "Choose an option";

    return [{
      slug: record.slug,
      name: record.name,
      category: sample?.category ?? sampleCategories.find((category) => category.name === record.category?.name)?.name ?? "Other Groceries",
      price: firstVariant.priceAmount / 100,
      priceRwf: firstVariant.priceRwf,
      description: record.description,
      detail: sample?.detail ?? record.description,
      shop: "Shine Baba Shop",
      badge: record.isFeatured ? "Featured" : undefined,
      color: sample?.color ?? "#f1dfcd",
      emoji: sample?.emoji ?? "✦",
      image,
      stockQuantity: variants.every((variant) => variant.stockQuantity !== null)
        ? variants.reduce((sum, variant) => sum + (variant.stockQuantity ?? 0), 0)
        : null,
      hasUncountedStock: variants.some((variant) => variant.stockQuantity === null),
      variants: variants.map((variant) => ({
        id: variant.id,
        label: variant.label,
        price: variant.priceAmount / 100,
        priceRwf: variant.priceRwf,
        stockQuantity: variant.stockQuantity,
        isPricePlaceholder: variant.isPricePlaceholder,
      })),
      options: variants.length > 1 || variants[0].label !== "Default"
        ? { label: optionLabel, values: variants.map((variant) => variant.label) }
        : undefined,
    }];
  });

  const categories: CatalogCategory[] = sampleCategories.map((sample) => {
    const stored = storedCategories.find((category) => category.name === sample.name);
    const slug = stored?.slug ?? sample.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return { id: stored?.id ?? slug, name: sample.name, slug, color: sample.color, emoji: sample.emoji };
  });

  return { products, categories };
}
