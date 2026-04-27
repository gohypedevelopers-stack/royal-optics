import { redirect } from "next/navigation";

export default function LegacyCategoryPage({ params }: { params: { slug: string } }) {
  redirect(`/products?category=${encodeURIComponent(params.slug)}`);
}
