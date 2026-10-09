"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not sign in.");
      router.replace("/admin"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not sign in."); }
    finally { setSubmitting(false); }
  }

  return <main className="login-screen">
    <section className="login-brand-panel"><Link href="/" className="brand login-brand"><span className="brand-mark">d.</span><span>draftline<span className="brand-period">.</span></span></Link><div className="login-brand-copy"><span className="eyebrow light-eyebrow"><Sparkles size={13} /> YOUR CREATIVE SPACE</span><h1>Good stories<br />deserve <em>good tools.</em></h1><p>A quiet, thoughtful workspace for the stories you can’t wait to share.</p><div className="login-note-card"><span className="login-note-mark">✳</span><div><strong>Make room for the good stuff.</strong><p>Write freely. Design intuitively. Publish with confidence.</p></div></div></div><div className="login-brand-footer"><span>UCT · FULL STACK INTERNSHIP PROJECT</span><span>CRAFTED BY JEET SHAW</span></div><div className="login-decor decor-1" /><div className="login-decor decor-2" /></section>
    <section className="login-form-panel"><div className="login-form-wrap"><div className="login-small-logo"><span className="brand-mark">d.</span><span>draftline</span></div><div className="login-heading"><span className="page-kicker">WELCOME BACK</span><h2>Sign in to your studio<span className="title-period">.</span></h2><p>Your next story is waiting.</p></div>{error && <div className="inline-error" role="alert">{error}</div>}<form onSubmit={submit} className="login-form"><label className="form-field"><span>Email address</span><div className="login-input-wrap"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="username" required maxLength={254} /></div></label><label className="form-field"><span>Password</span><div className="login-input-wrap"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required maxLength={200} /><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label><button type="submit" className="button button-dark login-submit" disabled={submitting}>{submitting ? "Signing you in…" : "Sign in to studio"}<ArrowRight size={17} /></button></form><div className="login-divider"><span /> <small>BUILT FOR THE LOVE OF PUBLISHING</small> <span /></div><Link href="/" className="login-back-link">← Back to the journal</Link><p className="login-security-note"><LockKeyhole size={13} /> Secure admin access · HTTP-only session cookie</p></div></section>
  </main>;
}
