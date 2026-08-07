import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.identityDocument.findUnique({
    where: { employeeId: id },
  });

  if (!document) {
    return NextResponse.json(
      { error: "Geen ID-document gevonden" },
      { status: 404 },
    );
  }

  try {
    const result = await get(document.pathname, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json(
        { error: "Document niet beschikbaar" },
        { status: 404 },
      );
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      document.contentType || "application/octet-stream",
    );
    headers.set(
      "Content-Disposition",
      `inline; filename="${document.originalName.replace(/"/g, "")}"`,
    );
    headers.set("Cache-Control", "private, no-store");

    return new NextResponse(result.stream, { headers });
  } catch (error) {
    console.error("ID document download failed:", error);
    return NextResponse.json(
      { error: "Download mislukt" },
      { status: 500 },
    );
  }
}
