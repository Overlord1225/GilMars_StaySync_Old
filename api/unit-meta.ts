// Serves Open Graph tags for /units/:id to social crawlers, which do not run JavaScript.
// vercel.json rewrites only crawler user agents here; people get the normal SPA.
const SITE_URL = (
  process.env.VITE_SITE_URL || "https://gil-mars-stay-sync-old.vercel.app"
).replace(/\/+$/, "");
const SITE_NAME = "GilMars StaySync";

type UnitRow = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  price_per_night: number;
  image_urls: string[];
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

async function fetchUnit(id: string): Promise<UnitRow | null> {
  const base = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !key) return null;
  const res = await fetch(
    `${base}/rest/v1/units?select=id,name,description,capacity,price_per_night,image_urls&is_active=eq.true&id=eq.${encodeURIComponent(id)}`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    },
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as UnitRow[];
  return rows[0] ?? null;
}

function page(status: number, html: string): Response {
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const id = new URL(request.url).searchParams.get("id") ?? "";
    let unit: UnitRow | null = null;
    try {
      unit = id ? await fetchUnit(id) : null;
    } catch {
      unit = null;
    }

    if (!unit) {
      return page(
        404,
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Stay not found · ${SITE_NAME}</title></head><body><a href="${SITE_URL}/units">Browse stays</a></body></html>`,
      );
    }

    const url = `${SITE_URL}/units/${encodeURIComponent(unit.id)}`;
    const title = `${unit.name} · ${SITE_NAME}`;
    const description = clip(
      unit.description?.trim() ||
        `Book ${unit.name} directly with GilMars. Sleeps ${unit.capacity}, from PHP ${unit.price_per_night} per night.`,
      200,
    );
    const image = unit.image_urls.find(Boolean) ?? `${SITE_URL}/og-image.png`;

    return page(
      200,
      `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
</head>
<body><h1>${esc(unit.name)}</h1><p>${esc(description)}</p><a href="${esc(url)}">View stay</a></body>
</html>`,
    );
  },
};
