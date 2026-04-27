import { redirect } from "next/navigation";

export default function AdminProductLegacyPage({ params }: { params: { id: string } }) {
  redirect(`/admin/products/${params.id}/edit`);
}
