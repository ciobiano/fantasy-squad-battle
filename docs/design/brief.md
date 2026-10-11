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

**Scope update (2026-10-10, from the data session's handoff):** tabs are **League · Fixtures · Players**. League has a Market | Table switch. People can enter with their own team ID, which lists their leagues. Pass 3 below covers the new screens.

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
| Tab bar | Every tab | League · Fixtures · Players. Navigation only, one-word labels, no disabled tabs (HIG) |
| View switch | League | Segmented control, Market \| Table, solid track so it reads on the sky |
| League row | Picker | Name, your rank, a movement pill (private leagues show the number; public ones the arrow only, since a six-digit move says nothing) |
| Ticker cell | Fixtures | Opponent's short name, H or A, and the difficulty number. Colour plus the number, so colour is never the only signal. Doubles stack two fixtures; blanks are a dashed "No match" |
| Status chip | Players | Injured (down red), Doubtful as its percentage (amber `#F2B33D` with dark text), Suspended (ink), Unavailable (outline) |
| You marker | Market, Table | Your row tinted (`youTint`) with a small "You" tag; your own card first in the stories |

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

**Our gradient: the Mist sky** (Ralph, 2026-10-10). Deep teal at the top, misty mint in the middle, fading into the page: white in light mode, near-black in dark mode. Taken from Ralph's fintech reference; stops sampled from it.
- **Light:** `#143A53` → `#315569` → `#7DA4A5` → `#A7D1C7` → `#D5F1E5` → `#FFFFFF`. **Dark:** `#143A53` → `#265858` (with a soft mint glow) → `#08090A`. Full stop lists live in the canvas components (`skyProfile`).
- **Where:** the top of every share card and of the app's main screens (Start, picker, League, Fixtures, Players). Content sits on it; the page colour takes over below.
- **Text on the sky:** white on the deep-teal top, then ink once it turns pale (light), or white throughout (dark). Grey secondary text fails on the mint, so text on the sky is full ink or white. Every text element is checked at its actual position.
- **Accent** (buttons, the selected story ring, the top scorer's points): pale mint `#C8EBDD` with `#06201F` text on dark; deep teal `#143A53` with white text on light.
- **Grain:** fine monochrome noise at 16%, fading out with the sky. Check that `next/og` renders it (or ship it as a PNG tile).
- **Clear of the Premier League palette.** The PL's own stylesheet (premierleague.com, read 2026-10-10) uses cyan `#05F0FF`, green `#00FF87`, purple `#37003C`, lilac `#953BFF`, pink `#FF2882`, orange `#FF6900`, yellow `#EBFF00`, all at full chroma. Every sky and accent colour is ΔE2000 ≥ 16 from all of them, at chroma ≤ 19. The bright Mint (`#35E1E5` → `#28E4A3`) was ΔE 4.7 and 9.7 from PL cyan and green, so it is retired. Movement green `#2FD27A` is ΔE 10 from PL green; it stays, because it is a status colour on small pills, never a brand fill.
- **Retired:** bright Mint, Harmattan (gold to apricot) and Lagoon (aqua to cornflower).
- **Cards in both themes:** a card renders in light or dark. Proposal (Ralph to confirm): the shared image follows the app's theme at the moment of sharing; link previews use dark.

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

**Mist sky and light cards (2026-10-10):** every card and the Start and League screens carry the sky; 18 light card boards sit below the dark ones on "Pass 2 · Cards". Bright Mint retired (see the gradient section).

**Pass 3, new scope (2026-10-11):** on the canvas page "Pass 3 · New scope", in dark and light, with states. Data is real FPL data from 2026-10-11 (GW 7–12 fixtures, 202 flagged players).
- **Start:** one field with a My team ID | League link switch. Team ID is the default path; a pasted league link flips the switch. Help shows where the ID lives in the Points page address.
- **League picker:** header names the person ("Emeka · Agbero Athletic"). Your leagues first; Public leagues folded, with a count. "Not you? Change team" is the way back.
- **League tab:** the league name is a button ("Change league"), then the Market | Table switch. Your row is tinted with a "You" tag and your own card leads the stories.
- **Fixtures:** 20 teams × 6 gameweeks, sticky team column with the run total under the short name, scroll sideways. Sort Easiest | A–Z. Legend line "Easiest 1 2 3 4 5 Hardest". States: loading, double and blank (an example, not real fixtures), end of season (three columns), FPL down.
- **Difficulty tokens** (fill / text), our own colours in FPL's order: dark `1 #1F7A44/white · 2 #2FD27A/#04140B · 3 #2A2D31/ink · 4 #FF5A4E/#1A0503 · 5 #9C2A2F/white`; light `1 #11823B/white · 2 #B5E8C6/ink · 3 #E9EBE8/ink · 4 #EE6A60/ink · 5 #A3222A/white`. Every cell's text is 4.5:1 or better.
- **Players:** "Injuries & bans" list, newest first: name and status chip, the news line, then team · position · age of the report. Filters: All (injured, doubtful, suspended), each status, and Unavailable on its own, because 105 of 202 flags are loans and transfers out. Team filter as a menu. States: loading, nothing flagged, FPL down.
- **Checked:** every screen rendered in both themes; every text element passes AA at its position on the sky; story rings pass 3:1 against the sky.

**Then:** a Design System artifact from the winner (tokens for both themes, type scale, components, contrast checks), which phase 5 and 6 build from.
