# Front-end design brief

The working spec for the design phase (tasks/todo.md, phase 4) and the app UI (phase 6). Product decisions live in [CLAUDE.md](../../CLAUDE.md); this file turns them into surfaces, components, data and constraints. Where the Claude Design canvas's own defaults disagree with CLAUDE.md (it discourages Inter and emoji), CLAUDE.md wins.

## 1. What we're designing

### Cards (the product)

One **Wrap** card plus eight award cards, each in two formats: Status (1080×1920) and X (1080×1080).

| # | Card | Headline stat | Notes |
|---|---|---|---|
| 1 | GW Wrapped | League average, top and bottom score | Lists every award winner, plus group lines for awards nobody won |
| 2 | Oga of the Week | Net GW score, e.g. "92 (96 −4)" | Title still open |
| 3 | Biggest Climber | Places gained, e.g. ▲ 5 | |
| 4 | Captain Disaster | Captain's points (≤ 2) | Name the captain. Triple captain makes it worse |
| 5 | Bench Regret | Points left on the bench | Never in a Bench Boost GW |
| 6 | Hit Merchant | Transfer cost, e.g. −12 | Wildcard and Free Hit don't count |
| 7 | Middle Class | Rank moved ≤ 1 over 3 GWs | Group card: many names. Title still open |
| 8 | Biggest Faller | Places lost, e.g. ▼ 4 | |
| 9 | Wooden Spoon | Lowest net GW score | The punchline. Funny, never cruel |

Every card carries: league name, "GW 5", the provisional tag when it applies, a roast line, and the web address watermark.

Edge cases every card layout must survive:
- **Ties:** up to 3 winners, then "+N others".
- **Long names:** team names run to 20 characters (FPL's limit). Player names run to 16, e.g. "Williams-Barnett".
- **Accents:** player names need Latin Extended, not just French accents: Šeško, Kadıoğlu, Kovačić (all in the 2026 bootstrap data).
- **Three languages:** French and Pidgin lines run up to ~30% longer than English.
- **Big numbers:** scores and totals up to 3 digits, totals up to 4. All numbers use tabular figures.

### App screens (mobile-first, 390 wide)

1. **Start:** paste a league ID or URL, with help on where to find it. Language and theme switchers visible.
2. **Market tab** (the default), top to bottom:
   - Header: league name, GW picker, provisional tag.
   - Story circles: Wrap first, then one per award, in the order in CLAUDE.md. Watched circles turn grey.
   - Team of the Week on a pitch: 11 players, name, points, "owned by N" tag. Any formation (GW5 was 4-4-2). No crests or photos: the club's short name ("COV") as text.
   - Market list: rows ranked by GW score.
3. **Story viewer** (full screen): progress segments, the card, Share (Status or X), close. Tap left or right, hold to pause.
4. **League tab:** the classic season table with ▲▼ movement.
5. **Share page** (public): the Wrapped card, the awards, the table and a "Roast your own league" button.

### States to design (not just the happy path)

Loading (skeletons, not spinners), invalid ID, private league, league over 50 (top 50, labelled), FPL down, GW not started, provisional data, fewer than 3 GWs (no Middle Class), an award nobody won (a group line in the Wrap).

## 2. Components

| Component | Used in | Notes |
|---|---|---|
| Team badge | Cards, rows, table | Initials in a shape, coloured from a hash of the team name over a fixed AA-safe palette. Built with CSS shapes, so it ports to Satori |
| Score with breakdown | Cards, rows | "67 (71 −4)": the net score big, the breakdown small |
| Rank pill | Market rows, Climber and Faller | ▲ green or ▼ red. Always pair the glyph with the colour, never colour alone |
| Sparkline | Market rows | Season total minus league average, per GW, over a dashed zero line |
| Story circle | Market tab | Gradient ring when unwatched, grey when watched |
| Progress segments | Story viewer | One per card, 5 s each. Static when reduced motion is on |
| Emoji chip | Cards, rows | Noto Color Emoji, never Apple |
| Provisional tag | Header, cards | |
| Segmented control | Tabs, language, theme | |
| Pitch | Team of the Week | Flexbox rows by position |

Starting emoji per award, to try on the canvas: Oga 👑, Climber 📈, Captain Disaster 🫠, Bench Regret 🪑, Hit Merchant 💸, Middle Class 🛋️, Faller 📉, Wooden Spoon 🥄.

## 3. The two directions

Both share Inter for UI and numbers, the same components and the same data. They differ in mood.

**A. Market** (after Apple Stocks)
- Dark: near-black ground, white type, green and red for movement.
- Big tabular numbers, sparklines and pills.
- Gradient only on the Wrap card's hero and the story rings.
- The shared card is always dark.

**B. Editorial** (after Future and Copilot)
- Light: a tinted background per award, with soft white rounded cards on top.
- Instrument Serif headline for award titles only, Inter for everything else.
- Progress rings and emoji chips.
- The shared card is always light.

**Our gradient palette:** both directions draw on one gradient family of our own. No purple, no glow, no generic AI washes. The canvas will try a few candidates, such as warm (amber to coral) and pitch (green to teal). Text over a gradient must pass AA against its worst stop.

## 4. Constraints

**Brand and legal:** no PL logo, crests or player photos. No "FPL" or "Premier League" in the name. First name plus team name only, never surnames. Roasts are funny, not cruel.

**Type:** Inter 400–700 with tabular figures. Instrument Serif for Editorial display only. Body text at least 17px, in `rem`. Subsets must include Latin Extended (see the accents above).

**Colour:** every colour is a token with a light and a dark value. Body text 4.5:1, large text 3:1, in both themes.

**Port to `next/og` (Satori):** design cards so they port without redesign (limits from `node_modules/next/dist/docs/.../image-response.md`):
- Flexbox and absolute positioning only. No CSS grid. Keep to borders, radii, gradients and solid fills; check anything fancier (blend modes, filters, blur) against Satori's CSS list first.
- A `div` with more than one child needs `display: flex`.
- **500 KB bundle limit**, fonts included. Full Inter in four weights won't fit, so cards use at most three weights (e.g. 400, 600, 700), subset, plus Instrument Serif for Editorial.
- Fonts must be TTF, OTF or WOFF (no WOFF2).
- Emoji: `ImageResponse` has a built-in `emoji: 'noto'` option.

**Speed:** app screens use no images apart from the cards themselves. Badges and the pitch are CSS. Motion only for the story viewer and the tab switch.

## 5. Data each surface needs

What the domain layer (`lib/league/`) should hand to the UI. A shape to agree on, not final types.

```ts
type Manager = { id: number; firstName: string; teamName: string };

type Score = { net: number; points: number; hits: number }; // net = points − hits

type AwardCard = {
  award: AwardId;            // "oga" | "climber" | "captainDisaster" | ...
  winners: Manager[];        // up to 3
  othersCount: number;       // the "+N others"
  stat: number;              // the headline number
  detail?: string;           // e.g. the captain's name
  score?: Score;             // for Oga and Wooden Spoon
  roast: string;             // already picked and filled in
};

type WrapCard = {
  league: string; gw: number; provisional: boolean;
  average: number; awards: AwardCard[]; groupLines: string[];
};

type MarketRow = {
  manager: Manager; score: Score; gwRank: number;
  leagueRankChange: number;  // + up, − down
  gapSeries: number[];       // season total minus league average, per GW
  awards: AwardId[];
};

type TeamOfTheWeek = {
  players: { name: string; club: string; position: "GK" | "DEF" | "MID" | "FWD"; points: number; ownedBy: number }[];
  topPlayer: string;
};
```

## 6. Canvas plan

Real data from Ralph's league (Denizens of Olympus, GW5, a finished GW), with surnames stripped. Roast lines are drafts until phase 3.

**Pass 1, to choose a direction** (10 artboards):
- Per direction: Wrap (Status), Oga (Status), Wooden Spoon (X).
- Per direction: the Market tab in light and in dark.

**Pass 2, the chosen direction only:**
- The remaining cards in both formats.
- The story viewer, the League tab, the Start screen, the share page and the states in section 1.

**Then:** a Design System artifact from the winner (tokens for both themes, type scale, components, contrast checks), which phase 5 and 6 build from.
