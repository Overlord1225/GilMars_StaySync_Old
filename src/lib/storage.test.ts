import { describe, expect, it } from "vitest";
import { storagePathFromPublicUrl } from "./storage";

describe("storagePathFromPublicUrl", () => {
  it("extracts the object path from a public Supabase URL", () => {
    expect(
      storagePathFromPublicUrl(
        "https://xyz.supabase.co/storage/v1/object/public/unit-images/foo/bar.jpg",
      ),
    ).toBe("foo/bar.jpg");
  });

  it("extracts a top-level object path", () => {
    expect(
      storagePathFromPublicUrl(
        "https://xyz.supabase.co/storage/v1/object/public/unit-images/file.jpg",
      ),
    ).toBe("file.jpg");
  });

  it("returns null when the bucket segment is absent", () => {
    expect(
      storagePathFromPublicUrl(
        "https://xyz.supabase.co/storage/v1/object/public/other/file.jpg",
      ),
    ).toBeNull();
  });

  it("returns null for empty or non-string input", () => {
    expect(storagePathFromPublicUrl("")).toBeNull();
    expect(storagePathFromPublicUrl(undefined as unknown as string)).toBeNull();
  });

  it("returns null when the bucket is the last path segment", () => {
    expect(
      storagePathFromPublicUrl(
        "https://xyz.supabase.co/storage/v1/object/public/unit-images",
      ),
    ).toBeNull();
  });

  it("supports a custom bucket segment", () => {
    expect(
      storagePathFromPublicUrl(
        "https://xyz.supabase.co/storage/v1/object/public/avatars/a.png",
        "avatars",
      ),
    ).toBe("a.png");
  });
});
