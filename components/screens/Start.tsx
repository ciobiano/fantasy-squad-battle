// Start: find your leagues with your team ID, or open a league from its link.
// No client JavaScript: the mode is a pair of radios styled as a segmented
// control, and CSS (globals.css, [data-mode-switch]) swaps the label, button
// and help text. The form goes to /find.
import Image from "next/image";
import { copyFor, type Lang } from "@/lib/i18n";
import type { StartView } from "@/lib/screens/start";
import {
  button, column, fieldError, fieldLabel, form, help, helpSummary, helpUrl, helpUrlId, input, onSkyRow,
  previewCard, previewStack, segment, segmented, startFooter, startHeadline, visuallyHidden, wordmark, wordmarkSquare,
} from "@/lib/variants";
import { LanguageSwitch } from "../ui/LanguageSwitch";
import { ThemeToggle } from "../ui/ThemeToggle";
import { AlertIcon, ChevronDown } from "../ui/icons";

export function Start({ view, lang }: { view: StartView; lang: Lang }) {
  const { mode, value, error } = view;
  const t = copyFor(lang);
  const s = t.start;
  const back = "/?start=1";
  return (
    <div lang={lang} className={column({ gap: "md" })}>
      <header className={onSkyRow()}>
        <span className={wordmark()}>
          <span aria-hidden="true" className={wordmarkSquare()} />
          Fantasy Squad Battle
        </span>
        <ThemeToggle labels={t.theme} />
      </header>

      <div aria-hidden="true" className={previewStack()}>
        <span className={previewCard({ tilt: "left" })}>
          <Image src="/cards/sample/5/oga?format=x&theme=dark" alt="" width={152} height={152} priority />
        </span>
        <span className={previewCard({ tilt: "right" })}>
          <Image src="/cards/sample/5/spoon?format=x&theme=dark" alt="" width={152} height={152} />
        </span>
      </div>

      <h1 className={startHeadline()}>{s.headline}</h1>

      <form action="/find" method="get" className={form()} data-mode-switch="">
        <div role="radiogroup" aria-label={s.modeLabel} className={segmented()}>
          {(["team", "league"] as const).map((m) => (
            <label key={m} className={segment()}>
              <input type="radio" name="mode" value={m} defaultChecked={m === mode} className={visuallyHidden()} />
              {m === "team" ? s.modeTeam : s.modeLeague}
            </label>
          ))}
        </div>

        <label htmlFor="entry" className={fieldLabel()}>
          <span data-show="team">{s.teamLabel}</span>
          <span data-show="league">{s.leagueLabel}</span>
        </label>
        <input
          id="entry"
          name="q"
          type="text"
          inputMode="url"
          autoComplete="off"
          defaultValue={value}
          placeholder={s.placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "entry-error" : undefined}
          className={input()}
        />
        {error ? (
          <p id="entry-error" role="alert" className={fieldError()}>
            <AlertIcon />
            <span>{s.errors[error]}</span>
          </p>
        ) : null}

        <button type="submit" className={button({ intent: "primary" })}>
          <span data-show="team">{s.teamButton}</span>
          <span data-show="league">{s.leagueButton}</span>
        </button>

        <details>
          <summary className={helpSummary()}>
            <span data-show="team">{s.teamHelp}</span>
            <span data-show="league">{s.leagueHelp}</span>
            <ChevronDown />
          </summary>
          <div className={help()}>
            <p data-show="team">{s.teamHelpBody}</p>
            <p data-show="league">{s.leagueHelpBody}</p>
            <p aria-hidden="true" className={helpUrl()}>
              fantasy.premierleague.com
              <br />
              <span data-show="team">
                /entry/<strong className={helpUrlId()}>1234567</strong>/event/6
              </span>
              <span data-show="league">
                /leagues/<strong className={helpUrlId()}>314159</strong>/standings/c
              </span>
            </p>
          </div>
        </details>
      </form>

      <div className={startFooter()}>
        <LanguageSwitch current={lang} back={back} label={t.languageLabel} />
      </div>
    </div>
  );
}
