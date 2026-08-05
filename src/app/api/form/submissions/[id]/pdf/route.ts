import { NextResponse } from "next/server";
import { verifySubmissionDownloadToken } from "@/lib/pdf/download-token";
import { buildSubmissionPdf } from "@/lib/pdf/build-submission-pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token");

  if (!token || !verifySubmissionDownloadToken(id, token)) {
    return NextResponse.json(
      { error: "Ongeldige of verlopen downloadlink" },
      { status: 403 },
    );
  }

  const result = await buildSubmissionPdf(id);
  if (!result) {
    return NextResponse.json(
      { error: "Inzending niet gevonden" },
      { status: 404 },
    );
  }

  if (result.submission.pdfUrl) {
    return NextResponse.redirect(result.submission.pdfUrl);
  }

  return new NextResponse(new Uint8Array(result.pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
