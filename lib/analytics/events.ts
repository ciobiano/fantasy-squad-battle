import { z } from "zod";

// The five events we count (CLAUDE.md, Stack), with exactly the properties
// each may carry. Nothing here identifies a person: no names, team IDs or IP
// addresses. League IDs are public, and they show how far the cards travel.

const lang = z.enum(["pcm", "en", "fr"]);
const card = z.enum(["wrap", "oga", "climber", "captain", "bench", "hits", "middle", "faller", "spoon"]);
const league = z.string().regex(/^(\d{1,9}|sample)$/);
const gw = z.number().int().min(1).max(38);

export const EVENT_SCHEMAS = {
  /** A league's Market, Table or public share page was opened. */
  league_loaded: z.object({ league, gw, view: z.enum(["market", "table", "share"]), language: lang }).strict(),
  /** A card was shown in the story viewer: each card, as the player moves through them. */
  card_viewed: z.object({ league, gw, award: card, language: lang }).strict(),
  /** The phone's share sheet took a card image (lib/share: "shared"). */
  card_shared: z.object({ league, gw, award: card, format: z.enum(["status", "x"]), language: lang }).strict(),
  /** A card image was saved: Save image ("both"), or a computer's fallback for Status or X. */
  card_downloaded: z
    .object({ league, gw, award: card, format: z.enum(["status", "x", "both"]), language: lang })
    .strict(),
  /** Someone switched language. `from` is null when they hadn't chosen before. */
  language_changed: z.object({ from: lang.nullable(), to: lang }).strict(),
};

export type EventName = keyof typeof EVENT_SCHEMAS;
export type EventProps = { readonly [E in EventName]: z.infer<(typeof EVENT_SCHEMAS)[E]> };

/**
 * The only events a browser may send (through /api/signal); the rest are counted on the server.
 * card_viewed is here because the story player moves between cards without loading a page.
 */
export const CLIENT_EVENTS = ["card_viewed", "card_shared", "card_downloaded"] as const;
export type ClientEvent = (typeof CLIENT_EVENTS)[number];

/** Checks an event a browser sent: a client event with exactly its properties. */
export function parseClientEvent(input: unknown): { event: ClientEvent; props: EventProps[ClientEvent] } | null {
  const shape = z.object({ event: z.enum(CLIENT_EVENTS), props: z.unknown() }).strict().safeParse(input);
  if (!shape.success) return null;
  const props = EVENT_SCHEMAS[shape.data.event].safeParse(shape.data.props);
  return props.success ? { event: shape.data.event, props: props.data } : null;
}
