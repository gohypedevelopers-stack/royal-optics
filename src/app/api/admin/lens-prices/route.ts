import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { lensPriceSchema } from "@/lib/validators";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function GET(request: Request) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() || "";

  const items = await prisma.lensPrice.findMany({
    where: q
      ? {
          OR: [
            { key: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
            { group: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: [{ category: "asc" }, { group: "asc" }, { sortOrder: "asc" }, { key: "asc" }],
  });

  return NextResponse.json({ items });
}

export async function PATCH(request: Request) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  try {
    const body = await request.json();
    const rows = Array.isArray(body?.items) ? body.items : [];
    const parsedRows = rows.map((row) => lensPriceSchema.parse(row));

    await prisma.$transaction(
      parsedRows.map((row) =>
        prisma.lensPrice.upsert({
          where: { key: row.key },
          update: {
            title: row.title,
            description: row.description || null,
            value: row.value,
            valueType: row.valueType,
            group: row.group || null,
            category: row.category || null,
            sortOrder: row.sortOrder,
            isActive: row.isActive,
          },
          create: {
            key: row.key,
            title: row.title,
            description: row.description || null,
            value: row.value,
            valueType: row.valueType,
            group: row.group || null,
            category: row.category || null,
            sortOrder: row.sortOrder,
            isActive: row.isActive,
          },
        }),
      ),
    );

    return NextResponse.json({ success: true, count: parsedRows.length });
  } catch (error: any) {
    return NextResponse.json({ error: error?.issues?.[0]?.message || "Failed to update lens prices" }, { status: 400 });
  }
}
