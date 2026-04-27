"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

export default function DeleteButton({
  endpoint,
  label = "Delete",
  title = "Delete item?",
  description = "This action cannot be undone.",
}: {
  endpoint: string;
  label?: string;
  title?: string;
  description?: string;
}) {
  const router = useRouter();

  return (
    <ConfirmDialog
      triggerLabel={label}
      title={title}
      description={description}
      onConfirm={async () => {
        const response = await fetch(endpoint, { method: "DELETE" });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast.error(result.error || "Delete failed");
          return;
        }
        toast.success("Deleted successfully");
        router.refresh();
      }}
    />
  );
}
