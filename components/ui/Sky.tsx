import type { VariantProps } from "class-variance-authority";
import { sky } from "@/lib/variants";

/** The Mist sky behind a screen's header: deep teal fading into the page, per theme. */
export function Sky({ height }: { height: NonNullable<VariantProps<typeof sky>["height"]> }) {
  return <div aria-hidden="true" className={sky({ height })} />;
}
