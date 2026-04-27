export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      name: { contains: q, mode: "insensitive" },
    },
    select: { id: true, name: true, slug: true },
    take: 8,
    orderBy: [{ isTrending: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ suggestions });
}

