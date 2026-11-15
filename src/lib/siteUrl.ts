import { normalizeSiteUrl } from "./seo";

/** Public origin used for canonical, Open Graph and structured data URLs. */
export const SITE_URL = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);
