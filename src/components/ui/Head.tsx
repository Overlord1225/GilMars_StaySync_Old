import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SITE_NAME, canonicalUrl, isIndexablePath } from "@/lib/seo";
import { SITE_URL } from "@/lib/siteUrl";

type HeadProps = {
  title?: string;
  description?: string;
  /** Absolute URL; defaults to the site og-image. */
  image?: string;
  /** Override the default: only public marketing paths are indexed. */
  noindex?: boolean;
  /** schema.org structured data for the page. */
  jsonLd?: object;
  children?: ReactNode;
};

const DEFAULT_TITLE = SITE_NAME;
const DEFAULT_DESCRIPTION =
  "Browse GilMars stays, check availability, and manage your reservation with StaySync.";
function upsert(selector: string, create: () => HTMLElement): HTMLElement {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

function setMeta(name: string, value: string) {
  upsert(`meta[name="${name}"]`, () => {
    const el = document.createElement("meta");
    el.setAttribute("name", name);
    return el;
  }).setAttribute("content", value);
}

function setProperty(property: string, value: string) {
  upsert(`meta[property="${property}"]`, () => {
    const el = document.createElement("meta");
    el.setAttribute("property", property);
    return el;
  }).setAttribute("content", value);
}

function setCanonical(href: string) {
  upsert('link[rel="canonical"]', () => {
    const el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    return el;
  }).setAttribute("href", href);
}

export function Head({
  title,
  description,
  image,
  noindex,
  jsonLd,
  children,
}: HeadProps) {
  const { pathname } = useLocation();
  const pageTitle = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
  const pageDescription = description ?? DEFAULT_DESCRIPTION;
  const pageUrl = canonicalUrl(SITE_URL, pathname) || `${SITE_URL}/`;
  const pageImage = image ?? `${SITE_URL}/og-image.png`;
  const hidden = noindex ?? !isIndexablePath(pathname);
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    document.title = pageTitle;
    setMeta("description", pageDescription);
    setMeta("robots", hidden ? "noindex, nofollow" : "index, follow");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", pageTitle);
    setMeta("twitter:description", pageDescription);
    setMeta("twitter:image", pageImage);
    setProperty("og:title", pageTitle);
    setProperty("og:description", pageDescription);
    setProperty("og:type", "website");
    setProperty("og:url", pageUrl);
    setProperty("og:site_name", SITE_NAME);
    setProperty("og:image", pageImage);
    setCanonical(pageUrl);
  }, [pageTitle, pageDescription, pageUrl, pageImage, hidden]);

  useEffect(() => {
    if (!jsonLdText) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = jsonLdText;
    document.head.appendChild(script);
    return () => script.remove();
  }, [jsonLdText]);

  return <>{children}</>;
}
