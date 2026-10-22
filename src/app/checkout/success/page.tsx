import { notFound } from "next/navigation";
import { CheckoutSuccess } from "@/components/checkout-success";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  if (!order || !/^SBS-[A-Z0-9]+-[A-F0-9]{8}$/.test(order)) notFound();
  return <CheckoutSuccess orderNumber={order} />;
}
