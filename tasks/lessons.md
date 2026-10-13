# Lessons

Patterns from Ralph's corrections, so the same mistake doesn't happen twice. Check this before designing a new screen or card.

## 2026-10-10: designs were too busy

**What happened:** pass 2 cards and screens were approved, but Ralph found several of them too busy and asked for Apple's rules on less text.

**Rules:**
- **One secondary line per element.** A big number gets one line of context, not a unit, a detail line and a pill.
- **No stats rows on share cards.** A card makes one point: award, who, the number, one picture, the roast.
- **A chart carries one message line.** Never a title plus a legend plus axis labels. The dashed baseline doesn't need a label if the message line says "vs league average".
- **Don't repeat what's already on screen.** If the card shows the league and the award, the story header doesn't need them too.
- **Names only where the person matters.** Team names on the card's winner block and in tables, not in Wrap rows or tie lists.
- **Microcopy at its shortest.** Errors say what happened and what to do, in one or two short sentences. No "right now", "in a few minutes", "like 314159".
- **Before publishing, cut a pass:** for each element ask "if this goes, does anyone miss it?" (HIG: simplicity is not minimalism, so keep what is necessary).

## 2026-10-13: story viewer bugs Ralph found on his phone

**What happened:** the story progress bar never showed time passing, and press and hold didn't pause. Both had passed my checks, which looked at end states (a segment done, a card advanced, `data-paused` set by a mouse click) rather than at what a thumb on a phone sees mid-way.

**Rules:**
- **Animate the property the utilities set.** Tailwind v4's `scale-*`, `rotate-*` and `translate-*` set the separate `scale`, `rotate` and `translate` properties, not `transform`. A keyframe on `transform` combines with them, so `scale-x-0` plus a `scaleX(0→1)` animation stays at zero width.
- **Check an animation mid-flight.** Measure it twice while it runs (width at 1.5 s and at 2.5 s), and take one screenshot part of the way through.
- **Treat press and hold on a phone as hostile ground.** On links, the browser claims a long press (drag, preview, callout) and cancels the pointer. Where a hold means something: `touch-action: none` on the area, `draggable={false}` and no user-drag or touch-callout on the links, and `contextmenu` prevented.
- **Test gestures as touch.** Dispatch `pointerType: "touch"` press and release sequences: a hold should pause and not move on when released; a quick tap should still move on.
