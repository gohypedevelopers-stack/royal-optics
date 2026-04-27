export const dynamic = "force-dynamic";
import Script from "next/script";
import { redirect } from "next/navigation";
import CheckoutClient from "@/components/CheckoutClient";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeDeliveryFee } from "@/lib/shipping";

export default async function CheckoutPage() {
  const session = await getSession();

  if (!session || session.role !== "USER" || !session.userId) {
    redirect("/login?redirect=/checkout");
  }

  const ownerKey = `user:${session.userId}`;

  const [addresses, cartItems] = await Promise.all([
    prisma.address.findMany({ where: { userId: session.userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
    prisma.cartItem.findMany({
      where: { ownerKey },
      include: { product: { select: { customizationType: true } } },
    }),
  ]);

  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.lineTotal), 0);
  const shippingFee = computeDeliveryFee(
    cartItems.map((item) => ({
      customizationType: item.product.customizationType,
      lensDetails: item.lensDetails,
    })),
  );

  return (
    <div className="relative mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.08),transparent_36%)]" />
      <Script id="razorpay-sdk" src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">Checkout</h1>
        <p className="mt-2 text-sm text-slate-600">Secure shipping and payment for your eyewear order.</p>

        <div className="mt-6">
          <CheckoutClient
            addresses={addresses.map((item) => ({
              ...item,
              addressLine2: item.addressLine2,
            }))}
            cartTotal={cartTotal}
            shippingFee={shippingFee}
            cartItemsCount={cartItems.length}
          />
        </div>
      </div>
    </div>
  );
}


