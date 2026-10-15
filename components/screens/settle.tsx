// Turns a screen's outcome (lib/screens/screen.ts) into what Next does with it:
// redirect, 404, the "FPL isn't answering" panel, or the screen itself.
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { copyFor, type Lang } from "@/lib/i18n";
import type { Screen } from "@/lib/screens/screen";
import { column } from "@/lib/variants";
import { DownPanel } from "../ui/bits";

export function settle<V>(screen: Screen<V>, lang: Lang, draw: (view: V) => ReactNode): ReactNode {
  switch (screen.kind) {
    case "redirect":
      return redirect(screen.to);
    case "not-found":
      return notFound();
    case "down": {
      const t = copyFor(lang).down;
      return (
        <div lang={lang} className={column()}>
          <DownPanel title={t.title} body={t.body} retry={t.retry} retryHref={screen.retry} />
        </div>
      );
    }
    case "ready":
      return draw(screen.view);
  }
}
