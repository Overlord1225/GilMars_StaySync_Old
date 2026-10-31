export function storagePathFromPublicUrl(
  publicUrl: string,
  bucketSegment = "unit-images",
): string | null {
  if (typeof publicUrl !== "string" || !publicUrl) return null;
  let path: string;
  try {
    path = new URL(publicUrl).pathname;
  } catch {
    // Fall back to a simple split for non-URL strings (e.g. relative paths)
    path = publicUrl;
  }
  const parts = path.split("/");
  const idx = parts.indexOf(bucketSegment);
  if (idx === -1 || idx >= parts.length - 1) return null;
  return parts.slice(idx + 1).join("/");
}
