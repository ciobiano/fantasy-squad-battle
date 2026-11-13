import Link from "next/link";
import { tab, tabBar, tabBarInner } from "@/lib/variants";
import { TabIcon } from "./icons";

export type TabKey = "league" | "fixtures" | "players" | "planner";

// League · Fixtures · Players · Planner; never a disabled tab.
// "League" goes to "/" and "Planner" to "/planner", which open the remembered
// league and team (proxy.ts), or Start.
const TABS: readonly { key: TabKey; href: string; label: string }[] = [
  { key: "league", href: "/", label: "League" },
  { key: "fixtures", href: "/fixtures", label: "Fixtures" },
  { key: "players", href: "/players", label: "Players" },
  { key: "planner", href: "/planner", label: "Planner" },
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
