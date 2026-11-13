import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Which folder may import which (docs/architecture.md). Each file matches one
// layer below, because a later block replaces an earlier block's rule.
const DATA = {
  // The planner's engine (lib/planner/engine) is pure and runs in the browser, so components may use it.
  regex: "^@/lib/(fpl|league|tools|projections)(/|$)|^@/lib/planner(/(?!engine(/|$))|$)",
  message: "FPL data reaches the app through a screen module in lib/screens.",
};
// lib/i18n/plan is the exception: the plan board runs in the browser and loads only its own lines.
const INTERNALS = {
  group: ["@/lib/i18n/*", "!@/lib/i18n/plan", "@/lib/cards/render/*"],
  message: "Import the module's entry point (@/lib/i18n, @/lib/cards/render).",
};
const REQUEST = { group: ["next/headers", "@/lib/request"], message: "Only routes (app/) read the request; pass what it says down as arguments." };

const layer = (files, patterns, ignores = []) => ({
  files,
  ignores,
  rules: { "@typescript-eslint/no-restricted-imports": ["error", { patterns }] },
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Routes: read the request, call a screen module, settle the outcome. app/api is the data session's.
  layer(["app/**/*.{ts,tsx}"], [DATA, INTERNALS], ["app/api/**"]),
  // Components draw views and words; they never fetch.
  layer(["components/**/*.{ts,tsx}"], [
    DATA,
    INTERNALS,
    REQUEST,
    { group: ["@/lib/cards/*"], message: "Cards are images drawn by lib/cards; components draw the app." },
  ]),
  // Screen modules return outcomes as values; the route turns them into redirects and 404s.
  layer(["lib/screens/**/*.ts"], [
    INTERNALS,
    REQUEST,
    { group: ["next/navigation", "@/components/*"], message: "Return an outcome (lib/screens/screen.ts); the route acts on it." },
  ]),
  // The card renderer: facts and options in, an image out. No data access, no app screens.
  layer(["lib/cards/**/*.{ts,tsx}"], [
    DATA,
    REQUEST,
    { group: ["@/lib/screens/*", "@/components/*"], message: "lib/cards sits below the screens and components." },
  ]),
  // Shared leaves: words, awards, IDs, the phone's memory, formatting. They import only each other.
  layer(["lib/i18n/**/*.ts", "lib/ui/**/*.ts", "lib/awards.ts", "lib/ids.ts", "lib/remembered.ts"], [
    { ...DATA, allowTypeImports: true, message: "Shared leaves may name FPL types, never call FPL." },
    REQUEST,
    { group: ["@/lib/screens/*", "@/lib/cards/*", "@/components/*"], message: "Shared leaves sit below everything else." },
  ]),
  // The planner engine runs in the browser: plain data in, plain data out. No fetching, no server code.
  layer(
    ["lib/planner/engine/**/*.ts"],
    [
      {
        group: ["@/lib/*", "next", "next/*", "../*"],
        allowTypeImports: true,
        message: "lib/planner/engine runs in the browser: import only its own files (types from elsewhere are fine).",
      },
    ],
    ["lib/planner/engine/**/*.test.ts"],
  ),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Other sessions' worktrees live here, with their own builds.
    ".claude/**",
  ]),
]);

export default eslintConfig;
