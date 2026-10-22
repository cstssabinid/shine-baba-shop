import { CheckoutPageContent } from "@/components/checkout-page-content";
import { getCustomerSession } from "@/lib/customer-auth";

export default async function CheckoutPage() {
  const customer = await getCustomerSession();
  const latestAddress = customer?.addresses[0];
  const profile = customer ? {
    fullName: customer.fullName,
    phone: latestAddress?.phone ?? customer.phone ?? "",
    district: latestAddress?.district ?? "",
    sector: latestAddress?.sector ?? "",
    directions: latestAddress?.directions ?? "",
  } : null;

  return <CheckoutPageContent profile={profile} />;
}

