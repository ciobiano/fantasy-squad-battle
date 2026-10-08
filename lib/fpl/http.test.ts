import { describe, expect, it, vi } from "vitest";
import { FplHttpError, fplFetch, resolveFplUrl } from "./http";

const json = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const noSleep = () => Promise.resolve();

describe("resolveFplUrl", () => {
  it("resolves relative paths under /api/", () => {
    expect(resolveFplUrl("bootstrap-static/").href).toBe(
      "https://fantasy.premierleague.com/api/bootstrap-static/",
    );
  });

  it.each(["https://evil.example/api/", "//evil.example/x", "/admin/", "../login/"])(
    "refuses %s",
    (path) => {
      expect(() => resolveFplUrl(path)).toThrow(FplHttpError);
    },
  );
});

describe("fplFetch", () => {
  it("returns parsed JSON and sends browser-like headers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(200, { events: [] }));

    await expect(fplFetch("bootstrap-static/", { fetchImpl })).resolves.toEqual({ events: [] });

    const headers = fetchImpl.mock.calls[0][1].headers as Headers;
    expect(headers.get("User-Agent")).toMatch(/Mozilla/);
    expect(headers.get("Referer")).toBe("https://fantasy.premierleague.com/");
  });

  it("lets a request override a default header", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(200));

    await fplFetch("bootstrap-static/", { fetchImpl, init: { headers: { Accept: "text/json" } } });

    const headers = fetchImpl.mock.calls[0][1].headers as Headers;
    expect(headers.get("Accept")).toBe("text/json");
    expect(headers.get("User-Agent")).toMatch(/Mozilla/);
  });

  it("retries a blocked request with backoff, then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json(403))
      .mockResolvedValueOnce(json(503))
      .mockResolvedValueOnce(json(200, { ok: true }));
    const sleep = vi.fn<(ms: number) => Promise<void>>(noSleep);

    await expect(fplFetch("fixtures/", { fetchImpl, sleep, baseDelayMs: 100 })).resolves.toEqual({
      ok: true,
    });
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([100, 200]);
  });

  it("retries network errors", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(json(200, [1]));

    await expect(fplFetch("fixtures/", { fetchImpl, sleep: noSleep })).resolves.toEqual([1]);
  });

  it("gives up after the retry budget with the last status", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(503));

    const error = await fplFetch("fixtures/", { fetchImpl, sleep: noSleep, retries: 2 }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(FplHttpError);
    expect((error as FplHttpError).status).toBe(503);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("does not retry a 404", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(404));

    await expect(fplFetch("entry/0/history/", { fetchImpl, sleep: noSleep })).rejects.toMatchObject({
      status: 404,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
