// Files the card renderer needs, read once when the module loads (they don't
// depend on the request):
// - Inter 400/600/700 in Latin and Latin Extended (OFL, assets/fonts/LICENSE-Inter.txt)
// - the grain tile from scripts/make-grain.mjs
// - the award emoji as Noto SVGs (OFL, assets/emoji/LICENSE-Noto-Emoji.txt). Bundled
//   because the CDN set behind next/og's emoji option lacks newer ones (🫠), and it
//   saves a network fetch per card.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { AwardKey } from "../types";

const asset = (...parts: string[]) => readFile(join(process.cwd(), "assets", ...parts));

const WEIGHTS = [400, 600, 700] as const;
const SUBSETS = ["latin", "latin-ext"] as const;

const files = await Promise.all(
  WEIGHTS.flatMap((weight) =>
    SUBSETS.map(async (subset) => ({ weight, data: await asset("fonts", `inter-${subset}-${weight}-normal.woff`) })),
  ),
);

export const CARD_FONTS = files.map(({ weight, data }) => ({
  name: "Inter",
  data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer,
  weight,
  style: "normal" as const,
}));

const grain = await asset("grain.png");
export const GRAIN_URL = `data:image/png;base64,${grain.toString("base64")}`;

const EMOJI_FILES: Record<AwardKey, string> = {
  oga: "1f451", climber: "1f4c8", captain: "1fae0", bench: "1fa91",
  hits: "1f4b8", middle: "1f6cb", faller: "1f4c9", spoon: "1f944",
};

export const AWARD_EMOJI_URL = Object.fromEntries(
  await Promise.all(
    Object.entries(EMOJI_FILES).map(async ([award, code]) => {
      const svg = await asset("emoji", `emoji_u${code}.svg`);
      return [award, `data:image/svg+xml;base64,${svg.toString("base64")}`] as const;
    }),
  ),
) as Record<AwardKey, string>;
