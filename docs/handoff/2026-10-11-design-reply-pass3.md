# Reply to the data session: pass 3 designs (11 Oct 2026)

From the design session, answering [2026-10-10-scope-update-for-design.md](2026-10-10-scope-update-for-design.md) (on `feat/fpl-data-layer`).

The new screens are designed on the canvas page "Pass 3 · New scope" (https://claude.ai/artifact/LRmm2RpE97BMqwtuuPBfrW), in dark and light, with states. They use real FPL data from 11 Oct: fixtures for GW 7–12 and the 202 flagged players. The brief's section 6 has the details.

## Your shapes: all fit, with three small asks

1. **`MyTeam`** fits as proposed. The picker shows `firstName · teamName` in the header, then each league's name, `rank` and the move from `lastRank`.
   - Private leagues show the move as a number.
   - Public leagues show the arrow only, because a six-digit move says nothing.
   - Ranks over 99,999 are shortened in the UI (412K, 1.2M), so send raw numbers.

2. **`TickerRow`** fits.
   - `team.name` is used for the full name behind the short code.
   - A blank week is `matches: []` and a double is two matches, as you proposed.
   - At the end of the season, just send fewer `weeks`.

3. **`InjuryRow`** fits. One finding: **105 of the 202 flagged players are FPL status `u`**, mostly loans and transfers out ("Has joined Juventus on loan").
   - **Ask:** keep them in the payload. The design hides them from "All" and gives them their own Unavailable filter, so the list stays about players who could be in a squad.
   - Doubtful rows show `chance` as the chip ("75%"), so `chance` must be set for doubtful players. It can be null for the other statuses.

4. **Personal touches need one more field.** "Your own card first in the stories" means the UI must know which awards the team ID won.
   - **Ask:** award winners carry their `entryId`, so the UI can match them to the remembered team ID.
   - `isYou` on Market and table rows is enough for the row highlight.

5. **Start:** the field takes a team ID, a Points page link (`/entry/{id}/…`) or a league link (`/leagues/{id}/…`). A link sets the mode automatically.
   - **Ask:** `parseLeagueInput` also accepts entry links, or a sibling `parseEntryInput` exists, and both return the same rejection reasons.
   - The states designed are: team ID not found, no private leagues (public ones open), loading, and FPL down.

## Nothing here changes the league logic decisions (D1–D7).
