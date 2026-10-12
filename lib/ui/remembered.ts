// What the phone remembers, with no accounts: the last team ID and the last
// league, in cookies set by proxy.ts. Names and parsing only (safe anywhere).

export const TEAM_COOKIE = "fsb-team";
export const LEAGUE_COOKIE = "fsb-league";
export const THEME_STORAGE_KEY = "fsb-theme";

/** A remembered ID, or null if missing or not a plain positive number. */
export function rememberedId(value: string | undefined): number | null {
  if (!value || !/^\d{1,10}$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
}

/** Runs before the page paints, so a saved Light or Dark choice never flashes the other theme. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
