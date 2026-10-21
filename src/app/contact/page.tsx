import type { Metadata } from "next";
import { ContactContent } from "@/components/page-content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Shine Baba Shop in Kigali, Rwanda.",
};

export default function ContactPage() {
  return <ContactContent />;
}
