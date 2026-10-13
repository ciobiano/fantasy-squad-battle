// Pidgin roast lines, the default language. Ralph edits these. Placeholders
// per pool: see ../book.ts. Funny, never cruel: no appearance, tribe, religion
// or family.
import type { RoastBook } from "../book";

export const pcm: RoastBook = {
  oga: {
    one: [
      "{name} score {score}. The rest of una na spectators.",
      "{name} no come play this week. {name} come collect territory.",
      "Oga patapata! {name} drop {score} like say e easy.",
      "{team} don open coaching centre. Fee na {score} points.",
      "{name} score {score}. Screenshot don enter group chat already.",
      "Make una respect yourselves. {name} carry first with {score}.",
    ],
    few: [
      "{names} share first with {score}. Plenty oga, one chair.",
      "{score} each for {names}. The throne get queue.",
    ],
    crowd: [
      "{count} managers score {score}. Oga too many, chair no reach.",
      "{count} of una carry first with {score}. Na photocopy league be this?",
    ],
    nobody: [
      "No score yet for GW{gw}. The chair still dey empty.",
      "GW{gw} never get oga. Everybody still dey warm up.",
    ],
  },
  climber: {
    one: [
      "{name} climb {places}. Who dey under, make una shift.",
      "From {from} to {to}. {name} dey climb like say na escalator.",
      "{name} go up {places}. The transfers don finally work.",
      "{team} dey rise: {places} up, and e never tire.",
      "{name} move from {from} to {to}. The table don hear.",
      "{places} up for one week. {name} no come here to play.",
    ],
    newLeader: [
      "{name} jump from {from} reach top. New oga don land.",
      "From {from} to 1st. {name} don collect the crown.",
    ],
    few: [
      "{names} climb {places} each. Lift dey work today.",
      "{places} up for {names}. Traffic dey move for this side.",
    ],
    crowd: [
      "{count} managers climb {places} each. The whole table don scatter.",
      "{count} of una go up {places}. Somebody must come down for that one.",
    ],
    early: ["Na first gameweek. Nobody never climb anywhere."],
    nobody: [
      "Nobody move this week. The table don freeze.",
      "No climber this week. Everybody siddon for one place.",
    ],
  },
  captain: {
    one: [
      "{name} give {captain} armband. {captain} give {name} {captainPoints}.",
      "{captain} as captain? {name}, armband no be lucky charm.",
      "{captain} carry armband, bring back {captainPoints}. Who advise you?",
      "{name} trust {captain}. {captain} off like NEPA light.",
      "Armband for {captain}, {captainPoints} come back. {name}, change your scout.",
      "{name} captain {captain}. E be like say the armband too heavy.",
    ],
    noShow: [
      "{name} captain {captain}. {captain} no even enter pitch.",
      "{captain} collect armband, siddon for house. {name} still dey wait.",
    ],
    rescued: [
      "{captain} no play at all. {name} vice-captain come save the day.",
      "{name} captain {captain}, but {captain} no show. Vice carry the load.",
    ],
    triple: [
      "Triple Captain for {captain}? {captainPoints} times three still small.",
      "{name} use Triple Captain for {captain}. Chip don go, points no come.",
    ],
    sameCaptain: [
      "{count} managers captain {captain}. {captain} give dem {captainPoints}. Group project don fail.",
      "{captain} disappoint {count} of una same time. Follow-follow dey cost points.",
    ],
    few: [
      "{names}: captain bring {captainPoints}. That armband na decoration.",
      "{names} pick the wrong armband. {captainPoints} each.",
    ],
    crowd: [
      "{count} captains bring {captainPoints}. Armband dey on strike this week.",
      "{count} of una collect {captainPoints} from captain. Next time, think am well.",
    ],
    nobody: [
      "Every captain deliver this week. Who be your scout?",
      "No captain fail this week. Enjoy am, e no go last.",
    ],
  },
  bench: {
    one: [
      "{name} bench score {bench}. The real team dey siddon.",
      "{bench} for {name} bench. Wrong eleven, correct players.",
      "{team} bench score {bench}. Abeg start dem next week.",
      "{bench} for bench. {name} subs don write petition.",
      "{bench} dey watch from bench. {name}, na your hand you take do am.",
      "{name} keep {bench} warm for bench. You too generous.",
    ],
    few: [
      "{names} bench {bench} each. Selection meeting, now now.",
      "{names}: {bench} each for bench. Same mistake.",
    ],
    crowd: [
      "{count} managers leave {bench} for bench. Bench na the real league.",
      "{count} of una bench {bench}. Who dey pick these teams?",
    ],
    nobody: [
      "No bench score anything. Perfect pick or perfect luck.",
      "Every bench score zero. Nobody get regret this week.",
    ],
  },
  hits: {
    one: [
      "{name} pay {hits} to change team. The new players no hear.",
      "{name} score {points}, pay {hits}, remain {score}. Expensive week.",
      "{hits} for hits. {name} dey run transfer market alone.",
      "{name} take {hits} hit. Patience no cost money o.",
      "{team} spend {hits} for transfers. Sapa don show face.",
      "{name} pay {hits} to change team. The old team no even bad.",
    ],
    few: [
      "{names} pay {hits} each. Transfer window no be buffet.",
      "{hits} each for {names}. Hits no be personality.",
    ],
    crowd: [
      "{count} managers pay {hits} each. Tax office dey collect today.",
      "{count} of una take {hits} hit. Panic dey spread.",
    ],
    nobody: [
      "Nobody take hit this week. Una too dey fear.",
      "Zero hits this week. Everybody dey save their points.",
    ],
  },
  middle: {
    one: [
      "{name} never move for three weeks. Middle don sweet am.",
      "{name} dey middle, e dey enjoy am. No top, no bottom, just there.",
      "Three weeks, same spot. {name} don pay rent for mid-table.",
      "{team}: e no reach to go up, e no bad reach to go down.",
      "{name} steady pass. Too steady sef.",
      "Mid-table forever. {name} don turn furniture.",
    ],
    few: [
      "{names} no dey go up, no dey go down.",
      "{names} stuck for mid-table traffic. No movement.",
    ],
    crowd: [
      "{count} managers stuck for middle. Traffic no dey move at all.",
      "{count} of una never move for three weeks. Comfort zone dey sweet.",
    ],
    early: ["Too early for Middle Class. Wait till after GW3."],
    nobody: [
      "Nobody stand still for middle this week. Everybody dey move.",
      "No Middle Class this week. Mid-table dey shake.",
    ],
  },
  faller: {
    one: [
      "{name} drop {places}. The table no wait for anybody.",
      "From {from} to {to}. {name} dey take staircase go down.",
      "{name} fall {places}. Make somebody check am.",
      "{team} dey slide: {places} down this week.",
      "{name} move from {from} to {to}. Gravity no dey lose.",
      "{places} down. {name}, the table dey move without you.",
    ],
    fromTop: [
      "{name} fall from first. Now na {to}.",
      "Oga don fall. {name} drop from 1st reach {to}.",
    ],
    few: [
      "{names} drop {places} each. Same lift, e dey go down.",
      "{places} down for {names}. This side no easy this week.",
    ],
    crowd: [
      "{count} managers drop {places} each. Everybody dey japa downstairs.",
      "{count} of una fall {places}. Somebody climb, una pay for am.",
    ],
    early: ["Na first gameweek. Nobody never fall anywhere."],
    nobody: [
      "Nobody fall this week. Not even one slip.",
      "Nobody drop this week. Everybody hold body.",
    ],
  },
  spoon: {
    one: [
      "{name} score {score}. Last position, but we still love you.",
      "{name} on {score}. The spoon na your own this week.",
      "{name} carry last with {score}. Group chat don hear.",
      "{team} score {score}. From here, na only up remain.",
      "{name} score {score}. Bottom of the week, top of the group chat.",
      "Wooden Spoon for {name}, on {score}. Plenty explanation dey wait.",
    ],
    paid: [
      "{name} pay {hits} make e fit score {score}. Who advise you?",
      "{name} take {hits} hit, still carry last with {score}.",
    ],
    few: [
      "{names} share spoon with {score}. Suffering like company.",
      "{score} each for {names}. Una carry last together.",
    ],
    crowd: [
      "{count} managers score {score}. Spoon go need longer handle.",
      "{count} of una score {score}. Na whole committee dey bottom.",
    ],
    nobody: [
      "Everybody score the same. No spoon this week.",
      "No Wooden Spoon. Una all tie, how?",
    ],
  },
};
