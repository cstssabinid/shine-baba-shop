import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCustomerSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const customer = await prisma.user.findFirst({
    where: { id: session.user.id, role: "CUSTOMER", status: "ACTIVE" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      addresses: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          recipient: true,
          phone: true,
          district: true,
          sector: true,
          directions: true,
          createdAt: true,
        },
      },
    },
  });

  return customer;
}

