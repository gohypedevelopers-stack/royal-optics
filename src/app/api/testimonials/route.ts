import { NextResponse } from "next/server";
import { TestimonialStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { testimonialCreateSchema } from "@/lib/validators";

function isSchemaMismatch(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "P2021" || code === "P2022";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit") || "12");
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 30) : 12;

  try {
    const items = await prisma.testimonial.findMany({
      where: { isApproved: true, status: TestimonialStatus.APPROVED },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        message: true,
        rating: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    if (isSchemaMismatch(error)) {
      const items = await prisma.testimonial.findMany({
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          name: true,
          message: true,
          rating: true,
          createdAt: true,
        },
      });

      return NextResponse.json({ items });
    }

    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = testimonialCreateSchema.parse({
      ...json,
      rating: Number(json?.rating || 0),
    });

    const session = await getSession();
    const userId = session?.role === "USER" ? session.userId : null;

    const item = await prisma.testimonial.create({
      data: {
        userId: userId || undefined,
        name: parsed.name,
        email: parsed.email || null,
        rating: parsed.rating,
        message: parsed.message,
        isApproved: false,
        status: TestimonialStatus.PENDING,
      },
      select: { id: true },
    });

    return NextResponse.json(
      {
        id: item.id,
        message: "Thanks for sharing your feedback. It will be visible after approval.",
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.issues?.[0]?.message || "Unable to submit testimonial right now." },
      { status: 400 },
    );
  }
}
