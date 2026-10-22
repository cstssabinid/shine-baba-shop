import Image from "next/image";

export function ShopIntroAnimation() {
  return (
    <div className="shop-intro" aria-hidden="true">
      <div className="shop-intro-content">
        <svg className="shop-intro-scene" viewBox="0 0 360 220" fill="none">
          <circle className="intro-orbit intro-orbit-one" cx="180" cy="110" r="92" />
          <circle className="intro-orbit intro-orbit-two" cx="180" cy="110" r="76" />

          <g className="intro-bag">
            <path d="M169 91h120l16 108H153l16-108Z" fill="#e25732" />
            <path d="M194 97V68c0-20 13-34 35-34s35 14 35 34v29" stroke="#e25732" strokeWidth="12" strokeLinecap="round" />
            <path d="M166 101h126" stroke="#f98b65" strokeWidth="3" strokeLinecap="round" />
            <path className="intro-bag-shine" d="M261 130v22m-11-11h22m-19-8 16 16m0-16-16 16" stroke="#fff8f0" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          <g className="intro-cart">
            <path d="M37 75h22l15 68h89l17-43H68" fill="none" stroke="#261b18" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M72 103h99l-12 31H79l-7-31Z" fill="#f7a17e" stroke="#261b18" strokeWidth="5" strokeLinejoin="round" />
            <path d="M91 99V83h19v16m9 0V75h19v24" fill="#f4d1b8" stroke="#261b18" strokeWidth="4" strokeLinejoin="round" />
            <path d="M87 157h75" stroke="#261b18" strokeWidth="7" strokeLinecap="round" />
            <circle cx="91" cy="166" r="9" fill="#261b18" />
            <circle cx="151" cy="166" r="9" fill="#261b18" />
          </g>

          <path className="intro-sparkle intro-sparkle-left" d="M69 46v14m-7-7h14m-12-5 10 10m0-10L64 58" />
          <path className="intro-sparkle intro-sparkle-right" d="M310 66v14m-7-7h14m-12-5 10 10m0-10-10 10" />
        </svg>

        <Image
          className="shop-intro-logo"
          src="/brand/shine-baba-shop-icon.png"
          alt=""
          width={164}
          height={164}
          priority
        />
        <p className="shop-intro-name">Shine Baba Shop</p>
        <p className="shop-intro-tagline">A little shine in every find</p>
      </div>
    </div>
  );
}

