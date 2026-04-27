export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import AccountClient from "@/components/AccountClient";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const session = await getSession();

  if (!session || session.role !== "USER" || !session.userId) {
    redirect("/login?redirect=/account");
  }

  const [user, addresses, orders] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.address.findMany({
      where: { userId: session.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    prisma.order.findMany({
      where: { userId: session.userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold text-slate-900">My Account</h1>
      <p className="mt-1 text-sm text-slate-600">Manage profile, addresses and orders.</p>

      <div className="mt-6">
        <AccountClient
          user={{
            username: user.username,
            email: user.email,
            phone: user.phone,
          }}
          addresses={addresses}
          orders={orders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            grandTotal: Number(order.grandTotal),
            createdAt: order.createdAt.toISOString(),
            items: order.items.map((item) => ({
              id: item.id,
              productName: item.productName,
              quantity: item.quantity,
            })),
          }))}
        />
      </div>
    </div>
  );
}


