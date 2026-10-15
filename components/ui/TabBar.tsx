import Link from "next/link";
import { tab, tabBar, tabBarInner } from "@/lib/variants";
import { TabIcon } from "./icons";

export type TabKey = "league" | "fixtures" | "players";

// League · Fixtures · Players. Planner gets a tab only when it ships; never a disabled tab.
// "League" goes to "/", which opens the remembered league (proxy.ts) or Start.
const TABS: readonly { key: TabKey; href: string; label: string }[] = [
  { key: "league", href: "/", label: "League" },
  { key: "fixtures", href: "/fixtures", label: "Fixtures" },
  { key: "players", href: "/players", label: "Players" },
];

export function TabBar({ active }: { active: TabKey }) {
  return (
    <nav aria-label="Sections" className={tabBar()}>
      <div className={tabBarInner()}>
        {TABS.map((t) => (
          <Link key={t.key} href={t.href} aria-current={t.key === active ? "page" : undefined} className={tab()}>
            <TabIcon name={t.key} />
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
