import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DataTable({
  headers,
  children,
}: {
  headers: Array<{ key: string; label: string; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow className="hover:bg-slate-50">
            {headers.map((header) => (
              <TableHead key={header.key} className={`text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 ${header.className || ""}`}>
                {header.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

export { TableRow, TableCell };
