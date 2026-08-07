import { del, put } from "@vercel/blob";

export const ID_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export const ID_DOCUMENT_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.jpg,.jpeg,.png,.webp,.heic,.pdf";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const EXT_TO_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
};

export type IdDocumentValidationError =
  | "missing"
  | "too_large"
  | "invalid_type";

export function validateIdDocumentFile(
  file: File | null | undefined,
): { ok: true; contentType: string } | { ok: false; error: IdDocumentValidationError } {
  if (!file || file.size === 0) {
    return { ok: false, error: "missing" };
  }
  if (file.size > ID_DOCUMENT_MAX_BYTES) {
    return { ok: false, error: "too_large" };
  }

  const contentType = resolveContentType(file);
  if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
    return { ok: false, error: "invalid_type" };
  }

  return { ok: true, contentType };
}

export function idDocumentErrorMessage(error: IdDocumentValidationError): string {
  switch (error) {
    case "missing":
      return "Upload een kopie van je paspoort of ID-kaart.";
    case "too_large":
      return "Bestand is te groot (max. 10 MB).";
    case "invalid_type":
      return "Alleen JPG, PNG, WEBP, HEIC of PDF is toegestaan.";
  }
}

function resolveContentType(file: File): string | null {
  if (file.type && ALLOWED_CONTENT_TYPES.has(file.type)) {
    return file.type;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext ? EXT_TO_TYPE[ext] ?? null : null;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "id-document";
}

export async function uploadIdentityDocument(opts: {
  file: File;
  contentType: string;
  bsn: string;
}): Promise<{
  blobUrl: string;
  pathname: string;
  contentType: string;
  originalName: string;
  sizeBytes: number;
}> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN ontbreekt");
  }

  const safeName = sanitizeFilename(opts.file.name);
  const pathname = `identity-documents/${opts.bsn}/${Date.now()}-${safeName}`;

  const blob = await put(pathname, opts.file, {
    access: "private",
    contentType: opts.contentType,
    multipart: opts.file.size > 4 * 1024 * 1024,
  });

  return {
    blobUrl: blob.url,
    pathname: blob.pathname,
    contentType: opts.contentType,
    originalName: opts.file.name.slice(0, 200),
    sizeBytes: opts.file.size,
  };
}

/** Best-effort cleanup of a private ID-document blob. */
export async function deleteIdentityDocumentBlob(pathname: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !pathname) return;
  try {
    await del(pathname);
  } catch {
    // Blob may already be gone; DB cleanup should still proceed.
  }
}
