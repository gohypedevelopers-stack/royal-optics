"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, MapPin, Percent, ShieldCheck, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

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
  isDefault: boolean;
};

type CheckoutClientProps = {
  addresses: Address[];
  cartTotal: number;
  shippingFee: number;
  cartItemsCount: number;
};

export default function CheckoutClient({ addresses, cartTotal, shippingFee, cartItemsCount }: CheckoutClientProps) {
  const router = useRouter();
  const [selectedAddressId, setSelectedAddressId] = useState(addresses.find((item) => item.isDefault)?.id || "");
  const [useNewAddress, setUseNewAddress] = useState(addresses.length === 0);
  const [promoCode, setPromoCode] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [loading, setLoading] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [summary, setSummary] = useState({
    subTotal: cartTotal,
    promoDiscount: 0,
    prepaidDiscount: 0,
    discount: 0,
    shippingFee,
    grandTotal: cartTotal + shippingFee,
    appliedPromoCode: null as string | null,
  });

  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    landmark: "",
    isDefault: true,
  });

  const canSubmit = useMemo(() => {
    if (cartItemsCount <= 0) return false;
    if (useNewAddress) {
      return (
        newAddress.fullName.trim().length > 1 &&
        newAddress.phone.trim().length >= 10 &&
        newAddress.addressLine1.trim().length > 4 &&
        newAddress.city.trim().length > 1 &&
        newAddress.state.trim().length > 1 &&
        newAddress.postalCode.trim().length > 3
      );
    }

    return !!selectedAddressId;
  }, [cartItemsCount, newAddress, selectedAddressId, useNewAddress]);

  async function applyPromoCode(nextCode?: string, options?: { silent?: boolean }) {
    setApplyingPromo(true);

    try {
      const normalizedPromoCode = (nextCode ?? promoCode).trim().toUpperCase();
      const response = await fetch("/api/orders/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: normalizedPromoCode || undefined, paymentMethod }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to apply promo code");
      }

      setSummary({
        subTotal: Number(data.summary?.subTotal || cartTotal),
        promoDiscount: Number(data.summary?.promoDiscount || 0),
        prepaidDiscount: Number(data.summary?.prepaidDiscount || 0),
        discount: Number(data.summary?.discount || 0),
        shippingFee: Number(data.summary?.shippingFee || shippingFee),
        grandTotal: Number(data.summary?.grandTotal || cartTotal + shippingFee),
        appliedPromoCode: data.summary?.appliedPromoCode || null,
      });

      if (!options?.silent) {
        toast.success(normalizedPromoCode ? "Promo code applied" : "Promo code removed");
      }
    } catch (error: any) {
      setSummary((prev) => ({
        ...prev,
        promoDiscount: 0,
        prepaidDiscount: 0,
        discount: 0,
        grandTotal: Math.max(0, cartTotal + prev.shippingFee),
        appliedPromoCode: null,
      }));
      if (!options?.silent) {
        toast.error(error.message || "Unable to apply promo code");
      }
    } finally {
      setApplyingPromo(false);
    }
  }

  useEffect(() => {
    applyPromoCode(undefined, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod]);

  async function placeOrder() {
    if (!canSubmit) return;

    setLoading(true);

    try {
      const checkoutResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: useNewAddress ? undefined : selectedAddressId,
          newAddress: useNewAddress ? newAddress : undefined,
          promoCode: summary.appliedPromoCode || undefined,
          paymentMethod,
          notes,
        }),
      });

      const checkoutData = await checkoutResponse.json();

      if (!checkoutResponse.ok) {
        throw new Error(checkoutData.error || "Unable to place order");
      }

      const order = checkoutData.order;

      if (paymentMethod === "COD") {
        toast.success("Order placed successfully");
        router.push(`/order-confirmation/${order.id}`);
        return;
      }

      const createOrderResponse = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      const paymentPayload = await createOrderResponse.json();

      if (!createOrderResponse.ok) {
        throw new Error(paymentPayload.error || "Unable to initiate Razorpay");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      const razorpay = new window.Razorpay({
        key: paymentPayload.keyId,
        amount: paymentPayload.order.amount,
        currency: paymentPayload.order.currency,
        name: "Royal Optics",
        description: `Order ${order.orderNumber}`,
        order_id: paymentPayload.order.id,
        notes: { internalOrderId: paymentPayload.internalOrderId },
        handler: async (response: any) => {
          const verifyResponse = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });

          const verifyData = await verifyResponse.json();
          if (!verifyResponse.ok) {
            toast.error(verifyData.error || "Payment verification failed");
            return;
          }

          toast.success("Payment successful");
          router.push(`/order-confirmation/${verifyData.orderId}`);
        },
        prefill: {
          name: useNewAddress ? newAddress.fullName : addresses.find((item) => item.id === selectedAddressId)?.fullName,
          contact: useNewAddress ? newAddress.phone : addresses.find((item) => item.id === selectedAddressId)?.phone,
        },
        theme: {
          color: "#1d4ed8",
        },
      });

      razorpay.open();
    } catch (error: any) {
      toast.error(error.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Shipping Details</h2>
            <p className="mt-1 text-sm text-slate-600">Select a saved address or add a new one.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <MapPin className="h-3.5 w-3.5" />
            {cartItemsCount} item(s)
          </span>
        </div>

        {addresses.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setUseNewAddress(false)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                !useNewAddress ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              <p className="font-semibold">Use Saved Address</p>
              <p className="mt-1 text-xs">Fast checkout with existing address</p>
            </button>
            <button
              type="button"
              onClick={() => setUseNewAddress(true)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                useNewAddress ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              <p className="font-semibold">Add New Address</p>
              <p className="mt-1 text-xs">Deliver to a different location</p>
            </button>
          </div>
        )}

        {!useNewAddress ? (
          <div className="grid gap-3">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`block rounded-xl border p-4 text-sm transition ${
                  selectedAddressId === address.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      {address.fullName} {address.isDefault ? <span className="text-xs text-emerald-700">(Default)</span> : null}
                    </p>
                    <p className="text-slate-600">{address.phone}</p>
                    <p className="text-slate-600">
                      {address.addressLine1}, {address.addressLine2 ? `${address.addressLine2}, ` : ""}
                      {address.city}, {address.state}, {address.postalCode}, {address.country}
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Full Name"
              value={newAddress.fullName}
              onChange={(event) => setNewAddress((prev) => ({ ...prev, fullName: event.target.value }))}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <input
              placeholder="Phone"
              value={newAddress.phone}
              onChange={(event) => setNewAddress((prev) => ({ ...prev, phone: event.target.value }))}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <input
              placeholder="Address Line 1"
              value={newAddress.addressLine1}
              onChange={(event) => setNewAddress((prev) => ({ ...prev, addressLine1: event.target.value }))}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:col-span-2"
            />
            <input
              placeholder="Address Line 2 (optional)"
              value={newAddress.addressLine2}
              onChange={(event) => setNewAddress((prev) => ({ ...prev, addressLine2: event.target.value }))}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:col-span-2"
            />
            <input
              placeholder="City"
              value={newAddress.city}
              onChange={(event) => setNewAddress((prev) => ({ ...prev, city: event.target.value }))}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <input
              placeholder="State"
              value={newAddress.state}
              onChange={(event) => setNewAddress((prev) => ({ ...prev, state: event.target.value }))}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <input
              placeholder="Postal Code"
              value={newAddress.postalCode}
              onChange={(event) => setNewAddress((prev) => ({ ...prev, postalCode: event.target.value }))}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <input
              placeholder="Country"
              value={newAddress.country}
              onChange={(event) => setNewAddress((prev) => ({ ...prev, country: event.target.value }))}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Order Note (optional)</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Delivery instructions, preferred timing, landmark..."
          />
        </div>
      </section>

      <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-24">
        <h2 className="text-xl font-bold text-slate-900">Payment & Summary</h2>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setPaymentMethod("RAZORPAY")}
            className={`w-full rounded-xl border p-3 text-left transition ${
              paymentMethod === "RAZORPAY" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 h-5 w-5 text-blue-700" />
              <div>
                <p className="font-semibold text-slate-900">Razorpay Prepaid</p>
                <p className="mt-1 text-xs text-slate-600">Card, UPI, Wallet, Netbanking. Fast and secure.</p>
                <p className="mt-1 text-xs font-semibold text-emerald-700">10% off on prepaid payment</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("COD")}
            className={`w-full rounded-xl border p-3 text-left transition ${
              paymentMethod === "COD" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <Wallet className="mt-0.5 h-5 w-5 text-slate-700" />
              <div>
                <p className="font-semibold text-slate-900">Cash on Delivery</p>
                <p className="mt-1 text-xs text-slate-600">Available for selected addresses.</p>
              </div>
            </div>
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Percent className="h-4 w-4 text-blue-600" />
            Apply Discount
          </label>
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
              placeholder="Enter promo code"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => {
                applyPromoCode();
              }}
              disabled={applyingPromo || loading}
              className="rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {applyingPromo ? "..." : "Apply"}
            </button>
          </div>
          {summary.appliedPromoCode && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-emerald-700">Applied: {summary.appliedPromoCode}</p>
              <button
                type="button"
                onClick={() => {
                  setPromoCode("");
                  applyPromoCode("");
                }}
                disabled={applyingPromo || loading}
                className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-60"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="flex items-center justify-between">
            <span>Items ({cartItemsCount})</span>
            <strong>{formatINR(summary.subTotal)}</strong>
          </p>
          {summary.promoDiscount > 0 && (
            <p className="flex items-center justify-between text-emerald-700">
              <span>Promo Discount</span>
              <strong>-{formatINR(summary.promoDiscount)}</strong>
            </p>
          )}
          {summary.prepaidDiscount > 0 && (
            <p className="flex items-center justify-between text-emerald-700">
              <span>Prepaid Discount (10%)</span>
              <strong>-{formatINR(summary.prepaidDiscount)}</strong>
            </p>
          )}
          <p className="flex items-center justify-between">
            <span>Shipping</span>
            <strong>{summary.shippingFee > 0 ? formatINR(summary.shippingFee) : "Free"}</strong>
          </p>
          <p className="flex items-center justify-between border-t border-slate-200 pt-3 text-base">
            <span>Payable</span>
            <strong>{formatINR(summary.grandTotal)}</strong>
          </p>
        </div>

        <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
          <p className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Secure encrypted payment flow
          </p>
          <p className="inline-flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-600" />
            Fast dispatch on confirmed orders
          </p>
        </div>

        <button
          type="button"
          disabled={!canSubmit || loading}
          onClick={placeOrder}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Processing..." : paymentMethod === "RAZORPAY" ? "Proceed to Razorpay" : "Place COD Order"}
        </button>
      </aside>
    </div>
  );
}
