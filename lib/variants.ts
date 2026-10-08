import { cva } from "class-variance-authority";

// Every component's Tailwind classes live here as CVA definitions (see the
// global design rules). JSX composes these; it never carries raw class strings.

export const rootHtml = cva("h-full antialiased");

export const rootBody = cva("min-h-full flex flex-col bg-background text-foreground font-sans");

export const placeholderMain = cva("flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center");

export const heading = cva("tracking-tight", {
  variants: {
    level: {
      display: "font-serif text-5xl leading-none",
      body: "font-sans text-lg text-foreground/70",
    },
  },
  defaultVariants: { level: "body" },
});
