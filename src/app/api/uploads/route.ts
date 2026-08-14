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

    const mimeType = request.headers.get("content-type") || "image/jpeg";

    try {
      // Save path inside public directory
      const publicPath = path.join(process.cwd(), "public", filePathVal);
      
      // Ensure parent directory (public/uploads) exists
      const dir = path.dirname(publicPath);
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(publicPath, buffer);

      // Serve via API route so runtime-uploaded files are accessible
      const serveUrl = filePathVal.replace(/^\/uploads\//, "/api/uploads/serve/");
      return NextResponse.json({ success: true, url: serveUrl });
    } catch (writeError: any) {
      console.warn("Local filesystem write failed, falling back to Base64 data URL:", writeError.message);
      
      // Fallback: return Base64 data URL
      const base64Data = `data:${mimeType};base64,${buffer.toString("base64")}`;
      return NextResponse.json({ success: true, url: base64Data });
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
