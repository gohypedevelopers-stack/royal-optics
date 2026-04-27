import { NextResponse } from "next/server";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);

export async function POST(request: Request) {
  const body = await request.json();
  const fileName = String(body.fileName || "").trim();
  const mimeType = String(body.mimeType || "").trim().toLowerCase();

  if (!fileName || !mimeType) {
    return NextResponse.json({ error: "fileName and mimeType are required" }, { status: 400 });
  }

  if (!allowedMimeTypes.has(mimeType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
  }

  const safePath = `/uploads/${Date.now()}-${fileName}`;

  return NextResponse.json({
    success: true,
    uploadMode: "local-public",
    filePath: safePath,
  });
}
