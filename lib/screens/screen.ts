// What loading a screen can come to. Each screen module (picker.ts, league.ts,
// fixtures.ts, players.ts) turns raw route input into one of these; the route
// only switches on it (components/screens/settle.tsx) and the screen component
// only draws `view`. Words stay out: views carry facts, components add language.

export type Screen<V> =
  | { readonly kind: "ready"; readonly view: V }
  /** Somewhere else to go, e.g. back to Start with the reason. */
  | { readonly kind: "redirect"; readonly to: string }
  | { readonly kind: "not-found" }
  /** FPL can't be reached: show the "FPL isn't answering" panel, with a retry link. */
  | { readonly kind: "down"; readonly retry: string };

export const ready = <V>(view: V): Screen<V> => ({ kind: "ready", view });
export const redirectTo = <V>(to: string): Screen<V> => ({ kind: "redirect", to });
export const notFound = <V>(): Screen<V> => ({ kind: "not-found" });

/**
 * Runs a load that reaches FPL. A thrown error (an outage, a block, a schema
 * change) is logged and becomes the "down" outcome; expected results like
 * "no such league" come back as values from the load itself.
 */
export async function guard<V>(screen: string, retry: string, load: () => Promise<Screen<V>>): Promise<Screen<V>> {
  try {
    return await load();
  } catch (failure) {
    console.error(`[${screen}] FPL load failed`, { retry, failure });
    return { kind: "down", retry };
  }
}
