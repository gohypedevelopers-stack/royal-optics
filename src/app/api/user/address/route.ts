export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireUserSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await requireUserSession();
    const addresses = await prisma.address.findMany({
      where: { userId: session.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ addresses });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireUserSession();
    const payload = addressSchema.parse(await request.json());

    if (payload.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: session.userId,
        ...payload,
      },
    });

    return NextResponse.json({ success: true, address });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: error?.issues?.[0]?.message || "Invalid address request" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireUserSession();
    const body = await request.json();
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ error: "Address id required" }, { status: 400 });
    }

    const payload = addressSchema.parse(body);

    if (payload.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: payload,
    });

    return NextResponse.json({ success: true, address });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: error?.issues?.[0]?.message || "Unable to update address" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireUserSession();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Address id required" }, { status: 400 });
    }

    await prisma.address.deleteMany({ where: { id, userId: session.userId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

