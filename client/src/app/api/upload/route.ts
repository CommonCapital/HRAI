// src/app/api/upload/route.ts
//
// Accepts multipart/form-data with a single "file" field.
// Returns: { url: string }
//
// ── SWAP GUIDE ────────────────────────────────────────────────────────────────
// To use Cloudflare R2 / AWS S3: replace the saveFile() body with your
// PutObjectCommand / R2 SDK call and return the public CDN URL.
// To use UploadThing: delete this file and use their Next.js adapter instead.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { nanoid } from "nanoid";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

async function saveFile(file: File): Promise<string> {
  // ── LOCAL DEV: writes to /public/uploads ──────────────────────────────────
  // Replace this block with your cloud storage call in production.
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const ext      = file.name.split(".").pop() ?? "pdf";
  const fileName = `${nanoid()}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), buffer);

  // Return a publicly accessible URL
  return `${process.env.NEXT_PUBLIC_APP_URL}/uploads/${fileName}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and Word documents are accepted." },
        { status: 415 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File must be under ${MAX_SIZE_MB} MB.` },
        { status: 413 },
      );
    }

    const url = await saveFile(file);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}