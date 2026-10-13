// English roast lines. Ralph edits these. Placeholders per pool: see ../book.ts.
// Funny, never cruel: no appearance, tribe, religion or family.
import type { RoastBook } from "../book";

export const en: RoastBook = {
  oga: {
    one: [
      "{name} scored {score}. The rest of you were spectators.",
      "{name} didn’t play this week. {name} held a masterclass.",
      "Oga at the top. {name} put up {score} and didn’t break a sweat.",
      "{team} is now open for coaching. Fee: {score} points.",
      "{name} scored {score}. The screenshots are already in the group chat.",
      "Respect the office. {name} owns this gameweek with {score}.",
    ],
    few: [
      "{names} share the top on {score}. One throne, too many ogas.",
      "{score} each for {names}. The throne has a queue.",
    ],
    crowd: [
      "{count} managers scored {score}. Too many ogas, not enough chairs.",
      "{count} of you share the top on {score}. Is this a photocopy league?",
    ],
    nobody: [
      "No scores yet for GW{gw}. The throne is empty.",
      "GW{gw} has no oga yet. Everyone is still warming up.",
    ],
  },
  climber: {
    one: [
      "{name} climbed {places}. Everyone below, mind your back.",
      "{from} to {to}. {name} is taking the stairs two at a time.",
      "{name} moved up {places}. The transfers finally worked.",
      "{team} is on the rise: up {places}, and not tired yet.",
      "{name} went from {from} to {to}. The table has been informed.",
      "Up {places} in one week. {name} is not here to play.",
    ],
    newLeader: [
      "{name} jumped from {from} to the top. New oga in the building.",
      "From {from} to 1st. {name} has taken the crown.",
    ],
    few: [
      "{names} each climbed {places}. The lift is working today.",
      "Up {places} for {names}. Traffic is moving on this side.",
    ],
    crowd: [
      "{count} managers each climbed {places}. The whole table is reshuffling.",
      "{count} of you went up {places}. Somebody had to come down for that.",
    ],
    early: ["First gameweek. Nobody has climbed anywhere yet."],
    nobody: [
      "Nobody moved this week. The table is frozen.",
      "No climbers this week. Everyone stayed exactly where they were.",
    ],
  },
  captain: {
    one: [
      "{name} gave {captain} the armband. {captain} gave back {captainPoints}.",
      "{captain} as captain? {name}, the armband is not a lucky charm.",
      "{captain} on {captainPoints}. {name}, who advised you?",
      "{name} trusted {captain}. {captain} went off like NEPA light.",
      "Armband to {captain}, {captainPoints} back. {name} needs a new scout.",
      "{name} handed {captain} the armband. It was too heavy.",
    ],
    noShow: [
      "{name} captained {captain}. {captain} didn’t even play.",
      "{captain} took the armband and stayed home. {name} is still waiting.",
    ],
    rescued: [
      "{captain} didn’t play. {name}’s vice-captain had to save the day.",
      "{name} captained {captain}, who never showed up. The vice carried the load.",
    ],
    triple: [
      "Triple Captain on {captain}? {captainPoints} times three is still small.",
      "{name} played Triple Captain on {captain}. Chip gone, points never came.",
    ],
    sameCaptain: [
      "{count} managers captained {captain}. {captain} gave them {captainPoints}. Group project failed.",
      "{captain} let {count} of you down at once. Following the crowd costs points.",
    ],
    few: [
      "{names}: captains on {captainPoints}. The armband was decoration.",
      "{names} picked the wrong armband. {captainPoints} each.",
    ],
    crowd: [
      "{count} captains on {captainPoints}. The armband was on strike this week.",
      "{count} of you got {captainPoints} from your captain. Think harder next time.",
    ],
    nobody: [
      "Every captain delivered this week. Who is your scout?",
      "No captain flopped this week. Enjoy it, it won’t last.",
    ],
  },
  bench: {
    one: [
      "{name} left {bench} on the bench. The best XI sat down.",
      "{bench} on {name}’s bench. Wrong eleven, right players.",
      "{team}’s bench scored {bench}. Maybe start them next week.",
      "{bench} on the bench. {name}’s subs are filing a complaint.",
      "{bench} watched from the bench. {name}, you did this to yourself.",
      "{name} kept {bench} warm on the bench. Very generous.",
    ],
    few: [
      "{names} each benched {bench}. Selection meeting, now.",
      "{names}: {bench} each on the bench. Same mistake.",
    ],
    crowd: [
      "{count} managers left {bench} on the bench. The bench is the real league.",
      "{count} of you benched {bench}. Who is picking these teams?",
    ],
    nobody: [
      "No points on any bench. Perfect picks, or perfect luck.",
      "Every bench scored zero. No regrets this week.",
    ],
  },
  hits: {
    one: [
      "{name} paid {hits} for transfers. The new signings missed the memo.",
      "{name} scored {points}, paid {hits}, kept {score}. Expensive week.",
      "{hits} in hits. {name} is running the transfer market alone.",
      "{name} took {hits} in hits. Patience is free, by the way.",
      "{team} spent {hits} on transfers. The receipts are in.",
      "{name} paid {hits} to change the team. The old team was fine.",
    ],
    few: [
      "{names} each paid {hits}. Transfers are not a buffet.",
      "{hits} each for {names}. Hits are not a personality.",
    ],
    crowd: [
      "{count} managers each paid {hits}. The tax office is open today.",
      "{count} of you took {hits} in hits. Panic is contagious.",
    ],
    nobody: [
      "Nobody took a hit this week. Very disciplined, or very scared.",
      "Zero hits this week. Everyone is saving their points.",
    ],
  },
  middle: {
    one: [
      "{name} hasn’t moved in three weeks. Comfortable in the middle.",
      "{name} is in the middle and loving it. Not top, not bottom, just there.",
      "Three weeks, same spot. {name} has signed a lease in mid-table.",
      "{team}: not good enough to go up, not bad enough to go down.",
      "{name} is the definition of steady. Too steady.",
      "Mid-table forever. {name} is part of the furniture now.",
    ],
    few: [
      "{names} haven’t moved in three weeks. Middle class, settled.",
      "{names} are stuck in mid-table traffic. No movement.",
    ],
    crowd: [
      "{count} managers stuck in the middle. The traffic is not moving.",
      "{count} of you haven’t moved in three weeks. Comfort is a choice.",
    ],
    early: ["Too early for the Middle Class. Check back after GW3."],
    nobody: [
      "Nobody stood still in the middle this week. Everyone is moving.",
      "No Middle Class this week. Mid-table is shaking.",
    ],
  },
  faller: {
    one: [
      "{name} dropped {places}. The table did not wait.",
      "{from} to {to}. {name} took the stairs down.",
      "{name} fell {places}. Somebody check on them.",
      "{team} is sliding: down {places} this week.",
      "{name} went from {from} to {to}. Gravity is undefeated.",
      "Down {places}. {name}, the table moves without you.",
    ],
    fromTop: [
      "{name} fell off the top spot. Down to {to}.",
      "The oga has fallen. {name} drops from 1st to {to}.",
    ],
    few: [
      "{names} each dropped {places}. Same lift, going down.",
      "Down {places} for {names}. Tough week on this side.",
    ],
    crowd: [
      "{count} managers each dropped {places}. Mass exodus downstairs.",
      "{count} of you fell {places}. Somebody’s climb cost you.",
    ],
    early: ["First gameweek. Nobody has fallen anywhere yet."],
    nobody: [
      "Nobody fell this week. Not a single slip.",
      "Nobody dropped this week. Everyone held on.",
    ],
  },
  spoon: {
    one: [
      "{name} scored {score}. Last place, but still in our hearts.",
      "{name} on {score}. The spoon is yours to keep this week.",
      "{name} finished last on {score}. The group chat has been informed.",
      "{team} scored {score}. The only way is up.",
      "{name} on {score}. Bottom of the week, top of the group chat.",
      "Wooden Spoon to {name}, on {score}. Lots of explaining to do.",
    ],
    paid: [
      "{name} paid {hits} for the privilege of scoring {score}.",
      "{name} took {hits} in hits and still finished last on {score}.",
    ],
    few: [
      "{names} share the spoon on {score}. Misery loves company.",
      "{score} each for {names}. Bottom of the week, together.",
    ],
    crowd: [
      "{count} managers on {score}. The spoon needs a longer handle.",
      "{count} of you scored {score}. A whole committee at the bottom.",
    ],
    nobody: [
      "Everyone scored the same. No spoon this week.",
      "No Wooden Spoon. Everyone tied, somehow.",
    ],
  },
};
