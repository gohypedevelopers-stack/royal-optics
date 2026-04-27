import { NextResponse } from "next/server";
import { TestimonialStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { testimonialStatusSchema } from "@/lib/validators";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  try {
    const body = await request.json();
    const status = testimonialStatusSchema.parse(body.status);

    const item = await prisma.testimonial.update({
      where: { id: params.id },
      data: {
        status,
        isApproved: status === TestimonialStatus.APPROVED,
      },
    });
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error?.issues?.[0]?.message || "Failed to update testimonial" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();
  await prisma.testimonial.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
