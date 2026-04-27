import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { blogSchema } from "@/lib/validators";
import { sanitizeBlogContent, toSlug } from "@/lib/admin";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  const item = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Blog not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  try {
    const payload = blogSchema.parse(await request.json());
    const item = await prisma.blogPost.update({
      where: { id: params.id },
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
    return NextResponse.json({ error: error?.issues?.[0]?.message || "Failed to update blog" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();
  await prisma.blogPost.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
