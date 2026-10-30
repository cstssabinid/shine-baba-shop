"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { usePreferences } from "@/components/preferences-provider";
import { formatRwf } from "@/lib/format";

const socialLinks = [
  { label: "TikTok", href: "https://www.tiktok.com/@shine_baba_shob" },
  { label: "Instagram", href: "https://www.instagram.com/shine_baba_shob/" },
  { label: "Facebook", href: "https://www.facebook.com/shine_baba_shob" },
];

export function SiteFooter() {
  const { t, exchangeRate } = usePreferences();
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand-block">
          <Image
            src="/brand/shine-baba-shop-logo.png"
            alt="Shine Baba Shop"
            width={170}
            height={170}
            className="footer-logo"
          />
          <p>{t("Thoughtful finds for everyday life, from our shop in Kigali.")}</p>
          <div className="social-links">
            {socialLinks.map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer">{item.label}</a>
            ))}
          </div>
        </div>
        <div className="footer-column">
          <p className="footer-title">{t("Explore")}</p>
          <Link href="/products">{t("Shop all")}</Link>
          <Link href="/shops">{t("Our shop")}</Link>
          <Link href="/contact">{t("Contact")}</Link>
        </div>
        <div className="footer-column">
          <p className="footer-title">{t("We’re here to help")}</p>
          <a href="mailto:juwizeye97@gmail.com"><Icon name="mail" size={16} /> juwizeye97@gmail.com</a>
          <a href="tel:+250790384123"><Icon name="phone" size={16} /> +250 790 384 123</a>
          <a href="https://wa.me/250790384123" target="_blank" rel="noreferrer">WhatsApp +250 790 384 123</a>
        </div>
        <div className="footer-column">
          <p className="footer-title">{t("Visit us")}</p>
          <p>Downtown<br />Kigali City, Rwanda</p>
          <p className="footer-title footer-payment-title">{t("Payment options")}</p>
          <div className="payment-chips">
            <span>MoMo</span><span>Airtel</span><span>VISA</span><span>Mastercard</span>
          </div>
          <p className="footer-title footer-payment-title">{t("Partner Studio")}</p>
          <a href="https://berwaphotohub.vercel.app/" target="_blank" rel="noreferrer">Berwa Photo Hub <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <div className="container footer-exchange-note">
        {exchangeRate.source === "BNR"
          ? <>{t("RWF amounts use the daily National Bank of Rwanda reference rate.")} 1 USD = {formatRwf(exchangeRate.usdToRwf)} · {t("Rate dated")} {exchangeRate.asOf ?? t("latest available")}</>
          : <>{t("Live exchange rate unavailable; using an estimate.")} 1 USD = {formatRwf(exchangeRate.usdToRwf)}</>}
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Shine Baba Shop</span>
        <span>{t("Made with care in Kigali")}</span>
      </div>
    </footer>
  );
}
