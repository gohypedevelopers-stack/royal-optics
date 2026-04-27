import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StatCard({
  title,
  value,
  hint,
  icon,
  tone = "default",
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const toneStyles: Record<string, string> = {
    default: "from-slate-400 to-slate-500",
    success: "from-emerald-400 to-emerald-600",
    warning: "from-amber-300 to-amber-500",
    danger: "from-rose-400 to-rose-600",
    info: "from-blue-400 to-blue-600",
  };

  return (
    <Card className="overflow-hidden border-slate-200/90 bg-white/95 shadow-[0_10px_26px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/90">
      <div className={`h-1 w-full bg-gradient-to-r ${toneStyles[tone] || toneStyles.default}`} />
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
          <p className="mt-3 text-5xl font-bold leading-none tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
          {hint ? <Badge variant={tone} className="mt-3 text-xs">{hint}</Badge> : null}
        </div>
        {icon ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
