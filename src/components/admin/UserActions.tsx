"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import DeleteButton from "@/components/admin/DeleteButton";

export default function UserActions({ id, status }: { id: string; status: "ACTIVE" | "BLOCKED" }) {
  const router = useRouter();

  async function toggleStatus() {
    const next = status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(result.error || "Failed to update user");
      return;
    }
    toast.success(`User ${next === "BLOCKED" ? "blocked" : "unblocked"}`);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button type="button" variant="outline" size="sm" onClick={toggleStatus}>
        {status === "ACTIVE" ? "Block" : "Unblock"}
      </Button>
      <DeleteButton endpoint={`/api/admin/users/${id}`} title="Delete user?" description="User account and linked personal records will be deleted." />
    </div>
  );
}
