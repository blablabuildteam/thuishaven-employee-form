import { put, del, get } from "@vercel/blob";

export async function uploadPrivatePdf(opts: {
  pathname: string;
  buffer: Buffer;
}): Promise<{ url: string; pathname: string }> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN ontbreekt");
  }
  const blob = await put(opts.pathname, opts.buffer, {
    access: "private",
    contentType: "application/pdf",
    allowOverwrite: true,
  });
  return { url: blob.url, pathname: blob.pathname };
}

export async function deletePrivateBlob(pathname: string | null | undefined) {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !pathname) return;
  try {
    await del(pathname);
  } catch {
    // Best-effort cleanup.
  }
}

export async function readPrivateBlob(
  pathname: string,
): Promise<{ stream: ReadableStream; statusCode: number } | null> {
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return { stream: result.stream, statusCode: result.statusCode };
}

export async function readPrivateBlobBuffer(
  pathname: string,
): Promise<Buffer | null> {
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const chunks: Uint8Array[] = [];
  const reader = result.stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}
