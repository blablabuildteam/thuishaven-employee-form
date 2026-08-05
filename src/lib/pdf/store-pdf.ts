/**
 * V1: No blob storage — PDFs are generated on-the-fly per request.
 * This module provides a placeholder for future integration with @vercel/blob.
 */
export async function storePDF(
  _buffer: Buffer,
  _filename: string,
): Promise<string | null> {
  return null;
}
