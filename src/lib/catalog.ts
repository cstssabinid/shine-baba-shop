export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  description: string;
  detail: string;
  shop: string;
  badge?: string;
  color: string;
  emoji: string;
  image: string;
  stockQuantity?: number | null;
  hasUncountedStock?: boolean;
  variants?: {
    id: string;
    label: string;
    price: number;
    stockQuantity: number | null;
    isPricePlaceholder: boolean;
  }[];
  options?: {
    label: string;
    values: string[];
  };
};

export const categories = [
  { name: "Fragrance", emoji: "🌸", color: "#f5d8c9" },
  { name: "Skin Care", emoji: "🧴", color: "#d8e6e3" },
  { name: "Body Care", emoji: "🧼", color: "#f4dce1" },
  { name: "Bath & Soap", emoji: "🫧", color: "#eee3ce" },
];

// Current products identified from the shop's supplied stock photos. Prices remain random placeholders.
export const products: Product[] = [
  {
    slug: "world-one-noir-dear-body-mists",
    name: "World One, NOIR & Dear Body Mists",
    category: "Fragrance",
    price: 12.53,
    description: "Fragrance mist options pictured: World One USA, NOIR for Men, and Dear Body.",
    detail: "Choose one of the fragrance mists shown in the product photo. The displayed price is a random placeholder and is not yet set per fragrance.",
    shop: "Shine Baba Shop",
    color: "#ead2bd",
    emoji: "🌸",
    image: "/images/hero/image%20(1).png",
    options: { label: "Choose a fragrance", values: ["World One USA Body Spray", "NOIR for Men Fragrance Mist", "Dear Body Fragrance Mist"] },
  },
  {
    slug: "molato-glow-carrot-care",
    name: "Double Dose Molato Glow Carrot Care",
    category: "Skin Care",
    price: 21.68,
    description: "Molato Glow carrot care products shown: soap, face and body cream, and lotion.",
    detail: "The photo shows Double Dose Molato Glow carrot soap, Double Gluta Molato face and body cream, and a pump lotion. The displayed price is a random placeholder and is not yet set per item.",
    shop: "Shine Baba Shop",
    color: "#f0ddc8",
    emoji: "🧴",
    image: "/images/hero/image%20(2).png",
    options: { label: "Choose a product", values: ["Molato Glow Carrot Soap", "Double Gluta Molato Face & Body Cream", "Molato Pump Lotion"] },
  },
  {
    slug: "cosmo-carrot-papaya-body-lotion",
    name: "COSMO Carrot & Papaya Body Lotion",
    category: "Body Care",
    price: 16.26,
    description: "COSMO 750 ml whitening body lotion, pictured in Carrot and Papaya formulas.",
    detail: "The product photo shows COSMO Carrot Whitening Body Lotion and COSMO Papaya Whitening Body Lotion, both marked 750 ml. The displayed price is a random placeholder and is not yet set per formula.",
    shop: "Shine Baba Shop",
    color: "#f4e1cf",
    emoji: "🧴",
    image: "/images/hero/image%20(3).png",
    options: { label: "Formula", values: ["Carrot", "Papaya"] },
  },
  {
    slug: "gluta-gold-half-cast-body-lotion",
    name: "Gluta Gold Half Cast Body Lotion",
    category: "Body Care",
    price: 18.63,
    description: "Gluta Gold Half Cast 500 ml body lotion, pictured in Organic and Papaya formulas.",
    detail: "The photo shows Gluta Gold Half Cast Body Lotion in Organic and Papaya formulas. Both bottles are marked 500 ml. The displayed price is a random placeholder and is not yet set per formula.",
    shop: "Shine Baba Shop",
    color: "#f1dfcd",
    emoji: "🧴",
    image: "/images/hero/image%20(4).png",
    options: { label: "Formula", values: ["Organic", "Papaya"] },
  },
  {
    slug: "duru-rose-herbal-soap",
    name: "DURU Rose Herbal Soap Tub",
    category: "Bath & Soap",
    price: 8.13,
    description: "DURU rose-scented natural herbal soap, shown in a multi-bar tub.",
    detail: "The product photo shows a tub of DURU rose natural herbal soap bars. The pack count has not been entered, and the displayed price is a random placeholder.",
    shop: "Shine Baba Shop",
    color: "#f3ded9",
    emoji: "🧼",
    image: "/images/hero/image%20(5).png",
  },
  {
    slug: "american-dream-disaar-skincare",
    name: "American Dream Cocoa Butter & Disaar Vitamin C",
    category: "Skin Care",
    price: 26.42,
    description: "American Dream Cocoa Butter Lemon Cream and Disaar Vitamin C Natural Oil are pictured.",
    detail: "The photo shows American Dream Cocoa Butter Lemon Cream (500 ml) and Disaar Vitamin C Natural Oil (100 ml). The displayed price is a random placeholder and is not yet set per item.",
    shop: "Shine Baba Shop",
    color: "#f2e2be",
    emoji: "🧴",
    image: "/images/hero/image%20(6).png",
    options: { label: "Choose a product", values: ["American Dream Cocoa Butter Lemon Cream", "Disaar Vitamin C Natural Oil"] },
  },
  {
    slug: "rexona-dove-boudchou-body-care",
    name: "Rexona, Dove & Boudchou Body Care",
    category: "Body Care",
    price: 15.24,
    description: "Rexona BioRhythm antiperspirant, Dove Pink soap, and Boudchou body pomade are pictured.",
    detail: "The photo shows Rexona 72-hour BioRhythm antiperspirant, Dove Pink soap (135 g), and Boudchou body pomade. The displayed price is a random placeholder and is not yet set per item.",
    shop: "Shine Baba Shop",
    color: "#f5e0d1",
    emoji: "🧼",
    image: "/images/hero/image%20(7).png",
    options: { label: "Choose a product", values: ["Rexona BioRhythm Antiperspirant", "Dove Pink Soap", "Boudchou Body Pomade"] },
  },
  {
    slug: "final-glow-carotte-body-care",
    name: "Final Glow Carrot Cream & Carotte Body Oil",
    category: "Body Care",
    price: 14.23,
    description: "Final Glow Half-Cast Carrot cream and Half-Cast Carotte Body Oil are pictured.",
    detail: "The photo shows Final Glow Half-Cast Carrot Face & Body Cream and Half-Cast Carotte Body Oil (300 ml). The displayed price is a random placeholder and is not yet set per item.",
    shop: "Shine Baba Shop",
    color: "#f3dfc9",
    emoji: "🧴",
    image: "/images/hero/image%20(8).png",
    options: { label: "Choose a product", values: ["Final Glow Carrot Face & Body Cream", "Half-Cast Carotte Body Oil"] },
  },
  {
    slug: "vaseline-purec-body-lotions",
    name: "Vaseline Cocoa Radiant & PureC Egyptian Gold",
    category: "Body Care",
    price: 19.87,
    description: "Vaseline Cocoa Radiant and PureC Egyptian Gold face and body lotions are pictured.",
    detail: "The photo shows Vaseline Intensive Care Cocoa Radiant Lotion (600 ml) and PureC Egyptian Gold Face & Body Lotion (300 ml). The displayed price is a random placeholder and is not yet set per item.",
    shop: "Shine Baba Shop",
    color: "#f3dfc9",
    emoji: "🧴",
    image: "/images/hero/image%20(9).png",
    options: { label: "Choose a product", values: ["Vaseline Cocoa Radiant Lotion", "PureC Egyptian Gold Face & Body Lotion"] },
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
