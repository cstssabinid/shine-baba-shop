import { PrismaNeon } from "@prisma/adapter-neon";
import { PaymentMethod, PrismaClient } from "../src/generated/prisma/client";
import { categories, products } from "../src/lib/catalog";
import { getProductTranslation } from "../src/lib/i18n";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be configured before seeding the catalog.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const categoryTranslations: Record<string, { fr: string; rw: string }> = {
  Fragrance: { fr: "Parfums", rw: "Impumuro" },
  "Skin Care": { fr: "Soins de la peau", rw: "Kwitaho uruhu" },
  "Body Care": { fr: "Soins du corps", rw: "Kwitaho umubiri" },
  "Bath & Soap": { fr: "Bain et savons", rw: "Kwiyuhagira n'isabune" },
};

function categorySlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function productTranslations(slug: string) {
  return Object.fromEntries(
    (["fr", "rw"] as const).map((locale) => {
      const translated = getProductTranslation(slug, locale);
      return [locale, {
        name: translated.name ?? "",
        description: translated.description ?? "",
        detail: translated.detail ?? "",
      }];
    }),
  );
}

async function seed() {
  const shopData = {
    name: "Shine Baba Shop",
    slug: "shine-baba-shop",
    description: "Everyday finds and personal care from Kigali, Rwanda.",
    logoUrl: "/brand/shine-baba-shop-icon.png",
    email: "juwizeye97@gmail.com",
    phone: "+250 790 384 123",
    whatsappNumbers: ["+250790384123"],
    address: "KN 20 Ave, Kigali City, Rwanda",
    socialLinks: {
      tiktok: "https://www.tiktok.com/@shine_baba_shob",
      instagram: "https://www.instagram.com/shine_baba_shob/",
      facebook: "https://www.facebook.com/shine_baba_shob",
    },
    paymentMethods: [
      PaymentMethod.MTN_MOBILE_MONEY,
      PaymentMethod.AIRTEL_MONEY,
      PaymentMethod.VISA,
      PaymentMethod.MASTERCARD,
    ],
    status: "ACTIVE" as const,
  };

  await prisma.shop.upsert({
    where: { slug: shopData.slug },
    update: { phone: shopData.phone, whatsappNumbers: shopData.whatsappNumbers },
    create: shopData,
  });

  for (const [sortOrder, category] of categories.entries()) {
    const slug = categorySlug(category.name);
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        name: category.name,
        slug,
        sortOrder,
        translations: categoryTranslations[category.name] ?? {},
      },
    });
  }

  for (const product of products) {
    const productCategorySlug = categorySlug(product.category);
    const translations = productTranslations(product.slug);
    const storedProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        translations,
        status: "ACTIVE",
        shop: { connect: { slug: shopData.slug } },
        category: { connect: { slug: productCategorySlug } },
      },
    });

    await prisma.productImage.upsert({
      where: {
        productId_url: { productId: storedProduct.id, url: product.image },
      },
      update: {},
      create: {
        productId: storedProduct.id,
        url: product.image,
        altText: product.name,
        sortOrder: 0,
      },
    });

    const choices = product.options?.values ?? ["Default"];
    for (const choice of choices) {
      const options = product.options ? { [product.options.label]: choice } : {};
      const sku = `${product.slug}-${choice.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
      const placeholderPriceCents = Math.round(product.price * 100);

      await prisma.productVariant.upsert({
        where: {
          productId_label: { productId: storedProduct.id, label: choice },
        },
        // Seed only missing variants so manager edits remain intact on later deployments.
        update: {},
        create: {
          productId: storedProduct.id,
          label: choice,
          sku,
          options,
          currency: "USD",
          priceAmount: placeholderPriceCents,
          isPricePlaceholder: true,
          stockQuantity: null,
        },
      });
    }
  }

  console.info(`Seeded ${products.length} product listings and ${categories.length} categories.`);
}

seed()
  .catch(() => {
    console.error("Catalog seeding failed. Check the database connection and Prisma logs locally.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
