"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Heart, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryNavItem = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

type NavbarProps = {
  categories: CategoryNavItem[];
  cartCount: number;
  wishlistCount: number;
  isLoggedIn: boolean;
  isAdmin: boolean;
};

const SIDEBAR_CATEGORY_PRIORITY = ["accessories", "contact-lenses", "eyeglasses", "sunglasses"];

function categoryOrder(slug: string) {
  const normalized = slug.toLowerCase();
  const exact = SIDEBAR_CATEGORY_PRIORITY.indexOf(normalized);
  if (exact >= 0) return exact;
  const fuzzy = SIDEBAR_CATEGORY_PRIORITY.findIndex((item) => normalized.includes(item));
  return fuzzy >= 0 ? fuzzy : SIDEBAR_CATEGORY_PRIORITY.length + 1;
}

export default function Navbar({ categories, cartCount, wishlistCount, isLoggedIn, isAdmin }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; slug: string }>>([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/products/suggestions?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    const params = new URLSearchParams();
    params.set("q", value);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    setSuggestions([]);
    router.push(`/products?${params.toString()}`);
  }

  const uniqueCategories = categories.filter(
    (category, index, list) => list.findIndex((item) => item.slug === category.slug) === index,
  );
  const parentCategories = uniqueCategories.filter((category) => !category.parentId);
  const childCategories = uniqueCategories.filter((category) => !!category.parentId);
  const childrenByParent = new Map<string, CategoryNavItem[]>();

  childCategories.forEach((child) => {
    if (!child.parentId) return;
    const current = childrenByParent.get(child.parentId) || [];
    current.push(child);
    childrenByParent.set(child.parentId, current);
  });

  const eyewearRoot = parentCategories.find((item) => item.slug === "eyewear" || item.name.toLowerCase() === "eyewear");
  const virtualTopLevel = [
    ...parentCategories.filter((item) => item.id !== eyewearRoot?.id),
    ...(eyewearRoot ? childrenByParent.get(eyewearRoot.id) || [] : []),
  ];
  const sidebarParents = Array.from(
    new Map(virtualTopLevel.map((item) => [item.id, item])).values(),
  ).sort((a, b) => {
    const byPriority = categoryOrder(a.slug) - categoryOrder(b.slug);
    if (byPriority !== 0) return byPriority;
    return a.name.localeCompare(b.name);
  });

  return (
    <header className="sticky top-0 z-40 border-b border-slate-300/90 bg-[#f8fafc]/95 backdrop-blur">
      <div className="w-full px-3 md:px-4 lg:px-5">
        <div className="flex w-full items-center gap-2.5 py-2.5 md:py-3">
          <button
            aria-label="Toggle category menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
            onClick={() => setMenuOpen((prev) => !prev)}
            type="button"
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          <Link href="/" className="flex min-w-max items-center pr-1.5">
            <Image
              src="/logo.jpeg"
              alt="Royal Optics"
              width={250}
              height={100}
              className="h-9 w-auto rounded-sm object-contain md:h-10"
            />
          </Link>

          <form onSubmit={submitSearch} className="relative hidden flex-1 md:block">
            <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
              <label className="relative min-w-[120px] border-r border-slate-300 bg-slate-50">
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="h-10 w-full appearance-none bg-transparent px-3 pr-8 text-sm text-slate-700 outline-none"
                >
                  <option value="all">All</option>
                  {categories.map((category) => (
                    <option value={category.slug} key={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" />
              </label>
              <div className="relative flex-1">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Optical Store"
                  className="h-10 w-full px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
              <button type="submit" className="inline-flex h-10 items-center justify-center border-l border-amber-500 bg-amber-400 px-4 text-slate-900 hover:bg-amber-300">
                <Search size={16} />
              </button>
            </div>
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-11 z-50 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    className="block w-full rounded-lg px-2.5 py-2 text-left text-sm hover:bg-slate-100"
                    onClick={() => {
                      setSuggestions([]);
                      setQuery("");
                      router.push(`/products/${item.slug}`);
                    }}
                    type="button"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </form>

          <nav className="ml-auto flex items-center gap-2">
            <Link
              href="/wishlist"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
              aria-label="Wishlist"
            >
              <Heart size={16} />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-slate-900 px-1 text-[9px] font-semibold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
              aria-label="Cart"
            >
              <ShoppingCart size={16} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-slate-900 px-1 text-[9px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAdmin ? (
              <Link href="/admin" className="hidden h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 md:inline-flex">
                Admin
              </Link>
            ) : isLoggedIn ? (
              <Link href="/account" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100" aria-label="Profile">
                <User size={16} />
              </Link>
            ) : (
              <>
                <Link href="/signup" className="hidden h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 md:inline-flex">
                  Sign Up
                </Link>
                <Link href="/login" className="hidden h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 md:inline-flex">
                  Login
                </Link>
                <Link href="/login" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 md:hidden">
                  <User size={16} />
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="block w-full pb-3 md:hidden">
          <form onSubmit={submitSearch}>
            <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Optical Store"
                className="h-10 flex-1 px-3 text-sm text-slate-700 outline-none"
              />
              <button type="submit" className="inline-flex h-10 items-center justify-center bg-amber-400 px-4 text-slate-900 hover:bg-amber-300">
                <Search size={15} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {menuOpen && <button type="button" className="fixed inset-0 z-40 bg-transparent" onClick={() => setMenuOpen(false)} />}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-[100dvh] w-[392px] max-w-[100vw] flex-col border-r border-slate-300 bg-white text-slate-900 shadow-xl transition-transform duration-300",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-300 bg-white px-4 py-3.5">
          <h3 className="text-[24px] font-bold leading-none text-black">Categories</h3>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-white px-4 py-3">
          <p className="mb-3 text-[16px] font-semibold text-slate-600">Shop by Category</p>
          {uniqueCategories.length === 0 ? (
            <p className="border-b border-slate-300 py-4 text-base text-black">No categories available.</p>
          ) : (
            <>
              {sidebarParents.map((parent) => {
                const children = (childrenByParent.get(parent.id) || []).sort((a, b) => a.name.localeCompare(b.name));
                return (
                  <section key={parent.id} className="border-b border-slate-200 py-3.5">
                    <Link
                      href={`/products?category=${parent.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="text-[34px] font-semibold leading-[1.2] text-[#0b66da] hover:underline"
                    >
                      {parent.name}
                    </Link>
                    {children.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5">
                        {children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/products?category=${child.slug}`}
                            onClick={() => setMenuOpen(false)}
                            className={cn(
                              "text-[16px] leading-[1.35] text-slate-800 transition hover:text-black hover:underline",
                              pathname.includes(child.slug) && "font-medium text-black underline",
                            )}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </>
          )}

          <div className="mt-5 rounded border border-slate-200">
            <Link href="/" onClick={() => setMenuOpen(false)} className="block border-b border-slate-200 px-3 py-2.5 text-[17px] text-black hover:bg-slate-50">
              Home
            </Link>
            <Link href="/about" onClick={() => setMenuOpen(false)} className="block border-b border-slate-200 px-3 py-2.5 text-[17px] text-black hover:bg-slate-50">
              About Us
            </Link>
            <a href="tel:+919911522006" className="block border-b border-slate-200 px-3 py-2.5 text-[17px] text-black hover:bg-slate-50">
              Call: +91 9911522006
            </a>
            <a href="mailto:royalopticians1169@gmail.com" className="block border-b border-slate-200 px-3 py-2.5 text-[17px] text-black hover:bg-slate-50">
              Email Us
            </a>
            {!isLoggedIn ? (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="block border-b border-slate-200 px-3 py-2.5 text-[17px] text-black hover:bg-slate-50">
                  Login
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-[17px] text-black hover:bg-slate-50">
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link href="/account" onClick={() => setMenuOpen(false)} className="block border-b border-slate-200 px-3 py-2.5 text-[17px] text-black hover:bg-slate-50">
                  My Account
                </Link>
                <Link href="/orders" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-[17px] text-black hover:bg-slate-50">
                  My Orders
                </Link>
              </>
            )}
          </div>
        </div>
      </aside>
    </header>
  );
}
