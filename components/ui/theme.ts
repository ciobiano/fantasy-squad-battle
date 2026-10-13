// The theme the page is showing right now: a saved choice (data-theme on <html>,
// set by ThemeToggle), else the phone's. Browser only: call it in effects and handlers.
export type ShownTheme = "light" | "dark";

export function shownTheme(): ShownTheme {
  const saved = document.documentElement.dataset.theme;
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
