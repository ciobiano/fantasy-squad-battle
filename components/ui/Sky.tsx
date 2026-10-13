import type { VariantProps } from "class-variance-authority";
import { sky, statusTint } from "@/lib/variants";

/**
 * The Mist sky behind a screen's header: deep teal fading into the page, per
 * theme. Its top colour carries on into the iPhone status bar: theme-color for
 * most browsers, and a fixed strip at the top edge for Safari 26, which tints
 * from that instead.
 */
export function Sky({ height }: { height: NonNullable<VariantProps<typeof sky>["height"]> }) {
  return (
    <>
      <div aria-hidden="true" className={statusTint()} />
      <div aria-hidden="true" className={sky({ height })} />
    </>
  );
}
