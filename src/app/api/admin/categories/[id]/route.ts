import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { categorySchema } from "@/lib/validators";
import { toSlug } from "@/lib/admin";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

async function resolveParentCategoryId(categoryId: string, parentId?: string | null) {
  if (!parentId) return null;
  if (parentId === categoryId) throw new Error("Category cannot be parent of itself");

  const parent = await prisma.category.findUnique({
    where: { id: parentId },
    select: { id: true, parentId: true },
  });
  if (!parent) throw new Error("Parent category not found");
  if (parent.parentId) throw new Error("Only top-level categories can be selected as parent");
  return parent.id;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  const item = await prisma.category.findUnique({
    where: { id: params.id },
    include: { _count: { select: { products: true } } },
  });
  if (!item) return NextResponse.json({ error: "Category not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  try {
    const payload = categorySchema.parse(await request.json());
    const slug = payload.slug?.trim() ? toSlug(payload.slug) : toSlug(payload.name);
    const parentId = await resolveParentCategoryId(params.id, payload.parentId || null);
    if (parentId) {
      const childCount = await prisma.category.count({ where: { parentId: params.id } });
      if (childCount > 0) {
        throw new Error("Cannot convert a parent category with children into a child category");
      }
    }

    const item = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: payload.name,
        slug,
        description: payload.description || null,
        imageUrl: payload.imageUrl || null,
        status: payload.status,
        parentId,
      },
    });
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error?.issues?.[0]?.message || "Failed to update category" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  const [count, childCount] = await Promise.all([
    prisma.product.count({ where: { categoryId: params.id } }),
    prisma.category.count({ where: { parentId: params.id } }),
  ]);
  if (count > 0 || childCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete category with linked records (products: ${count}, children: ${childCount}).` },
      { status: 409 },
    );
  }

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
