"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type SubmittedLine = { slug: string; option?: string; quantity: number };
const paymentMethods = { mtn: "MTN_MOBILE_MONEY", airtel: "AIRTEL_MONEY", visa: "VISA", mastercard: "MASTERCARD" } as const;

function parseCart(value: FormDataEntryValue | null): SubmittedLine[] | null {
  if (typeof value !== "string" || value.length > 12000) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 50) return null;
    const merged = new Map<string, SubmittedLine>();
    for (const value of parsed) {
      if (!value || typeof value !== "object") return null;
      const line = value as Partial<SubmittedLine>;
      if (typeof line.slug !== "string" || line.slug.length > 100 || (line.option !== undefined && (typeof line.option !== "string" || line.option.length > 100)) || !Number.isInteger(line.quantity) || !line.quantity || line.quantity < 1 || line.quantity > 99) return null;
      const key = `${line.slug}\u0000${line.option ?? "Default"}`;
      const existing = merged.get(key);
      const quantity = (existing?.quantity ?? 0) + line.quantity;
      if (quantity > 99) return null;
      merged.set(key, { slug: line.slug, option: line.option, quantity });
    }
    return [...merged.values()];
  } catch {
    return null;
  }
}

export async function submitOrder(formData: FormData) {
  const lines = parseCart(formData.get("cart"));
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const rawPhone = String(formData.get("phone") ?? "").trim();
  const phone = rawPhone.replace(/[^0-9+]/g, "");
  const district = String(formData.get("district") ?? "").trim().slice(0, 100);
  const sector = String(formData.get("sector") ?? "").trim().slice(0, 100);
  const directions = String(formData.get("directions") ?? "").trim().slice(0, 500);
  const paymentMethodKey = String(formData.get("paymentMethod") ?? "");
  const idempotencyKey = String(formData.get("requestKey") ?? "");
  if (!lines || name.length < 2 || !/^\+?[0-9]{7,18}$/.test(phone) || !district || !sector || !directions || !Object.hasOwn(paymentMethods, paymentMethodKey) || !/^[0-9a-f-]{36}$/i.test(idempotencyKey)) redirect("/checkout?error=details");

  try {
    const orderNumber = await prisma.$transaction(async (tx) => {
      const previous = await tx.payment.findUnique({ where: { idempotencyKey }, select: { order: { select: { orderNumber: true } } } });
      if (previous) return previous.order.orderNumber;

      const resolved = [] as { variantId: string; productId: string; productName: string; sku: string | null; price: number; quantity: number; options: Record<string, string>; shopId: string }[];
      for (const line of lines) {
        const variant = await tx.productVariant.findFirst({
          where: { label: line.option ?? "Default", isActive: true, product: { slug: line.slug, status: "ACTIVE" } },
          include: { product: { select: { id: true, name: true, shopId: true } } },
        });
        if (!variant || variant.stockQuantity === null || variant.stockQuantity < line.quantity) throw new Error("OUT_OF_STOCK");
        const options = variant.options && typeof variant.options === "object" && !Array.isArray(variant.options) ? variant.options as Record<string, string> : {};
        resolved.push({ variantId: variant.id, productId: variant.product.id, productName: variant.product.name, sku: variant.sku, price: variant.priceAmount, quantity: line.quantity, options, shopId: variant.product.shopId });
      }

      const subtotal = resolved.reduce((sum, item) => sum + item.price * item.quantity, 0);
      for (const item of resolved) {
        const claimed = await tx.productVariant.updateMany({ where: { id: item.variantId, isActive: true, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } });
        if (claimed.count !== 1) throw new Error("OUT_OF_STOCK");
      }

      const customer = await tx.user.upsert({ where: { phone }, update: {}, create: { fullName: name, phone, role: "CUSTOMER" } });
      const address = await tx.address.create({ data: { userId: customer.id, recipient: name, phone, district, sector, directions } });
      const orderNumber = `SBS-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
      const order = await tx.order.create({ data: {
        orderNumber,
        userId: customer.id,
        addressId: address.id,
        status: "PENDING",
        currency: "USD",
        subtotalAmount: subtotal,
        totalAmount: subtotal,
        deliveryAddressSnapshot: { recipient: name, phone, district, sector, directions },
      } });

      const shopTotals = new Map<string, number>();
      for (const item of resolved) shopTotals.set(item.shopId, (shopTotals.get(item.shopId) ?? 0) + item.price * item.quantity);
      for (const [shopId, sellerSubtotal] of shopTotals) {
        const sellerOrder = await tx.sellerOrder.create({ data: { orderId: order.id, shopId, subtotalAmount: sellerSubtotal } });
        await tx.orderItem.createMany({ data: resolved.filter((item) => item.shopId === shopId).map((item) => ({
          sellerOrderId: sellerOrder.id,
          productId: item.productId,
          variantId: item.variantId,
          productNameSnapshot: item.productName,
          skuSnapshot: item.sku,
          optionSnapshot: item.options,
          unitPriceAmount: item.price,
          quantity: item.quantity,
          lineTotalAmount: item.price * item.quantity,
        })) });
      }

      for (const item of resolved) await tx.inventoryMovement.create({ data: { variantId: item.variantId, delta: -item.quantity, reason: "Customer order stock reservation", reference: orderNumber } });
      await tx.payment.create({ data: { orderId: order.id, method: paymentMethods[paymentMethodKey as keyof typeof paymentMethods], status: "PENDING", amount: subtotal, provider: "Manual confirmation required", idempotencyKey } });
      return orderNumber;
    });

    revalidatePath("/api/catalog");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/admin");
    redirect(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    if (error instanceof Error && error.message === "OUT_OF_STOCK") redirect("/checkout?error=stock");
    redirect("/checkout?error=failed");
  }
}
