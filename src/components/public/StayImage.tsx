import { useState } from "react";

export function StayImage({
  src,
  alt,
  className = "",
  priority = false,
  fit = "cover",
}: {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
}) {
  const [status, setStatus] = useState<{
    src?: string;
    loaded: boolean;
    failed: boolean;
  }>({ loaded: false, failed: false });
  const loaded = status.src === src && status.loaded;
  const failed = status.src === src && status.failed;
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  if (!src || failed)
    return (
      <div
        role="img"
        aria-label={
          src ? `${alt} photo unavailable` : `${alt}, photo coming soon`
        }
        className={`flex items-center justify-center bg-sand-light px-4 text-center text-sm text-text-muted ${className}`}
      >
        Photo coming soon
      </div>
    );
  return (
    <div className={`relative overflow-hidden bg-brand-light ${className}`}>
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-border motion-reduce:animate-none"
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
        className={`size-full ${fitClass} transition-opacity duration-ui motion-reduce:transition-none ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
