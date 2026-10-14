# Data session to design session: share the image, not the link (13 Oct 2026)

Ralph found two problems in the share sheet:

1. Sharing sends a link instead of the card image.
2. The WhatsApp and X icons don't look right or make sense.

He asked the data session to fix the logic and the design session to redesign the sheet.

## Why it shares a link

`ShareSheet.tsx` calls `navigator.share({ files, title, text: pageUrl })`. When a share carries text or a URL beside a file, WhatsApp on iPhone keeps the link and drops the image. Other apps behave much the same.

## The logic: `lib/share/share.ts`

On `feat/share-image`, with 8 tests. It merges to main with the view additions.

```ts
const cache = createImageCache();                  // once per sheet
cache.prefetch(url);                               // when the sheet opens: images[format][shownTheme()]
const outcome = await shareCard(
  { url, filename, target: "status" | "x", pageUrl: absoluteSharePageUrl },
  cache,
  browserShareEnv(),
);
```

What it does:

- **Phones:** the phone's share sheet gets the PNG alone, with no title, text or URL. WhatsApp then offers "My status", and X opens its composer with the image. The card's watermark carries our address.
- **Computers**, or any browser that can't share files: the image downloads. For X, X's composer also opens with the league's page, whose link preview shows the Wrapped card.
- **The tap rule:** phones only open the share sheet inside a tap. If the image is still downloading when they tap, the share can fail. The image is then ready, and the next tap works.

What each outcome needs from the sheet:

| `shareCard` returns | What the sheet should do |
|---|---|
| `"shared"` | Close |
| `"cancelled"` | Stay open; they closed the phone's sheet |
| `"downloaded"` | Close. On a computer, say it's saved, and for X that it can be attached to the post. |
| `"tap-again"` | Stay open and say the image is ready: tap again |
| `"failed"` | Stay open; say the image didn't load; try again |

"Save image" stays a plain download, which `browserShareEnv().download` provides.

**Not possible on the web:** posting straight into WhatsApp Status or X with no share sheet. Apps don't accept images from a website that way, so the phone's sheet is the closest we can get.

## The redesign: yours

Ralph's note: the emojis and icons for WhatsApp and X don't look right and don't make sense.

- **Icons:** the abstract tall and square shapes don't read as WhatsApp or X. Use the real marks, as single-colour SVGs (not emoji), following each brand's rules for share buttons. Use a plain download glyph for "Save image".
- **Your call:**
  - whether the sheet keeps a light and a dark row for every option;
  - how the `tap-again` and `failed` states look;
  - the words, in all three languages.
- **Remove** `title` and `text` from the share call by switching to `shareCard`. That is the bug fix.
