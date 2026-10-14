import { describe, expect, it, vi } from "vitest";
import { createImageCache, shareCard, xComposeUrl, type ShareEnv } from "./share";

const PNG = new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" });
const input = {
  url: "/cards/314/5/oga?format=status&theme=dark&lang=pcm",
  filename: "squad-battle-gw5-oga-status.png",
  target: "status" as const,
  pageUrl: "https://fantasysquadbattle.vercel.app/s/314/5",
};

function phone(overrides: Partial<ShareEnv> = {}) {
  const env = {
    canShareFiles: vi.fn(() => true),
    share: vi.fn(async () => {}),
    download: vi.fn(),
    open: vi.fn(),
    ...overrides,
  };
  return env;
}
const computer = () => phone({ canShareFiles: vi.fn(() => false) });

async function readyCache() {
  const cache = createImageCache(async () => PNG);
  await cache.load(input.url);
  return cache;
}

const domError = (name: string) => new DOMException("", name);

describe("shareCard on a phone", () => {
  it("hands the phone's share sheet the image alone: no text, no link", async () => {
    const share = vi.fn(async (_data: { files: File[] }) => {});
    const env = phone({ share });
    expect(await shareCard(input, await readyCache(), env)).toBe("shared");
    const [data] = share.mock.calls[0];
    expect(Object.keys(data)).toEqual(["files"]);
    expect(data.files[0]).toMatchObject({ name: input.filename, type: "image/png" });
    expect(env.download).not.toHaveBeenCalled();
  });

  it("does nothing more when they close the share sheet", async () => {
    const env = phone({ share: vi.fn(async () => Promise.reject(domError("AbortError"))) });
    expect(await shareCard(input, await readyCache(), env)).toBe("cancelled");
    expect(env.download).not.toHaveBeenCalled();
  });

  it("asks for a second tap when the image arrived after the tap went stale", async () => {
    const cache = createImageCache(async () => PNG);
    const env = phone({ share: vi.fn(async () => Promise.reject(domError("NotAllowedError"))) });
    expect(await shareCard(input, cache, env)).toBe("tap-again");
    // Now the image is ready, so the next tap shares inside the tap.
    expect(cache.ready(input.url)).toBe(PNG);
  });

  it("saves the image when the phone refuses to share it", async () => {
    const env = phone({ share: vi.fn(async () => Promise.reject(domError("NotAllowedError"))) });
    expect(await shareCard(input, await readyCache(), env)).toBe("downloaded");
    expect(env.download).toHaveBeenCalledWith(input.url, input.filename);
  });

  it("reports an image that couldn't be fetched, and fetches again on the next tap", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(PNG);
    const cache = createImageCache(load);
    const env = phone();
    expect(await shareCard(input, cache, env)).toBe("failed");
    expect(await shareCard(input, cache, env)).toBe("shared");
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe("shareCard on a computer", () => {
  it("saves the Status image", async () => {
    const env = computer();
    expect(await shareCard(input, createImageCache(async () => PNG), env)).toBe("downloaded");
    expect(env.download).toHaveBeenCalledWith(input.url, input.filename);
    expect(env.open).not.toHaveBeenCalled();
  });

  it("saves the X image and opens X's composer with the league's page", async () => {
    const env = computer();
    const x = { ...input, target: "x" as const, filename: "squad-battle-gw5-oga-x.png" };
    expect(await shareCard(x, createImageCache(async () => PNG), env)).toBe("downloaded");
    expect(env.open).toHaveBeenCalledWith("https://x.com/intent/post?url=https%3A%2F%2Ffantasysquadbattle.vercel.app%2Fs%2F314%2F5");
    expect(xComposeUrl(input.pageUrl)).toContain(encodeURIComponent(input.pageUrl));
  });
});

describe("createImageCache", () => {
  it("fetches each image once", async () => {
    const load = vi.fn(async () => PNG);
    const cache = createImageCache(load);
    cache.prefetch(input.url);
    cache.prefetch(input.url);
    await cache.load(input.url);
    expect(load).toHaveBeenCalledTimes(1);
    expect(cache.ready(input.url)).toBe(PNG);
  });
});
