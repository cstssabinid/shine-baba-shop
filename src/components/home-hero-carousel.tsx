"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FocusEvent } from "react";
import { Icon } from "@/components/icons";
import { usePreferences } from "@/components/preferences-provider";

const slides = Array.from({ length: 9 }, (_, index) => ({
  src: `/images/hero/image%20(${index + 1}).png`,
  title: "Beauty & care, picked for you",
  copy: "Explore beauty, body care, and fragrance from Shine Baba Shop.",
  art: "\u2728",
}));

export function HomeHeroCarousel() {
  const { t } = usePreferences();
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [isHovered, setIsHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    if (isHovered || focusWithin || userPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [isHovered, focusWithin, userPaused]);

  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false);
  }

  return (
    <section
      className="home-mobile-hero"
      aria-label={t("Featured collection")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setFocusWithin(true)}
      onBlur={handleBlur}
    >
      <div className="container">
        <div className="mobile-hero-stage" role="group" aria-roledescription="carousel">
          {slides.map((slide, index) => {
            const src = slide.src;
            const isActive = index === activeIndex;
            const shouldLoad = isActive || index === (activeIndex + 1) % slides.length;
            return (
              <article
                key={src}
                className={`mobile-hero-slide${isActive ? " active" : ""} carousel-tone-${(index % 5) + 1}`}
                aria-hidden={!isActive}
                inert={!isActive}
                aria-roledescription="slide"
                aria-label={`${t("Slide")} ${index + 1} ${t("of")} ${slides.length}`}
              >
                {failedImages[src] && <div className="mobile-hero-fallback" aria-hidden="true"><span>{slide.art}</span></div>}
                {!failedImages[src] && shouldLoad && (
                  <>
                    <Image
                      className="mobile-hero-backdrop"
                      src={src}
                      alt=""
                      fill
                      sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1360px) calc(100vw - 64px), 1280px"
                    />
                    <Image
                      className="mobile-hero-photo"
                      src={src}
                      alt=""
                      fill
                      sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1360px) calc(100vw - 64px), 1280px"
                      onError={() => setFailedImages((current) => ({ ...current, [src]: true }))}
                    />
                  </>
                )}
                <div className="mobile-hero-shade" aria-hidden="true" />
                <div className="mobile-hero-copy">
                  <div className="mobile-hero-copy-text">
                    <p className="mobile-hero-kicker">Shine Baba Shop</p>
                    <h1>{t(slide.title)}</h1>
                    <p>{t(slide.copy)}</p>
                  </div>
                  <Link className="mobile-hero-cta" href="/products">{t("Shop now")} <Icon name="arrow" size={17} /></Link>
                </div>
              </article>
            );
          })}
          <div className="mobile-hero-controls">
            <button
              className="mobile-hero-arrow mobile-hero-arrow-previous"
              type="button"
              aria-label={t("Previous slide")}
              onClick={() => setActiveIndex((index) => (index - 1 + slides.length) % slides.length)}
            >
              <span aria-hidden="true">{"\u2190"}</span>
            </button>
            <div className="mobile-hero-dots" role="group" aria-label={t("Featured collection")}>
              {slides.map((slide, index) => (
                <button
                  key={slide.src}
                  className={index === activeIndex ? "active" : ""}
                  type="button"
                  aria-label={`${t("Slide")} ${index + 1}`}
                  aria-pressed={index === activeIndex}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
            <button
              className="mobile-hero-arrow mobile-hero-arrow-next"
              type="button"
              aria-label={t("Next slide")}
              onClick={() => setActiveIndex((index) => (index + 1) % slides.length)}
            >
              <span aria-hidden="true">{"\u2192"}</span>
            </button>
          </div>
          <button className="mobile-hero-pause" type="button" aria-label={userPaused ? t("Resume slides") : t("Pause slides")} onClick={() => setUserPaused((paused) => !paused)}>
            <Icon name={userPaused ? "play" : "pause"} size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
