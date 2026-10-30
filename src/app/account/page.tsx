import type { Metadata } from "next";
import { headers } from "next/headers";
import { CustomerAccountPanel, type CustomerAccountData } from "@/components/customer-account-panel";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "My account",
  description: "Sign in with your phone number and password to see your Shine Baba Shop orders and saved delivery details.",
};

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return <CustomerAccountPanel account={null} />;

  const user = await prisma.user.findFirst({
    where: { id: session.user.id, role: "CUSTOMER", status: "ACTIVE" },
    select: {
      fullName: true,
      email: true,
      phone: true,
      addresses: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, recipient: true, phone: true, district: true, sector: true, directions: true },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          fulfillments: { select: { items: { select: { productNameSnapshot: true, quantity: true } } } },
        },
      },
    },
  });

  const account: CustomerAccountData | null = user ? {
    fullName: user.fullName,
    email: user.email ?? session.user.email,
    phone: user.phone,
    addresses: user.addresses,
    orders: user.orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt.toLocaleDateString("en-RW", { year: "numeric", month: "short", day: "numeric" }),
      items: order.fulfillments.flatMap((fulfillment) => fulfillment.items.map((item) => ({ name: item.productNameSnapshot, quantity: item.quantity }))),
    })),
  } : null;

  return <CustomerAccountPanel account={account} />;
}

