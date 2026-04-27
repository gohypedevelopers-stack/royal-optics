export const dynamic = "force-dynamic";

import LoginForm from "@/components/LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const redirectParam = searchParams.redirect;
  const redirectTo = Array.isArray(redirectParam) ? redirectParam[0] : redirectParam || "/";

  return (
    <div className="relative overflow-hidden px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.14),transparent_42%)]" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-7 text-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.75)] sm:p-10">
          <div className="my-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Royal Optics</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Your premium eyewear store, now smarter.</h2>
            <p className="mt-4 max-w-lg text-sm text-slate-200">
              Login to track your orders, save lenses and checkout faster every time.
            </p>
            <div className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">Secure account session</div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">Faster repeat checkout</div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">Saved cart + wishlist</div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">Order status updates</div>
            </div>
          </div>
        </div>

        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
