import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readPrivateBlob } from "@/lib/contracts/blob";

const KINDS = {
  contract: {
    pathname: (c: { contractPdfPathname: string | null }) => c.contractPdfPathname,
    filename: "oproepovereenkomst.pdf",
  },
  reglement: {
    pathname: (c: { reglementPdfPathname: string | null }) =>
      c.reglementPdfPathname,
    filename: "huishoudelijk-reglement.pdf",
  },
  signed: {
    pathname: (c: { fullySignedPdfPathname: string | null }) =>
      c.fullySignedPdfPathname,
    filename: "oproepovereenkomst-getekend.pdf",
  },
} as const;

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; contractId: string }>;
  },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, contractId } = await params;
  const kindParam = new URL(request.url).searchParams.get("kind") ?? "signed";
  const kind = kindParam as keyof typeof KINDS;
  if (!(kind in KINDS)) {
    return NextResponse.json({ error: "Onbekend document" }, { status: 400 });
  }

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, employeeId: id },
  });
  if (!contract) {
    return NextResponse.json({ error: "Contract niet gevonden" }, { status: 404 });
  }

  const pathname = KINDS[kind].pathname(contract);
  if (!pathname) {
    return NextResponse.json({ error: "Document nog niet beschikbaar" }, { status: 404 });
  }

  try {
    const blob = await readPrivateBlob(pathname);
    if (!blob) {
      return NextResponse.json({ error: "Document niet beschikbaar" }, { status: 404 });
    }
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `inline; filename="${KINDS[kind].filename}"`,
    );
    headers.set("Cache-Control", "private, no-store");
    return new NextResponse(blob.stream, { headers });
  } catch (error) {
    console.error("Contract PDF download failed:", error);
    return NextResponse.json({ error: "Download mislukt" }, { status: 500 });
  }
}
