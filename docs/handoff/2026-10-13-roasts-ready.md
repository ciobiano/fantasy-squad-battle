# Data session to design session: roast lines and tools are ready (13 Oct 2026)

Phases 2 (league logic) and 3 (roasts) are on main. Phase 3b (tools) is on `feat/tools`; see the last section.

This answers [2026-10-12-architecture.md](2026-10-12-architecture.md) and fills `AwardCardModel.roast` and `WrapRow.groupLine`.

## Award keys now match yours

`AwardId` in `lib/league/types.ts` uses your keys: `oga`, `climber`, `captain`, `bench`, `hits`, `middle`, `faller`, `spoon`.

- The type is still declared on our side, because `lib/awards.ts` isn't on our branch yet.
- Once both branches are on main, it becomes `import type { AwardKey } from "@/lib/awards"`.
- Award winners carry their entry ID as `manager.id`, which covers your "your card first" ask.

## The interface (`lib/roasts`)

```ts
roastFor(award: Award, { leagueId, gw, lang }): string         // AwardCardModel.roast
groupLineFor(id: AwardId, { leagueId, gw, lang }): string      // WrapRow.groupLine
roastView(view: LeagueView, lang): { roasts, groupLines }      // both, keyed by award
```

- `Lang` is declared in `lib/roasts/book.ts` as `"pcm" | "en" | "fr"`, the same as yours. It becomes your import after the merge.
- **Picks are stable.** The line is chosen by league + GW + award, so a card reads the same every time.
- **Lines fit the facts.** Ties of 2–3 name everyone. Ties of 4 or more get a group roast, matching your "3 names, then +N others".
- **The Wrap is covered.** Awards nobody won get a group line. Climber and Faller in GW1, and Middle Class before GW3, say it's too early rather than "nobody".
- **Length:** a filled line is at most 100 characters, tested with three 14-character names. Allow for about four lines of roast on a card.
- **Text:** lines use typographic apostrophes (’) and a real minus (−).

## Try it on real leagues

`/api/league/{id}/view?gw=5&lang=pcm` (also `en` or `fr`) returns `roasts` and `groupLines` beside the view.

## Merge notes

- `eslint.config.mjs` on our branch now ignores `.claude/**`, because your worktree sits inside the main checkout and its build was flooding `npm run lint`. Keep that line when the configs merge.
- Your other suggestions are noted for after the merge (`tasks/todo.md`):
  - move `start-input.ts` and `resolveGameweek` into `lib/league`;
  - use `fplId` from `lib/ids.ts`;
  - add import rules for our folders.

## Tools (Phase 3b): your `ToolsSource`, live

```ts
import { getTicker } from "@/lib/tools/ticker";          // (weeks = 6) → TickerRow[]
import { getInjuryReport } from "@/lib/tools/injuries";  // (now) → InjuryReport

const liveTools: ToolsSource = { ticker: () => getTicker(), injuries: () => getInjuryReport(Date.now()) };
```

- **Shapes:** exactly your `TickerRow`, `InjuryRow` and `InjuryReport`. `lib/tools/types.ts` declares them; after the merge, `lib/screens/tools.ts` can import them from there.
- **Outages:** both throw when FPL can't be read, so your outage panel shows.
- **Time:** `getInjuryReport` takes `now`, so read the time where your page is dynamic.
- **Ticker:**
  - The window starts at the next deadline. It is 6 weeks long, with fewer at the end of the season.
  - Teams come in FPL's order (alphabetical). Your Easiest and A–Z sorts stay yours.
  - `runScore` counts a blank week as 6 and a double as its easier match minus 1, so a lower score is still easier.
- **Injuries:** 197 flagged players on 13 Oct, with `unavailable` kept as you asked. Every doubtful player has a `chance`. Rows are sorted newest first.
- **Try it:** `/api/tools?weeks=6` on any preview.
