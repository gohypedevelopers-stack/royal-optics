"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const orderStatuses = [
  "PENDING",
  "CONFIRMED",
  "PENDING_PAYMENT",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export default function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: (typeof orderStatuses)[number];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nextStatus, setNextStatus] = useState<string>(status);

  function onUpdate() {
    startTransition(async () => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        toast.error("Unable to update order status");
        return;
      }

      toast.success("Order status updated");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        disabled={isPending}
        value={nextStatus}
        onChange={(event) => setNextStatus(event.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
      >
        {orderStatuses.map((orderStatus) => (
          <option value={orderStatus} key={orderStatus}>
            {orderStatus.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <Button type="button" size="sm" variant="outline" disabled={isPending || nextStatus === status} onClick={onUpdate}>
        Update
      </Button>
    </div>
  );
}
