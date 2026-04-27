export const dynamic = "force-dynamic";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { GUEST_TOKEN_COOKIE } from "@/lib/guest";

function isSchemaMismatch(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "P2021" || code === "P2022";
}

async function safeCategoryNav() {
  try {
    return await prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, parentId: true },
    });
  } catch (error) {
    if (isSchemaMismatch(error)) return [];
    return [];
  }
}

async function safeCartCount(ownerKey: string | null) {
  if (!ownerKey) return 0;
  try {
    return await prisma.cartItem.count({ where: { ownerKey } });
  } catch (error) {
    if (isSchemaMismatch(error)) return 0;
    return 0;
  }
}

async function safeWishlistCount(ownerKey: string | null) {
  if (!ownerKey) return 0;
  try {
    return await prisma.wishlistItem.count({ where: { ownerKey } });
  } catch (error) {
    if (isSchemaMismatch(error)) return 0;
    return 0;
  }
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const guestToken = cookies().get(GUEST_TOKEN_COOKIE)?.value;

  const ownerKey =
    session?.role === "USER" && session.userId
      ? `user:${session.userId}`
      : guestToken
        ? `guest:${guestToken}`
        : null;

  const [categories, cartCount, wishlistCount] = await Promise.all([
    safeCategoryNav(),
    safeCartCount(ownerKey),
    safeWishlistCount(ownerKey),
  ]);

  return (
    <div className="min-h-screen">
      <Navbar
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          parentId: category.parentId,
        }))}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        isLoggedIn={session?.role === "USER"}
        isAdmin={session?.role === "ADMIN"}
      />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

