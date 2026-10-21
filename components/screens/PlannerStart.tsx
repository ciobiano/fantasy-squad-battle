// The Planner tab before a team ID: rate your squad, or draft one from scratch.
// No client JavaScript: the form goes to /planner/find, which opens the
// team's rating or comes back here with the reason.
import Link from "next/link";
import { copyFor, type Lang } from "@/lib/i18n";
import type { PlannerStartView } from "@/lib/screens/planner";
import {
  button, column, fieldError, fieldLabel, help, helpSummary, helpUrl, helpUrlId, input, onSkyRow, onSkyTitle, orRule,
  plannerForm, plannerTagline, scratchLink, scratchSub, scratchTitle,
} from "@/lib/variants";
import { ThemeToggle } from "../ui/ThemeToggle";
import { AlertIcon, ChevronDown } from "../ui/icons";

export function PlannerStart({ view, lang }: { view: PlannerStartView; lang: Lang }) {
  const t = copyFor(lang);
  const p = t.planner;
  const s = t.start;
  const { value, error } = view;
  return (
    <div lang={lang} className={column({ gap: "lg" })}>
      <header className={onSkyRow()}>
        <div>
          <h1 className={onSkyTitle()}>{p.title}</h1>
          <p className={plannerTagline()}>{p.tagline}</p>
        </div>
        <ThemeToggle labels={t.theme} />
      </header>

      <form action="/planner/find" method="get" className={plannerForm()}>
        <label htmlFor="team" className={fieldLabel()}>
          {s.teamLabel}
        </label>
        <input
          id="team"
          name="q"
          type="text"
          inputMode="url"
          autoComplete="off"
          defaultValue={value}
          placeholder={s.placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "team-error" : undefined}
          className={input()}
        />
        {error ? (
          <p id="team-error" role="alert" className={fieldError()}>
            <AlertIcon />
            <span>{s.errors[error]}</span>
          </p>
        ) : null}
        <button type="submit" className={button({ intent: "primary" })}>
          {p.rateButton}
        </button>
        <details>
          <summary className={helpSummary()}>
            {s.teamHelp}
            <ChevronDown />
          </summary>
          <div className={help()}>
            <p>{s.teamHelpBody}</p>
            <p aria-hidden="true" className={helpUrl()}>
              fantasy.premierleague.com
              <br />
              /entry/<strong className={helpUrlId()}>1234567</strong>/event/7
            </p>
          </div>
        </details>
      </form>

      <p aria-hidden="true" className={orRule()}>
        {p.or}
      </p>

      <Link href="/planner/draft" className={scratchLink()}>
        <span className={scratchTitle()}>{p.scratch}</span>
        <span className={scratchSub()}>{p.scratchSub}</span>
      </Link>
    </div>
  );
}
