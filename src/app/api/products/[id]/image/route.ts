import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Serve legacy inline photos separately so HTML/RSC responses stay small and
// Next's image optimizer can resize and cache them like uploaded images.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, status: "ACTIVE" },
    select: {
      mainImage: true,
      images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  if (!product) return new NextResponse(null, { status: 404 });

  const source = product.mainImage || product.images[0]?.url || "/frame-square.png";
  const inline = /^data:(image\/(?:jpeg|png|webp|gif|avif));base64,([a-zA-Z0-9+/=\s]+)$/i.exec(source);
  if (inline) {
    return new NextResponse(Buffer.from(inline[2], "base64"), {
      headers: {
        "Content-Type": inline[1],
        "Cache-Control": "public, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  // A product may have been edited since the listing was rendered.
  if (source.startsWith("/") && !source.startsWith("//") || /^https?:\/\//i.test(source)) {
    return NextResponse.redirect(new URL(source, request.url));
  }
  return NextResponse.redirect(new URL("/frame-square.png", request.url));
}
