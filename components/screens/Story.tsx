// The story viewer's words, worked out on the server so the browser gets plain
// strings, not every language's catalogue.
import { copyFor, type Lang } from "@/lib/i18n";
import type { StoryView } from "@/lib/screens/story";
import { StoryPlayer, type StoryLabels } from "./StoryPlayer";

export function Story({ view, lang }: { view: StoryView; lang: Lang }) {
  const t = copyFor(lang);
  const s = t.story;
  const titles = view.cards.map((card) => (card.key === "wrap" ? t.card.wrapTitle(view.gw) : t.awards[card.key]));
  const labels: StoryLabels = {
    label: s.label(view.gw),
    positions: view.cards.map((_, i) => s.position(i + 1, view.cards.length)),
    titles,
    share: titles.map((title) => ({
      share: s.share,
      title: s.sheetTitle(title),
      status: s.status,
      statusSub: s.statusSub,
      x: s.x,
      xSub: s.xSub,
      save: s.save,
      saveSub: s.saveSub,
      cancel: s.cancel,
      tapAgain: s.tapAgain,
      failed: s.failed,
      saved: s.saved,
      savedForX: s.savedForX,
    })),
    close: s.close,
    previous: s.previous,
    next: s.next,
    pause: s.pause,
    play: s.play,
  };
  return (
    <div lang={lang}>
      <StoryPlayer view={view} labels={labels} lang={lang} />
    </div>
  );
}
