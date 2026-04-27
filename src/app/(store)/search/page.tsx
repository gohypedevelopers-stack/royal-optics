import { redirect } from "next/navigation";

export default function SearchPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const q = String(searchParams.q || "");
  redirect(`/products?q=${encodeURIComponent(q)}`);
}
