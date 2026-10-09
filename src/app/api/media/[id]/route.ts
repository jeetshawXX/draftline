
import { unlink } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { cleanPlainText } from "@/lib/sanitize";
import { uploadDirectory } from "@/lib/uploads";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
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

  const { id } = await params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = z
    .object({ altText: z.string().max(300) })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Alt text must be under 300 characters." },
      { status: 400 },
    );
  }

  const media = await prisma.media
    .update({
      where: { id },
      data: {
        altText: cleanPlainText(parsed.data.altText, 300),
      },
    })
    .catch(() => null);

  if (!media) {
    return NextResponse.json(
      { error: "Media item not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ media });
}

export async function DELETE(request: NextRequest, { params }: Params) {
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

  const { id } = await params;
  const media = await prisma.media.findUnique({ where: { id } });

  if (!media) {
    return NextResponse.json(
      { error: "Media item not found." },
      { status: 404 },
    );
  }

  if (media.url.startsWith("https://res.cloudinary.com/")) {
    const publicId = `draftline/${media.filename.replace(/\.(jpg|png|webp|gif)$/i, "")}`;

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });

      if (result.result !== "ok" && result.result !== "not found") {
        return NextResponse.json(
          { error: "Could not delete the image from cloud storage." },
          { status: 502 },
        );
      }
    } catch (error) {
      console.error("Cloudinary deletion failed:", error);

      return NextResponse.json(
        { error: "Could not delete the image from cloud storage." },
        { status: 502 },
      );
    }
  } else {
    try {
      await unlink(path.join(uploadDirectory(), media.filename));
    } catch {
      // Continue if a legacy local image file is already missing.
    }
  }

  await prisma.media.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
