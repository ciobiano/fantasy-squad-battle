// A sample league (the design canvas's "Ikeja Banter League", real GW 5 player
// data) so the cards can be rendered and reviewed before lib/league is wired in.
// Roast lines are drafts (tasks/todo.md, phase 3).
import type { AwardKey } from "@/lib/awards";
import type { Lang } from "@/lib/i18n";
import type { AwardCardModel, AwardFacts, CardMeta, Manager, WrapCardModel } from "./types";

export const SAMPLE_GW = 5;

const meta: CardMeta = { leagueName: "Ikeja Banter League", gw: SAMPLE_GW, provisional: false };

const manager = (firstName: string, teamName: string, initials: string, colour: string, shape: Manager["badge"]["shape"]): Manager => ({
  firstName,
  teamName,
  badge: { initials, colour, shape },
});

const M = {
  kemi: manager("Kemi", "No Gree For Anybody", "NG", "#7A5A12", "circle"),
  amaka: manager("Amaka", "Jollof United", "JU", "#A3412A", "squircle"),
  ngozi: manager("Ngozi", "Odogwu XI", "OX", "#8A3B4A", "circle"),
  femi: manager("Femi", "Japa City", "JC", "#2952A3", "shield"),
  seun: manager("Seun", "Eze Does It", "ED", "#1E6E8C", "squircle"),
  ibrahim: manager("Ibrahim", "Wahala Wanderers", "WW", "#4E6B25", "shield"),
  emeka: manager("Emeka", "Agbero Athletic", "AA", "#2952A3", "squircle"),
  bayo: manager("Bayo", "Mbeumo Jumbo", "MJ", "#A3412A", "circle"),
  yemi: manager("Yemi", "Cole Palmer Wine", "CP", "#5A5248", "circle"),
  chidi: manager("Chidi", "Danfo Rovers", "DR", "#1E6E8C", "shield"),
};

const AWARDS: Record<AwardKey, { winners: Manager[]; facts: AwardFacts; roast: Record<Lang, string> }> = {
  oga: {
    winners: [M.kemi],
    facts: { award: "oga", net: 92, hits: 4, gapByGw: [3, 10, 7, 9, 49] },
    roast: {
      pcm: "Kemi no come play this week. Kemi come collect territory.",
      en: "Kemi didn’t play this week. Kemi held a masterclass.",
      fr: "Kemi n’a pas joué cette semaine. Kemi a donné une leçon.",
    },
  },
  climber: {
    winners: [M.amaka],
    facts: { award: "climber", places: 3, from: 12, to: 9, rankByGw: [[12, 12, 12, 12, 9]], leagueSize: 12 },
    roast: {
      pcm: "Amaka climb three places. Who dey under, make una shift.",
      en: "Amaka climbed three places. Everyone below, mind your back.",
      fr: "Amaka remonte de trois places. Ceux d’en dessous, attention.",
    },
  },
  captain: {
    winners: [M.bayo],
    facts: { award: "captain", captain: { name: "João Pedro", points: 0 }, best: { name: "Groß", points: 28, scope: "team" } },
    roast: {
      pcm: "Bayo give João Pedro armband. João Pedro give Bayo zero.",
      en: "Bayo gave João Pedro the armband. João Pedro gave nothing back.",
      fr: "Bayo a donné le brassard à João Pedro. Il n’a rien rendu.",
    },
  },
  bench: {
    winners: [M.emeka],
    facts: {
      award: "bench",
      total: 21,
      players: [
        { name: "Verbruggen", points: 6 },
        { name: "De Cuyper", points: 6 },
        { name: "Cherki", points: 8 },
        { name: "Calafiori", points: 1 },
      ],
    },
    roast: {
      pcm: "Emeka bench score 21. The real team dey sit down.",
      en: "Emeka left 21 points on the bench. The best XI sat down.",
      fr: "Emeka a laissé 21 points sur le banc. La vraie équipe était assise.",
    },
  },
  hits: {
    winners: [M.yemi],
    facts: { award: "hits", gross: 47, paid: 12 },
    roast: {
      pcm: "Yemi pay 12 points to change team. The new players no hear.",
      en: "Yemi paid 12 points for transfers. The new signings missed the memo.",
      fr: "Yemi a payé 12 points de transferts. Les recrues n’ont rien vu.",
    },
  },
  middle: {
    winners: [M.ngozi, M.seun, M.ibrahim],
    facts: { award: "middle", places: 1, weeks: 3, rankByGw: [[6, 6, 5, 5, 5], [7, 7, 7, 7, 6], [8, 8, 8, 8, 7]], leagueSize: 12 },
    roast: {
      pcm: "Ngozi, Seun and Ibrahim no dey go up, no dey go down.",
      en: "Ngozi, Seun and Ibrahim haven’t moved in three weeks.",
      fr: "Ngozi, Seun et Ibrahim n’ont pas bougé en trois semaines.",
    },
  },
  faller: {
    winners: [M.femi, M.bayo],
    facts: { award: "faller", places: 2, from: 1, to: 3, rankByGw: [[1, 1, 1, 1, 3], [4, 5, 6, 6, 8]], leagueSize: 12 },
    roast: {
      pcm: "Femi fall from first. Bayo follow am go down.",
      en: "Femi fell off the top spot. Bayo followed.",
      fr: "Femi perd la première place. Bayo suit.",
    },
  },
  spoon: {
    winners: [M.chidi],
    facts: { award: "spoon", net: 27, hits: 4, gapByGw: [-8, -17, -22, -32, -57] },
    roast: {
      pcm: "Chidi pay 4 points make e fit score 27. Who advise you?",
      en: "Chidi paid 4 points for the privilege of scoring 27.",
      fr: "Chidi a payé 4 points pour le plaisir de marquer 27.",
    },
  },
};

export function sampleAward(award: AwardKey, lang: Lang, provisional = false): AwardCardModel {
  const a = AWARDS[award];
  return { meta: { ...meta, provisional }, winners: a.winners, facts: a.facts, roast: a.roast[lang] };
}

export function sampleWrap(provisional = false): WrapCardModel {
  return {
    meta: { ...meta, provisional },
    leagueAverage: 52.2,
    rows: [
      { award: "oga", winners: ["Kemi"], value: "92" },
      { award: "climber", winners: ["Amaka"], value: "3", movement: "up" },
      { award: "captain", winners: ["Bayo"], value: "0" },
      { award: "bench", winners: ["Emeka"], value: "21" },
      { award: "hits", winners: ["Yemi"], value: "−12" },
      { award: "middle", winners: ["Ngozi", "Seun", "Ibrahim"], value: "±1" },
      { award: "faller", winners: ["Femi", "Bayo"], value: "2", movement: "down" },
      { award: "spoon", winners: ["Chidi"], value: "27" },
    ],
  };
}
