"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { formatUsd } from "@/lib/format";
import { usePreferences } from "@/components/preferences-provider";

type AddressSummary = {
  id: string;
  recipient: string;
  phone: string;
  district: string | null;
  sector: string | null;
  directions: string | null;
};

type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
};

export type CustomerAccountData = {
  fullName: string;
  email: string;
  phone: string | null;
  addresses: AddressSummary[];
  orders: OrderSummary[];
};

export function CustomerAccountPanel({ account }: { account: CustomerAccountData | null }) {
  const { t } = usePreferences();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const orderStatus: Record<string, string> = {
    PENDING: t("Awaiting shop confirmation"),
    CONFIRMED: t("Confirmed"),
    PROCESSING: t("Being prepared"),
    COMPLETED: t("Completed"),
    CANCELLED: t("Cancelled"),
    PARTIALLY_CANCELLED: t("Partially cancelled"),
  };

  async function submitCredentials(formData: FormData) {
    setPending(true);
    setError("");
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    try {
      const result = mode === "signup"
        ? await authClient.signUp.email({
            name: String(formData.get("name") ?? "").trim(),
            email,
            password,
          })
        : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(mode === "signup" ? t("We could not create your account. Check the details or sign in if you already registered.") : t("We could not sign you in. Check your email and password."));
        return;
      }

      router.refresh();
    } catch {
      setError(t("We could not connect to the account service. Please try again."));
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if ("error" in result && result.error) throw new Error("SIGN_OUT_FAILED");
      router.refresh();
    } catch {
      setError(t("We could not connect to the account service. Please try again."));
    } finally {
      setPending(false);
    }
  }

  if (!account) {
    return (
      <main className="page-main customer-account-page">
        <section className="page-hero compact-page-hero"><div className="container"><p className="eyebrow">{t("A little more personal")}</p><h1>{t("Your account, ")}<em>{t("with a little shine.")}</em></h1><p>{t("Keep your order requests together and save delivery details for next time.")}</p></div></section>
        <section className="container customer-auth-layout section">
          <div className="customer-benefits-card">
            <p className="eyebrow">{t("A smoother visit")}</p>
            <h2>{t("The little things, " )}<em>{t("kept together.")}</em></h2>
            <ul>
              <li><span>01</span>{t("See your order requests and their latest status.")}</li>
              <li><span>02</span>{t("Reuse delivery details saved during checkout.")}</li>
              <li><span>03</span>{t("Keep your shop details in one place.")}</li>
            </ul>
            <p className="customer-auth-note">{t("Use an email address you can access. Password recovery will be available after the shop email service is connected.")}</p>
          </div>
          <section className="customer-auth-card" aria-labelledby="customer-auth-title">
            <div className="customer-auth-tabs" role="group" aria-label={t("Account access")}>
              <button type="button" aria-pressed={mode === "signin"} onClick={() => { setMode("signin"); setError(""); }}>{t("Sign in")}</button>
              <button type="button" aria-pressed={mode === "signup"} onClick={() => { setMode("signup"); setError(""); }}>{t("Create account")}</button>
            </div>
            <p className="eyebrow">{mode === "signup" ? t("Welcome to the shop") : t("Welcome back")}</p>
            <h2 id="customer-auth-title">{mode === "signup" ? <>{t("Join us, ")}<em>{t("shop with ease.")}</em></> : <>{t("Sign in to ")}<em>{t("your account.")}</em></>}</h2>
            <form className="customer-auth-form" action={submitCredentials}>
              {mode === "signup" && <label>{t("Full name")}<input name="name" autoComplete="name" required maxLength={120} minLength={2} /></label>}
              <label>{t("Email address")}<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
              <label>{t("Password")}<input name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={10} maxLength={128} /></label>
              {mode === "signup" && <p className="customer-password-hint">{t("Use at least 10 characters.")}</p>}
              {error && <p className="customer-auth-error" role="alert">{error}</p>}
              <button className="button button-dark button-full" type="submit" disabled={pending}>{pending ? t("Please waitâ€¦") : mode === "signup" ? t("Create my account") : t("Sign in")}</button>
            </form>
            <p className="customer-auth-switch">{mode === "signup" ? t("Already have an account?") : t("New to Shine Baba Shop?")} <button type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }}>{mode === "signup" ? t("Sign in") : t("Create account")}</button></p>
            <Link className="customer-back-link" href="/products">{t("Continue browsing the shop")}</Link>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="page-main customer-account-page">
      <section className="page-hero compact-page-hero"><div className="container customer-account-heading"><div><p className="eyebrow">{t("Your Shine Baba Shop account")}</p><h1>{t("Hello, ")}<em>{account.fullName.split(" ")[0]}.</em></h1><p>{account.email}</p>{error && <p className="customer-auth-error" role="alert">{error}</p>}</div><button className="button button-outline" type="button" onClick={signOut} disabled={pending}>{t("Sign out")}</button></div></section>
      <section className="container section customer-dashboard">
        <div className="customer-dashboard-main">
          <section className="customer-dashboard-card">
            <div className="customer-card-heading"><div><p className="eyebrow">{t("Your shop activity")}</p><h2>{t("Order requests")}</h2></div><span className="customer-count">{account.orders.length}</span></div>
            {account.orders.length ? <div className="customer-order-list">{account.orders.map((order) => <article className="customer-order" key={order.id}>
              <div className="customer-order-heading"><div><strong>{order.orderNumber}</strong><small>{order.createdAt}</small></div><span className={`customer-order-status status-${order.status.toLowerCase()}`}>{orderStatus[order.status] ?? order.status}</span></div>
              <p>{order.items.map((item) => `${item.name} Ã— ${item.quantity}`).join(" Â· ")}</p>
              <strong className="customer-order-total">{formatUsd(order.totalAmount / 100)}</strong>
            </article>)}</div> : <div className="customer-account-empty"><p>{t("Your order requests will appear here after checkout.")}</p><Link href="/products" className="text-link">{t("Explore the shop")}</Link></div>}
          </section>
        </div>
        <aside className="customer-dashboard-side">
          <section className="customer-dashboard-card customer-profile-card"><p className="eyebrow">{t("Your details")}</p><h2>{account.fullName}</h2><p>{account.email}</p>{account.phone && <p>{account.phone}</p>}<p className="customer-profile-note">{t("Your delivery contact details are saved with each order request.")}</p></section>
          <section className="customer-dashboard-card"><div className="customer-card-heading"><div><p className="eyebrow">{t("For next time")}</p><h2>{t("Saved delivery details")}</h2></div></div>
            {account.addresses.length ? <div className="customer-address-list">{account.addresses.map((address) => <article className="customer-address" key={address.id}><strong>{address.recipient}</strong><span>{address.phone}</span><span>{[address.sector, address.district].filter(Boolean).join(", ")}</span>{address.directions && <small>{address.directions}</small>}</article>)}</div> : <p className="customer-account-empty">{t("Your delivery details will be saved here after your first order request.")}</p>}
          </section>
        </aside>
      </section>
    </main>
  );
}

