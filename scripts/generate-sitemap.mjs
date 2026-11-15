// Writes public/sitemap.xml: static public pages plus every active unit.
// Falls back to the static pages when Supabase is unreachable (CI uses dummy env).
import { writeFileSync } from "node:fs";

const SITE_URL = (
  process.env.VITE_SITE_URL || "https://gil-mars-stay-sync-old.vercel.app"
).replace(/\/+$/, "");
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const staticPaths = [
  "/",
  "/units",
  "/help",
  "/house-rules",
  "/cancellation-policy",
  "/terms",
  "/privacy",
];

async function fetchUnits() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/units?select=id,updated_at&is_active=eq.true`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`sitemap: units skipped (${error.message})`);
    return [];
  }
}

const units = await fetchUnits();
const entries = [
  ...staticPaths.map((path) => ({
    loc: `${SITE_URL}${path === "/" ? "/" : path}`,
  })),
  ...units.map((unit) => ({
    loc: `${SITE_URL}/units/${encodeURIComponent(unit.id)}`,
    lastmod: unit.updated_at?.slice(0, 10),
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</url>`,
  )
  .join("\n")}
</urlset>
`;
writeFileSync(new URL("../public/sitemap.xml", import.meta.url), xml);
console.log(`sitemap: ${entries.length} urls`);
