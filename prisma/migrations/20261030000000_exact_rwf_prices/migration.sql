ALTER TABLE "ProductVariant"
ADD COLUMN "priceRwf" INTEGER;

ALTER TABLE "Order"
ADD COLUMN "subtotalRwf" INTEGER,
ADD COLUMN "deliveryFeeRwf" INTEGER,
ADD COLUMN "totalRwf" INTEGER;

ALTER TABLE "SellerOrder"
ADD COLUMN "subtotalRwf" INTEGER,
ADD COLUMN "deliveryFeeRwf" INTEGER;

ALTER TABLE "OrderItem"
ADD COLUMN "unitPriceRwf" INTEGER,
ADD COLUMN "lineTotalRwf" INTEGER;

-- Restore the exact RWF values visible in the manager-entered handbag prices.
UPDATE "ProductVariant" AS variant
SET "priceRwf" = CASE lower(trim(product."name"))
  WHEN 'purple hand bag' THEN 50000
  WHEN 'pink hand bag' THEN 40000
  WHEN 'hand bag red' THEN 40000
  WHEN 'gucci hand bag' THEN 20000
END
FROM "Product" AS product
WHERE variant."productId" = product.id
  AND lower(trim(product."name")) IN ('purple hand bag', 'pink hand bag', 'hand bag red', 'gucci hand bag');
