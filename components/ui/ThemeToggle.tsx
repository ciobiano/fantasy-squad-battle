"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/ui/remembered";
import { iconButton } from "@/lib/variants";
import { ThemeIcon } from "./icons";

type Choice = "system" | "light" | "dark";
const ORDER: readonly Choice[] = ["system", "light", "dark"];

// The saved choice lives in localStorage (an external store), so it's read
// with useSyncExternalStore: other tabs and this button both notify it.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readChoice(): Choice {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

function save(choice: Choice) {
  const root = document.documentElement;
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;
  try {
    if (choice === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Private mode: the choice still applies until the page closes.
  }
  listeners.forEach((notify) => notify());
}

/** System → Light → Dark. The saved choice is applied before paint by THEME_SCRIPT in the layout. */
export function ThemeToggle({ labels, tone = "sky" }: { labels: Record<Choice, string>; tone?: "sky" | "surface" }) {
  const choice = useSyncExternalStore(subscribe, readChoice, () => "system" as const);
  const next = () => save(ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length]);
  return (
    <button type="button" onClick={next} aria-label={labels[choice]} className={iconButton({ tone })}>
      <ThemeIcon />
    </button>
  );
}
