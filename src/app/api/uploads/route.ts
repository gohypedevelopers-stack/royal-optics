import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const filePathVal = formData.get("filePath") as string | null;

    if (!file || !filePathVal) {
      return NextResponse.json({ error: "Missing file or filePath" }, { status: 400 });
    }

    // Security check: must start with /uploads/ and contain no path traversal sequences (like ..)
    if (!filePathVal.startsWith("/uploads/") || filePathVal.includes("..")) {
      return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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
