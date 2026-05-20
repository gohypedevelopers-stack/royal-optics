import { redirect } from "next/navigation";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = await searchParams;
  const q = String(resolvedSearchParams.q || "");
  redirect(`/products?q=${encodeURIComponent(q)}`);
}
