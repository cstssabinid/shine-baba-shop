"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { formatUsd } from "@/lib/format";
import { prepareCustomerPhoneAuth } from "@/app/account/actions";
import { maskPhoneNumber } from "@/lib/phone-number";
import { usePreferences } from "@/components/preferences-provider";
import { OtpCodeInput } from "@/components/otp-code-input";

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
  const [authStep, setAuthStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [signupName, setSignupName] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [resendCountdown, setResendCountdown] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const authCardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (authStep !== "otp" || resendCountdown <= 0) return;
    const timer = window.setInterval(() => setResendCountdown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [authStep, resendCountdown]);
  useEffect(() => {
    if (authStep !== "otp") return;
    const timer = window.setTimeout(() => {
      authCardRef.current?.querySelector<HTMLInputElement>(".customer-glass-face.is-active .otp-code-input input")?.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [authStep]);
  const orderStatus: Record<string, string> = {
    PENDING: t("Awaiting shop confirmation"),
    CONFIRMED: t("Confirmed"),
    PROCESSING: t("Being prepared"),
    COMPLETED: t("Completed"),
    CANCELLED: t("Cancelled"),
    PARTIALLY_CANCELLED: t("Partially cancelled"),
  };

  async function requestOtp(formData: FormData) {
    setPending(true);
    setError("");
    const name = String(formData.get("name") ?? "").trim();
    const submittedPhone = String(formData.get("phone") ?? "").trim();
    if (mode === "signup" && name.length < 2) {
      setError(t("Enter your full name to create an account."));
      setPending(false);
      return;
    }
    try {
      const prepared = await prepareCustomerPhoneAuth(submittedPhone);
      if (!prepared.ok) {
        setError(prepared.reason === "invalid-phone"
          ? t("Enter a valid Rwanda mobile number, such as 0780 000 000.")
          : prepared.reason === "sms-unavailable"
            ? t("Phone verification is not available yet. Please try again later.")
            : t("We could not prepare phone verification. Please try again."));
        return;
      }
      const result = await authClient.phoneNumber.sendOtp({ phoneNumber: prepared.phoneNumber });
      if ("error" in result && result.error) {
        setError(t("We could not send a verification code. Check the number and try again."));
        return;
      }
      setPhoneNumber(prepared.phoneNumber);
      setSignupName(name);
      setOtp(Array(6).fill(""));
      setAuthStep("otp");
      setResendCountdown(30);
    } catch {
      setError(t("We could not send a verification code. Check the number and try again."));
    } finally {
      setPending(false);
    }
  }

  async function resendOtp() {
    if (!phoneNumber || resendCountdown > 0 || pending) return;
    setPending(true);
    setError("");
    try {
      const result = await authClient.phoneNumber.sendOtp({ phoneNumber });
      if ("error" in result && result.error) {
        setError(t("We could not resend the code yet. Please wait a moment and try again."));
        return;
      }
      setOtp(Array(6).fill(""));
      setResendCountdown(30);
    } catch {
      setError(t("We could not connect to the account service. Please try again."));
    } finally {
      setPending(false);
    }
  }

  async function verifyOtp() {
    const code = otp.join("");
    if (!phoneNumber || code.length !== 6) {
      setError(t("Enter all six digits from the text message."));
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await authClient.phoneNumber.verify({ phoneNumber, code });
      if ("error" in result && result.error) {
        setError(t("That code could not be verified. Check it or request a new code."));
        return;
      }
      if (mode === "signup" && signupName) {
        const profileResult = await authClient.updateUser({ name: signupName });
        if (profileResult.error) {
          setError(t("Your number is verified, but we could not save your name. Please contact the shop for help."));
        }
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
        {authStep === "otp" && isActive ? <div className="customer-glass-content customer-glass-otp">
          <h2 className="customer-glass-title">{t("Check your messages")}</h2>
          <p className="customer-glass-subtitle">{t("We sent a six-digit verification code to")} <strong>{maskPhoneNumber(phoneNumber)}</strong></p>
          <OtpCodeInput value={otp} onChange={setOtp} disabled={pending} label={t("Verification code")} />
          {error && <p className="customer-glass-error" role="alert">{error}</p>}
          <button className="customer-glass-submit" type="button" onClick={verifyOtp} disabled={pending || otp.join("").length !== 6}>
            {pending ? t("Verifying…") : t("Verify and continue")}
          </button>
          <div className="customer-otp-actions">
            <button type="button" onClick={() => void resendOtp()} disabled={pending || resendCountdown > 0}>
              {resendCountdown > 0 ? `${t("Resend code in")} 00:${String(resendCountdown).padStart(2, "0")}` : t("Resend code")}
            </button>
            <button type="button" onClick={() => { setAuthStep("phone"); setOtp(Array(6).fill("")); setError(""); }}>{t("Use another number")}</button>
          </div>
        </div> : <form className="customer-glass-content customer-glass-form" action={requestOtp} aria-label={isSignup ? t("Create account") : t("Sign in")}>
          <h2 className="customer-glass-title">{isSignup ? t("Create account") : t("Welcome back")}</h2>
          <p className="customer-glass-subtitle">{isSignup ? t("Create your account with your name and phone number.") : t("Sign in to your account with your phone number.")}</p>
          {isSignup && <label className="customer-glass-field">
            <span className="sr-only">{t("Full name")}</span>
            <input name="name" type="text" autoComplete="name" required minLength={2} maxLength={120} placeholder={t("Full name")} disabled={!isActive || pending} />
          </label>}
          <label className="customer-glass-field">
            <span className="sr-only">{t("Rwanda mobile number")}</span>
            <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={24} placeholder={t("Rwanda mobile number")} disabled={!isActive || pending} />
          </label>
          <p className="customer-glass-meta">{t("One-time code · expires in 5 minutes")}</p>
          {error && <p className="customer-glass-error" role="alert">{error}</p>}
          <button className="customer-glass-submit" type="submit" disabled={!isActive || pending}>
            {pending ? t("Sending code…") : isSignup ? t("Create account") : t("Continue with phone")}
          </button>
          <p className="customer-glass-switch">
            <span>{isSignup ? t("Already have an account?") : t("New to Shine Baba Shop?")}</span>
            <button className="customer-glass-link" type="button" onClick={() => { setMode(isSignup ? "signin" : "signup"); setError(""); }}>
              {isSignup ? t("Sign in") : t("Create account")}
            </button>
          </p>
        </form>}
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
                if (event.target !== event.currentTarget || event.propertyName !== "transform" || authStep !== "phone") return;
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
          <section className="customer-dashboard-card customer-profile-card"><p className="eyebrow">{t("Your details")}</p><h2>{account.fullName}</h2><p>{account.phone ?? account.email}</p><p className="customer-profile-note">{t("Your verified phone number is used to sign in. Your delivery contact details are saved with each order request.")}</p></section>
          <section className="customer-dashboard-card"><div className="customer-card-heading"><div><p className="eyebrow">{t("For next time")}</p><h2>{t("Saved delivery details")}</h2></div></div>
            {account.addresses.length ? <div className="customer-address-list">{account.addresses.map((address) => <article className="customer-address" key={address.id}><strong>{address.recipient}</strong><span>{address.phone}</span><span>{[address.sector, address.district].filter(Boolean).join(", ")}</span>{address.directions && <small>{address.directions}</small>}</article>)}</div> : <p className="customer-account-empty">{t("Your delivery details will be saved here after your first order request.")}</p>}
          </section>
        </aside>
      </section>
    </main>
  );
}
