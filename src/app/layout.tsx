import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { CartProvider } from "@/components/cart-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PreferencesProvider } from "@/components/preferences-provider";
import { ShopIntroAnimation } from "@/components/shop-intro-animation";
import { auth } from "@/lib/auth";
import { getUsdToRwfRate } from "@/lib/exchange-rate";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Shine Baba Shop | Kigali",
    template: "%s | Shine Baba Shop",
  },
  description: "Thoughtful finds for everyday life, from Shine Baba Shop in Kigali, Rwanda.",
  applicationName: "Shine Baba Shop",
  icons: {
    icon: "/brand/shine-baba-shop-icon.png",
    apple: "/brand/shine-baba-shop-icon.png",
  },
  openGraph: {
    title: "Shine Baba Shop",
    description: "Everyday finds, with a little shine. Shop with Shine Baba Shop in Kigali.",
    siteName: "Shine Baba Shop",
    locale: "en_RW",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#e75a32",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const requestHeaders = await headers();
  const [exchangeRate, session] = await Promise.all([
    getUsdToRwfRate(),
    auth.api.getSession({ headers: requestHeaders }),
  ]);
  const customerFirstName = session?.user.name?.trim().split(/\s+/)[0] || null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ShopIntroAnimation />
        <PreferencesProvider exchangeRate={exchangeRate}>
          <CartProvider>
            <SiteHeader customerFirstName={customerFirstName} />
            {children}
            <SiteFooter />
          </CartProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}

