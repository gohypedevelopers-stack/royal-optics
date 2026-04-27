export const dynamic = "force-dynamic";
import { cookies } from "next/headers";
import WishlistList from "@/components/WishlistList";
import { getSession } from "@/lib/auth";
import { GUEST_TOKEN_COOKIE } from "@/lib/guest";
import { prisma } from "@/lib/prisma";

export default async function WishlistPage() {
  const session = await getSession();
  const guestToken = cookies().get(GUEST_TOKEN_COOKIE)?.value;
  const ownerKey =
    session?.role === "USER" && session.userId
      ? `user:${session.userId}`
      : guestToken
        ? `guest:${guestToken}`
        : null;

  const items = ownerKey
    ? await prisma.wishlistItem.findMany({
        where: { ownerKey },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const serialized = items.map((item) => ({
    ...item,
    product: {
      ...item.product,
      price: Number(item.product.price),
    },
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold text-slate-900">Wishlist</h1>
      <p className="mt-1 text-sm text-slate-600">Saved products for quick comparison and checkout later.</p>
      <div className="mt-6">
        <WishlistList items={serialized as any} />
      </div>
    </div>
  );
}


