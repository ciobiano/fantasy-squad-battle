// What the planner keeps on this phone: plans and drafts, in localStorage, read
// with useSyncExternalStore. When storage is blocked (a private window) they
// live in memory for the visit.
const KEPT_EVENT = "fsb-kept";
const memory = new Map<string, string>();

export function readKept(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

export function keep(key: string, value: string) {
  memory.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // Kept in memory only.
  }
  window.dispatchEvent(new Event(KEPT_EVENT));
}

export function subscribeKept(onChange: () => void) {
  window.addEventListener(KEPT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(KEPT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
