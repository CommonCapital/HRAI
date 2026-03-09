import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

async function saveFile(file: File): Promise<string> {
  const ext      = file.name.split(".").pop() ?? "pdf";
  const fileName = `${nanoid()}.${ext}`;

  const blob = await put(fileName, file, {
    access: "public",
  });

  return blob.url;
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