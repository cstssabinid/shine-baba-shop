"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUsdToRwfRate } from "@/lib/exchange-rate";
import { formatRwf, formatUsd } from "@/lib/format";

type SubmittedLine = { slug: string; option?: string; quantity: number };
const paymentMethods = { mtn: "MTN_MOBILE_MONEY", airtel: "AIRTEL_MONEY", visa: "VISA", mastercard: "MASTERCARD" } as const;
const paymentMethodLabels = {
  MTN_MOBILE_MONEY: "MTN Mobile Money",
  AIRTEL_MONEY: "Airtel Money",
  VISA: "Visa",
  MASTERCARD: "Mastercard",
} as const;
const shopWhatsAppNumber = "250790384123";
type OrderDetails = {
  orderNumber: string;
  subtotalAmount: number;
  subtotalRwf: number;
  paymentMethod: keyof typeof paymentMethodLabels;
  items: { productName: string; option: string; quantity: number; lineTotalAmount: number; lineTotalRwf: number }[];
};

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
  await createOrder(formData, "website");
}

export async function submitOrderViaWhatsApp(formData: FormData) {
  await createOrder(formData, "whatsapp");
}

async function createOrder(formData: FormData, channel: "website" | "whatsapp") {
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

  const session = await auth.api.getSession({ headers: await headers() });
  const registeredCustomerId = session?.user.id;
  const exchangeRate = await getUsdToRwfRate();

  let orderDetails: OrderDetails;
  try {
    orderDetails = await prisma.$transaction(async (tx) => {
      const previous = await tx.payment.findUnique({
        where: { idempotencyKey },
        select: {
          method: true,
          order: {
            select: {
              orderNumber: true,
              subtotalAmount: true,
              subtotalRwf: true,
              fulfillments: { select: { items: { select: { productNameSnapshot: true, quantity: true, lineTotalAmount: true, lineTotalRwf: true, variant: { select: { label: true } } } } } },
            },
          },
        },
      });
      if (previous) return {
        orderNumber: previous.order.orderNumber,
        subtotalAmount: previous.order.subtotalAmount,
        subtotalRwf: previous.order.subtotalRwf ?? Math.round((previous.order.subtotalAmount / 100) * exchangeRate.usdToRwf),
        paymentMethod: previous.method,
        items: previous.order.fulfillments.flatMap((fulfillment) => fulfillment.items.map((item) => ({
          productName: item.productNameSnapshot,
          option: item.variant.label === "Default" ? "" : item.variant.label,
          quantity: item.quantity,
          lineTotalAmount: item.lineTotalAmount,
          lineTotalRwf: item.lineTotalRwf ?? Math.round((item.lineTotalAmount / 100) * exchangeRate.usdToRwf),
        }))),
      };

      const resolved = [] as { variantId: string; productId: string; productName: string; variantLabel: string; sku: string | null; price: number; priceRwf: number; quantity: number; options: Record<string, string>; shopId: string }[];
      for (const line of lines) {
        const variant = await tx.productVariant.findFirst({
          where: { label: line.option ?? "Default", isActive: true, product: { slug: line.slug, status: "ACTIVE" } },
          include: { product: { select: { id: true, name: true, shopId: true } } },
        });
        if (!variant || variant.stockQuantity === null || variant.stockQuantity < line.quantity) throw new Error("OUT_OF_STOCK");
        const options = variant.options && typeof variant.options === "object" && !Array.isArray(variant.options) ? variant.options as Record<string, string> : {};
        resolved.push({ variantId: variant.id, productId: variant.product.id, productName: variant.product.name, variantLabel: variant.label, sku: variant.sku, price: variant.priceAmount, priceRwf: variant.priceRwf ?? Math.round((variant.priceAmount / 100) * exchangeRate.usdToRwf), quantity: line.quantity, options, shopId: variant.product.shopId });
      }

      const subtotal = resolved.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const subtotalRwf = resolved.reduce((sum, item) => sum + item.priceRwf * item.quantity, 0);
      for (const item of resolved) {
        const claimed = await tx.productVariant.updateMany({ where: { id: item.variantId, isActive: true, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } });
        if (claimed.count !== 1) throw new Error("OUT_OF_STOCK");
      }

      const customer = registeredCustomerId
        ? await tx.user.findFirst({ where: { id: registeredCustomerId, role: "CUSTOMER", status: "ACTIVE" } })
        : await tx.user.upsert({ where: { phone }, update: {}, create: { fullName: name, phone, role: "CUSTOMER" } });
      if (!customer) throw new Error("CUSTOMER_INACTIVE");
      const hasSavedAddress = await tx.address.findFirst({ where: { userId: customer.id }, select: { id: true } });
      const address = await tx.address.create({ data: { userId: customer.id, recipient: name, phone, district, sector, directions, isDefault: !hasSavedAddress } });
      const orderNumber = `SBS-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
      const order = await tx.order.create({ data: {
        orderNumber,
        userId: customer.id,
        addressId: address.id,
        status: "PENDING",
        currency: "USD",
        subtotalAmount: subtotal,
        subtotalRwf,
        totalAmount: subtotal,
        totalRwf: subtotalRwf,
        deliveryAddressSnapshot: { recipient: name, phone, district, sector, directions },
        customerNote: channel === "whatsapp" ? "Customer requested order confirmation via WhatsApp." : null,
      } });

      const shopTotals = new Map<string, number>();
      for (const item of resolved) shopTotals.set(item.shopId, (shopTotals.get(item.shopId) ?? 0) + item.price * item.quantity);
      for (const [shopId, sellerSubtotal] of shopTotals) {
        const sellerSubtotalRwf = resolved.filter((item) => item.shopId === shopId).reduce((sum, item) => sum + item.priceRwf * item.quantity, 0);
        const sellerOrder = await tx.sellerOrder.create({ data: { orderId: order.id, shopId, subtotalAmount: sellerSubtotal, subtotalRwf: sellerSubtotalRwf } });
        await tx.orderItem.createMany({ data: resolved.filter((item) => item.shopId === shopId).map((item) => ({
          sellerOrderId: sellerOrder.id,
          productId: item.productId,
          variantId: item.variantId,
          productNameSnapshot: item.productName,
          skuSnapshot: item.sku,
          optionSnapshot: item.options,
          unitPriceAmount: item.price,
          unitPriceRwf: item.priceRwf,
          quantity: item.quantity,
          lineTotalAmount: item.price * item.quantity,
          lineTotalRwf: item.priceRwf * item.quantity,
        })) });
      }

      for (const item of resolved) await tx.inventoryMovement.create({ data: { variantId: item.variantId, delta: -item.quantity, reason: "Customer order stock reservation", reference: orderNumber } });
      await tx.payment.create({ data: { orderId: order.id, method: paymentMethods[paymentMethodKey as keyof typeof paymentMethods], status: "PENDING", amount: subtotal, provider: "Manual confirmation required", idempotencyKey } });
      return {
        orderNumber,
        subtotalAmount: subtotal,
        subtotalRwf,
        paymentMethod: paymentMethods[paymentMethodKey as keyof typeof paymentMethods],
        items: resolved.map((item) => ({
          productName: item.productName,
          option: item.variantLabel === "Default" ? "" : item.variantLabel,
          quantity: item.quantity,
          lineTotalAmount: item.price * item.quantity,
          lineTotalRwf: item.priceRwf * item.quantity,
        })),
      };
    });
  } catch (error) {
    if (error instanceof Error && error.message === "OUT_OF_STOCK") redirect("/checkout?error=stock");
    if (error instanceof Error && error.message === "CUSTOMER_INACTIVE") redirect("/account?error=unavailable");
    redirect("/checkout?error=failed");
  }

  revalidatePath("/api/catalog");
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/admin");
  if (channel === "whatsapp") {
    const itemLines = orderDetails.items.map((item) => {
      const option = item.option ? ` (${item.option})` : "";
      return `- ${item.productName}${option} x ${item.quantity}: ${formatRwf(item.lineTotalRwf)} (${formatUsd(item.lineTotalRwf / exchangeRate.usdToRwf)})`;
    });
    const rateNote = exchangeRate.source === "BNR"
      ? `Indicative rate: 1 USD = ${formatRwf(exchangeRate.usdToRwf)} (BNR reference, ${exchangeRate.asOf ?? "latest available"}).`
      : "Indicative rate: live rate unavailable; RWF amounts use an estimate. The shop will confirm the final amount.";
    const message = [
      "Hello Shine Baba Shop, I placed an order request.",
      `Order: ${orderDetails.orderNumber}`,
      "",
      ...itemLines,
      "",
      `Estimated subtotal: ${formatRwf(orderDetails.subtotalRwf)} (${formatUsd(orderDetails.subtotalRwf / exchangeRate.usdToRwf)})`,
      rateNote,
      `Customer: ${name}`,
      `Phone: ${phone}`,
      `Delivery area: ${sector}, ${district}`,
      `Directions: ${directions}`,
      `Preferred payment: ${paymentMethodLabels[orderDetails.paymentMethod]}`,
      "Please confirm the final price, delivery fee, and payment instructions.",
    ].join("\n");
    redirect(`https://wa.me/${shopWhatsAppNumber}?text=${encodeURIComponent(message)}`);
  }
  redirect(`/checkout/success?order=${encodeURIComponent(orderDetails.orderNumber)}`);
}

