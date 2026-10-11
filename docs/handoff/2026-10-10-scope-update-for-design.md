# Handoff to the design session: scope update (10 Oct 2026)

From the data session (`lib/fpl/`, `lib/league/`, `lib/tools/`, the relay, Vercel). Ralph approved everything here on 10 Oct. The full record is in `CLAUDE.md` ("Scope update" and "League logic decisions"), and the interactive system map is at https://claude.ai/artifact/Sg1zjwKdBnW72H4H48dTJq.

## What changed

The app now has **two halves on one data layer**:

1. **League banter (the front door).** Roast cards, the Market view and the league table. This is everything you've designed so far.
2. **Free FPL tools (the reason to come back).** A fixture ticker, injuries & bans, then player stats, projections, price trends and a planner after launch.

The Market direction (A), the card system and the type and colour rules all stay as they are.

## Changes to screens you've already designed

- **Tab bar:** **League · Fixtures · Players**.
  - League has two views, a segmented control with **Market** (default) and **Table**. They replace the old "Market tab" and "League tab".
  - Planner gets a tab only when it ships after launch. Don't show a disabled tab.
- **Start screen.** People can now come in two ways:
  - **My team ID**, the new main path. It lists every league they're in, and they pick one.
  - **A league link or ID**, as before.
- **Personal touches** once a team ID is known: highlight their row in Market and Table, and surface their own card first in the stories. The view is still the whole league, and there are still no accounts.

## New screens for the first release

### 1. Start: find my leagues

- **One input, two meanings.** A bare number could be a team ID *or* a league ID, because FPL's IDs overlap. Links are unambiguous: `/entry/{id}/…` is a team and `/leagues/{id}/…` is a league.
  - Suggestion: one field with a two-option switch, "My team ID" or "League link". Pasting a link picks the right option automatically.
- **Help text for finding a team ID.** On the FPL website, open *Points*. The address shows `/entry/1234567/event/6`, and the number after "entry" is the team ID. People can also paste that whole address.
- **League picker.** FPL returns two kinds of league:
  - **Private leagues** (`league_type: "x"`), the friend groups. Show these first, under "Your leagues".
  - **Public leagues** (`"s"`), such as Overall, the country league and club fan leagues. Show these collapsed under "Public leagues". They're huge, and the app covers only the top 50 managers.
  - Each row shows the league name and the person's rank in it, with an up or down arrow from their last rank.
- **Remembered on the phone.** On the next visit, open straight into their last league, with an easy "Change league" control.
- **States:**
  - loading
  - team ID not found
  - a team with no private leagues (show the public ones)
  - FPL unavailable
  - plus the existing league states: invalid, not found, head-to-head, over 50 managers

### 2. Fixtures tab: the ticker

- **Grid:** 20 team rows by the next 5–6 gameweeks. On phones, keep the team column sticky and scroll the weeks sideways.
- **Each cell:** the opponent's short name plus H or A, coloured by FPL's difficulty rating (1–5).
  - Follow FPL's familiar order: dark green for 1, green 2, grey 3, red 4, dark red 5. Use our own tokens and pass AA in both themes.
  - Print the number or the opponent in every cell, so colour is never the only signal.
- **Double gameweeks:** two opponents stacked in one cell.
- **Blank gameweeks:** an empty cell marked "No match".
- **Sort:** by easiest run (the lowest total difficulty over the window) or alphabetically.
- **No crests**, per the guardrails. Use team short names, or our generated badges if they suit.
- **End of season:** fewer than 5 gameweeks left shows fewer columns.
- **Later, not in the first release:** our own attack and defence difficulty ("easy to score against" vs "easy to keep a clean sheet against"). Leave room for a switch.

### 3. Players tab: injuries & bans (the first release)

- **Each row:** player, team, position, a status chip, the news text, and how long ago it was reported.
- **Status chips:**

  | Status | When |
  |---|---|
  | Injured | 0% chance of playing |
  | Doubtful | 25, 50 or 75%, with the percentage shown |
  | Suspended | ruled out by a ban |
  | Unavailable | loan, transfer or other reasons |

- **Order:** newest first. Filter by team and status.
- About 107 players are flagged at a typical point in the season, so it needs to scan well.
- **States:** loading, empty ("No injuries or bans flagged right now"), FPL unavailable.
- **After launch** this tab gains the stats table and player pages. Its stats columns will be price, ownership, **Form**, points, xG, xA, xGI, defensive contributions and minutes.
  - FPL's "expected points" is really just recent form, so it's shown as **Form** and never called a projection.
  - A **Projected** column arrives later, from our own model.

## League logic decisions that touch the cards

- **D3 · Middle Class:** your proposal is adopted. Middle third of the table, with rank moved 1 place or less over the last 3 gameweeks.
- **D4 · Captain Disaster:** the captain the manager chose. Zero minutes counts, even if the vice-captain saved them. The roast can mention the rescue ("Vice carry you").
- **D5 · Ranks:** equal totals share a rank (1, 2, 2, 4). Climber and Faller skip anyone with no previous gameweek.
- **D6 · Chips:** Triple Captain still counts for Captain Disaster.
- **D2 · Language:** the facts on a card are identical in every language. Only the roast line and titles change.

## Data shapes for the new screens (proposed by the data session)

The shapes in section 5 of your brief stay the target for the league views. Additions:

```ts
type MyTeam = {
  id: number;
  firstName: string;           // first name only, never the surname
  teamName: string;
  leagues: {
    id: number;
    name: string;
    kind: "private" | "public"; // FPL league_type "x" | "s"
    rank: number;
    lastRank: number;
  }[];
};

type TickerRow = {
  team: { id: number; name: string; short: string };
  weeks: {
    gw: number;
    matches: { opponent: string; home: boolean; difficulty: 1 | 2 | 3 | 4 | 5 }[]; // [] blank, 2 = double
  }[];
  runScore: number;            // total difficulty over the window; lower = easier
};

type InjuryRow = {
  player: string;
  team: string;                // short name
  position: "GK" | "DEF" | "MID" | "FWD";
  status: "injured" | "doubtful" | "suspended" | "unavailable";
  chance: 0 | 25 | 50 | 75 | 100 | null;
  news: string;
  reportedAt: string;          // ISO date-time
};

// League views: MarketRow and table rows gain `isYou: boolean` when a team ID is known.
```

## How we split the work

| Data session (builds) | Design session (designs and builds) |
|---|---|
| Team ID and league readers, player detail, tool fields (`lib/fpl/`) | Canvas pass for Start, Fixtures and Players, in light and dark, with all states |
| League logic and awards (`lib/league/`) | Updates to `docs/design/brief.md` (screens, tab bar, states) |
| Ticker and injuries (`lib/tools/`) | Pages, cards and components |
| The shapes above, delivered as typed functions | |

- **Cache Components is on** (`next.config.ts`). Pages need `<Suspense>` around anything loaded at request time.
- If a shape above doesn't fit a design, write back in `docs/handoff/` and we'll change it before it's built.

## Update from the data session (11 Oct)

`getMyTeam(teamId)` is built (`lib/league/my-team.ts`). Two small changes to the `MyTeam` shape above:

- **Each league gains `members: number | null`**, the number of managers in it. Some player-made leagues are huge (one had 155,892 members), so `kind` alone doesn't mean "friend group". The list arrives already sorted: player-made leagues first, smallest first, then FPL's own leagues.
- **`rank` and `lastRank` are `number | null`.** FPL reports 0 before a manager is ranked, and we turn that into `null`.

Real data to design with: `GET /api/team/{teamId}` on any preview deploy returns the exact `MyTeam` object. It's temporary and goes before launch.
