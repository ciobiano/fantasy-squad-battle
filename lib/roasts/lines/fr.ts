// French roast lines, beta until a native speaker reviews them. Placeholders
// per pool: see ../book.ts. Managers can be anyone, so lines avoid words that
// agree with the manager's gender (no "il", "elle", "est tombé", "dernier").
// Funny, never cruel: no appearance, tribe, religion or family.
import type { RoastBook } from "../book";

export const fr: RoastBook = {
  oga: {
    one: [
      "{name} a marqué {score}. Les autres ont regardé le match.",
      "{name} n’a pas joué cette semaine. {name} a donné une leçon.",
      "{name} au sommet avec {score}, sans transpirer.",
      "{team} ouvre une école de coaching. Tarif : {score} points.",
      "{name} a marqué {score}. Les captures d’écran circulent déjà.",
      "Respect. {name} règne sur la semaine avec {score}.",
    ],
    few: [
      "{names} en tête avec {score}. Un trône, trop de monde.",
      "{score} chacun pour {names}. Il y a la queue pour le trône.",
    ],
    crowd: [
      "{count} managers à {score}. Trop de patrons, pas assez de chaises.",
      "{count} d’entre vous en tête avec {score}. C’est un copier-coller ?",
    ],
    nobody: [
      "Pas encore de score pour la GW{gw}. Le trône est vide.",
      "La GW{gw} n’a pas encore de patron. Tout le monde s’échauffe.",
    ],
  },
  climber: {
    one: [
      "{name} remonte de {places}. Ceux d’en dessous, attention.",
      "De {from} à {to}. {name} monte les marches quatre à quatre.",
      "{name} gagne {places}. Les transferts ont enfin marché.",
      "{team} décolle : {places} en une semaine.",
      "{name} passe de {from} à {to}. Le classement est prévenu.",
      "{places} en une semaine. {name} n’est pas là pour rigoler.",
    ],
    newLeader: [
      "{name} passe de {from} à la première place. Changement au sommet.",
      "De {from} à 1er. {name} prend la couronne.",
    ],
    few: [
      "{names} gagnent {places} chacun. L’ascenseur marche.",
      "{places} de mieux pour {names}. Ça roule de ce côté.",
    ],
    crowd: [
      "{count} managers gagnent {places} chacun. Le classement est sens dessus dessous.",
      "{count} d’entre vous montent de {places}. D’autres ont dû descendre.",
    ],
    early: ["Première journée. Personne n’a encore grimpé."],
    nobody: [
      "Personne n’a bougé cette semaine. Classement figé.",
      "Pas de grimpeur cette semaine. Chacun reste à sa place.",
    ],
  },
  captain: {
    one: [
      "{name} a donné le brassard à {captain}. Retour : {captainPoints}.",
      "{captain} capitaine ? {name}, le brassard n’est pas un porte-bonheur.",
      "Capitaine de pédalo : {captain}, {captainPoints}. Merci {name}.",
      "{name} a fait confiance à {captain}. Erreur de casting.",
      "Brassard pour {captain}, {captainPoints} en retour. {name}, change de recruteur.",
      "{name} a choisi {captain}. Le brassard était trop lourd.",
    ],
    noShow: [
      "{name} a nommé {captain} capitaine. {captain} n’a même pas joué.",
      "{captain} a pris le brassard et il est resté chez lui. {name} attend encore.",
    ],
    rescued: [
      "{captain} n’a pas joué. Le vice-capitaine de {name} a sauvé les meubles.",
      "{name} a misé sur {captain}, absent. Heureusement, le vice était là.",
    ],
    triple: [
      "Triple Capitaine sur {captain} ? {captainPoints} fois trois, ça reste peu.",
      "{name} a joué le Triple Capitaine sur {captain}. Bonus grillé, points envolés.",
    ],
    sameCaptain: [
      "{count} managers ont choisi {captain}. Résultat : {captainPoints}. Projet de groupe raté.",
      "{captain} a déçu {count} d’entre vous d’un coup. L’effet mouton coûte cher.",
    ],
    few: [
      "{names} : capitaines à {captainPoints}. Le brassard était décoratif.",
      "{names} ont mal choisi leur brassard. {captainPoints} chacun.",
    ],
    crowd: [
      "{count} capitaines à {captainPoints}. Le brassard était en grève.",
      "{count} d’entre vous ont eu {captainPoints} de leur capitaine. Réfléchissez mieux.",
    ],
    nobody: [
      "Tous les capitaines ont assuré. Qui est votre recruteur ?",
      "Aucun capitaine raté cette semaine. Profitez, ça ne durera pas.",
    ],
  },
  bench: {
    one: [
      "{name} a laissé {bench} sur le banc. La vraie équipe était assise.",
      "{bench} sur le banc de {name}. Mauvais onze, bons joueurs.",
      "Le banc de {team} a marqué {bench}. Fais-les jouer la semaine prochaine.",
      "{bench} sur le banc. Les remplaçants de {name} portent plainte.",
      "Sur le banc : {bench}. {name}, tu l’as bien cherché.",
      "{name} a gardé {bench} au chaud sur le banc. Quelle générosité.",
    ],
    few: [
      "{names} : {bench} chacun au banc. Sélection à revoir.",
      "{names} : {bench} chacun sur le banc. Même erreur.",
    ],
    crowd: [
      "{count} managers ont laissé {bench} sur le banc. Le banc, c’est la vraie ligue.",
      "{count} d’entre vous ont laissé {bench} sur le banc. Qui fait ces équipes ?",
    ],
    nobody: [
      "Aucun point sur les bancs. Choix parfaits ou chance parfaite.",
      "Tous les bancs à zéro. Aucun regret cette semaine.",
    ],
  },
  hits: {
    one: [
      "{name} a payé {hits} de transferts. Les recrues n’ont rien vu.",
      "{name} : {points} marqués, {hits} payés, {score} au final. Semaine chère.",
      "{hits} de pénalités. {name} fait tout le mercato en solo.",
      "{name} a pris {hits} de pénalité. La patience, c’est gratuit.",
      "{team} a dépensé {hits} en transferts. La facture est arrivée.",
      "{name} a payé {hits} pour changer d’équipe. L’ancienne allait très bien.",
    ],
    few: [
      "{names} : {hits} chacun. Le mercato n’est pas un buffet.",
      "{names} : {hits} de pénalité chacun. C’est une habitude ?",
    ],
    crowd: [
      "{count} managers ont payé {hits} chacun. Le fisc est passé.",
      "{count} d’entre vous ont pris {hits} de pénalité. La panique est contagieuse.",
    ],
    nobody: [
      "Personne n’a pris de pénalité. Très disciplinés, ou très peureux.",
      "Zéro pénalité cette semaine. Tout le monde économise.",
    ],
  },
  middle: {
    one: [
      "{name} n’a pas bougé en trois semaines. Le milieu de tableau lui va bien.",
      "{name} adore le milieu. Ni en haut, ni en bas, juste là.",
      "Trois semaines, même place. {name} a signé un bail en milieu de tableau.",
      "{team} : pas assez bon pour monter, pas assez mauvais pour descendre.",
      "{name}, la constance même. Trop de constance.",
      "Milieu de tableau pour toujours. {name} fait partie des meubles.",
    ],
    few: [
      "{names} : immobiles depuis trois semaines. Classe moyenne.",
      "{names} sont dans les bouchons du milieu de tableau.",
    ],
    crowd: [
      "{count} managers bloqués au milieu. Ça ne bouge plus.",
      "{count} d’entre vous n’ont pas bougé en trois semaines. Le confort, c’est un choix.",
    ],
    early: ["Trop tôt pour la Classe moyenne. Rendez-vous après la GW3."],
    nobody: [
      "Personne ne fait du surplace au milieu. Tout le monde bouge.",
      "Pas de Classe moyenne cette semaine. Le milieu de tableau s’agite.",
    ],
  },
  faller: {
    one: [
      "{name} perd {places}. Le classement n’attend personne.",
      "De {from} à {to}. {name} prend l’escalier, mais pour descendre.",
      "{name} recule de {places}. Quelqu’un peut prendre de ses nouvelles ?",
      "{team} glisse : moins {places} cette semaine.",
      "{name} passe de {from} à {to}. La gravité ne perd jamais.",
      "Moins {places}. {name}, le classement avance sans toi.",
    ],
    fromTop: [
      "{name} perd la première place. Direction {to}.",
      "Le sommet n’a pas tenu. {name} passe de 1er à {to}.",
    ],
    few: [
      "{names} perdent {places} chacun. Direction le bas.",
      "Moins {places} pour {names}. Semaine difficile de ce côté.",
    ],
    crowd: [
      "{count} managers perdent {places} chacun. Exode vers le bas.",
      "{count} d’entre vous reculent de {places}. Quelqu’un a grimpé sur votre dos.",
    ],
    early: ["Première journée. Personne n’a encore chuté."],
    nobody: [
      "Personne n’a reculé cette semaine. Pas une seule glissade.",
      "Aucune chute cette semaine. Tout le monde tient bon.",
    ],
  },
  spoon: {
    one: [
      "{name} a marqué {score}. Dernière place, mais toujours dans nos cœurs.",
      "{name} à {score}. La cuillère de bois est pour toi cette semaine.",
      "{name} ferme la marche avec {score}. Le groupe WhatsApp est au courant.",
      "{team} a marqué {score}. Ça ne peut que remonter.",
      "{name} à {score}. Bas du classement, star du groupe WhatsApp.",
      "Cuillère de bois pour {name}, à {score}. Il va falloir s’expliquer.",
    ],
    paid: [
      "{name} a payé {hits} pour le plaisir de marquer {score}.",
      "{name} a pris {hits} de pénalité et ferme quand même la marche avec {score}.",
    ],
    few: [
      "{names} à {score}. Cuillère partagée, malheur partagé.",
      "{score} chacun pour {names}. En bas, mais ensemble.",
    ],
    crowd: [
      "{count} managers à {score}. Il faut une plus grande cuillère.",
      "{count} d’entre vous à {score}. Un comité entier en bas du classement.",
    ],
    nobody: [
      "Tout le monde a le même score. Pas de cuillère cette semaine.",
      "Pas de cuillère de bois. Égalité générale, on ne sait pas comment.",
    ],
  },
};
