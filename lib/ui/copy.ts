// Words on the app screens, per language. Tab and view names stay English
// (League, Fixtures, Players; Market, Table). French is beta until a native
// speaker reviews it; Ralph edits English and Pidgin.
import type { Lang } from "@/lib/cards/types";
import type { StartInputError } from "@/lib/fpl/start-input";

export type StartError = StartInputError | "team-not-found" | "league-not-found";

interface Copy {
  readonly theme: { readonly system: string; readonly light: string; readonly dark: string; readonly label: (current: string) => string };
  readonly languageLabel: string;
  readonly down: { readonly title: string; readonly body: string; readonly retry: string };
  readonly start: {
    readonly headline: string;
    readonly modeLabel: string;
    readonly modeTeam: string;
    readonly modeLeague: string;
    readonly teamLabel: string;
    readonly leagueLabel: string;
    readonly placeholder: string;
    readonly teamButton: string;
    readonly leagueButton: string;
    readonly teamHelp: string;
    readonly leagueHelp: string;
    readonly teamHelpBody: string;
    readonly leagueHelpBody: string;
    readonly errors: Record<StartError, string>;
  };
  readonly picker: { readonly title: string; readonly yours: string; readonly public: string; readonly notYou: string; readonly noPrivate: string; readonly up: string; readonly down: string; readonly same: string; readonly unranked: string };
  readonly league: {
    readonly gameweek: (gw: number) => string;
    readonly afterGameweek: (gw: number) => string;
    readonly changeLeague: (name: string) => string;
    readonly viewLabel: string;
    readonly top50: string;
    readonly marketSoon: string;
    readonly seeTable: string;
    readonly teamOfTheWeek: string;
    readonly owners: string;
    readonly marketHeading: string;
    readonly gwScore: string;
    readonly columns: { readonly pos: string; readonly manager: string; readonly gw: string; readonly total: string };
    readonly standingsCaption: (gw: number) => string;
    readonly you: string;
    readonly sample: string;
  };
  readonly fixtures: { readonly title: string; readonly sortLabel: string; readonly easiest: string; readonly az: string; readonly legendStart: string; readonly legendEnd: string; readonly noMatch: string; readonly home: string; readonly away: string; readonly runLabel: (run: number) => string; readonly snapshot: string };
  readonly players: { readonly title: string; readonly section: string; readonly filterLabel: string; readonly all: string; readonly injured: string; readonly doubtful: string; readonly suspended: string; readonly unavailable: string; readonly allTeams: string; readonly empty: string; readonly ago: (age: string) => string; readonly snapshot: string };
}

const DOWN = {
  pcm: { title: "FPL no dey answer.", body: "Na their wahala. Try again soon.", retry: "Try again" },
  en: { title: "FPL isn’t answering.", body: "It’s on their side. Try again soon.", retry: "Try again" },
  fr: { title: "FPL ne répond pas.", body: "Le souci vient de chez eux. Réessayez bientôt.", retry: "Réessayer" },
} as const;

export const COPY: Record<Lang, Copy> = {
  pcm: {
    theme: { system: "System", light: "Light", dark: "Dark", label: (current) => `Theme: ${current}. Change theme` },
    languageLabel: "Language",
    down: DOWN.pcm,
    start: {
      headline: "Roast your league. Every gameweek.",
      modeLabel: "How you want enter",
      modeTeam: "My team ID",
      modeLeague: "League link",
      teamLabel: "Team ID or Points link",
      leagueLabel: "League ID or link",
      placeholder: "e.g. 1234567",
      teamButton: "Find my leagues",
      leagueButton: "Roast my league",
      teamHelp: "Where I go find my team ID?",
      leagueHelp: "Where I go find my league ID?",
      teamHelpBody: "For FPL site, open Points. Your team ID na the number after /entry/.",
      leagueHelpBody: "Open your league for FPL site. The ID na the number after /leagues/.",
      errors: {
        empty: "Paste your team ID or league link first.",
        "not-a-team": "That no be team ID. Copy the number after /entry/ for your Points page.",
        "not-a-league": "That no be league ID. Paste the number from your league link.",
        "head-to-head": "Head-to-head leagues no dey work yet. Try a classic league.",
        draft: "That na FPL Draft link. We only do the main game for now.",
        "invite-code": "That na invite link. Open the league for FPL and copy the link from there.",
        "team-not-found": "No team get that ID. Check the number for your Points page.",
        "league-not-found": "No classic league get that ID. Head-to-head leagues no dey work yet.",
      },
    },
    picker: { title: "Pick your league", yours: "Your leagues", public: "Public leagues", notYou: "No be you? Change team", noPrivate: "You never join private league. Public ones dey here.", up: "up", down: "down", same: "no change", unranked: "no rank yet" },
    league: {
      gameweek: (gw) => `Gameweek ${gw}`,
      afterGameweek: (gw) => `After Gameweek ${gw}`,
      changeLeague: (name) => `${name}. Change league`,
      viewLabel: "League view",
      top50: "Na only the top 50 managers dey here.",
      marketSoon: "Market and this week cards go land when the awards ready.",
      seeTable: "See the table",
      teamOfTheWeek: "Team of the Week",
      owners: "Owners in this league",
      marketHeading: "Market",
      gwScore: "GW score",
      columns: { pos: "Pos", manager: "Manager", gw: "GW", total: "Total" },
      standingsCaption: (gw) => `Season standings after gameweek ${gw}`,
      you: "You",
      sample: "Sample league",
    },
    fixtures: { title: "Fixtures", sortLabel: "Sort teams", easiest: "Easiest", az: "A–Z", legendStart: "Easiest", legendEnd: "Hardest", noMatch: "No match", home: "H", away: "A", runLabel: (run) => `Run difficulty ${run}`, snapshot: "Snapshot from 12 Oct" },
    players: { title: "Players", section: "Injuries & bans", filterLabel: "Filter by status", all: "All", injured: "Injured", doubtful: "Doubtful", suspended: "Suspended", unavailable: "Unavailable", allTeams: "All teams", empty: "No injuries or bans flagged.", ago: (age) => `${age} ago`, snapshot: "Snapshot from 12 Oct" },
  },
  en: {
    theme: { system: "System", light: "Light", dark: "Dark", label: (current) => `Theme: ${current}. Change theme` },
    languageLabel: "Language",
    down: DOWN.en,
    start: {
      headline: "Roast your mini-league. Every gameweek.",
      modeLabel: "How to find your league",
      modeTeam: "My team ID",
      modeLeague: "League link",
      teamLabel: "Team ID or Points link",
      leagueLabel: "League ID or link",
      placeholder: "e.g. 1234567",
      teamButton: "Find my leagues",
      leagueButton: "Roast my league",
      teamHelp: "Where’s my team ID?",
      leagueHelp: "Where’s my league ID?",
      teamHelpBody: "On the FPL site, open Points. Your team ID is the number after /entry/.",
      leagueHelpBody: "Open your league on the FPL site. The ID is the number after /leagues/.",
      errors: {
        empty: "Paste your team ID or league link first.",
        "not-a-team": "That isn’t a team ID. Copy the number after /entry/ on your Points page.",
        "not-a-league": "That isn’t a league ID. Paste the number from your league link.",
        "head-to-head": "Head-to-head leagues aren’t supported yet. Try a classic league.",
        draft: "That’s an FPL Draft link. We only cover the main game for now.",
        "invite-code": "That’s an invite link. Open the league on FPL and copy its link instead.",
        "team-not-found": "No team has that ID. Check the number on your Points page.",
        "league-not-found": "No classic league has that ID. Head-to-head leagues aren’t supported yet.",
      },
    },
    picker: { title: "Pick a league", yours: "Your leagues", public: "Public leagues", notYou: "Not you? Change team", noPrivate: "No private leagues yet. Here are your public ones.", up: "up", down: "down", same: "no change", unranked: "not ranked yet" },
    league: {
      gameweek: (gw) => `Gameweek ${gw}`,
      afterGameweek: (gw) => `After Gameweek ${gw}`,
      changeLeague: (name) => `${name}. Change league`,
      viewLabel: "League view",
      top50: "Showing the top 50 managers.",
      marketSoon: "The Market and this week’s cards arrive with the awards.",
      seeTable: "See the table",
      teamOfTheWeek: "Team of the Week",
      owners: "Owners in this league",
      marketHeading: "Market",
      gwScore: "GW score",
      columns: { pos: "Pos", manager: "Manager", gw: "GW", total: "Total" },
      standingsCaption: (gw) => `Season standings after gameweek ${gw}`,
      you: "You",
      sample: "Sample league",
    },
    fixtures: { title: "Fixtures", sortLabel: "Sort teams", easiest: "Easiest", az: "A–Z", legendStart: "Easiest", legendEnd: "Hardest", noMatch: "No match", home: "H", away: "A", runLabel: (run) => `Run difficulty ${run}`, snapshot: "Snapshot from 12 Oct" },
    players: { title: "Players", section: "Injuries & bans", filterLabel: "Filter by status", all: "All", injured: "Injured", doubtful: "Doubtful", suspended: "Suspended", unavailable: "Unavailable", allTeams: "All teams", empty: "No injuries or bans flagged.", ago: (age) => `${age} ago`, snapshot: "Snapshot from 12 Oct" },
  },
  fr: {
    theme: { system: "Système", light: "Clair", dark: "Sombre", label: (current) => `Thème : ${current}. Changer de thème` },
    languageLabel: "Langue",
    down: DOWN.fr,
    start: {
      headline: "Chambrez votre mini-ligue. Chaque journée.",
      modeLabel: "Comment trouver votre ligue",
      modeTeam: "Mon équipe",
      modeLeague: "Lien de ligue",
      teamLabel: "Identifiant ou lien Points",
      leagueLabel: "Identifiant ou lien de la ligue",
      placeholder: "ex. 1234567",
      teamButton: "Trouver mes ligues",
      leagueButton: "Chambrer ma ligue",
      teamHelp: "Où trouver mon identifiant ?",
      leagueHelp: "Où trouver l’identifiant de ligue ?",
      teamHelpBody: "Sur le site FPL, ouvrez Points. Votre identifiant est le nombre après /entry/.",
      leagueHelpBody: "Ouvrez votre ligue sur le site FPL. L’identifiant est le nombre après /leagues/.",
      errors: {
        empty: "Collez d’abord votre identifiant ou le lien de votre ligue.",
        "not-a-team": "Ce n’est pas un identifiant d’équipe. Copiez le nombre après /entry/ sur votre page Points.",
        "not-a-league": "Ce n’est pas un identifiant de ligue. Collez le numéro du lien.",
        "head-to-head": "Les ligues face-à-face ne marchent pas encore. Essayez une ligue classique.",
        draft: "C’est un lien FPL Draft. Seul le jeu principal est couvert pour l’instant.",
        "invite-code": "C’est un lien d’invitation. Ouvrez la ligue sur FPL et copiez son lien.",
        "team-not-found": "Aucune équipe avec cet identifiant. Vérifiez le numéro sur votre page Points.",
        "league-not-found": "Aucune ligue classique avec cet identifiant. Les ligues face-à-face ne marchent pas encore.",
      },
    },
    picker: { title: "Choisissez une ligue", yours: "Vos ligues", public: "Ligues publiques", notYou: "Pas vous ? Changer d’équipe", noPrivate: "Pas encore de ligue privée. Voici vos ligues publiques.", up: "en hausse", down: "en baisse", same: "stable", unranked: "pas encore classé" },
    league: {
      gameweek: (gw) => `Journée ${gw}`,
      afterGameweek: (gw) => `Après la journée ${gw}`,
      changeLeague: (name) => `${name}. Changer de ligue`,
      viewLabel: "Vue de la ligue",
      top50: "Seuls les 50 premiers managers sont affichés.",
      marketSoon: "Le Market et les cartes de la semaine arrivent avec les récompenses.",
      seeTable: "Voir le classement",
      teamOfTheWeek: "Équipe de la semaine",
      owners: "Propriétaires dans cette ligue",
      marketHeading: "Market",
      gwScore: "Score J",
      columns: { pos: "Pos", manager: "Manager", gw: "J", total: "Total" },
      standingsCaption: (gw) => `Classement de la saison après la journée ${gw}`,
      you: "Vous",
      sample: "Ligue d’exemple",
    },
    fixtures: { title: "Calendrier", sortLabel: "Trier les équipes", easiest: "Plus facile", az: "A–Z", legendStart: "Facile", legendEnd: "Difficile", noMatch: "Pas de match", home: "D", away: "E", runLabel: (run) => `Difficulté cumulée ${run}`, snapshot: "Instantané du 12 oct." },
    players: { title: "Joueurs", section: "Blessures et suspensions", filterLabel: "Filtrer par statut", all: "Tous", injured: "Blessé", doubtful: "Incertain", suspended: "Suspendu", unavailable: "Indisponible", allTeams: "Toutes les équipes", empty: "Aucune blessure ni suspension signalée.", ago: (age) => `il y a ${age}`, snapshot: "Instantané du 12 oct." },
  },
};

export const copyFor = (lang: Lang): Copy => COPY[lang];
