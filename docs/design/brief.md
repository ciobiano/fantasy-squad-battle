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
- **Big numbers:** scores up to 3 digits, totals up to 4. Hero numbers use proportional figures (tabular digits look loose at display size). Columns of numbers use tabular figures.
- **Status safe zones:** WhatsApp draws its progress bar and name over the top of a Status and its reply bar over the bottom. Keep the top 220px and bottom 240px of a 1080×1920 card free of anything important.

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

**Our gradient palette:** one gradient family of our own. No purple, no glow, no generic AI washes. Text over a gradient must pass AA against its worst stop.
- **Official: Mint** (Ralph's call, 2026-10-10, from two references he shared: a grainy aqua-to-green swatch and a fintech app with a deep-teal-to-mint hero). Colours measured from the references:
  - **Gradient:** aqua `#35E1E5` to mint green `#28E4A3`.
  - **Wash:** deep teal `#143A53`, pale mint `#D5F1E5`, mist `#EFEFEF`.
- **Text:** dark teal `#06201F` reads 10:1 or better on both gradient stops; white fails (1.6:1). On the wash, text sits only on the pale lower half.
- **Grain:** large gradient fields carry a fine monochrome grain (fractal noise, about 22%). Check that `next/og` renders it (resvg supports SVG filters) when the cards are built.
- **Known clash:** the green end is close to the dark theme's up green (ΔE 14). The gradient never touches movement pills or arrows, and movement always carries ▲ ▼.
- **Retired:** Harmattan (gold to apricot) and Lagoon (aqua to cornflower), the pass 1 candidates.

**Learned in pass 1 (2026-10-09):**
- Bright green and red pills need dark ink. White on #2FD27A is only 2.0:1.
- Grey secondary text fails over a gradient (2.9–4.1:1 on the old Harmattan gradient), so text that sits on a gradient uses full ink.
- The Apple HIG advises against an app-only appearance setting. CLAUDE.md asks for a System / Light / Dark switch. Keep the switch (on the web there is no system setting to defer to), but default it to System.

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

**Pass 1, to choose a direction:** done 2026-10-09 on the canvas "Squad Battle Directions".
- 11 artboards. Per direction: Wrap (Status), Oga (Status), Wooden Spoon (X), and the Market tab in light and in dark. Plus a palette board.
- Built with a sample league of 12 (the league ID hadn't arrived yet). Player names, points and the Team of the Week are real GW5 data.
- Cards have a language switch (Pidgin, English, French) and the Wrap a gradient switch, in the canvas's Tweaks panel.
- **Product finding:** with the sample data, 7 of 12 managers qualify as Middle Class, including the league leader. The "rank moved ≤ 1 over 3 GWs" rule needs a tighter definition, e.g. only the middle third of the table.

**Pass 2, Market direction:** done 2026-10-09, on the canvas pages "Pass 2 · Cards" and "Pass 2 · Screens".
- **One card component** renders every award in both formats, like the `next/og` port will: header, award label, winner(s), hero number with one line of context, one visual, then the roast and watermark anchored at the bottom. The visual depends on the award:

  | Award | Visual |
  |---|---|
  | Oga, Wooden Spoon | Season total against the league average (trend line over a dashed baseline), with one message line such as "49 above the league average" |
  | Climber, Faller, Middle Class | League position by GW (rank line, 1st at the top). Ties get one line each, labelled at the end |
  | Captain Disaster | Two bars: the captain's points and the best player in that team |
  | Bench Regret | The four bench players: points and name |
  | Hit Merchant | One bar: points kept and points paid in hits |

- **Less text (2026-10-10, Ralph's call, following Apple's simplicity and writing guidance):**
  - Cards lost their stats row, rank pill, chart titles, legends and GW labels.
  - The Wrap rows show first names only.
  - The pitch shows points and owners, without club codes.
  - Start, stories, League and share page lost their subheadings and footnotes.
  - Rules for next time are in [tasks/lessons.md](../../tasks/lessons.md).

- **Ties:** up to 3 winners stacked smaller under the label. Faller (Femi and Bayo) and Middle Class (3 names) show it.
- **Middle Class** uses the proposed rule (middle third and ≤ 1 place over 3 GWs), so the Wrap now names Ngozi, Seun and Ibrahim. Decision still Ralph's.
- **Screens and states** take settings, not copies: the Market tab has a `state` (loading, provisional, over 50, live GW, early season) and the Start screen has a `state` (invalid, not found, FPL down) plus language and theme.
- **Start screen:** the language switch sits at the bottom as a segmented control and the theme as an icon button, so both are always visible. Two real cards preview the product above the form.
- **Story viewer:** progress segments, close, invisible previous and next tap zones (real buttons for screen readers), Share and a visible Pause button (WCAG 2.2.2). Share opens a sheet with three choices: WhatsApp Status (tall), X (square), Save image.
- **Share page:** a fluid web page, not a phone frame. It has the Wrapped card, a swipeable row of the 8 award cards, the standings, a fan-project disclaimer and a sticky "Roast your own league" button.
- **Copy:** state messages and the Start screen are in Pidgin by default, with English and French behind the language setting. Navigation labels stay English. Ralph to edit.

**Then:** a Design System artifact from the winner (tokens for both themes, type scale, components, contrast checks), which phase 5 and 6 build from.
