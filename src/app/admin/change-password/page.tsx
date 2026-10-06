import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminPasswordForm from "@/components/admin/AdminPasswordForm";

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN" || !session.adminId) redirect("/admin/login");

  return <AdminPasswordForm />;
}
