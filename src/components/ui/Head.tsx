import { useEffect, useState, type ReactNode } from "react";

type HeadProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
};

const DEFAULT_TITLE = "GilMars StaySync";
const DEFAULT_DESCRIPTION = "Browse GilMars stays, check availability, and manage your reservation with StaySync.";
const SITE_NAME = "GilMars StaySync";
const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://staysync.gilmars.example";

export function Head({ title, description, children }: HeadProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const pageTitle = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
  const pageDescription = description ?? DEFAULT_DESCRIPTION;

  document.title = pageTitle;

  function setMeta(name: string, value: string) {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  }

  function setProperty(property: string, value: string) {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", property);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  }

  setMeta("description", pageDescription);
  setProperty("og:title", pageTitle);
  setProperty("og:description", pageDescription);
  setProperty("og:type", "website");
  setProperty("og:url", SITE_URL);
  setProperty("og:site_name", SITE_NAME);
  setProperty("og:image", `${SITE_URL}/og-image.png`);

  return <>{children}</>;
}