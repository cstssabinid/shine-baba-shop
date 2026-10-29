"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OtpCodeInput } from "@/components/otp-code-input";
import { sendManagerOtp, verifyManagerOtp } from "@/app/admin/auth-actions";

export function AdminManagerLogin({
  configured,
  phoneHint,
  initialError,
}: {
  configured: boolean;
  phoneHint: string | null;
  initialError?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [resendCountdown, setResendCountdown] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError ?? "");

  useEffect(() => {
    if (step !== "otp" || resendCountdown <= 0) return;
    const timer = window.setInterval(() => setResendCountdown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [step, resendCountdown]);

  async function requestCode() {
    setPending(true);
    setError("");
    try {
      const result = await sendManagerOtp();
      if (!result.ok) {
        setError("We could not send the manager verification code. Check the SMS setup and try again.");
        return;
      }
      setOtp(Array(6).fill(""));
      setStep("otp");
      setResendCountdown(30);
    } catch {
      setError("We could not send the manager verification code. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function verifyCode() {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Enter all six digits from the text message.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await verifyManagerOtp(code);
      if (!result.ok) {
        setError("That code is invalid or expired. Check it or request a new code.");
        return;
      }
      router.refresh();
    } catch {
      setError("We could not verify the code. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="manager-shell manager-login-shell">
      <section className="manager-login-card manager-otp-card">
        <p className="eyebrow">Shine Baba Shop</p>
        <h1>Manager <em>sign in.</em></h1>
        <p>Manage products, stock, and customer order requests.</p>
        {error && <div className="manager-alert error" role="alert">{error}</div>}
        {configured ? <div className="manager-otp-flow">
          {step === "phone" ? <>
            <div className="manager-otp-number"><span>Registered manager number</span><strong>{phoneHint}</strong></div>
            <p>A one-time code will be sent to the registered number. It expires after five minutes.</p>
            <button className="button button-dark" type="button" onClick={() => void requestCode()} disabled={pending}>{pending ? "Sending code…" : "Send verification code"}</button>
          </> : <>
            <p>A six-digit code was sent to <strong>{phoneHint}</strong>.</p>
            <OtpCodeInput value={otp} onChange={setOtp} disabled={pending} label="Manager verification code" />
            <button className="button button-dark" type="button" onClick={() => void verifyCode()} disabled={pending || otp.join("").length !== 6}>{pending ? "Verifying…" : "Verify and continue"}</button>
            <div className="customer-otp-actions"><button type="button" onClick={() => void requestCode()} disabled={pending || resendCountdown > 0}>{resendCountdown > 0 ? `Resend code in 00:${String(resendCountdown).padStart(2, "0")}` : "Resend code"}</button><button type="button" onClick={() => { setStep("phone"); setOtp(Array(6).fill("")); setError(""); }}>Back</button></div>
          </>}
        </div> : <div className="manager-alert">Configure ADMIN_PHONE_NUMBER, ADMIN_SESSION_SECRET, and the Twilio SMS settings in the local environment and Vercel project settings to enable manager access.</div>}
        <Link className="manager-back-link" href="/">Back to the shop</Link>
      </section>
    </main>
  );
}
