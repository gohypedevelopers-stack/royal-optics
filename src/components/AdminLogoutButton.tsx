"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AdminLogoutButton() {
  const router = useRouter();

  async function logout() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      toast.error("Logout failed");
      return;
    }

    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 rounded-xl border-slate-300 bg-white/90 px-5 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900"
      onClick={logout}
    >
      Logout
    </Button>
  );
}
