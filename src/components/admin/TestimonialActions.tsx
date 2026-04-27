"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import DeleteButton from "@/components/admin/DeleteButton";

export default function TestimonialActions({ id }: { id: string }) {
  const router = useRouter();

  async function updateStatus(status: "APPROVED" | "REJECTED" | "PENDING") {
    const response = await fetch(`/api/admin/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(result.error || "Failed to update testimonial");
      return;
    }
    toast.success("Testimonial updated");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => updateStatus("APPROVED")}>
        Approve
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => updateStatus("REJECTED")}>
        Reject
      </Button>
      <DeleteButton
        endpoint={`/api/admin/testimonials/${id}`}
        title="Delete testimonial?"
        description="This testimonial will be removed permanently."
      />
    </div>
  );
}
