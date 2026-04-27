export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Box,
  FileText,
  IndianRupee,
  Layers,
  MessageSquareQuote,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import DataTable, { TableCell, TableRow } from "@/components/admin/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const LOW_STOCK_THRESHOLD = 10;

export default async function AdminDashboardPage() {
  const [
    totalProducts,
    totalCategories,
    totalOrders,
    totalUsers,
    totalBlogs,
    totalTestimonials,
    pendingOrders,
    pendingTestimonials,
    deliveredOrders,
    cancelledOrders,
    revenueAggregate,
    recentOrders,
    lowStockProducts,
    latestTestimonials,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.blogPost.count(),
    prisma.testimonial.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "PENDING_PAYMENT", "CONFIRMED"] } } }),
    prisma.testimonial.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { paymentStatus: "PAID" },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { username: true, email: true, phone: true } }, items: true },
    }),
    prisma.product.findMany({
      where: { stock: { lte: LOW_STOCK_THRESHOLD }, status: "ACTIVE" },
      orderBy: { stock: "asc" },
      take: 8,
      select: { id: true, name: true, stock: true, status: true, slug: true },
    }),
    prisma.testimonial.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, rating: true, createdAt: true, message: true, status: true },
    }),
  ]);

  const revenue = Number(revenueAggregate._sum.grandTotal || 0);

  const quickActions = [
    { href: "/admin/products", label: "Manage Products", icon: Box, desc: "Catalog and stock controls" },
    { href: "/admin/categories", label: "Manage Categories", icon: Layers, desc: "Collections and hierarchy" },
    { href: "/admin/blogs", label: "Manage Blogs", icon: FileText, desc: "Content and publishing" },
    { href: "/admin/users", label: "Manage Users", icon: Users, desc: "Profiles and access" },
    { href: "/admin/lens-prices", label: "Manage Lens Prices", icon: IndianRupee, desc: "Pricing matrix" },
    { href: "/admin/coupons", label: "Manage Coupons", icon: Sparkles, desc: "Discount campaigns" },
    { href: "/admin/testimonials", label: "Manage Testimonials", icon: MessageSquareQuote, desc: "Review moderation" },
    { href: "/admin/orders", label: "Manage Orders", icon: ShoppingCart, desc: "Order processing" },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-900 px-5 py-6 text-white shadow-[0_20px_45px_rgba(15,23,42,0.28)] md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Dashboard Overview</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Commerce Command Center</h2>
            <p className="mt-2 max-w-2xl text-sm text-blue-100 md:text-base">
              Real-time visibility on products, orders, customers, and revenue performance.
            </p>
          </div>
          <div className="grid min-w-[220px] gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-blue-100">Pending Orders</p>
              <p className="mt-1 text-2xl font-semibold">{pendingOrders}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-blue-100">Pending Testimonials</p>
              <p className="mt-1 text-2xl font-semibold">{pendingTestimonials}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-blue-100">Paid Revenue</p>
              <p className="mt-1 text-2xl font-semibold">{formatINR(revenue)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Products" value={totalProducts} hint="Catalog size" icon={<Box size={18} />} />
        <StatCard title="Categories" value={totalCategories} hint="Collections" icon={<Layers size={18} />} />
        <StatCard title="Orders" value={totalOrders} hint={`${pendingOrders} pending`} tone="warning" icon={<ShoppingCart size={18} />} />
        <StatCard title="Users" value={totalUsers} hint="Registered customers" icon={<Users size={18} />} />
        <StatCard title="Blog Posts" value={totalBlogs} icon={<FileText size={18} />} />
        <StatCard
          title="Testimonials"
          value={totalTestimonials}
          hint={`${pendingTestimonials} pending`}
          tone={pendingTestimonials > 0 ? "warning" : "success"}
          icon={<MessageSquareQuote size={18} />}
        />
        <StatCard title="Pending Orders" value={pendingOrders} tone="warning" icon={<ShoppingBag size={18} />} />
        <StatCard title="Revenue" value={formatINR(revenue)} tone="success" icon={<IndianRupee size={18} />} />
      </section>

      <Card className="rounded-2xl border-slate-200/90 bg-white/95 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles size={20} className="text-blue-600" /> Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-3.5 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 group-hover:border-blue-200 group-hover:text-blue-700">
                    <Icon size={16} />
                  </span>
                  <ArrowRight size={16} className="mt-1 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </div>
                <p className="mt-2 text-lg font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200/90 bg-white/95 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Sales Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Paid Revenue</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">{formatINR(revenue)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Delivered Orders</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">{deliveredOrders}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Cancelled Orders</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">{cancelledOrders}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-2xl border-slate-200/90 bg-white/95 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DataTable
              headers={[
                { key: "order", label: "Order" },
                { key: "customer", label: "Customer" },
                { key: "amount", label: "Amount" },
                { key: "status", label: "Status" },
              ]}
            >
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link className="font-semibold text-blue-700 hover:underline" href={`/admin/orders/${order.id}`}>
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{order.user.username}</p>
                    <p className="text-xs text-slate-500">{order.user.phone}</p>
                  </TableCell>
                  <TableCell>{formatINR(Number(order.grandTotal))}</TableCell>
                  <TableCell>
                    <StatusBadge value={order.status} />
                  </TableCell>
                </TableRow>
              ))}
            </DataTable>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/90 bg-white/95 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Activity size={20} className="text-rose-600" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-slate-500">No low stock products right now.</p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <Link href={`/admin/products/${product.id}/edit`} className="text-sm font-semibold text-blue-700 hover:underline">
                      {product.name}
                    </Link>
                    <p className="text-xs text-slate-500">Stock left: {product.stock}</p>
                  </div>
                  <StatusBadge value={product.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200/90 bg-white/95 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl">Pending Testimonials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {latestTestimonials.length === 0 ? (
            <p className="text-sm text-slate-500">No pending testimonials.</p>
          ) : (
            latestTestimonials.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{item.name}</p>
                  <StatusBadge value={item.status} />
                </div>
                <p className="text-xs text-slate-500">Rating {item.rating}/5</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.message}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
