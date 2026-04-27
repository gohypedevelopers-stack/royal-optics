export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let categories: Array<{ id: string; name: string; slug: string; parentId: string | null; imageUrl: string | null }> = [];

  try {
    categories = await prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, parentId: true, imageUrl: true },
    });
  } catch (error: any) {
    if (error?.code !== "P2022" && error?.code !== "P2021") {
      throw error;
    }
    const fallback = await prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, parentId: true },
    });
    categories = fallback.map((item) => ({ ...item, imageUrl: null }));
  }

  return NextResponse.json({ categories });
}

