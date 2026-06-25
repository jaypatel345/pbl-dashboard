import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const DEFAULT_DATA_DIR =
  process.env.ASSIGNMENT_DATA_DIR ?? path.resolve(process.cwd(), "../Open Source/Mantra4Change_PBL_AI_Prework_Candidate_Package");

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const segments = (await params).path;
  const relativePath = segments.join("/");
  const baseDir = path.join(DEFAULT_DATA_DIR, "03_Grant_Reporting_Evidence");
  const filePath = path.join(baseDir, relativePath);

  if (!filePath.startsWith(baseDir)) {
    return NextResponse.json({ error: "Invalid path." }, { status: 400 });
  }

  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new NextResponse(buffer, {
      headers: { "Content-Type": MIME[ext] ?? "application/octet-stream" },
    });
  } catch {
    return NextResponse.json({ error: "Evidence file not found." }, { status: 404 });
  }
}
