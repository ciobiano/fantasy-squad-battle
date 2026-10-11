import { cva } from "class-variance-authority";

// Every component's Tailwind classes live here as CVA definitions (see the
// global design rules). JSX composes these; it never carries raw class strings.
// Colours, radii and the type scale are the Design System's tokens
// (app/tokens.css, app/globals.css).

export const rootHtml = cva("h-full antialiased");

export const rootBody = cva("min-h-full flex flex-col bg-bg text-ink font-sans text-body");

export const placeholderMain = cva("flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center");

export const heading = cva("", {
  variants: {
    level: {
      display: "text-display",
      body: "text-body text-ink-2",
    },
  },
  defaultVariants: { level: "body" },
});
