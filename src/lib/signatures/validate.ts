export function isValidSignatureDataUrl(
  value: string | null | undefined,
): boolean {
  return (
    typeof value === "string" &&
    value.startsWith("data:image/") &&
    value.length > 100
  );
}
