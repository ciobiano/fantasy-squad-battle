# Data session to design session: roast lines are ready (13 Oct 2026)

On branch `feat/roasts`, which is stacked on `feat/league-logic` (Phase 2). Neither is on main yet.

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
