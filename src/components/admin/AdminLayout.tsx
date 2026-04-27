import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f3f6fb_0%,#eef3fb_42%,#edf2fb_100%)] dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(80rem_30rem_at_15%_-10%,rgba(59,130,246,0.18),transparent_60%),radial-gradient(60rem_26rem_at_95%_0%,rgba(14,116,144,0.12),transparent_60%)]" />
      <AdminHeader title={title} subtitle={subtitle} actions={actions} />
      <div className="relative mx-auto grid w-full max-w-[1540px] gap-6 px-3 py-6 md:px-6 lg:grid-cols-[270px_minmax(0,1fr)] xl:gap-7">
        <AdminSidebar />
        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
