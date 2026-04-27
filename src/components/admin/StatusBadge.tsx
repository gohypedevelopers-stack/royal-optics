import { Badge } from "@/components/ui/badge";

const variants: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  ACTIVE: "success",
  APPROVED: "success",
  PUBLISHED: "success",
  DELIVERED: "success",
  CONFIRMED: "info",
  PROCESSING: "info",
  SHIPPED: "info",
  PENDING: "warning",
  PENDING_PAYMENT: "warning",
  DRAFT: "warning",
  INACTIVE: "default",
  CANCELLED: "danger",
  REJECTED: "danger",
  BLOCKED: "danger",
};

export default function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = String(value || "UNKNOWN").replaceAll("_", " ");
  const key = String(value || "").toUpperCase();
  return <Badge variant={variants[key] || "default"}>{label}</Badge>;
}
