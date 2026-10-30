"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasManagerSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { categories as catalogCategories } from "@/lib/catalog";
import { getUsdToRwfRate } from "@/lib/exchange-rate";

async function requireManager() {
  if (!await hasManagerSession()) redirect("/admin?error=login");
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}

function usdCentsFromRwf(value: FormDataEntryValue | null, usdToRwf: number) {
  if (typeof value !== "string" || !/^\d{1,12}(\.\d{1,2})?$/.test(value.trim())) return null;
  const amount = Number(value.trim());
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(usdToRwf) || usdToRwf <= 0) return null;
  const usdCents = Math.round((amount / usdToRwf) * 100);
  return Number.isSafeInteger(usdCents) && usdCents <= 2_147_483_647 ? usdCents : null;
}

function stockValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  if (!/^\d{1,7}$/.test(value.trim())) return null;
  return Number(value.trim());
}

function imageUrl(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const result = value.trim();
  if (!result || result.length > 2048) return null;
  if (result.startsWith("/") && !result.startsWith("//") && !result.includes("\\") && !result.includes("..")) return result;
  try {
    const parsed = new URL(result);
    return parsed.protocol === "https:" ? result : null;
  } catch {
    return null;
  }
}

function categoryName(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().slice(0, 60) : "";
}

const validCategoryNames = new Set(catalogCategories.map((category) => category.name));

function refreshCatalog(slug?: string) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/products/[slug]", "page");
  revalidatePath("/shops/shine-baba-shop");
  revalidatePath("/api/catalog");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/products/${slug}`);
}

export async function saveProduct(formData: FormData) {
  await requireManager();
  const { usdToRwf } = await getUsdToRwfRate();
  const id = formData.get("productId");
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const description = String(formData.get("description") ?? "").trim().slice(0, 3000);
  const category = categoryName(formData.get("category"));
  const image = imageUrl(formData.get("image"));
  const statusValue = String(formData.get("status") ?? "DRAFT");
  const status = ["ACTIVE", "DRAFT", "ARCHIVED"].includes(statusValue) ? statusValue : "DRAFT";
  const featured = formData.get("featured") === "true";
  if (!name || !description || !image || !validCategoryNames.has(category) || !slugify(category)) redirect("/admin?error=product-fields");

  const productId = typeof id === "string" && id ? id : null;
  if (!productId) {
    const slugFromForm = String(formData.get("slug") ?? "").trim();
    const slug = slugify(slugFromForm || name);
    const priceAmount = usdCentsFromRwf(formData.get("price"), usdToRwf);
    const openingStock = stockValue(formData.get("stock"));
    if (!slug || !slugify(category) || priceAmount === null || priceAmount < 1 || openingStock === null) redirect("/admin?error=product-fields");
    try {
      await prisma.$transaction(async (tx) => {
        const categorySlug = slugify(category);
        const storedCategory = await tx.category.upsert({ where: { slug: categorySlug }, update: { name: category }, create: { name: category, slug: categorySlug } });
        const shop = await tx.shop.findUnique({ where: { slug: "shine-baba-shop" }, select: { id: true } });
        if (!shop) throw new Error("Shop is not seeded");
        const product = await tx.product.create({ data: { shopId: shop.id, categoryId: storedCategory.id, name, slug, description, status: status as "ACTIVE" | "DRAFT" | "ARCHIVED", isFeatured: featured } });
        await tx.productImage.create({ data: { productId: product.id, url: image, altText: name, sortOrder: 0 } });
        const variant = await tx.productVariant.create({ data: { productId: product.id, label: "Default", sku: `${slug}-default-${randomBytes(3).toString("hex")}`, options: {}, currency: "USD", priceAmount, isPricePlaceholder: true, stockQuantity: openingStock } });
        if (openingStock !== undefined && openingStock > 0) await tx.inventoryMovement.create({ data: { variantId: variant.id, delta: openingStock, reason: "Opening stock set by manager" } });
      });
      refreshCatalog(slug);
      redirect("/admin?notice=product-added");
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      redirect("/admin?error=save-product");
    }
  }

  const variantIds = formData.getAll("variantId").map(String);
  const prices = formData.getAll("variantPrice").map(String);
  const stocks = formData.getAll("variantStock").map(String);
  const placeholders = formData.getAll("variantPlaceholder").map(String);
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { id: productId }, include: { variants: true, images: { orderBy: { sortOrder: "asc" } } } });
      if (!existing) throw new Error("Product not found");
      const categorySlug = slugify(category);
      const storedCategory = await tx.category.upsert({ where: { slug: categorySlug }, update: { name: category }, create: { name: category, slug: categorySlug } });
      await tx.product.update({ where: { id: productId }, data: { name, description, categoryId: storedCategory.id, status: status as "ACTIVE" | "DRAFT" | "ARCHIVED", isFeatured: featured } });
      if (existing.images[0]) await tx.productImage.update({ where: { id: existing.images[0].id }, data: { url: image, altText: name } });
      else await tx.productImage.create({ data: { productId, url: image, altText: name, sortOrder: 0 } });

      for (let index = 0; index < variantIds.length; index += 1) {
        const variant = existing.variants.find((entry) => entry.id === variantIds[index]);
        if (!variant) continue;
        const enteredPrice = prices[index]?.trim();
        const displayedCurrentPrice = variant.priceAmount === null ? null : Math.round((variant.priceAmount / 100) * usdToRwf);
        const newPrice = !enteredPrice || Number(enteredPrice) === displayedCurrentPrice
          ? variant.priceAmount
          : usdCentsFromRwf(enteredPrice, usdToRwf);
        const requestedStock = stockValue(stocks[index] ?? "");
        if (requestedStock === null) throw new Error("Invalid variant value");
        const newStock = requestedStock === undefined ? variant.stockQuantity : requestedStock;
        if (newPrice === null || newPrice < 1) throw new Error("Invalid variant value");
        await tx.productVariant.update({ where: { id: variant.id }, data: { priceAmount: newPrice, stockQuantity: newStock, isPricePlaceholder: placeholders[index] === "true" } });
        if (newStock !== variant.stockQuantity && newStock !== null) {
          const delta = newStock - (variant.stockQuantity ?? 0);
          await tx.inventoryMovement.create({ data: { variantId: variant.id, delta, reason: variant.stockQuantity === null ? "Opening stock set by manager" : "Manager stock adjustment" } });
        }
      }
      return existing.slug;
    });
    refreshCatalog(updated);
    redirect("/admin?notice=product-saved");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect("/admin?error=save-product");
  }
}

export async function archiveProduct(formData: FormData) {
  await requireManager();
  const id = String(formData.get("productId") ?? "");
  if (!id) redirect("/admin?error=product-not-found");
  const product = await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" }, select: { slug: true } }).catch(() => null);
  if (!product) redirect("/admin?error=product-not-found");
  refreshCatalog(product.slug);
  redirect("/admin?notice=product-archived");
}

export async function addVariant(formData: FormData) {
  await requireManager();
  const { usdToRwf } = await getUsdToRwfRate();
  const productId = String(formData.get("productId") ?? "");
  const label = String(formData.get("label") ?? "").trim().slice(0, 100);
  const priceAmount = usdCentsFromRwf(formData.get("price"), usdToRwf);
  const stockQuantity = stockValue(formData.get("stock"));
  if (!productId || !label || priceAmount === null || priceAmount < 1 || stockQuantity === null) redirect("/admin?error=variant-fields");
  try {
    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId }, select: { slug: true, name: true } });
    const variant = await prisma.productVariant.create({ data: { productId, label, sku: `${product.slug}-${slugify(label)}-${randomBytes(3).toString("hex")}`, options: {}, currency: "USD", priceAmount, isPricePlaceholder: true, stockQuantity } });
    if (stockQuantity !== undefined && stockQuantity > 0) await prisma.inventoryMovement.create({ data: { variantId: variant.id, delta: stockQuantity, reason: "Opening stock set by manager" } });
    refreshCatalog(product.slug);
    redirect("/admin?notice=variant-added");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect("/admin?error=variant-fields");
  }
}

export async function deactivateVariant(formData: FormData) {
  await requireManager();
  const variantId = String(formData.get("variantId") ?? "");
  const variant = await prisma.productVariant.update({ where: { id: variantId }, data: { isActive: false }, select: { product: { select: { slug: true } } } }).catch(() => null);
  if (!variant) redirect("/admin?error=variant-not-found");
  refreshCatalog(variant.product.slug);
  redirect("/admin?notice=variant-removed");
}

export async function updateOrderStatus(formData: FormData) {
  await requireManager();
  const orderId = String(formData.get("orderId") ?? "");
  const nextStatus = String(formData.get("status") ?? "");
  if (!orderId || !["PENDING", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"].includes(nextStatus)) redirect("/admin?error=order-status");

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { fulfillments: { include: { items: true } }, payments: true } });
      if (!order) throw new Error("Order not found");
      const allowed: Record<string, string[]> = {
        PENDING: ["PENDING", "CONFIRMED", "CANCELLED"],
        CONFIRMED: ["CONFIRMED", "PROCESSING", "CANCELLED"],
        PROCESSING: ["PROCESSING", "COMPLETED", "CANCELLED"],
        COMPLETED: ["COMPLETED"],
        CANCELLED: ["CANCELLED"],
      };
      if (!allowed[order.status]?.includes(nextStatus)) throw new Error("Invalid order status transition");
      if (nextStatus === "CANCELLED" && order.payments.some((payment) => payment.status === "PAID")) throw new Error("Paid orders need a refund before cancellation");
      if (nextStatus === "CANCELLED" && order.status !== "CANCELLED") {
        const claimed = await tx.order.updateMany({ where: { id: orderId, status: order.status }, data: { status: "CANCELLED" } });
        if (claimed.count !== 1) throw new Error("Order already cancelled");
        for (const sellerOrder of order.fulfillments) {
          await tx.sellerOrder.update({ where: { id: sellerOrder.id }, data: { status: "CANCELLED" } });
          for (const item of sellerOrder.items) {
            await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } });
            await tx.inventoryMovement.create({ data: { variantId: item.variantId, delta: item.quantity, reason: "Cancelled order stock released", reference: order.orderNumber } });
          }
        }
      } else if (nextStatus !== "CANCELLED") {
        const updated = await tx.order.updateMany({ where: { id: orderId, status: order.status }, data: { status: nextStatus as "PENDING" | "CONFIRMED" | "PROCESSING" | "COMPLETED" } });
        if (updated.count !== 1) throw new Error("Order changed concurrently");
        const fulfillmentStatus = nextStatus === "CONFIRMED" ? "CONFIRMED" : nextStatus === "PROCESSING" ? "PREPARING" : nextStatus === "COMPLETED" ? "DELIVERED" : "NEW";
        await tx.sellerOrder.updateMany({ where: { orderId }, data: { status: fulfillmentStatus } });
      }
    });
    revalidatePath("/admin");
    revalidatePath("/api/catalog");
    revalidatePath("/products");
    revalidatePath("/");
    redirect("/admin?notice=order-updated");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect("/admin?error=order-update");
  }
}

export async function confirmManualPayment(formData: FormData) {
  await requireManager();
  const { usdToRwf } = await getUsdToRwfRate();
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) redirect("/admin?error=order-update");
  const itemIds = formData.getAll("orderItemId").map(String);
  const enteredItemPrices = formData.getAll("orderItemPrice").map(String);
  const itemPrices = enteredItemPrices.map((value) => usdCentsFromRwf(value, usdToRwf));
  const enteredDeliveryFee = String(formData.get("deliveryFee") ?? "");
  const deliveryFee = usdCentsFromRwf(enteredDeliveryFee, usdToRwf);
  if (!itemIds.length || itemIds.length !== itemPrices.length || deliveryFee === null || deliveryFee < 0 || itemPrices.some((price) => price === null || price < 1)) redirect("/admin?error=order-update");
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { payments: true, fulfillments: { include: { items: true } } } });
      if (!order || order.status === "CANCELLED") throw new Error("Order unavailable");
      const pendingPayment = order.payments.find((payment) => payment.status === "PENDING");
      if (!pendingPayment) throw new Error("No pending payment");
      const orderItems = order.fulfillments.flatMap((sellerOrder) => sellerOrder.items);
      if (orderItems.length !== itemIds.length || orderItems.some((item) => !itemIds.includes(item.id))) throw new Error("Order items changed");
      const subtotalBySeller = new Map<string, number>();
      let subtotalAmount = 0;
      for (let index = 0; index < itemIds.length; index += 1) {
        const item = orderItems.find((entry) => entry.id === itemIds[index]);
        const displayedCurrentPrice = item ? Math.round((item.unitPriceAmount / 100) * usdToRwf) : null;
        const priceAmount = item && Number(enteredItemPrices[index]) === displayedCurrentPrice
          ? item.unitPriceAmount
          : itemPrices[index];
        if (!item || priceAmount === null || priceAmount === undefined) throw new Error("Invalid order item price");
        const lineTotalAmount = priceAmount * item.quantity;
        subtotalAmount += lineTotalAmount;
        subtotalBySeller.set(item.sellerOrderId, (subtotalBySeller.get(item.sellerOrderId) ?? 0) + lineTotalAmount);
        await tx.orderItem.update({ where: { id: item.id }, data: { unitPriceAmount: priceAmount, lineTotalAmount } });
      }
      for (const sellerOrder of order.fulfillments) await tx.sellerOrder.update({ where: { id: sellerOrder.id }, data: { subtotalAmount: subtotalBySeller.get(sellerOrder.id) ?? 0 } });
      const displayedCurrentDeliveryFee = Math.round((order.deliveryFeeAmount / 100) * usdToRwf);
      const finalDeliveryFee = Number(enteredDeliveryFee) === displayedCurrentDeliveryFee
        ? order.deliveryFeeAmount
        : deliveryFee;
      const totalAmount = subtotalAmount + finalDeliveryFee;
      const nextStatus = order.status === "PENDING" ? "CONFIRMED" : order.status;
      const updated = await tx.order.updateMany({ where: { id: orderId, status: order.status }, data: { subtotalAmount, deliveryFeeAmount: finalDeliveryFee, totalAmount, status: nextStatus } });
      if (updated.count !== 1) throw new Error("Order changed concurrently");
      if (order.status === "PENDING") await tx.sellerOrder.updateMany({ where: { orderId, status: "NEW" }, data: { status: "CONFIRMED" } });
      await tx.payment.update({ where: { id: pendingPayment.id }, data: { amount: totalAmount, status: "PAID", paidAt: new Date() } });
    });
    revalidatePath("/admin");
    redirect("/admin?notice=payment-confirmed");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect("/admin?error=order-update");
  }
}
