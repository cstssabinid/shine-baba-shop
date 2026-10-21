import type { Metadata } from "next";
import { AccountContent } from "@/components/page-content";

export const metadata: Metadata = {
  title: "My account",
  description: "Account features for Shine Baba Shop are coming soon.",
};

export default function AccountPage() {
  return <AccountContent />;
}
