import Link from "next/link";
import { managerLogin } from "@/app/admin/auth-actions";

export function AdminManagerLogin({
  configured,
  initialError,
}: {
  configured: boolean;
  initialError?: string;
}) {
  return (
    <main className="manager-shell manager-login-shell">
      <section className="manager-login-card">
        <p className="eyebrow">Shine Baba Shop</p>
        <h1>Manager <em>sign in.</em></h1>
        <p>Manage products, stock, and customer order requests.</p>
        {initialError && <div className="manager-alert error" role="alert">{initialError}</div>}
        {configured ? <form action={managerLogin} className="manager-form">
          <label>Manager password<input name="password" type="password" autoComplete="current-password" required maxLength={128} /></label>
          <button className="button button-dark" type="submit">Sign in</button>
        </form> : <div className="manager-alert">Configure ADMIN_PASSWORD and ADMIN_SESSION_SECRET in the local environment and Vercel project settings to enable manager access.</div>}
        <Link className="manager-back-link" href="/">Back to the shop</Link>
      </section>
    </main>
  );
}
