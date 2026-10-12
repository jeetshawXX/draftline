"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Mail, LockKeyhole, UserRound, Sparkles } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<"details" | "verify">("details");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/auth/signup/request-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send verification code.");
      setStage("verify"); setMessage(result.message || "Check your inbox for your verification code.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not send verification code."); }
    finally { setBusy(false); }
  }

  async function verifyAndCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/auth/signup/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create account.");
      router.replace("/admin"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create account."); }
    finally { setBusy(false); }
  }

  return <main className="login-screen">
    <section className="login-brand-panel"><Link href="/" className="brand login-brand"><span className="brand-mark">d.</span><span>draftline<span className="brand-period">.</span></span></Link><div className="login-brand-copy"><span className="eyebrow light-eyebrow"><Sparkles size={13} /> YOUR CREATIVE SPACE</span><h1>Every great story<br />starts with <em>you.</em></h1><p>Create your account and make a little room for your next big idea.</p><div className="login-note-card"><span className="login-note-mark">✳</span><div><strong>Your ideas, your studio.</strong><p>Write freely. Design intuitively. Publish with confidence.</p></div></div></div><div className="login-brand-footer"><span>UCT · FULL STACK INTERNSHIP PROJECT</span><span>CRAFTED BY JEET SHAW</span></div><div className="login-decor decor-1" /><div className="login-decor decor-2" /></section>
    <section className="login-form-panel"><div className="login-form-wrap"><div className="login-small-logo"><span className="brand-mark">d.</span><span>draftline</span></div><div className="login-heading"><span className="page-kicker">{stage === "details" ? "GET STARTED" : "ONE LAST STEP"}</span><h2>{stage === "details" ? "Create your account" : "Check your inbox"}<span className="title-period">.</span></h2><p>{stage === "details" ? "Your next story starts here." : `We sent a six-digit code to ${email}.`}</p></div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      {message && <div className="inline-success" role="status">{message}</div>}
      {stage === "details" ? <form onSubmit={requestCode} className="login-form">
        <label className="form-field"><span>Your name</span><div className="login-input-wrap"><UserRound size={17} /><input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name" required minLength={2} maxLength={80} /></div></label>
        <label className="form-field"><span>Email address</span><div className="login-input-wrap"><Mail size={17} /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required maxLength={254} /></div></label>
        <button type="submit" className="button button-dark login-submit" disabled={busy}>{busy ? "Sending code…" : "Continue with email"}<ArrowRight size={17} /></button>
      </form> : <form onSubmit={verifyAndCreate} className="login-form">
        <label className="form-field"><span>Verification code</span><div className="login-input-wrap"><CheckCircle2 size={17} /><input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" required minLength={6} maxLength={6} pattern="\d{6}" /></div></label>
        <label className="form-field"><span>Create password</span><div className="login-input-wrap"><LockKeyhole size={17} /><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required minLength={8} maxLength={200} /></div></label>
        <button type="submit" className="button button-dark login-submit" disabled={busy}>{busy ? "Creating account…" : "Verify & create account"}<ArrowRight size={17} /></button>
        <button type="button" className="login-back-link" onClick={() => { setStage("details"); setCode(""); setPassword(""); setMessage(""); setError(""); }}>← Change name or email</button>
      </form>}
      <div className="login-divider"><span /> <small>OR SIGN UP WITH</small> <span /></div>
      <a href="/api/auth/google" className="google-auth-button"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.01 13.22l7.98 6.19C11.92 13.72 17.48 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.73 6C44.43 37.98 46.98 31.9 46.98 24.55z"/><path fill="#FBBC05" d="M9.99 28.59A14.4 14.4 0 0 1 9.2 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.58 10.78l7.41-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.9 2.3-8.18 2.3-6.52 0-12.08-4.22-14.01-10.09l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Continue with Google</a>
      <p className="signup-switch">Already have an account? <Link href="/admin/login">Sign in</Link></p>
      <Link href="/" className="login-back-link">← Back to the journal</Link><p className="login-security-note"><LockKeyhole size={13} /> Email verification protects your account</p>
    </div></section>
  </main>;
}
