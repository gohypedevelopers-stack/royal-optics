import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePathVal = searchParams.get("filePath");

    if (!filePathVal) {
      return NextResponse.json({ error: "Missing filePath query parameter" }, { status: 400 });
    }

    // Security check: must start with /uploads/ and contain no path traversal sequences (like ..)
    if (!filePathVal.startsWith("/uploads/") || filePathVal.includes("..")) {
      return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
    }

    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json({ error: "Empty file body" }, { status: 400 });
    }

    // Save path inside public directory
    const publicPath = path.join(process.cwd(), "public", filePathVal);
    
    // Ensure parent directory (public/uploads) exists
    const dir = path.dirname(publicPath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(publicPath, buffer);

    return NextResponse.json({ success: true, url: filePathVal });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
