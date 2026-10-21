"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { formatUsd } from "@/lib/format";
import { localizeCategory, localizeProduct } from "@/lib/i18n";
import { Icon } from "@/components/icons";
import { ProductArt } from "@/components/product-art";
import { ProductBrowser } from "@/components/product-browser";
import { ProductDetailActions } from "@/components/product-detail-actions";
import { ProductGrid } from "@/components/product-grid";
import { usePreferences } from "@/components/preferences-provider";

const socials = [
  { name: "TikTok", url: "https://www.tiktok.com/@shine_baba_shob" },
  { name: "Instagram", url: "https://www.instagram.com/shine_baba_shob/" },
  { name: "Facebook", url: "https://www.facebook.com/shine_baba_shob" },
];

export function AccountContent() {
  const { t } = usePreferences();
  return <main className="page-main"><section className="container account-preview empty-state"><div className="empty-state-icon">♙</div><p className="eyebrow">{t("A little more to come")}</p><h1>{t("Your account is ")}<em>{t("on its way.")}</em></h1><p>{t("We’re preparing customer accounts and order tracking. You can still explore the preview catalog or reach the shop directly.")}</p><div className="account-preview-actions"><Link className="button button-dark" href="/products">{t("Explore the shop")}</Link><Link className="button button-outline" href="/contact">{t("Contact us")}</Link></div></section></main>;
}

export function ContactContent() {
  const { t } = usePreferences();
  return (
    <main className="page-main">
      <section className="page-hero"><div className="container"><p className="eyebrow">{t("We’d love to hear from you")}</p><h1>{t("Let’s ")}<em>{t("talk.")}</em></h1><p>{t("Have a question about a product or need a hand? Get in touch with Shine Baba Shop.")}</p></div></section>
      <section className="container section contact-page-grid">
        <div className="contact-main-card"><p className="eyebrow">{t("Customer care")}</p><h2>{t("Here when you ")}<em>{t("need us.")}</em></h2><p className="contact-intro">{t("Choose whichever way is easiest. Our team can help with product questions and shop information.")}</p>
          <div className="contact-methods">
            <a href="mailto:juwizeye97@gmail.com" className="contact-method"><span className="contact-method-icon"><Icon name="mail" size={21} /></span><span><small>{t("Email us")}</small><strong>juwizeye97@gmail.com</strong></span><span className="contact-method-arrow">↗</span></a>
            <a href="tel:+250790384123" className="contact-method"><span className="contact-method-icon"><Icon name="phone" size={21} /></span><span><small>{t("Call the shop")}</small><strong>+250 790 384 123</strong></span><span className="contact-method-arrow">↗</span></a>
            <a href="https://wa.me/250722398228" target="_blank" rel="noreferrer" className="contact-method"><span className="contact-method-icon">◉</span><span><small>WhatsApp</small><strong>0722 398 228</strong></span><span className="contact-method-arrow">↗</span></a>
            <a href="https://wa.me/250788872559" target="_blank" rel="noreferrer" className="contact-method"><span className="contact-method-icon">◉</span><span><small>WhatsApp</small><strong>0788 872 559</strong></span><span className="contact-method-arrow">↗</span></a>
          </div>
        </div>
        <aside className="contact-address-card"><div className="address-card-icon"><Icon name="pin" size={24} /></div><p className="eyebrow">{t("Find our shop")}</p><h2>{t("Visit us in ")}<em>{t("Kigali.")}</em></h2><p>KN 20 Ave<br />Kigali City, Rwanda</p><div className="address-map-art" aria-hidden="true"><span>✳</span><b>KN 20 Ave</b><i>⌂</i></div><p className="eyebrow social-eyebrow">{t("Follow the shop")}</p><div className="contact-socials">{socials.map((social) => <a key={social.name} href={social.url} target="_blank" rel="noreferrer">{social.name} <span>↗</span></a>)}</div></aside>
      </section>
      <section className="container contact-payment-note"><div><p className="eyebrow">{t("Payment options planned")}</p><h2>{t("Choose a convenient way to ")}<em>{t("pay.")}</em></h2><p>{t("MTN Mobile Money, Airtel Money, Visa credit or debit, and Mastercard.")}</p></div><div className="payment-chips payment-chips-large"><span>MTN MoMo</span><span>Airtel Money</span><span>VISA</span><span>Mastercard</span></div></section>
    </main>
  );
}

export function ShopsContent() {
  const { t } = usePreferences();
  return <main className="page-main"><section className="page-hero"><div className="container"><p className="eyebrow">{t("Meet the shop")}</p><h1>{t("Good things, ")}<em>{t("close to home.")}</em></h1><p>{t("Find out more about Shine Baba Shop and get in touch with our team in Kigali.")}</p></div></section><section className="container section shop-directory"><article className="shop-profile-card"><div className="shop-profile-logo"><Image src="/brand/shine-baba-shop-icon.png" alt="" width={130} height={130} /></div><div className="shop-profile-copy"><p className="eyebrow">{t("Kigali City, Rwanda")}</p><h2>Shine Baba Shop</h2><p>{t("A warm, local shop for everyday finds, gifts, and useful little things.")}</p><div className="shop-profile-meta"><span>⌂ KN 20 Ave</span><span>✳ {t("Friendly support")}</span></div></div><Link className="button button-dark" href="/shops/shine-baba-shop">{t("Visit shop")} <span>↗</span></Link></article></section></main>;
}

export function ProductsContent({ initialQuery, initialCategory }: { initialQuery: string; initialCategory: string }) {
  const { t } = usePreferences();
  return <main className="page-main"><section className="page-hero"><div className="container"><p className="eyebrow">{t("The Shine Baba Shop edit")}</p><h1>{t("Find something ")}<em>{t("lovely.")}</em></h1><p>{t("Browse products shown in Shine Baba Shop's current stock photos.")}</p></div></section><section className="section catalog-section"><div className="container"><ProductBrowser initialQuery={initialQuery} initialCategory={initialCategory} /><p className="catalog-footnote">{t("Photos show the supplied current stock. Prices are random USD placeholders; stock counts were not provided.")}</p></div></section></main>;
}

export function ProductDetailContent({ product: sourceProduct, related }: { product: Product; related: Product[] }) {
  const { locale, t } = usePreferences();
  const product = localizeProduct(sourceProduct, locale);
  return (
    <main className="page-main product-detail-page">
      <div className="container breadcrumb"><Link href="/">{t("Home")}</Link><span>/</span><Link href="/products">{t("Shop")}</Link><span>/</span><span>{product.name}</span></div>
      <section className="container product-detail-layout"><div className="product-gallery"><div className="product-main-image"><ProductArt product={product} sizes="(max-width: 760px) 100vw, 48vw" /></div><div className="gallery-thumbnails"><div className="gallery-thumb selected"><ProductArt product={product} compact /></div><div className="gallery-thumb gallery-thumb-alt" aria-hidden="true">✦</div><div className="gallery-thumb gallery-thumb-alt" aria-hidden="true">✳</div></div></div>
        <div className="product-detail-copy"><p className="eyebrow">{localizeCategory(sourceProduct.category, locale)} <span className="detail-dot">•</span> {product.shop}</p><h1>{product.name}</h1><div className="detail-rating"><span>★★★★★</span><small>{t("Current stock")}</small></div><p className="detail-price">{formatUsd(product.price)}</p><p className="detail-description">{product.description}</p><ProductDetailActions product={product} canonicalOptionValues={sourceProduct.options?.values} /><div className="detail-assurances"><div><span>⌂</span><p><strong>{t("Delivery from Kigali")}</strong><small>{t("We’ll confirm the delivery fee with your order.")}</small></p></div><div><span>↺</span><p><strong>{t("Friendly support")}</strong><small>{t("Contact us if you need help with a return.")}</small></p></div></div><p className="detail-preview-note">{t("Displayed prices are random USD placeholders and are not set per selected option.")}</p></div>
      </section>
      <section className="container detail-info-section"><div className="detail-info-tabs"><span className="selected">{t("Description")}</span><span>{t("Delivery & returns")}</span></div><p>{product.detail}</p><p className="detail-shop-note">{t("Sold by")} <strong>{product.shop}</strong> · <Link href="/shops/shine-baba-shop">{t("Visit shop")}</Link></p></section>
      {related.length > 0 && <section className="section related-section"><div className="container"><div className="section-heading"><div><p className="eyebrow">{t("Keep exploring")}</p><h2>{t("You may also ")}<em>{t("like.")}</em></h2></div></div><ProductGrid items={related} /></div></section>}
    </main>
  );
}

export function ShopDetailContent({ products }: { products: Product[] }) {
  const { t } = usePreferences();
  return <main className="page-main"><div className="container breadcrumb"><Link href="/">{t("Home")}</Link><span>/</span><Link href="/shops">{t("Our shop")}</Link><span>/</span><span>Shine Baba Shop</span></div><section className="container shop-detail-hero"><div className="shop-detail-logo"><Image src="/brand/shine-baba-shop-icon.png" alt="" width={150} height={150} /></div><div><p className="eyebrow">{t("Our shop")} · {t("Kigali City, Rwanda")}</p><h1>Shine Baba <em>Shop.</em></h1><p>{t("Everyday finds and thoughtful gifts, with a warm hello from Kigali.")}</p><a href="https://wa.me/250722398228" className="text-link" target="_blank" rel="noreferrer">{t("Chat with our team")} <span>↗</span></a></div><div className="shop-detail-address"><span>⌂</span><p><strong>{t("Visit us")}</strong><br />KN 20 Ave<br />Kigali City, Rwanda</p></div></section><section className="section container"><div className="section-heading"><div><p className="eyebrow">{t("Current stock")}</p><h2>{t("From our ")}<em>{t("shelves.")}</em></h2></div><span className="sample-pill">{t("Products shown")}</span></div><ProductGrid items={products} /></section></main>;
}
