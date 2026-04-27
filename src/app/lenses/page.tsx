export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export default async function LensesPage() {
  const lensPrices = await prisma.lensPrice.findMany({ orderBy: [{ group: "asc" }, { sortOrder: "asc" }, { key: "asc" }] });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold text-slate-900">Lens Price Catalog</h1>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {lensPrices.map((lens) => (
          <article key={lens.id} className="rounded-lg border bg-white p-3 text-sm">
            <p className="font-semibold text-slate-900">{lens.title}</p>
            <p className="text-slate-500">{lens.key}</p>
            <p className="mt-1 text-slate-700">{lens.description}</p>
            <p className="mt-2 font-semibold text-slate-900">
              {lens.valueType === "MULTIPLIER" ? "x" : "Rs."}
              {Number(lens.value).toFixed(2)}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}


