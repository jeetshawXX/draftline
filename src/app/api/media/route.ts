
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { cleanPlainText } from "@/lib/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function matchesSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (type === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }

  if (type === "image/gif") {
    return String.fromCharCode(...bytes.slice(0, 6)).startsWith("GIF8");
  }

  if (type === "image/webp") {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }

  return false;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if (auth.response || !auth.user) {
    return (
      auth.response ??
      NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      )
    );
  }

  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      filename: true,
      originalName: true,
      mimeType: true,
      size: true,
      url: true,
      altText: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ media });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);

  if (auth.response || !auth.user) {
    return (
      auth.response ??
      NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      )
    );
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Choose an image to upload." },
      { status: 400 },
    );
  }

  const maxMb = Math.max(
    1,
    Math.min(10, Number(process.env.UPLOAD_MAX_MB || 5)),
  );

  if (file.size <= 0 || file.size > maxMb * 1024 * 1024) {
    return NextResponse.json(
      { error: `Image must be smaller than ${maxMb}MB.` },
      { status: 413 },
    );
  }

  const extension = extensions[file.type];

  if (!extension) {
    return NextResponse.json(
      { error: "Allowed formats: JPG, PNG, WEBP, and GIF." },
      { status: 415 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!matchesSignature(file.type, buffer)) {
    return NextResponse.json(
      {
        error: "The file contents do not match the selected image type.",
      },
      { status: 415 },
    );
  }

  const id = randomUUID();
  const filename = `${id}.${extension}`;

  try {
    const uploaded = await cloudinary.uploader.upload(
      `data:${file.type};base64,${buffer.toString("base64")}`,
      {
        folder: "draftline",
        public_id: id,
        resource_type: "image",
        overwrite: false,
      },
    );

    const media = await prisma.media.create({
      data: {
        filename,
        originalName: cleanPlainText(file.name, 200) || filename,
        mimeType: file.type,
        size: buffer.byteLength,
        url: uploaded.secure_url,
        altText: cleanPlainText(form.get("altText"), 300),
        uploadedById: auth.user.id,
      },
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    console.error("Media upload failed:", error);

    return NextResponse.json(
      { error: "Image upload failed. Please try again." },
      { status: 500 },
    );
  }
}
