// Your team (/planner/{id}): the rating, how it compares in your league, week
// by week, where the points come from, and transfer ideas. One idea per block,
// one main action (Plan transfers). Drawn on the server; the only scripts are
// Change team and Compare in. `league` is the streamed Your league section.
import Link from "next/link";
import type { ReactNode } from "react";
import { copyFor, type Lang } from "@/lib/i18n";
import type { NoSquadView, RatedTeamView, RatingTeam, TeamRatingView, TransferIdeaView } from "@/lib/screens/planner";
import { deadlineText, decimal, money, signedDecimal } from "@/lib/ui/format";
import {
  button, chevron, column, explain, explainBody, explainChevron, explainToggle, ideaArrow, ideaGain, ideaList, ideaMove,
  ideaMoves, ideaOut, ideaRow, ideaSub, onSkyRow, onSkyTitle, panel, panelBody, panelTitle, partBar, partFill, partHead, partList, partRow,
  partTrack, partValue, plannerHeading, ratingHero, ratingLine, ratingNumber, ratingStack, sectionAside, sectionHead, sectionHeading,
  visuallyHidden, weekGrid, weekGw, weekPoints, weekTile,
} from "@/lib/variants";
import { ThemeToggle } from "../ui/ThemeToggle";
import { ArrowRight, ChevronDown, ChevronRight } from "../ui/icons";
import { TeamSwitch } from "./TeamSwitch";

export function TeamRating({ view, lang, league }: { view: TeamRatingView; lang: Lang; league: ReactNode }) {
  return view.kind === "rated" ? <Rated view={view} lang={lang} league={league} /> : <NoSquad view={view} lang={lang} />;
}

function Header({ team, lang }: { team: RatingTeam; lang: Lang }) {
  const t = copyFor(lang);
  const p = t.planner;
  const labels = {
    title: p.changeTeam,
    button: team.name ? p.teamButtonAria(team.name) : p.changeTeam,
    field: t.start.teamLabel,
    placeholder: t.start.placeholder,
    submit: p.rateThis,
    recent: p.recentTeams,
    close: p.close,
  };
  return (
    <header className={onSkyRow()}>
      <div className={plannerHeading()}>
        <h1 className={onSkyTitle()}>{p.title}</h1>
        <TeamSwitch team={team} labels={labels} />
      </div>
      <ThemeToggle labels={t.theme} />
    </header>
  );
}

function Rated({ view, lang, league }: { view: RatedTeamView; lang: Lang; league: ReactNode }) {
  const p = copyFor(lang).planner;
  const { team, firstGw, lastGw } = view;
  const planHref = `/planner/${team.id}/plan`;
  return (
    <div lang={lang} className={column({ gap: "lg" })}>
      <Header team={team} lang={lang} />

      <section aria-labelledby="rating-h" className={ratingHero()}>
        <h2 id="rating-h" className={visuallyHidden()}>
          {p.ratingHeading}
        </h2>
        <p className={ratingStack()}>
          <span className={ratingNumber()}>{Math.round(view.points)}</span>
          <span className={ratingLine()}>{[p.ptsProjected, p.window(firstGw, lastGw), p.squadAsOf(view.asOf)].join(" · ")}</span>
        </p>
        <details className={explain()}>
          <summary className={explainToggle()}>
            {p.howWorkedOut}
            <ChevronDown className={explainChevron()} />
          </summary>
          <p className={explainBody()}>{p.explainBody}</p>
        </details>
      </section>

      {league}

      <section aria-labelledby="weeks-h">
        <div className={sectionHead()}>
          <h2 id="weeks-h" className={sectionHeading()}>
            {p.weekByWeek}
          </h2>
        </div>
        <ol className={weekGrid()}>
          {view.weeks.map((w) => (
            <li key={w.gw} aria-label={p.weekAria(w.gw, decimal(w.points, lang))} className={weekTile()}>
              <span aria-hidden="true" className={weekGw()}>
                {p.gw(w.gw)}
              </span>
              <span aria-hidden="true" className={weekPoints()}>
                {decimal(w.points, lang)}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="where-h">
        <div className={sectionHead()}>
          <h2 id="where-h" className={sectionHeading()}>
            {p.whereFrom}
          </h2>
        </div>
        <ul className={partList()}>
          {view.parts.map((part) => (
            <li key={part.key} className={partRow()}>
              <span className={partHead()}>
                <span>{p.parts[part.key]}</span>
                <span className={partValue()}>{decimal(part.points, lang)}</span>
              </span>
              <svg viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true" className={partBar()}>
                <rect width="100" height="6" className={partTrack()} />
                <rect width={Math.max(0, Math.min(1, part.share)) * 100} height="6" className={partFill({ part: part.key === "captain" ? "captain" : "position" })} />
              </svg>
            </li>
          ))}
        </ul>
      </section>

      {view.singles.length + view.pairs.length > 0 ? (
        <section aria-labelledby="ideas-h">
          <div className={sectionHead()}>
            <h2 id="ideas-h" className={sectionHeading()}>
              {p.ideas}
            </h2>
            <span className={sectionAside()}>{p.ideasAside(firstGw, lastGw)}</span>
          </div>
          <ul className={ideaList()}>
            {[...view.singles, ...view.pairs].map((idea, i) => (
              <li key={i}>
                <Idea idea={idea} href={`${planHref}?idea=${i < view.singles.length ? `s${i}` : `p${i - view.singles.length}`}`} lang={lang} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link href={planHref} className={button({ intent: "primary" })}>
        {p.planButton}
      </Link>
    </div>
  );
}

function Idea({ idea, href, lang }: { idea: TransferIdeaView; href: string; lang: Lang }) {
  const p = copyFor(lang).planner;
  const cost = idea.moves.length > 1 ? p.twoTransfers : p.freeTransfer;
  const sub = idea.hit > 0 ? `${cost} · ${p.hitCounted(idea.hit)}` : `${cost} · ${p.left(money(idea.bank, lang))}`;
  const gain = signedDecimal(idea.gain, lang);
  return (
    <Link href={href} aria-label={`${idea.moves.map((m) => p.moveAria(m.out, m.in)).join("; ")}. ${sub}. ${p.gainAria(gain)}. ${p.ideaOpens}`} className={ideaRow()}>
      <span aria-hidden="true" className={ideaMoves()}>
        {idea.moves.map((m) => (
          <span key={m.out} className={ideaMove()}>
            <span className={ideaOut()}>{m.out}</span>
            <ArrowRight className={ideaArrow()} />
            {m.in}
          </span>
        ))}
        <span className={ideaSub()}>{sub}</span>
      </span>
      <span aria-hidden="true" className={ideaGain()}>
        {gain}
      </span>
      <ChevronRight className={chevron()} />
    </Link>
  );
}

function NoSquad({ view, lang }: { view: NoSquadView; lang: Lang }) {
  const p = copyFor(lang).planner;
  return (
    <div lang={lang} className={column({ gap: "lg" })}>
      <Header team={view.team} lang={lang} />
      <section role="status" className={panel()}>
        <h2 className={panelTitle()}>{p.noSquadTitle}</h2>
        <p className={panelBody()}>{p.noSquadBody(view.deadline ? deadlineText(view.deadline, lang) : null)}</p>
      </section>
      <Link href="/planner/draft" className={button({ intent: "primary" })}>
        {p.scratch}
      </Link>
    </div>
  );
}
