import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { blogSchema } from "@/lib/validators";
import { parseLimit, parsePage, sanitizeBlogContent, toSlug } from "@/lib/admin";

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
  const q = searchParams.get("q")?.trim() || "";
  const status = searchParams.get("status")?.trim() || "";
  const page = parsePage(searchParams.get("page"), 1);
  const limit = parseLimit(searchParams.get("limit"), 10, 100);

  const where: Prisma.BlogPostWhereInput = {
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { author: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status: status as any } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return NextResponse.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function POST(request: Request) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  try {
    const payload = blogSchema.parse(await request.json());
    const item = await prisma.blogPost.create({
      data: {
        title: payload.title,
        slug: payload.slug?.trim() ? toSlug(payload.slug) : toSlug(payload.title),
        content: sanitizeBlogContent(payload.content),
        author: payload.author,
        featuredImage: payload.featuredImage || null,
        status: payload.status,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error?.issues?.[0]?.message || "Failed to create blog" }, { status: 400 });
  }
}
