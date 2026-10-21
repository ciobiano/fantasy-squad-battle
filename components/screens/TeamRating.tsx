// Your team (/planner/{id}): the rating, week by week, where the points come
// from, and transfer ideas. Drawn on the server, with no client JavaScript; the
// plan itself is the next screen. `paper` is the streamed "2nd of 11 on paper" link.
import Link from "next/link";
import type { ReactNode } from "react";
import { copyFor, type Lang } from "@/lib/i18n";
import type { NoSquadView, RatedTeamView, TeamRatingView, TransferIdeaView } from "@/lib/screens/planner";
import { deadlineText, decimal, money, signedDecimal } from "@/lib/ui/format";
import {
  actionStack, asOfPill, badge, button, column, ideaArrow, ideaGain, ideaList, ideaMove, ideaMoves, ideaOut, ideaRow, ideaSub, onSkyRow,
  onSkyTitle, panel, panelBody, panelTitle, partBar, partFill, partHead, partLabel, partList, partRow, partTrack, partValue,
  ratingFigure, ratingHero, ratingNote, ratingNumber, ratingUnit, sectionAside, sectionHead, sectionHeading, teamLine,
  visuallyHidden, weekGrid, weekGw, weekPoints, weekTile,
} from "@/lib/variants";
import { ThemeToggle } from "../ui/ThemeToggle";
import { ArrowRight } from "../ui/icons";

export function TeamRating({ view, lang, paper }: { view: TeamRatingView; lang: Lang; paper: ReactNode }) {
  return view.kind === "rated" ? <Rated view={view} lang={lang} paper={paper} /> : <NoSquad view={view} lang={lang} />;
}

function Header({ lang, children }: { lang: Lang; children?: ReactNode }) {
  const t = copyFor(lang);
  return (
    <header className={onSkyRow()}>
      <div>
        <h1 className={onSkyTitle()}>{t.planner.title}</h1>
        {children}
      </div>
      <ThemeToggle labels={t.theme} />
    </header>
  );
}

function Rated({ view, lang, paper }: { view: RatedTeamView; lang: Lang; paper: ReactNode }) {
  const p = copyFor(lang).planner;
  const { team, firstGw, lastGw } = view;
  const planHref = `/planner/${team.id}/plan`;
  return (
    <div lang={lang} className={column({ gap: "lg" })}>
      <Header lang={lang}>
        <TeamLine team={team}>
          <span className={asOfPill()}>{p.asOf(view.asOf)}</span>
        </TeamLine>
      </Header>

      <section aria-labelledby="rating-h" className={ratingHero()}>
        <h2 id="rating-h" className={visuallyHidden()}>
          {p.ratingHeading}
        </h2>
        <p className={ratingFigure()}>
          <span className={ratingNumber()}>{Math.round(view.points)}</span>
          <span className={ratingUnit()}>
            <span>{p.ptsProjected}</span>
            <span>{p.window(firstGw, lastGw)}</span>
          </span>
        </p>
        <p className={ratingNote()}>{p.ratingNote}</p>
        {paper}
      </section>

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
                <span className={partLabel()}>{p.parts[part.key]}</span>
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

      <div className={actionStack()}>
        <Link href={planHref} className={button({ intent: "primary" })}>
          {p.planButton}
        </Link>
        <Link href="/planner?start=1" className={button({ intent: "quiet" })}>
          {p.changeTeam}
        </Link>
      </div>
    </div>
  );
}

function Idea({ idea, href, lang }: { idea: TransferIdeaView; href: string; lang: Lang }) {
  const p = copyFor(lang).planner;
  const cost = idea.moves.length > 1 ? p.twoTransfers : p.freeTransfer;
  const sub = idea.hit > 0 ? `${cost} · ${p.hitCounted(idea.hit)}` : `${cost} · ${p.left(money(idea.bank, lang))}`;
  const gain = signedDecimal(idea.gain, lang);
  return (
    <Link href={href} aria-label={`${idea.moves.map((m) => p.moveAria(m.out, m.in)).join("; ")}. ${sub}. ${p.gainAria(gain)}`} className={ideaRow()}>
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
    </Link>
  );
}

function TeamLine({ team, children }: { team: { readonly name: string; readonly badge: RatedTeamView["team"]["badge"] }; children?: ReactNode }) {
  return (
    <p className={teamLine()}>
      <span aria-hidden="true" className={badge({ colour: team.badge.colour, shape: team.badge.shape, size: "sm" })}>
        {team.badge.initials}
      </span>
      {team.name}
      {children}
    </p>
  );
}

function NoSquad({ view, lang }: { view: NoSquadView; lang: Lang }) {
  const p = copyFor(lang).planner;
  return (
    <div lang={lang} className={column({ gap: "lg" })}>
      <Header lang={lang}>{view.team.name ? <TeamLine team={view.team} /> : null}</Header>
      <section role="status" className={panel()}>
        <h2 className={panelTitle()}>{p.noSquadTitle}</h2>
        <p className={panelBody()}>{p.noSquadBody(view.deadline ? deadlineText(view.deadline, lang) : null)}</p>
      </section>
      <div className={actionStack()}>
        <Link href="/planner/draft" className={button({ intent: "primary" })}>
          {p.scratch}
        </Link>
        <Link href="/planner?start=1" className={button({ intent: "quiet" })}>
          {p.changeTeam}
        </Link>
      </div>
    </div>
  );
}
