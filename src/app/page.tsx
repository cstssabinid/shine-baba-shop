"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { PriceDisplay } from "@/components/price-display";
import { ProductCard } from "@/components/product-card";
import { ProductArt } from "@/components/product-art";
import { Icon } from "@/components/icons";
import { usePreferences } from "@/components/preferences-provider";
import { localizeCategory, localizeProduct } from "@/lib/i18n";
import { HomeHeroCarousel } from "@/components/home-hero-carousel";

const highlights = [
  { number: "01", title: "Curated with care", copy: "Useful finds and thoughtful gifts, gathered in one place." },
  { number: "02", title: "Here in Kigali", copy: "A real shop, real people, and help when you need it." },
  { number: "03", title: "Easy ways to pay", copy: "Mobile Money and card options planned for checkout." },
];

export default function HomePage() {
  const { locale, t } = usePreferences();
  const { products, categories } = useCart();
  const featured = products.slice(0, 4);
  const heroProduct = products[0] ? localizeProduct(products[0], locale) : null;

  return (
    <main>
      <HomeHeroCarousel />
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-overline"><span /> {t("A little something for every day")}</div>
            <h1>{t("Everyday finds,")}<br /><em>{t("with a little shine.")}</em></h1>
            <p className="hero-description">
              {t("Discover pieces for your home, your style, and the people you love — from Shine Baba Shop in Kigali.")}
            </p>
            <div className="hero-actions">
              <Link href="/products" className="button button-dark">{t("Explore the shop")} <Icon name="arrow" size={18} /></Link>
              <Link href="/contact" className="text-link">{t("Get in touch")} <span>↗</span></Link>
            </div>
            <div className="hero-note"><Icon name="sparkle" size={17} /> {t("Thoughtful picks. Friendly service. Kigali based.")}</div>
          </div>
          <div className="hero-art-wrap">
            <div className="hero-art-backdrop" />
            <div className="hero-brand-card">
              <Image
                src="/brand/shine-baba-shop-logo.png"
                alt="Shine Baba Shop logo"
                width={430}
                height={430}
                priority
                className="hero-logo"
              />
            </div>
            <div className="hero-float-card hero-float-top">
              <span className="float-star">✳</span>
              <span>Find your<br /><strong>new favorite</strong></span>
            </div>
            <div className="hero-float-card hero-float-bottom">
              {heroProduct && <><span className="hero-mini-art"><ProductArt product={products[0]} compact /></span>
              <span><small>{t("Shine pick")}</small><strong>{heroProduct.name}</strong><PriceDisplay usdAmount={heroProduct.price} className="hero-product-price" /></span></>}
            </div>
            <span className="hero-sunburst">✳</span>
          </div>
        </div>
        <div className="hero-wave" aria-hidden="true" />
      </section>

      <section className="section categories-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow category-eyebrow">{t("Find your kind of lovely")}</p>
              <h2><span className="category-desktop-title">{t("Browse by ")}<em>{t("mood.")}</em></span><span className="category-mobile-title">{t("Available categories")}</span></h2>
            </div>
            <Link className="text-link" href="/products">{t("View all categories")} <span>↗</span></Link>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <Link
                href={"/products?category=" + encodeURIComponent(category.name)}
                className="category-tile"
                key={category.name}
                style={{ backgroundColor: category.color }}
              >
                <span className="category-symbol" aria-hidden="true">{category.emoji}</span>
                <span>{localizeCategory(category.name, locale)}</span>
                <span className="category-arrow">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section featured-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t("A few things we love")}</p>
              <h2>{t("Little ")}<em>{t("treasures.")}</em></h2>
            </div>
            <Link className="text-link" href="/products">{t("Shop all pieces")} <span>↗</span></Link>
          </div>
          <div className="product-grid">
            {featured.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
          <div className="sample-disclaimer">{t("Stock is shown from the live catalog. Prices remain random placeholders until the shop confirms them.")}</div>
        </div>
      </section>

      <section className="story-band">
        <div className="container story-band-inner">
          <div className="story-mark"><Image src="/brand/shine-baba-shop-icon.png" alt="" width={110} height={110} /></div>
          <div className="story-copy">
            <p className="eyebrow">{t("A shop with a warm hello")}</p>
            <h2>{t("Small joys, thoughtfully ")}<em>{t("chosen.")}</em></h2>
            <p>{t("Shine Baba Shop brings together everyday essentials and special finds with friendly, personal service from Kigali.")}</p>
            <Link className="button button-outline" href="/contact">{t("Contact us")} <Icon name="arrow" size={17} /></Link>
          </div>
          <div className="story-highlights">
            {highlights.map((item) => (
              <div className="story-highlight" key={item.number}>
                <span>{item.number}</span>
                <div><strong>{t(item.title)}</strong><p>{t(item.copy)}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section contact-strip-section">
        <div className="container contact-strip">
          <div>
            <p className="eyebrow">{t("We’re just a message away")}</p>
            <h2>{t("Looking for something ")}<em>{t("special?")}</em></h2>
            <p>{t("Tell us what you have in mind. Our team is happy to help.")}</p>
          </div>
          <div className="contact-strip-actions">
            <a className="button button-orange" href="https://wa.me/250790384123" target="_blank" rel="noreferrer">{t("Chat on WhatsApp")} <span>↗</span></a>
            <a className="contact-strip-phone" href="tel:+250790384123">+250 790 384 123</a>
          </div>
          <span className="contact-strip-flower">✳</span>
        </div>
      </section>
    </main>
  );
}
