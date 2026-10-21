# Route and readiness matrix

| Route | Current status | Notes |
|---|---|---|
| / | Preview ready | Branded home, categories, sample items, contact CTA |
| /products | Preview ready | Client-side search, category filters, price sorting |
| /products/[slug] | Preview ready | Sample detail, option picker, browser-local add to bag |
| /shops | Preview ready | Single Shine Baba Shop listing |
| /shops/shine-baba-shop | Preview ready | Shop details and sample catalog |
| /cart | Preview ready | localStorage cart, quantity updates, subtotal |
| /checkout | Preview only | Submit sends nothing and collects no payment |
| /about | Preview ready | Business introduction |
| /contact | Preview ready | Supplied contact, location, social handles, payment list |
| /account | Placeholder | Authentication and order history are not configured |
| Seller dashboard | Not started | Requires seller workflow details |
| Admin dashboard | Not started | Requires staff permissions and catalog operations |

## Authorization plan

Anonymous visitors can browse. Customer, seller, and admin operations will require server-side authentication and authorization before they are added. Hiding a link in the interface is not access control.
