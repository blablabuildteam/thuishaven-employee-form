import type SignatureCanvas from "react-signature-canvas";

export { isValidSignatureDataUrl } from "@/lib/signatures/validate";

export function exportSignatureDataUrl(
  sig: SignatureCanvas,
  maxWidth = 480,
): string {
  if (sig.isEmpty()) return "";

  let source: HTMLCanvasElement;
  try {
    const trimmed = sig.getTrimmedCanvas();
    if (trimmed.width > 0 && trimmed.height > 0) {
      source = trimmed;
    } else {
      source = sig.getCanvas();
    }
  } catch {
    source = sig.getCanvas();
  }

  const scale = Math.min(1, maxWidth / Math.max(source.width, 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    return sig.toDataURL("image/png");
  }
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}
