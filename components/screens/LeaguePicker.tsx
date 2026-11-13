"use client";

// Compare in [league ⌃⌄]: a pop-up list of the leagues this squad can be
// ranked in. Picking one stays on Your team: the name changes at once, the rank
// row below shows its placeholder, and only the rank is fetched again. Each
// league is a link, and the list is a <details>, so it works before (or
// without) this script; the script adds what a native menu does: closing on a
// tap outside or Escape, and keeping the scroll position.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useRef, useTransition, type MouseEvent, type ReactNode } from "react";
import {
  leagueMenu, leagueMenuIcon, leagueOption, leagueOptionName, leagueOptionSize, leagueOptions, leagueRow, leagueRowLabel, leagueTick,
  leagueValue, leagueValueName,
} from "@/lib/variants";
import { CheckIcon, UpDownIcon } from "../ui/icons";
import { RankPlaceholder } from "./RankPlaceholder";

export interface LeagueOption {
  readonly id: number;
  readonly name: string;
  readonly members: number;
  readonly href: string;
  /** "Screamerz, 26 managers" */
  readonly aria: string;
  /** Read out while this league's squads are rated. */
  readonly loading: string;
}

export function LeaguePicker({ label, options, current, children }: { label: string; options: readonly LeagueOption[]; current: number; children: ReactNode }) {
  const router = useRouter();
  const menu = useRef<HTMLDetailsElement>(null);
  const [pending, startTransition] = useTransition();
  const [shown, show] = useOptimistic(current);
  const chosen = options.find((o) => o.id === shown) ?? options[0];

  useEffect(() => {
    const close = (event: PointerEvent | KeyboardEvent) => {
      const details = menu.current;
      if (!details?.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        details.open = false;
        details.querySelector("summary")?.focus();
      } else if (!details.contains(event.target as Node)) {
        details.open = false;
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  const pick = (event: MouseEvent<HTMLAnchorElement>, option: LeagueOption) => {
    // A new tab is the browser's business.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (menu.current) menu.current.open = false;
    if (option.id === shown) return;
    startTransition(() => {
      show(option.id);
      router.push(option.href, { scroll: false });
    });
  };

  return (
    <>
      <details ref={menu} className={leagueMenu()}>
        <summary className={leagueRow({ press: "top" })}>
          <span className={leagueRowLabel()}>{label}</span>
          <span className={leagueValue()}>
            <span className={leagueValueName()}>{chosen.name}</span>
            <UpDownIcon className={leagueMenuIcon()} />
          </span>
        </summary>
        <ul aria-label={label} className={leagueOptions()}>
          {options.map((o) => (
            <li key={o.id}>
              <Link
                href={o.href}
                scroll={false}
                prefetch={false}
                aria-label={o.aria}
                aria-current={o.id === shown ? "true" : undefined}
                className={leagueOption()}
                onClick={(event) => pick(event, o)}
              >
                <CheckIcon className={leagueTick({ on: o.id === shown })} />
                <span aria-hidden="true" className={leagueOptionName()}>
                  {o.name}
                </span>
                <span aria-hidden="true" className={leagueOptionSize()}>
                  {o.members}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </details>
      <p aria-live="polite" className={leagueRow({ rule: true })}>
        {pending ? <RankPlaceholder label={chosen.loading} /> : children}
      </p>
    </>
  );
}
