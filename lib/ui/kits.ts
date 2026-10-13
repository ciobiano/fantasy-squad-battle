// Club colours for the Team of the Week shirts: the home shirt's main colour,
// its trim (sleeves and collar) and whether it's striped. Colours only, never
// crests or badges (CLAUDE.md legal guardrails). Keyed by FPL's short name; a
// club that isn't listed (a newly promoted side) wears a plain grey shirt.

export interface Kit {
  readonly body: string;
  readonly trim: string;
  /** Vertical stripes of body and trim. */
  readonly stripes: boolean;
}

const kit = (body: string, trim: string, stripes = false): Kit => ({ body, trim, stripes });

const KITS: Readonly<Record<string, Kit>> = {
  ARS: kit("#DB0007", "#FFFFFF"),
  AVL: kit("#670E36", "#95BFE5"),
  BOU: kit("#DA291C", "#111111", true),
  BRE: kit("#E30613", "#FFFFFF", true),
  BHA: kit("#0057B8", "#FFFFFF", true),
  BUR: kit("#6C1D45", "#99D6EA"),
  CHE: kit("#034694", "#FFFFFF"),
  COV: kit("#59CBE8", "#FFFFFF"),
  CRY: kit("#C4122E", "#1B458F", true),
  EVE: kit("#003399", "#FFFFFF"),
  FUL: kit("#FFFFFF", "#111111"),
  HUL: kit("#F5A12D", "#111111", true),
  IPS: kit("#0044A9", "#FFFFFF"),
  LEE: kit("#FFFFFF", "#1D428A"),
  LEI: kit("#003090", "#FDBE11"),
  LIV: kit("#C8102E", "#C8102E"),
  MCI: kit("#6CABDD", "#FFFFFF"),
  MUN: kit("#DA291C", "#FFFFFF"),
  NEW: kit("#241F20", "#FFFFFF", true),
  NFO: kit("#DD0000", "#FFFFFF"),
  SOU: kit("#D71920", "#FFFFFF", true),
  SUN: kit("#EB172B", "#FFFFFF", true),
  TOT: kit("#FFFFFF", "#132257"),
  WHU: kit("#7A263A", "#1BB1E7"),
  WOL: kit("#FDB913", "#231F20"),
};

export const NO_KIT: Kit = kit("#9BA1A6", "#9BA1A6");

export const kitFor = (club: string): Kit => KITS[club] ?? NO_KIT;

/** Clubs whose shirts are striped, for the stripe patterns a pitch defines once. */
export const stripedClubs = (clubs: readonly string[]): readonly string[] => [...new Set(clubs)].filter((club) => kitFor(club).stripes);
