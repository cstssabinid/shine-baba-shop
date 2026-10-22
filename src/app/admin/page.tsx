import Link from "next/link";
import { redirect } from "next/navigation";
import { formatUsd } from "@/lib/format";
import { hasManagerSession, isManagerLoginConfigured } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { managerLogin, managerLogout } from "@/app/admin/auth-actions";
import { addVariant, archiveProduct, confirmManualPayment, deactivateVariant, saveProduct, updateOrderStatus } from "@/app/admin/actions";
import { AdminImageUpload } from "@/components/admin-image-upload";

export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  "product-added": "Product added to the catalog.",
  "product-saved": "Product details and inventory saved.",
  "product-archived": "Product archived. Its order history is preserved.",
  "variant-added": "Variant added.",
  "variant-removed": "Variant removed from the storefront.",
  "order-updated": "Order status updated.",
  "payment-confirmed": "Manual payment marked as received.",
};

const errors: Record<string, string> = {
  "not-configured": "Manager login is not configured yet. Add ADMIN_PASSWORD and ADMIN_SESSION_SECRET to the local environment and Vercel project settings.",
  login: "The manager password was not accepted.",
  "product-fields": "Check the product fields. Price must be a USD amount and stock must be a whole number or blank when first added.",
  "save-product": "Product could not be saved. Check that its slug and variant labels are unique.",
  "variant-fields": "Check the variant name, price, and stock quantity.",
  "variant-not-found": "That variant could not be found.",
  "product-not-found": "That product could not be found.",
  "order-status": "Choose a valid order status.",
  "order-update": "The order could not be updated. Paid orders need a refund before cancellation.",
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const params = await searchParams;
  if (!await hasManagerSession()) {
    return (
      <main className="manager-shell manager-login-shell">
        <section className="manager-login-card">
          <p className="eyebrow">Shine Baba Shop</p>
          <h1>Manager <em>sign in.</em></h1>
          <p>Manage products, stock, and customer order requests.</p>
          {params.error && <div className="manager-alert error">{errors[params.error] ?? "Manager sign in failed."}</div>}
          {isManagerLoginConfigured() ? (
            <form action={managerLogin} className="manager-form">
              <label>Manager password<input type="password" name="password" required autoComplete="current-password" autoFocus /></label>
              <button className="button button-dark" type="submit">Sign in</button>
            </form>
          ) : (
            <div className="manager-alert">Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in your local environment and Vercel project settings to enable manager access.</div>
          )}
          <Link className="manager-back-link" href="/">Back to the shop</Link>
        </section>
      </main>
    );
  }

  const [products, categories, orders, recentMovements] = await Promise.all([
    prisma.product.findMany({ include: { category: true, images: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { createdAt: "asc" } } }, orderBy: [{ status: "asc" }, { updatedAt: "desc" }] }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.order.findMany({ include: { user: true, address: true, fulfillments: { include: { items: true } }, payments: true }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.inventoryMovement.findMany({ include: { variant: { include: { product: true } } }, orderBy: { createdAt: "desc" }, take: 18 }),
  ]);
  const activeCount = products.filter((product) => product.status === "ACTIVE").length;
  const pendingCount = orders.filter((order) => order.status === "PENDING").length;
  const lowStockCount = products.flatMap((product) => product.variants).filter((variant) => variant.isActive && variant.stockQuantity !== null && variant.stockQuantity <= 5).length;
  const unsetCount = products.flatMap((product) => product.variants).filter((variant) => variant.isActive && variant.stockQuantity === null).length;

  return (
    <main className="manager-shell">
      <header className="manager-header">
        <div><p className="eyebrow">Shine Baba Shop</p><h1>Manager <em>dashboard.</em></h1><p>Catalog and stock are read directly from the live database.</p></div>
        <div className="manager-header-actions"><Link className="button button-outline" href="/">View storefront</Link><form action={managerLogout}><button className="button button-dark" type="submit">Sign out</button></form></div>
      </header>
      {params.notice && <div className="manager-alert success">{messages[params.notice] ?? "Saved."}</div>}
      {params.error && <div className="manager-alert error">{errors[params.error] ?? "The requested change could not be saved."}</div>}
      {!process.env.DATABASE_URL && <div className="manager-alert error">DATABASE_URL is not configured for this deployment.</div>}

      <section className="manager-metrics" aria-label="Shop overview">
        <article><span>Live products</span><strong>{activeCount}</strong></article>
        <article><span>Pending orders</span><strong>{pendingCount}</strong></article>
        <article><span>Low stock (5 or less)</span><strong>{lowStockCount}</strong></article>
        <article><span>Stock not set</span><strong>{unsetCount}</strong></article>
      </section>

      <section className="manager-section" id="products">
        <div className="manager-section-heading"><div><p className="eyebrow">Product catalog</p><h2>Add a <em>product.</em></h2></div></div>
        <form action={saveProduct} className="manager-form manager-product-form">
          <label>Product name<input name="name" required maxLength={120} /></label>
          <label>URL slug<input name="slug" placeholder="Generated from product name if blank" maxLength={70} /></label>
          <label>Category<input name="category" list="manager-categories" required placeholder="e.g. Body Care" maxLength={60} /><datalist id="manager-categories">{categories.map((category) => <option key={category.id} value={category.name} />)}</datalist></label>
          <AdminImageUpload />
          <label>USD price<input name="price" type="number" min="0.01" step="0.01" required placeholder="12.53" /><small>Marked as a placeholder price, as requested.</small></label>
          <label>Starting stock<input name="stock" type="number" min="0" step="1" placeholder="Leave blank until counted" /><small>Blank means stock is not yet counted and the item cannot be ordered.</small></label>
          <label className="manager-field-wide">Description<textarea name="description" required rows={3} maxLength={3000} /></label>
          <label>Status<select name="status" defaultValue="DRAFT"><option value="DRAFT">Draft</option><option value="ACTIVE">Live on storefront</option><option value="ARCHIVED">Archived</option></select></label>
          <label>Featured<select name="featured" defaultValue="false"><option value="false">No</option><option value="true">Yes</option></select></label>
          <div className="manager-field-wide"><button className="button button-dark" type="submit">Add product</button></div>
        </form>
      </section>

      <section className="manager-section">
        <div className="manager-section-heading"><div><p className="eyebrow">{products.length} records</p><h2>Products & <em>inventory.</em></h2></div></div>
        <div className="manager-product-list">
          {products.map((product) => (
            <details className="manager-product" key={product.id}>
              <summary><span><strong>{product.name}</strong><small>{product.category?.name ?? "Uncategorized"} · {product.slug}</small></span><span className={`manager-status ${product.status.toLowerCase()}`}>{product.status}</span><span className="manager-summary-stock">{product.variants.map((variant) => variant.stockQuantity === null ? "Not counted" : `${variant.label}: ${variant.stockQuantity}`).join(" · ") || "No active variants"}</span></summary>
              <form action={saveProduct} className="manager-form manager-product-form manager-edit-form">
                <input type="hidden" name="productId" value={product.id} />
                <label>Product name<input name="name" required defaultValue={product.name} maxLength={120} /></label>
                <label>Category<input name="category" list="manager-categories" required defaultValue={product.category?.name ?? ""} maxLength={60} /></label>
                <AdminImageUpload defaultValue={product.images[0]?.url ?? ""} />
                <label>Status<select name="status" defaultValue={product.status}><option value="DRAFT">Draft</option><option value="ACTIVE">Live on storefront</option><option value="ARCHIVED">Archived</option></select></label>
                <label>Featured<select name="featured" defaultValue={String(product.isFeatured)}><option value="false">No</option><option value="true">Yes</option></select></label>
                <label className="manager-field-wide">Description<textarea name="description" required defaultValue={product.description} rows={3} maxLength={3000} /></label>
                {product.variants.map((variant) => (
                  <div className="manager-variant-row" key={variant.id}>
                    <input type="hidden" name="variantId" value={variant.id} />
                    <strong>{variant.label}{!variant.isActive && " · removed"}</strong>
                    <label>USD price<input name="variantPrice" type="number" min="0.01" step="0.01" defaultValue={(variant.priceAmount / 100).toFixed(2)} required /></label>
                    <label>Stock<input name="variantStock" type="number" min="0" step="1" defaultValue={variant.stockQuantity ?? ""} placeholder="Not counted" /></label>
                    <label>Price type<select name="variantPlaceholder" defaultValue={String(variant.isPricePlaceholder)}><option value="true">Placeholder</option><option value="false">Confirmed</option></select></label>
                  </div>
                ))}
                <div className="manager-field-wide manager-form-actions"><button className="button button-dark" type="submit">Save product & stock</button></div>
              </form>
              <div className="manager-inline-actions">
                <form action={archiveProduct}><input type="hidden" name="productId" value={product.id} /><button className="text-button" type="submit">Archive product</button></form>
                {product.variants.some((variant) => variant.isActive) && <form action={deactivateVariant} className="manager-variant-remove"><label>Remove variant<select name="variantId" required defaultValue="">{product.variants.filter((variant) => variant.isActive).map((variant) => <option key={variant.id} value={variant.id}>{variant.label}</option>)}</select></label><button className="text-button" type="submit">Remove</button></form>}
                <form action={addVariant} className="manager-variant-add"><input type="hidden" name="productId" value={product.id} /><label>Add variant<input name="label" required placeholder="Variant name" maxLength={100} /></label><label>Price<input name="price" type="number" min="0.01" step="0.01" required placeholder="USD" /></label><label>Stock<input name="stock" type="number" min="0" step="1" placeholder="Not counted" /></label><button className="text-button" type="submit">Add variant</button></form>
              </div>
            </details>
          ))}
          {products.length === 0 && <p className="manager-empty">No database products yet. Run the catalog seed, then set each actual stock count before publishing products.</p>}
        </div>
      </section>

      <section className="manager-section" id="orders">
        <div className="manager-section-heading"><div><p className="eyebrow">Latest customer requests</p><h2>Orders & <em>stock reservations.</em></h2><p>Checkout requests reserve stock. Payment is not processed online; confirm it with the customer before dispatch.</p></div></div>
        <div className="manager-orders">
          {orders.map((order) => {
            const itemCount = order.fulfillments.reduce((sum, sellerOrder) => sum + sellerOrder.items.reduce((quantity, item) => quantity + item.quantity, 0), 0);
            const paid = order.payments.some((payment) => payment.status === "PAID");
            return <article className="manager-order" key={order.id}>
              <div><strong>{order.orderNumber}</strong><span className={`manager-status ${order.status.toLowerCase()}`}>{order.status}</span><small>{order.createdAt.toLocaleString("en-RW")}</small></div>
              <div><strong>{order.user.fullName}</strong><small>{order.user.phone ?? "No phone"}</small><small>{[order.address?.district, order.address?.sector, order.address?.directions].filter(Boolean).join(" · ")}</small></div>
              <div><strong>{itemCount} item{itemCount === 1 ? "" : "s"}</strong><small>{formatUsd(order.totalAmount / 100)} estimated · {paid ? "Paid" : "Payment pending"}</small></div>
              {order.status !== "CANCELLED" ? <div className="manager-order-actions"><form action={updateOrderStatus} className="manager-order-status"><input type="hidden" name="orderId" value={order.id} /><select name="status" defaultValue={order.status}>{order.status === "PENDING" && <><option value="PENDING">Pending</option><option value="CONFIRMED">Confirm order</option><option value="CANCELLED" disabled={paid}>Cancel & release stock</option></>}{order.status === "CONFIRMED" && <><option value="CONFIRMED">Confirmed</option><option value="PROCESSING">Start processing</option><option value="CANCELLED" disabled={paid}>Cancel & release stock</option></>}{order.status === "PROCESSING" && <><option value="PROCESSING">Processing</option><option value="COMPLETED">Mark completed</option><option value="CANCELLED" disabled={paid}>Cancel & release stock</option></>}{order.status === "COMPLETED" && <option value="COMPLETED">Completed</option>}</select><button className="button button-outline button-small" type="submit">Update</button></form></div> : <span className="manager-order-cancelled">Stock released</span>}
              {!paid && order.status !== "CANCELLED" && <form action={confirmManualPayment} className="manager-payment-form"><strong>Set actual prices, delivery, and record payment</strong>{order.fulfillments.flatMap((sellerOrder) => sellerOrder.items).map((item) => <label key={item.id}>{item.productNameSnapshot} × {item.quantity}<span><input type="hidden" name="orderItemId" value={item.id} /><input name="orderItemPrice" type="number" min="0.01" step="0.01" required defaultValue={(item.unitPriceAmount / 100).toFixed(2)} aria-label={`Final unit price for ${item.productNameSnapshot}`} /> USD each</span></label>)}<label>Delivery fee<input name="deliveryFee" type="number" min="0" step="0.01" required defaultValue={(order.deliveryFeeAmount / 100).toFixed(2)} /></label><input type="hidden" name="orderId" value={order.id} /><button className="button button-outline button-small" type="submit">Record payment received</button></form>}
            </article>;
          })}
          {orders.length === 0 && <p className="manager-empty">No customer orders yet.</p>}
        </div>
      </section>

      <section className="manager-section">
        <div className="manager-section-heading"><div><p className="eyebrow">Inventory audit</p><h2>Recent stock <em>changes.</em></h2></div></div>
        <div className="manager-movements">{recentMovements.map((movement) => <article key={movement.id}><span className={movement.delta >= 0 ? "movement-in" : "movement-out"}>{movement.delta > 0 ? "+" : ""}{movement.delta}</span><strong>{movement.variant.product.name}</strong><span>{movement.reason}</span><small>{movement.createdAt.toLocaleString("en-RW")}</small></article>)}{recentMovements.length === 0 && <p className="manager-empty">Stock adjustments and order reservations will appear here.</p>}</div>
      </section>
    </main>
  );
}
