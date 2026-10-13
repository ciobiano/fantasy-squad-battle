// The site's own address, for absolute URLs in link previews (Open Graph, X).
// Production uses its domain; previews use their deployment URL; locally, the dev server.
function siteUrl(): string {
  const { VERCEL_ENV, VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL } = process.env;
  if (VERCEL_ENV === "production" && VERCEL_PROJECT_PRODUCTION_URL) return `https://${VERCEL_PROJECT_PRODUCTION_URL}`;
  if (VERCEL_URL) return `https://${VERCEL_URL}`;
  return "http://localhost:3000";
}

export const SITE_URL = new URL(siteUrl());
