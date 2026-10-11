// Writes assets/grain.png: a 128×128 tile of monochrome noise. The share cards lay
// it over the Mist sky at low opacity, the same fine grain as the design canvas.
// Run once with `node scripts/make-grain.mjs`; the PNG is committed.
import { writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

const SIZE = 128;
// Share of pixels that carry a speck: sparse grain compresses far better than full noise.
const DENSITY = Number(process.env.GRAIN_DENSITY ?? 0.08);

// Seeded so the tile is the same every time it's generated.
let seed = 0x5eed;
const random = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (const b of bytes) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
};

const header = Buffer.alloc(13);
header.writeUInt32BE(SIZE, 0);
header.writeUInt32BE(SIZE, 4);
header[8] = 8; // bit depth
header[9] = 4; // greyscale with alpha
const rows = [];
for (let y = 0; y < SIZE; y++) {
  const row = Buffer.alloc(SIZE * 2 + 1); // filter byte 0, then grey + alpha per pixel
  for (let x = 0; x < SIZE; x++) {
    const r = random();
    const speck = r < DENSITY / 2 ? 255 : r < DENSITY ? 0 : -1;
    row[x * 2 + 1] = speck < 0 ? 128 : speck;
    row[x * 2 + 2] = speck < 0 ? 0 : 255;
  }
  rows.push(row);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", header),
  chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);
await writeFile(new URL("../assets/grain.png", import.meta.url), png);
console.log(`assets/grain.png: ${png.length} bytes`);
