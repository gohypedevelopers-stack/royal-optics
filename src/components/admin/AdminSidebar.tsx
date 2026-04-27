"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Package, Shapes, ShoppingCart, IndianRupee, MessageSquareQuote, Users, FileText, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Shapes },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/lens-prices", label: "Lens Prices", icon: IndianRupee },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/blogs", label: "Blogs", icon: FileText },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    for (const link of links) {
      router.prefetch(link.href);
    }
  }, [router]);

  return (
    <aside className="sticky top-[108px] h-fit rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="rounded-xl bg-gradient-to-r from-slate-900 to-blue-900 px-3 py-3 text-white dark:from-slate-800 dark:to-blue-950">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Admin Panel</p>
        <p className="mt-1 text-sm font-medium text-white/90">Navigate commerce modules</p>
      </div>
      <nav className="mt-3 space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch
              className={cn(
                "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_10px_22px_rgba(37,99,235,0.35)]"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition",
                  isActive
                    ? "border-white/30 bg-white/10 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-slate-300 group-hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                )}
              >
                <Icon size={16} />
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
