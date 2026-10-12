# Architecture

How the code is split, and which folder may import which. ESLint enforces the rules (`eslint.config.mjs`), so a wrong import fails `npm run lint`.

## Layers

Each layer may import only from the layers below it.

```
app/                 routes: read the request, call a screen module, settle the outcome
components/          draw views and words; never fetch
lib/screens/         one module per screen: raw input → outcome
lib/cards/           share cards: model + options → PNG
lib/league, lib/tools   domain logic (data session)
lib/fpl/             raw FPL access: cached, validated (data session)
shared leaves        lib/i18n, lib/awards, lib/ids, lib/remembered, lib/ui, lib/variants, lib/tokens
```

Two adapters sit beside the layers:

- `proxy.ts` applies `lib/remembered`.
- `lib/request.ts` reads cookies and headers through `next/headers`. Only routes call it.

## The modules and their interfaces

| Module | Interface | Hides |
|---|---|---|
| `lib/screens/{start,picker,league,fixtures,players,card}` | `loadX(input, source?) → Screen<View>` | parsing, fetching, FPL outages, mapping to what's drawn |
| `lib/screens/screen.ts` | `Screen<V>`: ready, redirect, not-found or down | — |
| `components/screens/settle.tsx` | `settle(screen, lang, draw)` | Next's `redirect`, `notFound` and the down panel |
| `lib/cards/render` | `renderCard(card, options) → Response` | Satori: sizes, fonts, emoji, cache headers, render errors |
| `lib/cards/request` | `cardRequest(params, query)` | path and query checks |
| `lib/i18n` | `copyFor(lang)`, `resolveLang`, `languageChoice` | one catalogue per language |
| `lib/remembered` | `onVisit(path, query, cookies)` | which pages save what; opening the last league |
| `lib/fpl/api` (data session) | one function per endpoint | caching, validation, the relay |

## Adding a screen

1. Write `lib/screens/x.ts`. It exports a `View` type and `loadX(input, source = live)`, and returns `Screen<View>`.
2. Write `x.test.ts` next to it. Test through `loadX` with a fake source, covering ready, redirect or not-found, and down.
3. Write `components/screens/X.tsx`. It takes `{ view, lang }` and only draws.
4. Write `app/x/page.tsx`. It reads the request, then calls `settle(await loadX(...), lang, (view) => <X … />)`.
5. Add the screen's words to `lib/i18n/copy.ts`, then to `pcm.ts`, `en.ts` and `fr.ts`. The compiler flags any language you miss.

## Decisions

- **Sources are passed in.** The live source is the default, and tests pass fakes.
  - The sample league and the 12 Oct tools snapshot are real second sources too.
  - Wiring `lib/league` or `lib/tools` therefore swaps one default.
- **Outcomes are values, not exceptions.**
  - Errors thrown inside `'use cache'` lose their class in production, so the app returns them as values instead.
  - We don't use Next's `error.tsx`. It must run in the browser, adding JavaScript against a tight budget. It can't read the language cookie. It would also hide real bugs.
- **No shared League layout.** Marking the active tab would need browser JavaScript. Both League pages call `app/league/[leagueId]/league-tab.tsx` instead.
- **Typed catalogues, not next-intl.**
  - We have three languages, no language in the URL, and server rendering only.
  - The card renderer needs the same words outside React.
  - The `Copy` type turns a missing line into a compile error, at no runtime cost.
- **Built-in ESLint `no-restricted-imports`, not eslint-plugin-boundaries.** Five folder rules don't justify a new dependency.
