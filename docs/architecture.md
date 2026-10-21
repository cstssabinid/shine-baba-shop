# Initial architecture

## Current implementation

- Next.js App Router serves the storefront and public information pages.
- The initial catalog is a TypeScript fixture in src/lib/catalog.ts; its product names, amounts, and illustrations are samples.
- The cart is browser-local and persists in localStorage on the same browser.
- Checkout is a local preview only. It does not save an order, send contact details, contact a payment provider, or collect money.
- The PostgreSQL/Prisma contract is a draft. No database connection, migration, authentication, or payment provider is configured.

## Planned production path

1. Confirm real product details, inventory, options, and delivery rules.
2. Provision PostgreSQL, set a private DATABASE_URL, and apply the schema through Prisma migrations.
3. Add customer and staff authentication, then enforce roles on every server-side write.
4. Move cart and order creation to server-side operations. Recalculate price, stock, discounts, and delivery fees on the server.
5. Select and test a Rwanda-supported payment gateway. Verify signed webhooks and make event processing idempotent.
6. Add seller and admin tools as required by the business.
7. Configure production environment variables in Vercel and deploy through a connected Git repository or the Vercel CLI.

## Data rules

- Every saleable SKU is a ProductVariant, including a product with no visible options.
- ProductVariant is the single source of price and stock.
- Store RWF amounts as whole-number minor amounts in the initial schema.
- Preserve product name, SKU, option, and unit price snapshots on order lines.
- Split an order into SellerOrder records by shop so fulfillment can be handled per seller if marketplace sellers are enabled.
- Never trust browser-submitted prices, totals, roles, or stock values.
