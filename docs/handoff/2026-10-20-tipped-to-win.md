# Data session to design session: "Tipped to win" (20 Oct 2026)

Branch `feat/title-odds`, on main once Ralph says. How it's worked out: [docs/research/2026-10-20-title-odds.md](../research/2026-10-20-title-odds.md).

**Ralph's calls (20 Oct):**
- Show percentages, under the working name "Tipped to win".
- **Call out managers who've quit**: "it's a game, it will prompt them to take it seriously".

## Load

`getLeagueOdds(leagueId, { gw?, now })` returns `{ ok: true, data: LeagueOdds }` or `{ ok: false, reason }`. The reasons are the same as `getLeagueView`'s.

It reads the same cached league bundle, so it costs no extra FPL calls, and computes in about 0.1–0.2 s.

### `LeagueOdds`
- `gw`: the odds are after this gameweek.
- `remaining`: gameweeks left.
- `truncated`: only the top 50 are in the race.
- `managers`: best chance first. Each one has:

| Field | Meaning |
|---|---|
| `firstName`, `entryName`, `rank`, `total` | Same rules as the Table (first names only; ranks 1, 2, 2, 4) |
| `win`, `top3`, `last` | Chances from 0 to 1. Show them as whole percentages, and as "<1%" below 0.5%. |
| `winChange` | Change in `win` since last week (−1 to 1), or null in GW1. For "up 11%" pills (▲ green, ▼ red, like the Market). |
| `activity` | `active`, `quiet` (3+ weeks without a transfer, maybe saving) or `ghost` (has quit: quiet with 2+ injured or gone starters, or 6+ weeks idle) |
| `idleWeeks` | Weeks since the last transfer, Wildcard or Free Hit |
| `out` | Under 1 in 1,000 to win: "out of the race" |

The odds for a league and gameweek never change on reload, so a shared card matches the app.

## Ideas for where it shows
1. **A "Tipped to win" story card**, before the Wooden Spoon:
   - the top 3 by `win`, with their pills;
   - the leader, when they aren't the favourite ("Ayo tops the table, the model backs Sir");
   - the ghosts.
2. **A Table column** with each manager's `win`, and a ghost marker 👻 (Noto/Twemoji) next to quitters.
3. **Spoon odds** on the Wooden Spoon card: "Nnajiofor 42% to finish last".

## Draft lines (for Ralph to edit; not in `lib/roasts` yet)
Placeholders work like the roast book's. `{pct}` is a whole percentage.

**Favourite**
- en: "{name} is tipped to win at {pct}. The rest of you are playing for second."
- en: "The model backs {name} at {pct}. Plenty of season left to embarrass it."
- pcm: "{name} get {pct} chance to carry this league. Una wey remain, na second una dey find?"
- pcm: "Data don talk: {name}, {pct}. Make una no vex, na numbers talk am."

**Leader not favourite**
- en: "{leader} tops the table, but the model backs {name} at {pct}. Awkward."
- pcm: "{leader} dey top table, but model dey back {name} with {pct}. Luck no dey last o."

**Ghost**
- en: "Missing: {name}. No transfer in {weeks} weeks, injured players still starting."
- en: "{name} hasn't touched their team in {weeks} weeks. Pray for the squad."
- pcm: "{name} don japa? {weeks} weeks, no transfer. Injured players still dey start."
- pcm: "Who see {name} last? That team don turn museum."

**Spoon odds**
- en: "{name}: {pct} to finish last. The Wooden Spoon is warming up."
- pcm: "{name} get {pct} chance to carry last. Spoon don dey wait."

**Out of the race**
- en: "{name} is out of the title race. Playing for pride now."
- pcm: "{name}, title don comot for your hand. Play for pride."

If Ralph likes the card, the data session adds these as pools in `lib/roasts`, keyed on new card IDs we agree, with the same 100-character and guardrail tests.
