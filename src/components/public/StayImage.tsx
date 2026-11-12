import { useState } from "react";
import { BrandMark } from "@/components/ui/BrandMark";

/** One frame ratio per image role (tokens in index.css: --aspect-*). */
const ratioClass = {
  hero: "aspect-hero w-full",
  card: "aspect-card w-full",
  gallery: "aspect-gallery w-full",
  thumb: "aspect-thumb w-full",
} as const;

export function StayImage({
  src,
  alt,
  className = "",
  priority = false,
  fit = "cover",
  ratio,
}: {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  /** Sizes the frame itself. Omit when a parent already owns the box. */
  ratio?: keyof typeof ratioClass;
}) {
  const [status, setStatus] = useState<{
    src?: string;
    loaded: boolean;
    failed: boolean;
  }>({ loaded: false, failed: false });
  const loaded = status.src === src && status.loaded;
  const failed = status.src === src && status.failed;
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  if (ratio) className = `${ratioClass[ratio]} ${className}`;
  if (!src || failed)
    return (
      <div
        role="img"
        aria-label={
          src ? `${alt} photo unavailable` : `${alt}, photo coming soon`
        }
        className={`flex flex-col items-center justify-center gap-2 overflow-hidden bg-brand-light px-4 text-center text-xs font-medium text-ink-muted ${className}`}
      >
        <BrandMark className="h-1/4 max-h-14 min-h-6 w-auto opacity-30" />
        <span aria-hidden="true">Photo coming soon</span>
      </div>
    );
  return (
    <div className={`relative overflow-hidden bg-brand-light ${className}`}>
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-rule motion-reduce:animate-none"
        />
      )}
      <img
        src={src}
        alt={alt}
        width="1200"
        height="900"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setStatus({ src, loaded: true, failed: false })}
        onError={() => setStatus({ src, loaded: false, failed: true })}
        className={`size-full ${fitClass} transition-[opacity,transform] duration-media ease-ui group-hover:scale-[1.04] group-focus-visible:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
