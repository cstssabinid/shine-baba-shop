"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { usePreferences } from "@/components/preferences-provider";
import { SitePreferences } from "@/components/site-preferences";
import { localizeCategory } from "@/lib/i18n";
import { categories } from "@/lib/catalog";

export function SiteHeader() {
  const { itemCount } = useCart();
  const { locale, t } = usePreferences();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="topline">
        <div className="container topline-inner">
          <span className="topline-note">{t("A little shine in every find")}</span>
          <div className="topline-tools"><SitePreferences /></div>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-main">
          <Link href="/" className="brand" aria-label={"Shine Baba Shop · " + t("Home")}>
            <Image
              src="/brand/shine-baba-shop-icon.png"
              alt=""
              width={54}
              height={54}
              priority
              className="brand-icon"
            />
            <Image
              src="/brand/shine-baba-shop-logo.png"
              alt=""
              width={110}
              height={110}
              priority
              className="brand-mobile-logo"
            />
            <span className="brand-name">Shine <strong>Baba Shop</strong></span>
          </Link>

          <form id="header-search" action="/products" className={`header-search${mobileSearchOpen ? " is-open" : ""}`} onSubmit={() => setMobileSearchOpen(false)}>
            <Icon name="search" size={19} />
            <input type="search" name="q" placeholder={t("Search the shop...")} aria-label={t("Search products")} />
            <button type="submit" aria-label={t("Submit search")}><Icon name="arrow" size={18} /></button>
          </form>

          <div className="header-actions">
            <Link className="header-account" href="/account">
              <span className="header-action-icon"><span>♙</span></span>
              <span className="header-action-label">{t("My account")}</span>
            </Link>
            <Link className="header-cart" href="/cart" aria-label={t("Shopping bag") + ", " + itemCount + " " + t("items")}>
              <span className="header-action-icon"><Icon name="bag" size={21} /></span>
              <span className="header-action-label">{t("My bag")}</span>
              <span className="cart-count">{itemCount}</span>
            </Link>
          </div>
          <div className="mobile-header-controls">
            <button type="button" aria-label={mobileSearchOpen ? t("Close search") : t("Open search")} aria-expanded={mobileSearchOpen} aria-controls="header-search" onClick={() => setMobileSearchOpen((open) => !open)}>
              <Icon name={mobileSearchOpen ? "close" : "search"} size={23} />
            </button>
            <button type="button" aria-label={mobileMenuOpen ? t("Close menu") : t("Open menu")} aria-expanded={mobileMenuOpen} aria-controls="mobile-main-navigation" onClick={() => setMobileMenuOpen((open) => !open)}>
              <Icon name={mobileMenuOpen ? "close" : "menu"} size={24} />
            </button>
          </div>
        </div>
        <div className={`header-nav-wrap${mobileMenuOpen ? " mobile-nav-open" : ""}`}>
          <nav className="container main-nav" id="mobile-main-navigation" aria-label={t("Main navigation")} onClick={() => setMobileMenuOpen(false)}>
            <Link href="/products">{t("Shop all")}</Link>
            {categories.map((category) => <Link key={category.name} href={"/products?category=" + encodeURIComponent(category.name)}>{localizeCategory(category.name, locale)}</Link>)}
            <Link href="/shops">{t("Our shop")}</Link>
          </nav>
        </div>
      </header>
      <MobileBottomNav />
      <a className="mobile-help-tab" href="https://wa.me/250790384123" target="_blank" rel="noreferrer" aria-label={t("Chat with our team on WhatsApp")}>
        <span className="mobile-help-icon"><Icon name="whatsapp" size={19} /></span><span>{t("Help")}</span>
      </a>
    </>
  );
}

function MobileBottomNav() {
  const { t } = usePreferences();
  const { itemCount } = useCart();
  const pathname = usePathname();
  const activeClass = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href)) ? " is-current" : "";
  return (
    <nav className="mobile-bottom-nav" aria-label={t("Mobile navigation")}>
      <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className={`mobile-bottom-link${activeClass("/")}`}><Icon name="home" size={23} /><span>{t("Home")}</span></Link>
      <Link href="/products" aria-current={pathname.startsWith("/products") ? "page" : undefined} className={`mobile-bottom-link${activeClass("/products")}`}><Icon name="box" size={23} /><span>{t("Products")}</span></Link>
      <Link href="/shops" aria-current={pathname.startsWith("/shops") ? "page" : undefined} className={`mobile-bottom-link${activeClass("/shops")}`}><Icon name="store" size={23} /><span>{t("Stores")}</span></Link>
      <Link href="/cart" aria-current={pathname === "/cart" ? "page" : undefined} className={`mobile-bottom-link${activeClass("/cart")}`}><Icon name="bag" size={23} /><span>{t("Cart")}</span>{itemCount > 0 && <span className="mobile-nav-count">{itemCount}</span>}</Link>
      <Link href="/account" aria-current={pathname.startsWith("/account") ? "page" : undefined} className={`mobile-bottom-link${activeClass("/account")}`}><Icon name="user" size={23} /><span>{t("My account")}</span></Link>
    </nav>
  );
}
