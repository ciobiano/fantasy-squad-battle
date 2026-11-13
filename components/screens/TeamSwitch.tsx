"use client";

// The team under "Planner": tapping it opens Change team, a sheet with a team
// ID field and the teams rated on this phone, so trying another squad is a
// short task that comes back here. Before this script runs it's a link to
// Start, which does the same job a page away.
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore, type MouseEvent } from "react";
import { RECENT_TEAMS_KEY, readRecentTeams, withRecentTeam, type RecentTeam } from "@/lib/remembered";
import { badgeFor, type Badge } from "@/lib/ui/badge";
import {
  button, fieldLabel, input, recentHeading, recentItem, recentList, recentManager, recentName, recentRow, recentText, sheetClose,
  sheetHeader, sheetHeaderText, sheetName, teamButton, teamButtonChevron, teamButtonName, teamForm,
} from "@/lib/variants";
import { TeamBadge } from "../ui/bits";
import { CheckIcon, ChevronDown, CloseIcon } from "../ui/icons";
import { Sheet } from "../ui/Sheet";

export interface TeamSwitchLabels {
  readonly title: string;
  readonly button: string;
  readonly field: string;
  readonly placeholder: string;
  readonly submit: string;
  readonly recent: string;
  readonly close: string;
}

// The recent teams live in localStorage (an external store), read with
// useSyncExternalStore: other tabs and this page both notify it.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readStored(): string | null {
  try {
    return localStorage.getItem(RECENT_TEAMS_KEY);
  } catch {
    return null;
  }
}

function remember(team: RecentTeam) {
  try {
    localStorage.setItem(RECENT_TEAMS_KEY, withRecentTeam(readStored(), team));
  } catch {
    // Storage off (a private window): Change team still has the field.
  }
  listeners.forEach((notify) => notify());
}

const plainClick = (event: MouseEvent) => !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);

export function TeamSwitch({ team, labels }: { team: { readonly id: number; readonly name: string; readonly badge: Badge; readonly manager: string }; labels: TeamSwitchLabels }) {
  const [open, setOpen] = useState(false);
  const stored = useSyncExternalStore(subscribe, readStored, () => null);
  const recents = useMemo(() => readRecentTeams(stored), [stored]);
  const { id, name, manager } = team;

  useEffect(() => {
    if (name) remember({ id, name, manager });
  }, [id, name, manager]);

  return (
    <>
      <Link
        href="/planner?start=1"
        aria-haspopup="dialog"
        aria-label={labels.button}
        className={teamButton()}
        onClick={(event) => {
          if (!plainClick(event)) return;
          event.preventDefault();
          setOpen(true);
        }}
      >
        {name ? <TeamBadge value={team.badge} size="sm" /> : null}
        <span className={teamButtonName()}>{name || labels.title}</span>
        <ChevronDown className={teamButtonChevron()} />
      </Link>

      <Sheet open={open} onClose={() => setOpen(false)} labelledBy="team-sheet-h">
        <header className={sheetHeader()}>
          <div className={sheetHeaderText()}>
            <h2 id="team-sheet-h" className={sheetName()}>
              {labels.title}
            </h2>
          </div>
          <button type="button" aria-label={labels.close} className={sheetClose()} onClick={() => setOpen(false)}>
            <CloseIcon />
          </button>
        </header>

        <form action="/planner/find" method="get" className={teamForm()}>
          <label htmlFor="team-id" className={fieldLabel()}>
            {labels.field}
          </label>
          <input id="team-id" name="q" type="text" inputMode="url" autoComplete="off" placeholder={labels.placeholder} className={input({ on: "surface" })} />
          <button type="submit" className={button({ intent: "primary" })}>
            {labels.submit}
          </button>
        </form>

        {recents.length > 1 ? (
          <section aria-labelledby="recent-h" className={teamForm()}>
            <h3 id="recent-h" className={recentHeading()}>
              {labels.recent}
            </h3>
            <ul className={recentList()}>
              {recents.map((r) => {
                const current = r.id === id;
                return (
                  <li key={r.id} className={recentItem()}>
                    <Link
                      href={`/planner/${r.id}`}
                      aria-current={current ? "page" : undefined}
                      className={recentRow()}
                      onClick={(event) => {
                        if (!plainClick(event)) return;
                        if (current) event.preventDefault();
                        setOpen(false);
                      }}
                    >
                      <TeamBadge value={badgeFor(r.name)} />
                      <span className={recentText()}>
                        <span className={recentName()}>{r.name}</span>
                        {r.manager ? <span className={recentManager()}>{r.manager}</span> : null}
                      </span>
                      {current ? <CheckIcon /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </Sheet>
    </>
  );
}
