"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Package, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark: string | null;
  isDefault: boolean;
};

type OrderItemSummary = {
  id: string;
  productName: string;
  quantity: number;
};

type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  createdAt: string;
  items: OrderItemSummary[];
};

function statusClass(status: string) {
  if (status === "DELIVERED") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "CANCELLED") return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "PENDING" || status === "PENDING_PAYMENT") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

export default function AccountClient({
  user,
  addresses,
  orders,
}: {
  user: { username: string; email: string; phone: string };
  addresses: Address[];
  orders: OrderSummary[];
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(user);
  const [addressForm, setAddressForm] = useState({
    fullName: user.username,
    phone: user.phone,
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    landmark: "",
    isDefault: false,
  });

  async function updateProfile() {
    const response = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Profile update failed");
      return;
    }

    toast.success("Profile updated");
    router.refresh();
  }

  async function addAddress() {
    const response = await fetch("/api/user/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addressForm),
    });

    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Address creation failed");
      return;
    }

    toast.success("Address added");
    setAddressForm((prev) => ({
      ...prev,
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      landmark: "",
      isDefault: false,
    }));
    router.refresh();
  }

  async function deleteAddress(id: string) {
    const response = await fetch(`/api/user/address?id=${id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Unable to delete address");
      return;
    }

    toast.success("Address deleted");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <UserCircle2 className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
          </div>

          <div className="space-y-3">
            <input
              value={profile.username}
              onChange={(event) => setProfile((prev) => ({ ...prev, username: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Name"
            />
            <input
              value={profile.email}
              onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Email"
            />
            <input
              value={profile.phone}
              onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Phone"
            />
          </div>

          <button
            type="button"
            onClick={updateProfile}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Save Profile
          </button>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-700" />
              <h2 className="text-lg font-semibold text-slate-900">Orders</h2>
            </div>
            <Link href="/orders" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              View All
            </Link>
          </div>

          {orders.length ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <article key={order.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500">{order.orderNumber}</p>
                      <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {order.items.map((item) => `${item.productName} x${item.quantity}`).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(order.status)}`}>
                        {order.status.replaceAll("_", " ")}
                      </span>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatINR(Number(order.grandTotal))}</p>
                      <Link href={`/order-confirmation/${order.id}`} className="text-xs font-semibold text-blue-700 hover:underline">
                        View Details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No orders yet.</div>
          )}
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-700" />
          <h2 className="text-lg font-semibold text-slate-900">Address</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            placeholder="Full Name"
            value={addressForm.fullName}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, fullName: event.target.value }))}
            className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <input
            placeholder="Phone"
            value={addressForm.phone}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, phone: event.target.value }))}
            className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <input
            placeholder="Address Line 1"
            value={addressForm.addressLine1}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, addressLine1: event.target.value }))}
            className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:col-span-2"
          />
          <input
            placeholder="Address Line 2 (optional)"
            value={addressForm.addressLine2}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, addressLine2: event.target.value }))}
            className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:col-span-2"
          />
          <input
            placeholder="City"
            value={addressForm.city}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, city: event.target.value }))}
            className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <input
            placeholder="State"
            value={addressForm.state}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, state: event.target.value }))}
            className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <input
            placeholder="Postal Code"
            value={addressForm.postalCode}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, postalCode: event.target.value }))}
            className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <input
            placeholder="Country"
            value={addressForm.country}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, country: event.target.value }))}
            className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <input
            placeholder="Landmark (optional)"
            value={addressForm.landmark}
            onChange={(event) => setAddressForm((prev) => ({ ...prev, landmark: event.target.value }))}
            className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:col-span-2"
          />
        </div>

        <button
          type="button"
          onClick={addAddress}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Add Address
        </button>

        <div className="grid gap-3 md:grid-cols-2">
          {addresses.map((address) => (
            <article key={address.id} className="rounded-xl border border-slate-200 p-4 text-sm">
              <p className="font-semibold text-slate-900">{address.fullName}</p>
              <p className="text-slate-600">{address.phone}</p>
              <p className="text-slate-600">
                {address.addressLine1}, {address.addressLine2 ? `${address.addressLine2}, ` : ""}
                {address.city}, {address.state} {address.postalCode}, {address.country}
              </p>
              {address.landmark ? <p className="text-slate-600">Landmark: {address.landmark}</p> : null}
              <div className="mt-2 flex items-center gap-2">
                {address.isDefault && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Default
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => deleteAddress(address.id)}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
