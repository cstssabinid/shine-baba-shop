# Shine Baba Shop

An independent online storefront for Shine Baba Shop in Kigali, Rwanda. The storefront currently shows nine products identified from the supplied stock photos. Product prices remain random USD placeholders, and the cart and checkout are still browser-local previews.

## Stack

- Next.js App Router and TypeScript
- React
- Prisma ORM 7 data model for PostgreSQL, prepared for Neon on Vercel
- Vercel as the planned deployment platform

## Business details supplied

- Store location: KN 20 Ave, Kigali City, Rwanda
- Email: juwizeye97@gmail.com
- Phone: +250 790 384 123
- WhatsApp: +250 790 384 123
- Social handle: shine_baba_shob on TikTok, Instagram, and Facebook
- Planned payment methods: MTN Mobile Money, Airtel Money, Visa credit/debit, and Mastercard

## Run locally

1. Install dependencies with npm install.
2. Start the development server with npm run dev.
3. Open http://localhost:3000.

The app does not collect real payments. Checkout is a preview and stores no order or personal information on a server. Stock quantities are not yet entered, and the visible prices are placeholders.

## Current routes

- / — storefront
- /products and /products/[slug] — current photo-based catalog and details
- /shops and /shops/shine-baba-shop — shop discovery and storefront
- /cart and /checkout — browser-local cart and checkout preview
- /about, /contact, and /account — business information and account placeholder

## Database setup

- PostgreSQL schema: `prisma/schema.prisma`.
- Runtime queries use the pooled `DATABASE_URL`; Prisma migrations use `DIRECT_URL` or Neon’s `DATABASE_URL_UNPOOLED` when available.
- The idempotent seed imports the current catalog and preserves database-edited prices, stock counts, and variant activation states when re-run.
- A `null` variant stock quantity means it has not been counted yet; `0` means confirmed out of stock.
- Random display prices are marked as placeholders in the database and stored in USD cents.

The Neon database is provisioned and linked to the `shine-baba-shop` Vercel project for Production and Preview. Before migrating, put the connection variables for a development or preview branch in the ignored `.env.local`. The checked-in `.env` currently points to `localhost`, and no database migration or seed has been applied. Do not run `migrate dev` against the production branch.

Install dependencies and initialize the development database with:

```powershell
npm install --offline=false
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

Use `npm run db:migrate:deploy` to apply committed migrations to a deployment database. Keep development and production databases isolated.

## Project setup notes

- Brand assets supplied by Shine Baba Shop are in public/brand/.
- .env.example documents pooled runtime and unpooled migration connection variables. Do not put production credentials in source control.
- prisma/schema.prisma and the seed script are prepared. Neon is provisioned and connected to Vercel, but no migration has been applied and no catalog has been seeded yet.
- Mobile Money and card choices are shown as planned payment methods; a Rwanda-supported gateway and its webhook behavior must be selected before accepting payments.
- Vercel can deploy this Next.js project with its framework defaults. Neon connection variables are managed by the Vercel integration; add payment secrets only after a gateway is selected.
