import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { passwordChangeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN" || !session.adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = passwordChangeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsed.data;
  if (bcrypt.truncates(newPassword)) {
    return NextResponse.json({ error: "New password must be at most 72 UTF-8 bytes." }, { status: 400 });
  }

  try {
    const admin = await prisma.adminUser.findUnique({ where: { id: session.adminId } });
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    if (await bcrypt.compare(newPassword, admin.passwordHash)) {
      return NextResponse.json({ error: "Choose a different new password." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const updated = await prisma.adminUser.updateMany({
      where: { id: admin.id, passwordHash: admin.passwordHash },
      data: { passwordHash },
    });
    if (!updated.count) {
      return NextResponse.json({ error: "Password changed in another request. Please try again." }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to change password. Please try again." }, { status: 500 });
  }
}
