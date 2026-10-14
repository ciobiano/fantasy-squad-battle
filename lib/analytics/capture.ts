import { createHash } from "node:crypto";
import { after } from "next/server";
import type { EventName, EventProps } from "./events";

// Server-side analytics: events go from our server to PostHog's EU capture API
// after the response is sent, so they cost visitors no JavaScript and no time.
//
// Cookieless (no consent banner): a visitor is a hash of IP address, browser
// and today's date with a secret salt. It changes every day, so nobody can be
// followed from one day to the next, and the IP never leaves our server. The
// country comes from Vercel's own header instead of PostHog's IP lookup.

export interface AnalyticsConfig {
  /** PostHog project API key (phc_…). */
  readonly key: string;
  readonly host: string;
  /** Secret mixed into visitor hashes. */
  readonly salt: string;
}

/** Analytics is off (a no-op) unless both the PostHog key and the salt are set. */
export function analyticsConfig(env: Record<string, string | undefined> = process.env): AnalyticsConfig | null {
  const key = env.POSTHOG_KEY?.trim();
  const salt = env.ANALYTICS_SALT?.trim();
  if (!key || !salt) return null;
  return { key, salt, host: env.POSTHOG_HOST?.trim() || "https://eu.i.posthog.com" };
}

/** What we keep from a request: enough to count it, nothing sent on as is. */
export interface RequestContext {
  readonly ip: string;
  readonly userAgent: string;
  /** Two-letter country code from Vercel, or null. */
  readonly country: string | null;
  /** Bots, link previews and prefetches aren't visits. */
  readonly skip: boolean;
}

const BOTS = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|curl|wget|python|node-fetch|undici/i;

export function requestContext(headers: Headers): RequestContext {
  const userAgent = headers.get("user-agent") ?? "";
  const prefetch =
    headers.get("next-router-prefetch") === "1" ||
    headers.get("purpose") === "prefetch" ||
    (headers.get("sec-purpose") ?? "").includes("prefetch");
  const ip = headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const country = headers.get("x-vercel-ip-country");
  return {
    ip,
    userAgent,
    country: country && /^[A-Z]{2}$/.test(country) ? country : null,
    skip: prefetch || !userAgent || BOTS.test(userAgent),
  };
}

/** Today's anonymous visitor ID: the same all day for one phone, different tomorrow. */
export function visitorId(context: RequestContext, salt: string, now: number): string {
  const day = new Date(now).toISOString().slice(0, 10);
  return createHash("sha256").update(`${salt}|${day}|${context.ip}|${context.userAgent}`).digest("hex").slice(0, 32);
}

/** Sends one event to PostHog. Never throws: analytics must never break a page. */
export async function capture<E extends EventName>(
  event: E,
  props: EventProps[E],
  context: RequestContext,
  options: { config?: AnalyticsConfig | null; now?: number; send?: typeof fetch } = {},
): Promise<boolean> {
  const { config = analyticsConfig(), now = Date.now(), send = fetch } = options;
  if (!config || context.skip) return false;
  const body = {
    api_key: config.key,
    event,
    distinct_id: visitorId(context, config.salt, now),
    timestamp: new Date(now).toISOString(),
    properties: {
      ...props,
      country: context.country,
      // Filter previews and local runs out in PostHog.
      environment: process.env.VERCEL_ENV ?? "development",
      $process_person_profile: false,
      $geoip_disable: true,
      $lib: "fsb-server",
    },
  };
  try {
    const response = await send(`${config.host}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) console.warn(`[analytics] ${event} not counted: PostHog answered ${response.status}`);
    return response.ok;
  } catch (failure) {
    console.warn(`[analytics] ${event} not counted`, failure);
    return false;
  }
}

/**
 * Counts an event once the response has gone out. Pass the request's headers:
 * read them where the request is read (routes), before this runs.
 */
export function trackServer<E extends EventName>(event: E, props: EventProps[E], headers: Headers): void {
  const context = requestContext(headers);
  if (context.skip || !analyticsConfig()) return;
  after(() => capture(event, props, context).then(() => undefined));
}
