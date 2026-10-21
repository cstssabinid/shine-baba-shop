import type { Metadata } from "next";
import { ShopsContent } from "@/components/page-content";

export const metadata: Metadata = {
  title: "Our shop",
  description: "Discover Shine Baba Shop, based in Kigali, Rwanda.",
};

export default function ShopsPage() {
  return <ShopsContent />;
}
