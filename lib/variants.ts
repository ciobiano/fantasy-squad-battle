import { cva } from "class-variance-authority";

// Every component's Tailwind classes live here as CVA definitions (see the
// global design rules). JSX composes these; it never carries raw class strings.
// Colours, radii and the type scale are the Design System's tokens
// (app/tokens.css, app/globals.css). Sizes use Tailwind's 4px scale.

// ---------------------------------------------------------------- Page

export const rootHtml = cva("h-full antialiased");
export const rootBody = cva("min-h-full flex flex-col bg-bg text-ink font-sans text-body");

/** A screen: room at the bottom for the tab bar when there is one. */
export const page = cva("relative isolate flex min-h-dvh flex-col overflow-x-clip", {
  variants: { tabs: { true: "pb-28", false: "pb-8" } },
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
export const sky = cva("pointer-events-none absolute inset-x-0 top-0 -z-10 bg-sky", {
  variants: {
    height: { start: "h-108", picker: "h-80", league: "h-118", fixtures: "h-48", players: "h-84" },
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
  "flex flex-1 items-center justify-center rounded-sm text-callout text-ink-2 has-checked:bg-segment-selected has-checked:font-bold has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-focus current:bg-segment-selected current:font-bold current:text-ink aria-pressed:bg-segment-selected aria-pressed:font-bold aria-pressed:text-ink",
  { variants: { size: { md: "h-10", sm: "h-8.5" } }, defaultVariants: { size: "md" } },
);

// ---------------------------------------------------------------- Forms

export const form = cva("flex flex-col gap-2.5");
export const fieldLabel = cva("mt-1.5 text-callout font-semibold");
export const input = cva(
  "h-13 w-full rounded-lg border-2 border-transparent bg-surface px-4 text-body text-ink placeholder:text-ink-2 focus-visible:border-focus focus-visible:outline-none flagged:border-down",
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

export const pitch = cva("relative flex h-101 flex-col justify-between overflow-hidden rounded-2xl bg-pitch px-1.5 py-4");
export const pitchLine = cva("relative flex justify-evenly");
export const pitchMark = cva("absolute border-fine border-pitch-line", {
  variants: {
    at: {
      topBox: "left-1/2 top-0 h-14 w-38 -translate-x-1/2 border-t-0",
      halfway: "inset-x-0 top-1/2 h-0 border-x-0 border-b-0",
      circle: "left-1/2 top-1/2 size-21 -translate-x-1/2 -translate-y-1/2 rounded-full",
      bottomBox: "bottom-0 left-1/2 h-14 w-38 -translate-x-1/2 border-b-0",
    },
  },
});
/** Players share their line equally (up to 80px each), so a five-man midfield still fits a phone. */
export const token = cva("flex min-w-0 max-w-20 flex-1 flex-col items-center gap-1.5");
export const tokenPoints = cva("relative flex h-8 min-w-10 items-center justify-center rounded-sm px-2.5 text-headline font-bold tabular-nums", {
  variants: { top: { true: "bg-accent text-on-accent", false: "bg-surface text-ink" } },
  defaultVariants: { top: false },
});
export const tokenOwners = cva("absolute -right-2.5 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.25 text-micro font-bold text-bg");
export const tokenName = cva("max-w-full truncate px-0.5 text-caption font-semibold");

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
  "fixed inset-0 z-50 flex justify-center bg-black text-ink select-none touch-manipulation touch-callout-none",
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
  "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md flex-col gap-1.5 rounded-t-sheet bg-surface px-5 pt-2.5 pb-8",
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
export const shareCta = cva("sticky bottom-0 -mx-5 mt-auto flex flex-col gap-2 bg-linear-to-b from-transparent to-bg to-30% px-5 pt-6 pb-7");
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

export const tabBar = cva("fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-tabbar-bg backdrop-blur-md");
export const tabBarInner = cva("mx-auto flex h-21 max-w-md pt-1.5");
export const tab = cva("flex flex-1 flex-col items-center gap-0.75 pt-1 text-micro font-semibold text-ink-2 no-underline current:text-ink");

// ---------------------------------------------------------------- Kept from slice 1

export const placeholderMain = cva("flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center");
export const heading = cva("", {
  variants: { level: { display: "text-display", body: "text-body text-ink-2" } },
  defaultVariants: { level: "body" },
});
