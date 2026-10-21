// The plan board's words (/planner/{id}/plan and the draft). Kept apart from the
// main catalogue because the board runs in the browser: it loads these lines
// only, not every screen's copy in three languages.
import type { Lang } from "./lang";

type Chip = "wildcard" | "freehit" | "bboost" | "3xc";
type Position = "GK" | "DEF" | "MID" | "FWD";

export interface PlanCopy {
  readonly back: string;
  readonly title: string;
  readonly draftTitle: string;
  readonly undo: string;
  readonly redo: string;
  readonly gw: (gw: number) => string;
  readonly window: (first: number, last: number) => string;
  readonly gwAria: (gw: number, points: string) => string;
  readonly gwTabs: string;
  readonly deadline: (when: string) => string;
  readonly freeTransfers: string;
  readonly bank: string;
  readonly hits: string;
  readonly est: string;
  readonly hint: string;
  readonly startingXI: string;
  readonly benchHeading: string;
  readonly home: string;
  readonly away: string;
  readonly blank: string;
  readonly captainBadge: string;
  readonly viceBadge: string;
  readonly newBadge: string;
  readonly tokenAria: (name: string, role: "captain" | "vice" | null, fixture: string, points: string) => string;
  readonly chipsHeading: string;
  readonly chipsAside: (until: number) => string;
  readonly chips: Readonly<Record<Chip, string>>;
  readonly chipAvailable: string;
  readonly chipThisWeek: (points: string) => string;
  readonly chipWith: (points: string, name: string) => string;
  readonly chipPlaying: string;
  readonly chipUsed: (gw: number) => string;
  readonly footnote: (gw: number) => string;
  readonly planGain: (points: string) => string;
  readonly transfersCount: (count: number, cost: string) => string;
  readonly free: string;
  readonly hit: (points: number) => string;
  readonly review: string;
  readonly moveAria: (out: string, into: string) => string;
  // Player sheet
  readonly positions: Readonly<Record<Position, string>>;
  readonly positionsPlural: Readonly<Record<Position, string>>;
  readonly onBench: string;
  readonly price: string;
  readonly sell: string;
  readonly form: string;
  readonly owned: string;
  readonly projected: string;
  readonly projectedTotal: (points: string, window: string) => string;
  readonly rising: (day: string | null) => string;
  readonly falling: (day: string | null) => string;
  readonly transferOut: string;
  readonly startHim: string;
  readonly makeCaptain: string;
  readonly close: string;
  // Pick a replacement
  readonly replaceTitle: (name: string) => string;
  readonly replaceSub: (position: string, budget: string) => string;
  readonly search: (positionPlural: string) => string;
  readonly sortBy: string;
  readonly sorts: { readonly gain: string; readonly price: string; readonly form: string; readonly projected: string };
  readonly allClubs: string;
  readonly club: string;
  readonly columnPlayer: string;
  readonly columnGain: (window: string) => string;
  readonly columnProjected: (window: string) => string;
  readonly overBudget: (money: string) => string;
  readonly clubLimit: (count: number, club: string) => string;
  readonly chance: (percent: number) => string;
  readonly rowAria: (name: string, club: string, price: string, value: string) => string;
  readonly blockedAria: (name: string, reasons: string) => string;
  readonly nobody: string;
  // Compare
  readonly compareTitle: (into: string, out: string) => string;
  readonly out: string;
  readonly in: string;
  readonly sellFor: (money: string) => string;
  readonly buyFor: (money: string) => string;
  readonly gainNote: (window: string) => string;
  readonly gainAfterHit: (hit: number, window: string) => string;
  readonly cost: string;
  readonly costFree: string;
  readonly costHit: (hit: number) => string;
  readonly bankAfter: string;
  readonly estimate: (money: string) => string;
  readonly waitTip: (gw: number, points: string) => string;
  readonly moveTo: (gw: number) => string;
  readonly add: string;
  readonly addHit: (hit: number) => string;
  // Chips sheet
  readonly chipsTitle: string;
  readonly chipsWeek: (gw: number) => string;
  readonly chipSubs: { readonly bboost: string; readonly "3xc": (name: string) => string; readonly freehit: string; readonly wildcard: string };
  readonly chipUsedLong: (gw: number, back: number | null) => string;
  readonly chipNote: (until: number) => string;
  readonly cancelChip: string;
  // Review
  readonly reviewTitle: string;
  readonly vsNone: string;
  readonly projectedChange: (now: string, was: string) => string;
  readonly weekByWeek: string;
  readonly captainNote: (name: string) => string;
  readonly fplTitle: string;
  readonly fplBody: (deadline: string) => string;
  readonly openFpl: string;
  readonly estimates: string;
}

const en: PlanCopy = {
  back: "Your team",
  title: "Plan",
  draftTitle: "Draft",
  undo: "Undo",
  redo: "Redo",
  gw: (gw) => `GW${gw}`,
  window: (first, last) => `GW${first}–${last}`,
  gwAria: (gw, points) => `Gameweek ${gw}, ${points} points projected`,
  gwTabs: "Gameweek",
  deadline: (when) => `Deadline ${when}`,
  freeTransfers: "Free transfers",
  bank: "Bank",
  hits: "Hits",
  est: "est.",
  hint: "Tap a player to transfer, captain or bench.",
  startingXI: "Starting XI",
  benchHeading: "Bench",
  home: "H",
  away: "A",
  blank: "No match",
  captainBadge: "C",
  viceBadge: "V",
  newBadge: "IN",
  tokenAria: (name, role, fixture, points) => `${name}${role === "captain" ? ", captain" : role === "vice" ? ", vice-captain" : ""}, ${fixture}, ${points} points projected`,
  chipsHeading: "Chips",
  chipsAside: (until) => `One of each until GW${until}`,
  chips: { wildcard: "Wildcard", freehit: "Free Hit", bboost: "Bench Boost", "3xc": "Triple Captain" },
  chipAvailable: "Available",
  chipThisWeek: (points) => `${points} this week`,
  chipWith: (points, name) => `${points} with ${name}`,
  chipPlaying: "Playing this week",
  chipUsed: (gw) => `Used GW${gw}`,
  footnote: (gw) => `Squad as of the GW${gw} deadline. Bank and free transfers are estimates.`,
  planGain: (points) => `${points} pts`,
  transfersCount: (count, cost) => `${count} transfer${count === 1 ? "" : "s"} · ${cost}`,
  free: "free",
  hit: (points) => `−${points}`,
  review: "Review plan",
  moveAria: (out, into) => `${out} out, ${into} in`,
  positions: { GK: "Goalkeeper", DEF: "Defender", MID: "Midfielder", FWD: "Forward" },
  positionsPlural: { GK: "goalkeepers", DEF: "defenders", MID: "midfielders", FWD: "forwards" },
  onBench: "Bench",
  price: "Price",
  sell: "Sell (est.)",
  form: "Form",
  owned: "Owned",
  projected: "Projected",
  projectedTotal: (points, window) => `${points} pts · ${window}`,
  rising: (day) => (day ? `Price rise expected ${day}` : "Price rise expected"),
  falling: (day) => (day ? `Price fall expected ${day}` : "Price fall expected"),
  transferOut: "Transfer out",
  startHim: "Start him",
  makeCaptain: "Make captain",
  close: "Close",
  replaceTitle: (name) => `Replace ${name}`,
  replaceSub: (position, budget) => `${position} · up to ${budget}`,
  search: (plural) => `Search ${plural}`,
  sortBy: "Sort by",
  sorts: { gain: "Gain", price: "Price", form: "Form", projected: "Projected" },
  allClubs: "All clubs",
  club: "Club",
  columnPlayer: "Player",
  columnGain: (window) => `Your team, ${window}`,
  columnProjected: (window) => `Projected, ${window}`,
  overBudget: (money) => `${money} over budget`,
  clubLimit: (count, club) => `${count} from ${club} already`,
  chance: (percent) => `${percent}%`,
  rowAria: (name, club, price, value) => `${name}, ${club}, ${price}, ${value} points`,
  blockedAria: (name, reasons) => `${name}: not possible, ${reasons}`,
  nobody: "No player matches.",
  compareTitle: (into, out) => `${into} for ${out}`,
  out: "Out",
  in: "In",
  sellFor: (money) => `Sell ${money} (est.)`,
  buyFor: (money) => `Buy ${money}`,
  gainNote: (window) => `pts for your team, ${window}`,
  gainAfterHit: (hit, window) => `pts after the −${hit} hit, ${window}`,
  cost: "Cost",
  costFree: "Free transfer",
  costHit: (hit) => `−${hit} pts · no free transfers left`,
  bankAfter: "Bank after",
  estimate: (money) => `${money} (est.)`,
  waitTip: (gw, points) => `Free in GW${gw}, and worth ${points} then.`,
  moveTo: (gw) => `Move to GW${gw}`,
  add: "Add to plan",
  addHit: (hit) => `Add to plan · −${hit}`,
  chipsTitle: "Play a chip",
  chipsWeek: (gw) => `Gameweek ${gw}`,
  chipSubs: {
    bboost: "Your bench scores too",
    "3xc": (name) => `${name} scores three times`,
    freehit: "A new squad for one week, then yours back",
    wildcard: "Unlimited free transfers this week",
  },
  chipUsedLong: (gw, back) => (back ? `Used in GW${gw}. Back from GW${back}.` : `Used in GW${gw}.`),
  chipNote: (until) => `One of each until GW${until}, then a fresh set.`,
  cancelChip: "Cancel chip",
  reviewTitle: "Your plan",
  vsNone: "pts vs no transfers",
  projectedChange: (now, was) => `${now} projected, from ${was}.`,
  weekByWeek: "Week by week",
  captainNote: (name) => `C ${name}`,
  fplTitle: "Make it on FPL",
  fplBody: (deadline) => `We plan, FPL makes the transfer. Do it before ${deadline}.`,
  openFpl: "Open FPL",
  estimates: "Bank and free transfers are estimates.",
};

const pcm: PlanCopy = {
  ...en,
  back: "Your team",
  hint: "Tap player to transfer, make captain or bench am.",
  chipsAside: (until) => `One of each till GW${until}`,
  chipAvailable: "Dey available",
  chipPlaying: "You dey play am this week",
  footnote: (gw) => `Squad as of GW${gw} deadline. Bank and free transfer na estimate.`,
  review: "Check your plan",
  moveAria: (out, into) => `${out} comot, ${into} enter`,
  rising: (day) => (day ? `Price fit rise ${day}` : "Price fit rise"),
  falling: (day) => (day ? `Price fit fall ${day}` : "Price fit fall"),
  startHim: "Start am",
  makeCaptain: "Make am captain",
  replaceSub: (position, budget) => `${position} · reach ${budget}`,
  clubLimit: (count, club) => `${count} from ${club} don full`,
  nobody: "No player match.",
  gainNote: (window) => `pts for your team, ${window}`,
  gainAfterHit: (hit, window) => `pts after −${hit} hit, ${window}`,
  costHit: (hit) => `−${hit} pts · free transfer don finish`,
  waitTip: (gw, points) => `E go free for GW${gw}, and e go give ${points} then.`,
  chipSubs: {
    bboost: "Your bench go score too",
    "3xc": (name) => `${name} go score three times`,
    freehit: "New squad for one week, then your own come back",
    wildcard: "Free transfer anyhow this week",
  },
  chipNote: (until) => `One of each till GW${until}, then new set.`,
  reviewTitle: "Your plan",
  vsNone: "pts pass no transfer",
  projectedChange: (now, was) => `${now} projected, from ${was}.`,
  fplBody: (deadline) => `We dey plan, na FPL you go make the transfer. Do am before ${deadline}.`,
  estimates: "Bank and free transfer na estimate.",
};

const fr: PlanCopy = {
  back: "Votre équipe",
  title: "Plan",
  draftTitle: "Brouillon",
  undo: "Annuler",
  redo: "Rétablir",
  gw: (gw) => `J${gw}`,
  window: (first, last) => `J${first}–${last}`,
  gwAria: (gw, points) => `Journée ${gw}, ${points} points prévus`,
  gwTabs: "Journée",
  deadline: (when) => `Date limite ${when}`,
  freeTransfers: "Transferts gratuits",
  bank: "Banque",
  hits: "Pénalités",
  est: "est.",
  hint: "Touchez un joueur pour le transférer, le nommer capitaine ou le mettre sur le banc.",
  startingXI: "Onze de départ",
  benchHeading: "Banc",
  home: "D",
  away: "E",
  blank: "Pas de match",
  captainBadge: "C",
  viceBadge: "V",
  newBadge: "NV",
  tokenAria: (name, role, fixture, points) => `${name}${role === "captain" ? ", capitaine" : role === "vice" ? ", vice-capitaine" : ""}, ${fixture}, ${points} points prévus`,
  chipsHeading: "Bonus",
  chipsAside: (until) => `Un de chaque jusqu’à la J${until}`,
  chips: { wildcard: "Wildcard", freehit: "Free Hit", bboost: "Bench Boost", "3xc": "Triple Capitaine" },
  chipAvailable: "Disponible",
  chipThisWeek: (points) => `${points} cette journée`,
  chipWith: (points, name) => `${points} avec ${name}`,
  chipPlaying: "Joué cette journée",
  chipUsed: (gw) => `Utilisé J${gw}`,
  footnote: (gw) => `Effectif à la date limite de la J${gw}. Banque et transferts gratuits estimés.`,
  planGain: (points) => `${points} pts`,
  transfersCount: (count, cost) => `${count} transfert${count === 1 ? "" : "s"} · ${cost}`,
  free: "gratuit",
  hit: (points) => `−${points}`,
  review: "Voir le plan",
  moveAria: (out, into) => `${out} sort, ${into} entre`,
  positions: { GK: "Gardien", DEF: "Défenseur", MID: "Milieu", FWD: "Attaquant" },
  positionsPlural: { GK: "gardiens", DEF: "défenseurs", MID: "milieux", FWD: "attaquants" },
  onBench: "Banc",
  price: "Prix",
  sell: "Revente (est.)",
  form: "Forme",
  owned: "Possédé",
  projected: "Prévu",
  projectedTotal: (points, window) => `${points} pts · ${window}`,
  rising: (day) => (day ? `Hausse de prix attendue ${day}` : "Hausse de prix attendue"),
  falling: (day) => (day ? `Baisse de prix attendue ${day}` : "Baisse de prix attendue"),
  transferOut: "Transférer",
  startHim: "Le titulariser",
  makeCaptain: "Nommer capitaine",
  close: "Fermer",
  replaceTitle: (name) => `Remplacer ${name}`,
  replaceSub: (position, budget) => `${position} · jusqu’à ${budget}`,
  search: (plural) => `Chercher des ${plural}`,
  sortBy: "Trier par",
  sorts: { gain: "Gain", price: "Prix", form: "Forme", projected: "Prévu" },
  allClubs: "Tous les clubs",
  club: "Club",
  columnPlayer: "Joueur",
  columnGain: (window) => `Votre équipe, ${window}`,
  columnProjected: (window) => `Prévu, ${window}`,
  overBudget: (money) => `${money} au-dessus du budget`,
  clubLimit: (count, club) => `Déjà ${count} de ${club}`,
  chance: (percent) => `${percent} %`,
  rowAria: (name, club, price, value) => `${name}, ${club}, ${price}, ${value} points`,
  blockedAria: (name, reasons) => `${name} : impossible, ${reasons}`,
  nobody: "Aucun joueur ne correspond.",
  compareTitle: (into, out) => `${into} pour ${out}`,
  out: "Sort",
  in: "Entre",
  sellFor: (money) => `Revente ${money} (est.)`,
  buyFor: (money) => `Achat ${money}`,
  gainNote: (window) => `pts pour votre équipe, ${window}`,
  gainAfterHit: (hit, window) => `pts après la pénalité de −${hit}, ${window}`,
  cost: "Coût",
  costFree: "Transfert gratuit",
  costHit: (hit) => `−${hit} pts · plus de transfert gratuit`,
  bankAfter: "Banque après",
  estimate: (money) => `${money} (est.)`,
  waitTip: (gw, points) => `Gratuit à la J${gw}, et vaut ${points} alors.`,
  moveTo: (gw) => `Passer à la J${gw}`,
  add: "Ajouter au plan",
  addHit: (hit) => `Ajouter au plan · −${hit}`,
  chipsTitle: "Jouer un bonus",
  chipsWeek: (gw) => `Journée ${gw}`,
  chipSubs: {
    bboost: "Votre banc marque aussi",
    "3xc": (name) => `${name} marque trois fois`,
    freehit: "Un nouvel effectif pour une journée, puis le vôtre revient",
    wildcard: "Transferts gratuits illimités cette journée",
  },
  chipUsedLong: (gw, back) => (back ? `Utilisé à la J${gw}. De retour à la J${back}.` : `Utilisé à la J${gw}.`),
  chipNote: (until) => `Un de chaque jusqu’à la J${until}, puis une nouvelle série.`,
  cancelChip: "Annuler le bonus",
  reviewTitle: "Votre plan",
  vsNone: "pts de plus que sans transfert",
  projectedChange: (now, was) => `${now} prévus, contre ${was}.`,
  weekByWeek: "Journée par journée",
  captainNote: (name) => `C ${name}`,
  fplTitle: "À faire sur FPL",
  fplBody: (deadline) => `Nous planifions, FPL fait le transfert. À faire avant le ${deadline}.`,
  openFpl: "Ouvrir FPL",
  estimates: "Banque et transferts gratuits estimés.",
};

const PLAN_COPY: Readonly<Record<Lang, PlanCopy>> = { en, pcm, fr };

export const planCopyFor = (lang: Lang): PlanCopy => PLAN_COPY[lang];
