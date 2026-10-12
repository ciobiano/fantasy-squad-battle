// FPL team and league IDs, as they arrive in paths, cookies and forms: plain
// positive whole numbers of up to 10 digits. Anything else is null.
const ID = /^\d{1,10}$/;

/** The design canvas's sample league: the one league ID that isn't a number. */
export const SAMPLE_LEAGUE = "sample";

export function fplId(text: string | null | undefined): number | null {
  if (!text || !ID.test(text)) return null;
  const id = Number(text);
  return id > 0 ? id : null;
}
