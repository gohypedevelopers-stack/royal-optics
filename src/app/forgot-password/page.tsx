"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Mail, UserCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setResetUrl(data.resetUrl || "");
      toast.success("Reset link generated");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate reset link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.15),transparent_38%)]" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_1fr]">
        <form
          onSubmit={onSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_22px_55px_-30px_rgba(15,23,42,0.45)] sm:p-8"
        >
          <p className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Account Help
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">Forgot Password?</h1>
          <p className="mt-2 text-sm text-slate-600">Enter email, username or phone to get reset link.</p>

          <label className="mt-6 block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email / Username / Phone</span>
            <span className="relative block">
              <UserCircle2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="you@example.com"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate Reset Link"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>

          {resetUrl ? (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">Reset link is ready</p>
              <Link href={resetUrl} className="mt-2 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800">
                Open Reset Password Page
              </Link>
            </div>
          ) : null}

          <p className="mt-5 text-center text-sm text-slate-600">
            Remember your password?{" "}
            <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-800">
              Back to Login
            </Link>
          </p>
        </form>

        <div className="flex rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-7 text-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.75)] sm:p-10">
          <div className="my-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Secure Recovery</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Reset in less than a minute.</h2>
            <p className="mt-4 max-w-lg text-sm text-slate-200">
              We generate a secure temporary link so you can safely create a new password.
            </p>
            <div className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">Secure token link</div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">Short expiration time</div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">No data loss</div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">Quick account restore</div>
            </div>
            <div className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm">
              <Mail className="h-4 w-4 text-amber-300" />
              Keep your new password strong and unique.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
