import { cva } from "class-variance-authority";

// Every component's Tailwind classes live here as CVA definitions (see the
// global design rules). JSX composes these; it never carries raw class strings.
// Colours, radii and the type scale are the Design System's tokens
// (app/tokens.css, app/globals.css). Sizes use Tailwind's 4px scale.

// ---------------------------------------------------------------- Page

export const rootHtml = cva("h-full antialiased");
export const rootBody = cva("min-h-full flex flex-col bg-bg text-ink font-sans text-body");

/** A screen: room at the bottom for the tab bar when there is one. */
export const page = cva("relative isolate flex min-h-dvh flex-col overflow-x-clip pt-safe", {
  variants: { tabs: { true: "pb-with-tabs", false: "pb-end" } },
  defaultVariants: { tabs: true },
});
export const column = cva("relative mx-auto flex w-full max-w-md flex-col px-5 pt-14", {
  variants: { gap: { sm: "gap-4", md: "gap-6", lg: "gap-7" } },
  defaultVariants: { gap: "md" },
});
export const bleed = cva("-mx-5 px-5");
export const visuallyHidden = cva("sr-only");

// ---------------------------------------------------------------- The Mist sky

/** The sky behind a screen's header, fading into the page. Height per screen. */
/** Paints the iPhone status bar in the sky's top colour (see h-status in globals.css). */
export const statusTint = cva("pointer-events-none fixed inset-x-0 top-0 z-30 h-status bg-brand-deep");
export const sky = cva("pointer-events-none absolute inset-x-0 top-0 -z-10 bg-sky", {
  variants: {
    height: { start: "h-108", picker: "h-80", league: "h-118", fixtures: "h-48", players: "h-84", planner: "h-90", rating: "h-75" },
  },
});
export const onSkyTitle = cva("m-0 text-large-title text-on-sky");
export const onSkyKicker = cva("text-callout font-semibold text-on-sky-2");
/** The league name in the header: a link that opens Change league. */
export const titleLink = cva("inline-flex items-center gap-1 text-inherit no-underline");
export const onSkyRow = cva("flex items-start justify-between gap-3");

// ---------------------------------------------------------------- Start

export const wordmark = cva("flex items-center gap-2.5 text-callout font-bold text-on-sky");
export const wordmarkSquare = cva("size-6.5 shrink-0 rounded-sm border border-on-sky-fill bg-mark");
export const previewStack = cva("relative h-41");
export const previewCard = cva("absolute size-38 overflow-hidden rounded-xl border border-hairline", {
  variants: { tilt: { left: "left-17.5 top-1.5 -rotate-5", right: "left-40 top-0.5 rotate-4" } },
});
export const startHeadline = cva("m-0 text-display text-balance");
export const startFooter = cva("mt-auto pt-6");

// ---------------------------------------------------------------- Buttons and links

export const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-sans transition-transform duration-150 ease-out active:scale-97",
  {
    variants: {
      intent: {
        primary: "h-13 w-full bg-accent text-headline font-bold text-on-accent",
        quiet: "min-h-11 self-center px-3 text-callout font-semibold text-ink-2",
        outline: "min-h-11 self-start rounded-md border-fine border-ink-2 px-4.5 text-callout font-semibold text-ink",
      },
    },
  },
);
export const iconButton = cva("inline-flex size-11 shrink-0 items-center justify-center rounded-full", {
  variants: { tone: { sky: "bg-on-sky-fill text-on-sky", surface: "bg-surface text-ink" } },
  defaultVariants: { tone: "surface" },
});
export const textLink = cva("text-ink underline underline-offset-2");

// ---------------------------------------------------------------- Segmented controls

export const segmented = cva("flex rounded-md bg-surface p-0.75");
/** A segment: a link (views), a radio label (Start mode) or a submit button (language). */
export const segment = cva(
  "flex flex-1 items-center justify-center rounded-sm text-callout text-ink-2 has-checked:bg-segment-selected has-checked:font-bold has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-focus current:bg-segment-selected current:font-bold current:text-ink aria-pressed:bg-segment-selected aria-pressed:font-bold aria-pressed:text-ink aria-checked:bg-segment-selected aria-checked:font-bold aria-checked:text-ink",
  { variants: { size: { md: "h-10", sm: "h-8.5" } }, defaultVariants: { size: "md" } },
);

// ---------------------------------------------------------------- Forms

export const form = cva("flex flex-col gap-2.5");
export const fieldLabel = cva("mt-1.5 text-callout font-semibold");
export const input = cva(
  "h-13 w-full rounded-lg border-2 border-transparent px-4 text-body text-ink placeholder:text-ink-2 focus-visible:border-focus focus-visible:outline-none flagged:border-down",
  { variants: { on: { bg: "bg-surface", surface: "bg-surface-2" } }, defaultVariants: { on: "bg" } },
);
export const fieldError = cva("m-0 flex items-start gap-2 text-callout text-down");
export const help = cva("flex flex-col gap-3 rounded-xl bg-surface p-4");
export const helpSummary = cva("flex min-h-11 cursor-pointer items-center justify-center gap-1.5 text-callout font-semibold text-ink-2");
export const helpUrl = cva("m-0 rounded-md bg-bg px-3 py-2.5 font-mono text-footnote text-ink-2");
export const helpUrlId = cva("font-bold text-ink");

// ---------------------------------------------------------------- Panels

export const panel = cva("flex flex-col gap-3 rounded-2xl bg-surface p-4.5", {
  variants: { tone: { plain: "", note: "text-callout" } },
  defaultVariants: { tone: "plain" },
});
export const panelTitle = cva("flex items-center gap-2.5 text-headline font-bold");
export const panelBody = cva("m-0 text-callout text-ink-2");

export const skeleton = cva("rounded-md bg-surface", {
  variants: { shape: { line: "h-3.5", block: "h-60 rounded-2xl", row: "h-15", circle: "rounded-full" } },
});

// ---------------------------------------------------------------- Lists: league picker

export const groupHeading = cva("mb-2 ml-4 text-footnote font-bold uppercase tracking-wider");
export const group = cva("flex flex-col overflow-hidden rounded-2xl bg-surface");
export const listRow = cva(
  "flex min-h-15 items-center gap-3 border-t border-hairline px-4 text-ink no-underline first:border-t-0",
);
export const listRowName = cva("min-w-0 flex-1 truncate text-headline");
export const listRowValue = cva("text-headline font-bold tabular-nums");
export const disclosure = cva("group/disclosure rounded-2xl bg-surface");
export const disclosureSummary = cva("flex min-h-13 cursor-pointer items-center justify-between rounded-2xl px-4 text-headline group-open/disclosure:rounded-b-none");
export const disclosureChevron = cva("shrink-0 text-ink-2 transition-transform group-open/disclosure:rotate-180");
export const chevron = cva("shrink-0 text-ink-3");

// ---------------------------------------------------------------- Movement and badges

export const rankPill = cva("inline-flex min-w-7.5 justify-center rounded-xs px-1.5 py-0.5 text-caption font-bold tabular-nums", {
  variants: { direction: { up: "bg-up text-on-up", down: "bg-down text-on-down", none: "bg-surface-3 text-ink" } },
});
export const moveText = cva("text-micro font-bold", {
  variants: { direction: { up: "text-up", down: "text-down", none: "text-ink-2" } },
});

export const badge = cva("inline-flex shrink-0 items-center justify-center font-bold text-on-badge", {
  variants: {
    colour: { 1: "bg-badge-1", 2: "bg-badge-2", 3: "bg-badge-3", 4: "bg-badge-4", 5: "bg-badge-5", 6: "bg-badge-6", 7: "bg-badge-7", 8: "bg-badge-8" },
    shape: { circle: "rounded-full", squircle: "rounded-squircle", shield: "rounded-shield" },
    size: { sm: "size-6 text-micro", md: "size-9 text-footnote", lg: "size-14 text-headline" },
  },
  defaultVariants: { size: "md" },
});

export const youTag = cva("inline-flex rounded-xs bg-accent px-1.5 py-px text-micro font-bold text-on-accent");

// ---------------------------------------------------------------- League screen

export const storyRow = cva("-mx-5 flex gap-3.5 overflow-x-auto px-5 scrollbar-none");
export const story = cva("flex w-17 shrink-0 flex-col items-center gap-1.5 text-caption font-semibold text-ink");
export const storyRing = cva("flex rounded-full p-0.75", {
  variants: { watched: { true: "bg-watched", false: "bg-linear-to-b from-ring-start to-ring-end" } },
  defaultVariants: { watched: false },
});
export const storyGap = cva("flex rounded-full bg-bg p-0.75");
export const storyFace = cva("flex size-14 items-center justify-center", {
  variants: { kind: { award: "rounded-full bg-surface", wrap: "rounded-full bg-accent text-footnote font-bold text-on-accent", you: "rounded-2xl" } },
});

export const sectionHeading = cva("m-0 text-title");
export const sectionHead = cva("flex items-baseline justify-between pb-2");
export const sectionAside = cva("text-footnote font-semibold text-ink-2");

/** Matchday grass at 6:7 (the markings' proportions), the same in both themes. */
export const pitch = cva("relative aspect-6/7 w-full overflow-hidden rounded-2xl bg-pitch");
export const pitchMarkings = cva("absolute inset-0 size-full");
/** Holds shared SVG patterns; takes no room. */
export const kitPatterns = cva("absolute size-0 overflow-hidden");
/** Paint for the pitch drawing's parts. */
export const pitchPaint = cva("", {
  variants: { part: { ground: "fill-pitch", stripe: "fill-pitch-stripe", line: "fill-none stroke-pitch-line", spot: "fill-pitch-line" } },
});
export const pitchLines = cva("absolute inset-0 flex flex-col justify-around px-1 py-4.5");
export const pitchLine = cva("flex justify-evenly");
/** Players share their line equally (up to 96px each): a five-man midfield fits a phone, a lone keeper gets his full name. */
export const token = cva("flex min-w-0 max-w-24 flex-1 flex-col items-center gap-0.75");
export const tokenKit = cva("relative");
export const tokenOwners = cva(
  "absolute -right-2.25 -top-1.25 flex h-4.25 min-w-4.25 items-center justify-center rounded-full bg-pitch-badge px-0.75 text-micro font-bold text-on-pitch-badge",
);
export const tokenPoints = cva("rounded-sm px-2 py-1 text-footnote font-bold leading-none tabular-nums", {
  variants: { top: { true: "bg-pitch-top text-on-pitch-top", false: "bg-pitch-chip text-on-pitch-chip" } },
  defaultVariants: { top: false },
});
export const tokenName = cva("max-w-full truncate px-0.5 text-caption font-semibold text-on-pitch");

export const marketRow = cva("flex min-h-15 items-center gap-3 border-t border-hairline text-ink no-underline", {
  variants: { you: { true: "-mx-5 bg-you-tint px-5", false: "" } },
  defaultVariants: { you: false },
});
export const rowText = cva("flex min-w-0 flex-1 flex-col gap-0.5");
export const personCell = cva("flex items-center gap-2.5 font-normal");
export const rowName = cva("flex items-center gap-1.5 text-headline");
export const rowTeam = cva("truncate text-footnote text-ink-2");
export const rowEnd = cva("flex w-15.5 shrink-0 flex-col items-end gap-1");
export const rowScore = cva("text-headline font-bold tabular-nums");
export const sparkLine = cva("fill-none stroke-2", {
  variants: { direction: { up: "stroke-up", down: "stroke-down" } },
});
export const sparkBase = cva("stroke-ink-3 stroke-1");

export const table = cva("w-full border-collapse tabular-nums");
export const tableHead = cva("pb-2.5 text-left text-caption font-bold uppercase tracking-wider text-ink-2", {
  variants: { align: { left: "", right: "text-right" } },
  defaultVariants: { align: "left" },
});
export const tableRow = cva("border-t border-hairline", {
  variants: { you: { true: "bg-you-tint", false: "" } },
  defaultVariants: { you: false },
});
export const tableCell = cva("h-14 align-middle", {
  variants: { align: { left: "text-left", right: "text-right" }, tone: { strong: "text-headline font-bold", quiet: "text-callout text-ink-2" } },
  defaultVariants: { align: "left" },
});

// ---------------------------------------------------------------- Story viewer
// Always dark (the root sets data-theme="dark"), like the canvas's S-Story.

export const storyViewer = cva(
  "fixed inset-0 z-50 flex justify-center bg-black pt-safe pb-safe text-ink select-none touch-manipulation touch-callout-none",
);
export const storyColumn = cva("flex h-full w-full max-w-md flex-col px-3 pt-3 pb-6");
export const storySegments = cva("flex gap-1 px-1");
export const storySegment = cva("flex h-0.75 flex-1 overflow-hidden rounded-full bg-ink/30");
export const storyFill = cva("block size-full origin-left bg-ink", {
  variants: {
    state: {
      done: "scale-x-100",
      active: "scale-x-0 animate-story story-paused:animation-paused motion-reduce:animate-none motion-reduce:scale-x-100",
      todo: "scale-x-0",
    },
  },
});
export const storyTop = cva("flex justify-end py-1");
export const storyClose = cva("inline-flex size-11 items-center justify-center rounded-full text-ink");
/** touch-none: the browser doesn't claim a held finger for scrolling or zooming, so a hold stays a pause. */
export const storyStage = cva("flex min-h-0 flex-1 touch-none items-center justify-center px-2 container-size");
export const storyCard = cva("relative overflow-hidden rounded-lg bg-surface story-fit");
/** A card image for one theme: the other is hidden, so only the one shown downloads (lazy). */
export const cardImage = cva("object-cover", {
  variants: { theme: { light: "dark:hidden", dark: "hidden dark:block" } },
});
/** Tap zones are links (they work without JavaScript), kept from starting a link drag or preview on a long press. */
export const storyTap = cva("absolute inset-y-0 select-none touch-callout-none no-drag", {
  variants: { side: { previous: "left-0 w-3/10", next: "right-0 w-7/10" } },
});
export const storyBar = cva("flex gap-3 px-2 pt-4");
export const storyShareWrap = cva("flex-1");
export const storyShare = cva(
  "flex h-13 flex-1 cursor-pointer list-none items-center justify-center gap-2 rounded-lg bg-ink text-headline font-bold text-bg transition-transform duration-150 ease-out active:scale-97",
);
export const storyPause = cva("flex size-13 shrink-0 items-center justify-center rounded-lg bg-surface text-ink");

export const sheetBackdrop = cva("fixed inset-0 z-50 bg-black/60");
export const sheet = cva(
  "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md flex-col gap-1.5 rounded-t-sheet bg-surface px-5 pt-2.5 pb-sheet",
);
export const sheetGrabber = cva("mb-2.5 h-1.25 w-9 self-center rounded-full bg-hairline");
export const sheetTitle = cva("m-0 mb-2 text-headline font-bold");
export const sheetOption = cva(
  "flex min-h-16 items-center gap-3.5 border-t border-hairline text-left text-ink no-underline",
  { variants: { theme: { light: "dark:hidden", dark: "hidden dark:flex" } } },
);
export const sheetIcon = cva("flex size-11 shrink-0 items-center justify-center rounded-md bg-hairline");
/** Why the sheet is still open: the picture is ready (tap again) or didn't load. */
export const sheetStatus = cva("m-0 mb-1 text-footnote empty:hidden", {
  variants: { tone: { info: "text-ink-2", alert: "text-caution" } },
});
/** "Saved", after the sheet closes on a computer. Sits above the Share bar. */
export const storyToast = cva(
  "pointer-events-none fixed inset-x-0 bottom-24 z-50 mx-auto w-fit max-w-sm rounded-lg bg-surface px-4 py-3 text-center text-callout text-ink empty:hidden",
);
export const sheetText = cva("flex flex-1 flex-col gap-0.5");
export const sheetOptionTitle = cva("text-headline font-semibold");
export const sheetOptionSub = cva("text-footnote text-ink-2");
export const sheetCancel = cva("mt-2.5 flex h-13 items-center justify-center rounded-lg bg-hairline text-headline font-semibold text-ink no-underline");

// ---------------------------------------------------------------- Share page (public)

export const shareTop = cva("flex min-h-13 items-center justify-between");
export const shareMake = cva("flex min-h-11 items-center text-callout font-semibold text-on-sky-2 no-underline");
export const shareWrap = cva("relative mx-auto aspect-square w-full max-w-90 overflow-hidden rounded-2xl border border-hairline bg-surface");
export const shareAwards = cva("-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 scrollbar-none");
export const shareAward = cva("relative size-55 shrink-0 snap-start overflow-hidden rounded-xl border border-hairline bg-surface");
export const shareNote = cva("m-0 text-footnote text-ink-2");
export const shareCta = cva("sticky bottom-0 -mx-5 mt-auto flex flex-col gap-2 bg-linear-to-b from-transparent to-bg to-30% px-5 pt-6 pb-cta");
export const shareCtaSub = cva("self-center text-footnote text-ink-2");

// ---------------------------------------------------------------- Fixtures

export const tickerScroll = cva("overflow-x-auto scrollbar-none");
export const ticker = cva("flex w-max flex-col gap-1.5 px-5");
export const tickerRow = cva("flex gap-1.5");
export const tickerTeam = cva("sticky left-0 z-10 -ml-5 flex h-12 w-19.5 shrink-0 flex-col justify-center bg-bg pl-5");
export const tickerShort = cva("text-callout font-bold no-underline");
export const tickerRun = cva("text-micro font-semibold tabular-nums text-ink-2");
export const tickerGw = cva("flex shrink-0 justify-center text-caption font-bold tracking-wide text-ink-2", {
  variants: { width: { normal: "w-14.5", wide: "w-21.5" } },
});
export const tickerCell = cva("flex h-12 shrink-0 flex-col gap-0.5", {
  variants: { width: { normal: "w-14.5", wide: "w-21.5" } },
});
export const fixture = cva("flex flex-1 items-center justify-center rounded-sm", {
  variants: {
    difficulty: { 1: "bg-diff-1 text-on-diff-1", 2: "bg-diff-2 text-on-diff-2", 3: "bg-diff-3 text-on-diff-3", 4: "bg-diff-4 text-on-diff-4", 5: "bg-diff-5 text-on-diff-5" },
    layout: { single: "flex-col gap-1", double: "flex-row gap-1.25" },
  },
  defaultVariants: { layout: "single" },
});
export const fixtureOpponent = cva("font-bold leading-none tracking-wide", {
  variants: { layout: { single: "text-callout", double: "text-micro" } },
  defaultVariants: { layout: "single" },
});
export const fixtureSub = cva("text-micro font-semibold leading-none tabular-nums opacity-85");
export const fixtureBlank = cva("flex flex-1 items-center justify-center rounded-sm border-fine border-dashed border-ink-3 text-center text-micro font-semibold text-ink-2");
export const legend = cva("flex items-center gap-2 px-5 text-footnote text-ink-2");
export const legendSwatch = cva("flex size-6 items-center justify-center rounded-xs text-caption font-bold", {
  variants: { difficulty: { 1: "bg-diff-1 text-on-diff-1", 2: "bg-diff-2 text-on-diff-2", 3: "bg-diff-3 text-on-diff-3", 4: "bg-diff-4 text-on-diff-4", 5: "bg-diff-5 text-on-diff-5" } },
});

// ---------------------------------------------------------------- Players

export const filters = cva("-mx-5 flex gap-2 overflow-x-auto px-5 scrollbar-none");
export const filterChip = cva(
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface px-3.5 text-callout font-semibold text-ink no-underline current:bg-ink current:text-bg",
);
export const filterCount = cva("font-medium tabular-nums opacity-70");
export const newsRow = cva("flex flex-col gap-1 border-t border-hairline py-3.5");
export const newsHead = cva("flex items-center justify-between gap-3 text-headline");
export const newsText = cva("text-callout text-ink");
export const newsMeta = cva("text-footnote text-ink-2");
export const statusChip = cva("inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-footnote font-bold", {
  variants: {
    status: {
      injured: "bg-down text-on-down",
      doubtful: "bg-caution text-on-caution",
      suspended: "bg-ink text-bg",
      unavailable: "border-fine border-ink-3 text-ink-2",
    },
  },
});
export const teamMenu = cva("self-start");
export const teamMenuList = cva("mt-2 grid grid-cols-4 gap-1.5 rounded-2xl bg-surface p-2");
export const teamMenuItem = cva("flex h-10 items-center justify-center rounded-md text-footnote font-bold text-ink no-underline current:bg-ink current:text-bg");

// ---------------------------------------------------------------- Tab bar

export const tabBar = cva("fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-tabbar-bg pb-safe backdrop-blur-md");
export const tabBarInner = cva("mx-auto flex h-21 max-w-md pt-1.5");
export const tab = cva("flex flex-1 flex-col items-center gap-0.75 pt-1 text-micro font-semibold text-ink-2 no-underline current:text-ink");

// ---------------------------------------------------------------- Kept from slice 1

export const placeholderMain = cva("flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center");
export const heading = cva("", {
  variants: { level: { display: "text-display", body: "text-body text-ink-2" } },
  defaultVariants: { level: "body" },
});

// ---------------------------------------------------------------- Planner: Start and Your team

export const plannerTagline = cva("text-headline font-semibold text-on-sky-2");
export const plannerForm = cva("mt-10 flex flex-col gap-2.5");
export const orRule = cva("flex items-center gap-3 text-footnote font-semibold text-ink-3 before:h-px before:flex-1 before:bg-hairline after:h-px after:flex-1 after:bg-hairline");
export const scratchLink = cva("flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border-fine border-surface-3 text-ink no-underline");
export const scratchTitle = cva("text-headline font-bold");
export const scratchSub = cva("text-callout text-ink-2");

/** "Planner" and the team under it. */
export const plannerHeading = cva("flex min-w-0 flex-1 flex-col gap-1");
/** The team under the title: a button that opens Change team (a link to Start before the page's script runs). */
export const teamButton = cva("-ml-0.5 flex min-h-11 max-w-full items-center gap-2 self-start pr-3 pl-0.5 text-headline text-on-sky no-underline");
export const teamButtonName = cva("truncate");
export const teamButtonChevron = cva("shrink-0 opacity-80");

export const ratingHero = cva("flex flex-col gap-1.5");
/** A big number with its unit beside it (the compare sheet, the review). */
export const ratingFigure = cva("flex items-end gap-3");
export const ratingNumber = cva("text-hero tabular-nums");
export const ratingUnit = cva("flex flex-col pb-0.5 text-headline font-semibold leading-tight text-ink-2");
/** Your team's rating: the number, then one line under it. */
export const ratingStack = cva("m-0 flex flex-col gap-2.5");
export const ratingLine = cva("text-headline text-ink-2");
export const explain = cva("group/explain");
export const explainToggle = cva("flex min-h-11 w-fit cursor-pointer items-center gap-1.5 text-headline text-ink-2");
export const explainChevron = cva("shrink-0 transition-transform group-open/explain:rotate-180 motion-reduce:transition-none");
export const explainBody = cva("m-0 text-body text-ink-2");

// Your league: grouped rows, iOS Settings style. Nothing clips them, so the
// Compare in menu can float over the rows below it.
export const leagueGroup = cva("flex flex-col rounded-xl bg-surface");
export const leagueRow = cva("flex min-h-13 items-center gap-3 px-4 text-body text-ink no-underline", {
  variants: {
    /** The rule above every row but the first. */
    rule: { true: "border-t border-hairline", false: "" },
    /** Rows that go somewhere darken while pressed, rounded to the group's corner. */
    press: { top: "rounded-t-xl active:bg-surface-2", bottom: "rounded-b-xl active:bg-surface-2", none: "" },
    /** A label at the start and a chevron at the end. */
    spread: { true: "justify-between", false: "" },
  },
  defaultVariants: { rule: false, press: "none", spread: false },
});
export const leagueRowLabel = cva("shrink-0 text-ink-2");
export const leagueMenu = cva("relative");
export const leagueValue = cva("ml-auto flex min-w-0 items-center gap-1.5 font-semibold");
export const leagueValueName = cva("truncate");
export const leagueMenuIcon = cva("shrink-0 text-ink-2");
export const leagueOptions = cva("absolute top-full right-2 z-10 m-0 flex w-68 list-none flex-col rounded-lg border border-hairline bg-menu p-0 py-1.5 shadow-xl");
export const leagueOption = cva("flex min-h-11 items-center gap-2.5 pr-3.5 pl-3 text-body text-ink no-underline active:bg-surface-2");
export const leagueTick = cva("shrink-0", { variants: { on: { true: "", false: "invisible" } } });
export const leagueOptionName = cva("min-w-0 flex-1 truncate");
export const leagueOptionSize = cva("text-callout tabular-nums text-ink-2");
export const paperRankBadge = cva("flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-1.5 text-callout font-bold tabular-nums", {
  variants: { top: { true: "bg-accent text-on-accent", false: "bg-surface-3 text-ink" } },
});
export const paperRankQuiet = cva("text-ink-2");
/** The rank row while a league's squads are rated: a dot and a line, never a spinner. */
export const rankSkeleton = cva("shrink-0 rounded-full bg-surface-3", { variants: { shape: { dot: "size-7", line: "h-3.5 w-48" } } });
export const leagueFallback = cva("h-47 rounded-xl bg-surface");

// Change team: the sheet's form and the teams rated on this phone.
export const teamForm = cva("flex flex-col gap-2.5");
export const recentHeading = cva("m-0 ml-4 text-callout font-semibold text-ink-2");
export const recentList = cva("m-0 flex list-none flex-col overflow-hidden rounded-xl bg-surface-2 p-0");
export const recentItem = cva("border-t border-surface-3 first:border-t-0");
export const recentRow = cva("flex min-h-15 items-center gap-3 px-4 text-ink no-underline active:bg-surface-3");
export const recentText = cva("flex min-w-0 flex-1 flex-col gap-0.5");
export const recentName = cva("truncate text-headline");
export const recentManager = cva("text-callout text-ink-2");

export const weekGrid = cva("m-0 grid list-none grid-cols-6 gap-1.5 p-0");
export const weekTile = cva("flex flex-col items-center gap-1 rounded-lg bg-surface py-3");
export const weekGw = cva("text-caption font-semibold text-ink-2");
export const weekPoints = cva("text-headline font-bold tabular-nums");

export const partList = cva("m-0 flex list-none flex-col gap-3.5 p-0");
export const partRow = cva("flex flex-col gap-2");
export const partHead = cva("flex items-baseline justify-between text-body");
export const partValue = cva("font-bold tabular-nums");
/** A share bar, drawn as SVG so its length is an attribute rather than an inline style. */
export const partBar = cva("block h-1.5 w-full overflow-hidden rounded-full");
export const partTrack = cva("fill-surface-2");
export const partFill = cva("", { variants: { part: { position: "fill-ink-2", captain: "fill-accent" } } });

export const ideaList = cva("m-0 flex list-none flex-col p-0");
export const ideaRow = cva("flex min-h-16 items-center gap-3 border-t border-hairline py-2.5 text-ink no-underline");
export const ideaMoves = cva("flex min-w-0 flex-1 flex-col gap-1");
export const ideaMove = cva("flex items-center gap-2 text-headline");
export const ideaOut = cva("font-medium text-ink-2");
export const ideaArrow = cva("shrink-0 text-ink-3");
export const ideaSub = cva("text-callout text-ink-2");
export const ideaGain = cva("text-headline font-bold tabular-nums text-up");

// ---------------------------------------------------------------- League: On paper

export const paperHeadline = cva("m-0 text-headline font-bold");
export const paperHeadlineSub = cva("m-0 text-callout text-ink-2");

// ---------------------------------------------------------------- Planner: the plan board (browser)

export const planNav = cva("-mx-2.5 flex items-center justify-between");
export const planBack = cva("inline-flex min-h-11 items-center gap-1.5 px-2.5 text-headline font-semibold text-on-sky no-underline");
export const planTools = cva("flex gap-1");
/** Undo and redo: dimmed (not hidden) when there's nothing to undo, so the bar doesn't shift. */
export const planTool = cva("inline-flex size-11 items-center justify-center rounded-full bg-on-sky-fill text-on-sky disabled:opacity-40");
export const gwTabs = cva("-mx-5 flex gap-2 overflow-x-auto px-5 scrollbar-none");
export const gwTab = cva(
  "flex h-14.5 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-on-sky-fill text-ink aria-selected:bg-accent aria-selected:text-on-accent",
);
export const gwTabLabel = cva("text-caption font-semibold opacity-85");
export const gwTabPoints = cva("text-headline font-bold tabular-nums");
export const planDeadline = cva("-mt-1 text-body text-ink-2");
export const planStats = cva("m-0 grid grid-cols-3 rounded-xl bg-surface");
export const planStat = cva("flex flex-col gap-1 border-l border-hairline px-3.5 py-3 first:border-l-0");
export const planStatLabel = cva("text-caption font-semibold text-ink-2");
export const planStatValue = cva("m-0 flex items-baseline gap-1 text-title font-bold tabular-nums");
export const planStatNote = cva("text-caption font-bold text-ink-3");
export const planMoves = cva("m-0 flex list-none flex-col gap-1.5 p-0");
export const planMove = cva("flex min-h-13 items-center justify-between gap-3 rounded-lg bg-surface px-4 py-2");
export const planMoveCost = cva("shrink-0 text-callout font-bold", { variants: { hit: { true: "text-down", false: "text-ink-2" } } });
export const planHint = cva("m-0 text-body text-ink-2");

/** A player on the planner's pitch or bench: a button that opens his sheet. */
export const planToken = cva("flex min-w-0 max-w-24 flex-1 flex-col items-center gap-0.75 text-inherit");
export const emptyShirt = cva("", { variants: { part: { shirt: "fill-on-pitch/10 stroke-on-pitch/60", plus: "fill-none stroke-on-pitch" } } });
/** The draft's club-limit notice. */
export const draftLimit = cva("m-0 flex items-center gap-2.5 rounded-lg bg-surface px-3.5 py-3 text-body");
export const draftLimitDot = cva("size-2 shrink-0 rounded-full bg-caution");
/** An empty shirt's position, on a dark chip so it reads on the grass. */
export const slotLabel = cva("rounded-xs bg-black/40 px-1.5 py-1 text-micro font-bold leading-none tracking-wider text-on-pitch");
export const tokenRole = cva(
  "absolute -top-1.25 -right-2.25 flex h-4.25 min-w-4.25 items-center justify-center rounded-full bg-pitch-badge px-0.75 text-micro font-bold text-on-pitch-badge",
);
export const tokenNew = cva("absolute -top-1.25 -left-3 flex h-4 items-center rounded-full bg-up px-1 text-micro font-bold text-on-up");
export const tokenFixture = cva("whitespace-nowrap text-micro font-semibold", { variants: { on: { pitch: "text-on-pitch/80", surface: "text-ink-2" } } });
export const benchName = cva("max-w-full truncate px-0.5 text-caption font-semibold");
export const benchPoints = cva("rounded-sm bg-surface-3 px-2 py-1 text-footnote font-bold leading-none tabular-nums text-ink");
export const bench = cva("flex flex-col gap-3 rounded-2xl bg-surface px-1 pt-3.5 pb-4");
export const benchHeading = cva("m-0 ml-3.5 text-footnote font-bold uppercase tracking-wider text-ink-2");
export const benchRow = cva("flex justify-evenly");

export const chipGrid = cva("grid grid-cols-2 gap-2");
export const chipCard = cva("flex min-h-16 flex-col items-start gap-1 rounded-lg bg-surface px-3.5 py-3 text-left disabled:text-ink-3", {
  variants: { playing: { true: "ring-2 ring-accent", false: "" } },
  defaultVariants: { playing: false },
});
export const chipName = cva("text-headline font-bold");
export const chipSub = cva("text-callout font-semibold tabular-nums", { variants: { tone: { gain: "text-up", quiet: "text-ink-2", off: "text-ink-3" } } });
export const planFootnote = cva("m-0 text-footnote text-ink-2");

/** The bar above the tab bar once the plan changes something. */
export const planBar = cva(
  "fixed inset-x-0 bottom-tabs z-20 mx-auto flex max-w-md items-center justify-between gap-3 border-t border-hairline bg-tabbar-bg px-5 py-3 backdrop-blur",
);
export const planBarGain = cva("flex flex-col gap-0.75");
export const planBarPoints = cva("text-headline font-bold tabular-nums text-up");
export const planBarSub = cva("text-callout font-semibold text-ink-2");
export const planBarButton = cva("inline-flex h-12 shrink-0 items-center rounded-lg bg-accent px-5 text-headline font-bold text-on-accent");
/** Room under the board for the plan bar, so it never covers the last row. */
export const planBarSpace = cva("h-17 shrink-0");

// Sheets (native <dialog>): a panel from the bottom over a dimmed page.
export const planSheet = cva(
  "fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-dvh w-full max-w-md overflow-y-auto rounded-t-sheet bg-surface p-0 text-ink backdrop:bg-black/60",
);
/** The sheet's content. Taps outside it land on the dialog itself, which closes it. */
export const planSheetBody = cva("flex flex-col gap-5 px-5 pt-2.5 pb-sheet");
export const sheetHeader = cva("flex items-center gap-3.5");
export const sheetHeaderText = cva("flex min-w-0 flex-1 flex-col gap-0.75");
export const sheetName = cva("m-0 text-title font-bold");
export const sheetMeta = cva("text-callout text-ink-2");
export const sheetClose = cva("inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2");
export const sheetShirt = cva("flex size-13 shrink-0 items-center justify-center rounded-full bg-surface-2");
export const factRow = cva("m-0 grid grid-cols-4 border-y border-hairline py-3.5");
export const fact = cva("flex flex-col gap-1 border-l border-hairline pl-3 first:border-l-0 first:pl-0");
export const factLabel = cva("text-caption font-semibold text-ink-2");
export const factValue = cva("m-0 text-headline font-bold tabular-nums");
export const sheetNews = cva("m-0 rounded-md bg-surface-2 px-3.5 py-3 text-body");
export const trendChip = cva("inline-flex h-6 items-center rounded-full px-2.5 text-footnote font-bold", {
  variants: { direction: { rise: "bg-up text-on-up", fall: "bg-down text-on-down" } },
});
export const barChart = cva("m-0 grid list-none grid-cols-6 gap-1.5 p-0");
export const barColumn = cva("flex flex-col items-center gap-1.5");
export const barValue = cva("text-footnote font-bold tabular-nums");
export const barTrack = cva("block h-14 w-full");
/** A player's bar, its height one of 14 steps (0–7 points), with its number on top. */
export const barStack = cva("flex h-19 w-full flex-col items-center justify-end gap-1");
export const bar = cva("w-full rounded-t-sm rounded-b-xs bg-ink-3", {
  variants: {
    step: {
      1: "h-1", 2: "h-2", 3: "h-3", 4: "h-4", 5: "h-5", 6: "h-6", 7: "h-7",
      8: "h-8", 9: "h-9", 10: "h-10", 11: "h-11", 12: "h-12", 13: "h-13", 14: "h-14",
    },
  },
});
export const barFill = cva("", { variants: { tone: { player: "fill-ink-3", out: "fill-ink-3", in: "fill-accent" } } });
export const barLabel = cva("flex flex-col items-center gap-0.5");
export const barOpp = cva("text-caption font-bold");
export const barGw = cva("text-micro font-semibold text-ink-2");
export const sheetActions = cva("flex flex-col gap-2.5");
export const outlineButton = cva("inline-flex h-13 w-full items-center justify-center rounded-lg border-fine border-surface-3 text-headline font-bold text-ink disabled:opacity-40");

// Planner: the transfer side by side
export const compareSides = cva("grid grid-cols-2 gap-2");
export const compareSide = cva("flex items-center gap-2.5 rounded-xl bg-surface-2 p-3");
export const compareTag = cva("text-caption font-bold uppercase tracking-wider", { variants: { tone: { out: "text-down", in: "text-up" } } });
export const costValue = cva("font-bold", { variants: { hit: { true: "text-down", false: "text-ink" } } });
export const compareName = cva("truncate text-headline font-bold");
export const compareGain = cva("text-hero tabular-nums text-up");
export const compareLedger = cva("m-0 flex flex-col");
export const compareLedgerRow = cva("flex min-h-11 items-center justify-between border-t border-hairline text-body [&>dt]:text-ink-2 [&>dd]:m-0 [&>dd]:font-bold [&>dd]:tabular-nums");
export const compareTip = cva("flex items-center gap-3 rounded-lg bg-surface-2 px-3.5 py-3 [&>p]:flex-1");
export const legendKeys = cva("flex gap-3 text-footnote font-semibold text-ink-2 tabular-nums");
export const legendKey = cva("flex items-center gap-1.5");
export const legendDot = cva("size-2 rounded-xs", { variants: { tone: { out: "bg-ink-3", in: "bg-accent" } } });

// Planner: pick a replacement
export const replaceFilters = cva("mt-2 flex flex-col gap-2.5");
export const replaceSelect = cva("h-12 w-full rounded-lg bg-surface px-3.5 text-body font-semibold text-ink");
export const replaceHead = cva("flex justify-between pb-2 text-caption font-bold uppercase tracking-wider text-ink-2");
export const replaceList = cva("m-0 flex list-none flex-col p-0");
export const replaceRow = cva("flex min-h-16.5 w-full items-center gap-3 border-t border-hairline py-2 text-left text-ink disabled:opacity-55");
export const replaceRowText = cva("flex min-w-0 flex-1 flex-col gap-0.75");
export const replaceRowName = cva("flex items-center gap-1.5 truncate text-headline");
export const replaceRowSub = cva("truncate text-callout", { variants: { blocked: { true: "text-down", false: "text-ink-2" } }, defaultVariants: { blocked: false } });
export const replaceRowEnd = cva("flex shrink-0 flex-col items-end gap-0.75");
export const replaceGain = cva("text-headline font-bold tabular-nums", { variants: { tone: { up: "text-up", quiet: "text-ink-2", plain: "text-ink" } } });

// Planner: review
export const reviewRows = cva("m-0 flex list-none flex-col p-0");
export const reviewRow = cva("flex min-h-15 items-center gap-3.5 border-t border-hairline py-2.5");
export const reviewGw = cva("w-14 shrink-0 text-headline font-bold");
export const reviewText = cva("flex min-w-0 flex-1 flex-col gap-0.75");
export const reviewPoints = cva("text-headline font-bold tabular-nums");

