import { NextResponse } from "next/server";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif", "image/svg+xml"]);

export async function POST(request: Request) {
  const body = await request.json();
  let fileName = String(body.fileName || "").trim();
  const mimeType = String(body.mimeType || "").trim().toLowerCase();

  if (!fileName || !mimeType) {
    return NextResponse.json({ error: "fileName and mimeType are required" }, { status: 400 });
  }

  if (!allowedMimeTypes.has(mimeType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  // Sanitize the file name by replacing spaces with dashes and removing invalid characters
  fileName = fileName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');

  if (!fileName) {
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
  }

  const safePath = `/uploads/${Date.now()}-${fileName}`;

  return NextResponse.json({
    success: true,
    uploadMode: "local-public",
    filePath: safePath,
  });
}
