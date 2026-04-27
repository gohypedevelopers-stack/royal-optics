import AdminLayoutShell from "@/components/admin/AdminLayout";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (session?.role !== "ADMIN") {
    return <>{children}</>;
  }

  return (
    <AdminLayoutShell
      title="Royal Optics Admin"
      subtitle="Premium optical commerce control center"
      actions={<AdminLogoutButton />}
    >
      {children}
    </AdminLayoutShell>
  );
}
