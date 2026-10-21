import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/signal/route";
import { analyticsConfig, capture, requestContext, visitorId } from "./capture";
import { track } from "./client";
import { EVENT_SCHEMAS, parseClientEvent } from "./events";

const after = vi.hoisted(() => vi.fn());
vi.mock("next/server", () => ({ after }));

const CONFIG = { key: "phc_test", host: "https://eu.i.posthog.com", salt: "pepper" };
const PHONE = "Mozilla/5.0 (Linux; Android 14; SM-A145F) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36";
const NOW = Date.parse("2026-10-15T09:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

const headersOf = (extra: Record<string, string> = {}) =>
  new Headers({ "user-agent": PHONE, "x-real-ip": "102.89.1.2", "x-vercel-ip-country": "NG", ...extra });

const shared = { league: "314", gw: 5, award: "oga", format: "status", language: "pcm" } as const;

describe("who counts as a visitor", () => {
  const phone = requestContext(headersOf());

  it("is the same phone all day and a stranger tomorrow", () => {
    expect(visitorId(phone, "pepper", NOW)).toBe(visitorId(phone, "pepper", NOW + 60_000));
    expect(visitorId(phone, "pepper", NOW)).not.toBe(visitorId(phone, "pepper", NOW + DAY));
    expect(visitorId(phone, "pepper", NOW)).not.toBe(visitorId(phone, "salt", NOW));
  });

  it("skips bots, link previews and prefetches", () => {
    expect(phone.skip).toBe(false);
    expect(requestContext(headersOf({ "user-agent": "WhatsApp/2.24.1 A" })).skip).toBe(true);
    expect(requestContext(headersOf({ "user-agent": "Twitterbot/1.0" })).skip).toBe(true);
    expect(requestContext(headersOf({ "next-router-prefetch": "1" })).skip).toBe(true);
    expect(requestContext(new Headers()).skip).toBe(true);
  });

  it("reads the country from Vercel, and nothing odd", () => {
    expect(phone.country).toBe("NG");
    expect(requestContext(headersOf({ "x-vercel-ip-country": "<script>" })).country).toBeNull();
  });
});

describe("capture", () => {
  it("is off without a key or a salt", async () => {
    expect(analyticsConfig({ POSTHOG_KEY: "phc_x" })).toBeNull();
    expect(analyticsConfig({ POSTHOG_KEY: "phc_x", ANALYTICS_SALT: "s" })).toEqual({ key: "phc_x", salt: "s", host: "https://eu.i.posthog.com" });
    const send = vi.fn();
    expect(await capture("card_shared", shared, requestContext(headersOf()), { config: null, send })).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it("sends an anonymous event to PostHog EU, without the IP or the browser", async () => {
    const send = vi.fn(async () => new Response(null, { status: 200 }));
    const context = requestContext(headersOf());
    expect(await capture("card_shared", shared, context, { config: CONFIG, now: NOW, send })).toBe(true);
    const [url, init] = send.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://eu.i.posthog.com/i/v0/e/");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      api_key: "phc_test",
      event: "card_shared",
      distinct_id: visitorId(context, "pepper", NOW),
      properties: { ...shared, country: "NG", $process_person_profile: false, $geoip_disable: true },
    });
    expect(String(init.body)).not.toContain("102.89.1.2");
    expect(String(init.body)).not.toContain("Android");
  });

  it("never throws when PostHog is down", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const send = vi.fn(async () => Promise.reject(new Error("offline")));
    expect(await capture("card_shared", shared, requestContext(headersOf()), { config: CONFIG, send })).toBe(false);
    warn.mockRestore();
  });
});

describe("server events", () => {
  it("count every league view, On paper included", () => {
    const loaded = (view: string) => EVENT_SCHEMAS.league_loaded.safeParse({ league: "314", gw: 7, view, language: "pcm" }).success;
    expect(["market", "table", "paper", "share"].every(loaded)).toBe(true);
    expect(loaded("planner")).toBe(false);
  });
});

describe("events from the browser", () => {
  it("accepts only cards seen, shared and downloaded, with exactly their properties", () => {
    expect(parseClientEvent({ event: "card_shared", props: shared })).toEqual({ event: "card_shared", props: shared });
    expect(parseClientEvent({ event: "card_viewed", props: { league: "314", gw: 5, award: "wrap", language: "pcm" } })).not.toBeNull();
    expect(parseClientEvent({ event: "card_viewed", props: { ...shared } })).toBeNull();
    expect(parseClientEvent({ event: "card_downloaded", props: { ...shared, format: "both" } })).not.toBeNull();
    expect(parseClientEvent({ event: "league_loaded", props: { league: "314", gw: 5, view: "market", language: "en" } })).toBeNull();
    expect(parseClientEvent({ event: "card_shared", props: { ...shared, name: "Ade" } })).toBeNull();
    expect(parseClientEvent({ event: "card_shared", props: { ...shared, format: "both" } })).toBeNull();
  });
});

describe("POST /api/signal", () => {
  beforeEach(() => {
    vi.stubEnv("POSTHOG_KEY", "phc_test");
    vi.stubEnv("ANALYTICS_SALT", "pepper");
    after.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  const post = (body: string, headers: Record<string, string> = {}) =>
    POST(
      new Request("https://fsb.example/api/signal", {
        method: "POST",
        body,
        headers: { ...Object.fromEntries(headersOf()), host: "fsb.example", origin: "https://fsb.example", "sec-fetch-site": "same-origin", ...headers },
      }),
    );

  it("counts a share from our own pages after responding", async () => {
    expect((await post(JSON.stringify({ event: "card_shared", props: shared }))).status).toBe(204);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it("refuses other sites, oversized bodies and bad events", async () => {
    expect((await post("{}", { origin: "https://evil.example", "sec-fetch-site": "cross-site" })).status).toBe(403);
    expect((await post("x".repeat(2000))).status).toBe(413);
    expect((await post("not json")).status).toBe(400);
    expect((await post(JSON.stringify({ event: "language_changed", props: { from: null, to: "fr" } }))).status).toBe(400);
    expect(after).not.toHaveBeenCalled();
  });

  it("answers bots without counting them", async () => {
    const res = await post(JSON.stringify({ event: "card_shared", props: shared }), { "user-agent": "Twitterbot/1.0" });
    expect(res.status).toBe(204);
    expect(after).not.toHaveBeenCalled();
  });
});

describe("track (browser)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends a beacon to our own endpoint", () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { sendBeacon });
    track("card_shared", shared);
    expect(sendBeacon).toHaveBeenCalledWith("/api/signal", expect.any(Blob));
  });

  it("falls back to a keepalive fetch, and never throws", () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("navigator", { sendBeacon: () => false });
    vi.stubGlobal("fetch", fetch);
    track("card_shared", shared);
    expect(fetch).toHaveBeenCalledWith("/api/signal", expect.objectContaining({ keepalive: true }));
    vi.stubGlobal("navigator", undefined);
    expect(() => track("card_shared", shared)).not.toThrow();
  });
});
