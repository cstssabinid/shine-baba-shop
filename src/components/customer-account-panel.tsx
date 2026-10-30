"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { formatUsd } from "@/lib/format";
import { authenticateCustomerWithPhone } from "@/app/account/actions";
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
  const authCardRef = useRef<HTMLDivElement>(null);
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
    const name = String(formData.get("name") ?? "").trim();
    const phoneNumber = String(formData.get("phone") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    try {
      const result = await authenticateCustomerWithPhone({ mode, name, phoneNumber, password });
      if (!result.ok) {
        setError(result.reason === "invalid-phone"
          ? t("Enter a valid Rwanda mobile number, such as 0780 000 000.")
          : result.reason === "invalid-password"
            ? t("Use a password with at least 10 characters.")
            : result.reason === "invalid-name"
              ? t("Enter your full name to create an account.")
              : result.reason === "account-exists"
                ? t("We could not create or update an account for this number. Try signing in or contact the shop.")
                : mode === "signup"
                  ? t("We could not create your account. Check your phone number and try again.")
                  : t("We could not sign you in. Check your phone number and password."));
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

  function renderAuthFace(faceMode: "signin" | "signup") {
    const isSignup = faceMode === "signup";
    const isActive = mode === faceMode;

    return (
      <section
        className={`customer-glass-face ${isSignup ? "customer-glass-face-back" : "customer-glass-face-front"} ${isActive ? "is-active" : ""}`}
        aria-hidden={!isActive}
        inert={!isActive}
      >
        <form className="customer-glass-content customer-glass-form" action={submitCredentials} aria-label={isSignup ? t("Create account") : t("Sign in")}>
          <h2 className="customer-glass-title">{isSignup ? t("Create account") : t("Welcome back")}</h2>
          <p className="customer-glass-subtitle">{isSignup ? t("Create your account with your name, phone number, and password.") : t("Sign in with your phone number and password.")}</p>
          {isSignup && <label className="customer-glass-field">
            <span className="sr-only">{t("Full name")}</span>
            <input name="name" type="text" autoComplete="name" required minLength={2} maxLength={120} placeholder={t("Full name")} disabled={!isActive || pending} />
          </label>}
          <label className="customer-glass-field">
            <span className="sr-only">{t("Rwanda mobile number")}</span>
            <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={24} placeholder={t("Rwanda mobile number")} disabled={!isActive || pending} />
          </label>
          <label className="customer-glass-field">
            <span className="sr-only">{t("Password")}</span>
            <input name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} required minLength={10} maxLength={128} placeholder={t("Password")} disabled={!isActive || pending} />
          </label>
          <p className="customer-glass-meta">{isSignup ? t("Use at least 10 characters.") : t("Your phone number and account password are used to sign in.")}</p>
          {error && <p className="customer-glass-error" role="alert">{error}</p>}
          <button className="customer-glass-submit" type="submit" disabled={!isActive || pending}>
            {pending ? t("Please wait…") : isSignup ? t("Create account") : t("Sign in")}
          </button>
          <p className="customer-glass-switch">
            <span>{isSignup ? t("Already have an account?") : t("New to Shine Baba Shop?")}</span>
            <button className="customer-glass-link" type="button" onClick={() => { setMode(isSignup ? "signin" : "signup"); setError(""); }}>
              {isSignup ? t("Sign in") : t("Create account")}
            </button>
          </p>
        </form>
      </section>
    );
  }

  if (!account) {
    return (
      <main className="page-main customer-account-page customer-auth-glass-page">
        <div className="customer-glass-ambient-ring" aria-hidden="true" />
        <section className="customer-glass-shell">
          <h1 className="customer-glass-brand">SHINE BABA SHOP <span>/ {t("Secure access")}</span></h1>
          <section className="customer-glass-stage" aria-label={t("Customer account access")}>
            <span className="customer-glass-corner customer-glass-corner-top" aria-hidden="true" />
            <span className="customer-glass-corner customer-glass-corner-bottom" aria-hidden="true" />
            <div
              ref={authCardRef}
              className={`customer-glass-flip-card ${mode === "signup" ? "signup-mode" : ""}`}
              onTransitionEnd={(event) => {
                if (event.target !== event.currentTarget || event.propertyName !== "transform") return;
                authCardRef.current?.querySelector<HTMLInputElement>(".customer-glass-face.is-active input:not(:disabled)")?.focus({ preventScroll: true });
              }}
            >
              {renderAuthFace("signin")}
              {renderAuthFace("signup")}
            </div>
          </section>
          <Link className="customer-glass-back-link" href="/products">{t("Continue browsing the shop")} <span aria-hidden="true">↗</span></Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-main customer-account-page">
      <section className="page-hero compact-page-hero"><div className="container customer-account-heading"><div><p className="eyebrow">{t("Your Shine Baba Shop account")}</p><h1>{t("Hello, ")}<em>{account.fullName.split(" ")[0]}.</em></h1><p>{account.phone ?? account.email}</p>{error && <p className="customer-auth-error" role="alert">{error}</p>}</div><button className="button button-outline" type="button" onClick={signOut} disabled={pending}>{t("Sign out")}</button></div></section>
      <section className="container section customer-dashboard">
        <div className="customer-dashboard-main">
          <section className="customer-dashboard-card">
            <div className="customer-card-heading"><div><p className="eyebrow">{t("Your shop activity")}</p><h2>{t("Order requests")}</h2></div><span className="customer-count">{account.orders.length}</span></div>
            {account.orders.length ? <div className="customer-order-list">{account.orders.map((order) => <article className="customer-order" key={order.id}>
              <div className="customer-order-heading"><div><strong>{order.orderNumber}</strong><small>{order.createdAt}</small></div><span className={`customer-order-status status-${order.status.toLowerCase()}`}>{orderStatus[order.status] ?? order.status}</span></div>
              <p>{order.items.map((item) => `${item.name} × ${item.quantity}`).join(" · ")}</p>
              <strong className="customer-order-total">{formatUsd(order.totalAmount / 100)}</strong>
            </article>)}</div> : <div className="customer-account-empty"><p>{t("Your order requests will appear here after checkout.")}</p><Link href="/products" className="text-link">{t("Explore the shop")}</Link></div>}
          </section>
        </div>
        <aside className="customer-dashboard-side">
          <section className="customer-dashboard-card customer-profile-card"><p className="eyebrow">{t("Your details")}</p><h2>{account.fullName}</h2><p>{account.phone ?? account.email}</p><p className="customer-profile-note">{t("Use your phone number and password to sign in. Delivery contact details are saved with each order request.")}</p></section>
          <section className="customer-dashboard-card"><div className="customer-card-heading"><div><p className="eyebrow">{t("For next time")}</p><h2>{t("Saved delivery details")}</h2></div></div>
            {account.addresses.length ? <div className="customer-address-list">{account.addresses.map((address) => <article className="customer-address" key={address.id}><strong>{address.recipient}</strong><span>{address.phone}</span><span>{[address.sector, address.district].filter(Boolean).join(", ")}</span>{address.directions && <small>{address.directions}</small>}</article>)}</div> : <p className="customer-account-empty">{t("Your delivery details will be saved here after your first order request.")}</p>}
          </section>
        </aside>
      </section>
    </main>
  );
}
