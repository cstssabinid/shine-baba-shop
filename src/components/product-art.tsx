import Image from "next/image";
import type { Product } from "@/lib/catalog";

export function ProductArt({
  product,
  compact = false,
  sizes,
}: {
  product: Pick<Product, "name" | "emoji" | "color" | "image">;
  compact?: boolean;
  sizes?: string;
}) {
  const hasImage = Boolean(product.image);

  return (
    <div
      className={"product-art" + (compact ? " product-art-compact" : "") + (hasImage ? " product-art-with-image" : "")}
      style={{ backgroundColor: product.color }}
      role="img"
      aria-label={(hasImage ? "Product photo for " : "Illustration for ") + product.name}
    >
      {hasImage ? (
        <Image
          className="product-art-photo"
          src={product.image}
          alt=""
          fill
          sizes={sizes ?? (compact ? "90px" : "(max-width: 760px) 50vw, (max-width: 1200px) 33vw, 24vw")}
        />
      ) : (
        <>
          <span className="product-art-orbit product-art-orbit-one" />
          <span className="product-art-orbit product-art-orbit-two" />
          <span className="product-art-emoji" aria-hidden="true">{product.emoji}</span>
          {!compact && <span className="product-art-spark" aria-hidden="true">✳</span>}
        </>
      )}
    </div>
  );
}
