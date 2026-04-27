import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function searchProductIds(query: string, limit = 40) {
  const cleaned = query.trim();
  if (!cleaned) return [] as string[];

  try {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM "Product"
      WHERE "status" = 'ACTIVE'
        AND to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))
            @@ plainto_tsquery('simple', ${cleaned})
      ORDER BY ts_rank(
        to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '')),
        plainto_tsquery('simple', ${cleaned})
      ) DESC
      LIMIT ${limit}
    `);

    if (rows.length > 0) {
      return rows.map((row) => row.id);
    }
  } catch {
    // Fallback below when DB does not support text search configuration.
  }

  const fallback = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { name: { contains: cleaned, mode: "insensitive" } },
        { description: { contains: cleaned, mode: "insensitive" } },
      ],
    },
    select: { id: true },
    take: limit,
  });

  return fallback.map((item) => item.id);
}
